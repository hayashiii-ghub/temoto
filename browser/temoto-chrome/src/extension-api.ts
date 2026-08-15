import { isValidHttpOrigin, replaceOrigin } from "./url-utils.ts";

declare global {
  interface Window {
    EyeDropper?: new () => { open(): Promise<{ sRGBHex: string }> };
  }
}

export interface PageInfo {
  hostname: string;
  origin: string;
  url: string;
  title?: string;
  videoCount: number;
  playbackRate: number;
}

export interface ProjectSettings {
  name: string;
  local: string;
  staging: string;
  production: string;
}

export interface ScreenshotOptions {
  delayMs: number;
  forceReveal: boolean;
}

export interface ExtensionSettings {
  project: ProjectSettings;
  lastColor: string;
  lastSpeed: number;
  screenshot: ScreenshotOptions;
}

export interface ExtensionResponse {
  ok: boolean;
  preview?: boolean;
  error?: string;
  changed?: number;
  url?: string;
}

type MessagePayload = Record<string, unknown>;

const hasChromeApi = (): boolean => typeof chrome !== "undefined" && Boolean(chrome.runtime?.id);

const previewPage: PageInfo = {
  hostname: "localhost",
  origin: "http://localhost:3000",
  url: "http://localhost:3000/products/123?preview=1",
  title: "Local development",
  videoCount: 1,
  playbackRate: 1.5,
};

const defaultSettings: ExtensionSettings = {
  project: {
    name: "Local project",
    local: "http://localhost:3000",
    staging: "https://staging.example.com",
    production: "https://example.com",
  },
  lastColor: "#7C5CFC",
  lastSpeed: 1.5,
  screenshot: { delayMs: 0, forceReveal: false },
};

export async function sendExtensionMessage<T = ExtensionResponse>(
  type: string,
  payload: MessagePayload = {},
): Promise<T> {
  if (!hasChromeApi()) return { ok: true, preview: true } as T;
  return chrome.runtime.sendMessage({ type, ...payload }) as Promise<T>;
}

export async function detectPage(): Promise<PageInfo> {
  if (!hasChromeApi()) return previewPage;
  const response = await sendExtensionMessage<ExtensionResponse & { page?: PageInfo }>("DETECT_PAGE");
  if (!response.ok || !response.page) throw new Error(response.error || "Could not read the current page");
  return response.page;
}

export async function setVideoSpeed(speed: number): Promise<ExtensionResponse> {
  if (!hasChromeApi()) return { ok: true, changed: 1 };
  return sendExtensionMessage("SET_VIDEO_SPEED", { speed });
}

export function captureVisible(options: ScreenshotOptions): Promise<ExtensionResponse> {
  return sendExtensionMessage("CAPTURE_VISIBLE", { options });
}

export function captureFullPage(options: ScreenshotOptions): Promise<ExtensionResponse> {
  return sendExtensionMessage("CAPTURE_FULL_PAGE", { options });
}

export function captureRegion(options: ScreenshotOptions): Promise<ExtensionResponse> {
  return sendExtensionMessage("START_REGION_CAPTURE", { options });
}

export async function startMeasure(): Promise<ExtensionResponse> {
  if (!hasChromeApi()) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `/src/extension/content/measure.ts?preview=${Date.now()}`;
      script.onload = () => { script.remove(); resolve(); };
      script.onerror = () => { script.remove(); reject(new Error("Could not start Inspect")); };
      document.documentElement.appendChild(script);
    });
    return { ok: true, preview: true };
  }
  return sendExtensionMessage("START_MEASURE");
}

export async function resetOrigin(origin: string): Promise<ExtensionResponse> {
  if (!isValidHttpOrigin(origin)) return { ok: false, error: "Site Reset is unavailable on this page" };
  if (!hasChromeApi()) {
    await new Promise<void>((resolve) => window.setTimeout(resolve, 900));
    return { ok: true, preview: true };
  }
  const granted = await chrome.permissions.request({ permissions: ["browsingData"] });
  if (!granted) return { ok: false, error: "Permission to clear site data is required" };
  return sendExtensionMessage("RESET_ORIGIN", { origin });
}

export async function switchEnvironment(targetOrigin: string, currentUrl: string): Promise<ExtensionResponse> {
  const nextUrl = replaceOrigin(currentUrl, targetOrigin);
  if (!hasChromeApi()) return { ok: true, preview: true, url: nextUrl };
  return sendExtensionMessage("NAVIGATE", { url: nextUrl });
}

export async function openSidePanel(): Promise<void> {
  if (!hasChromeApi()) {
    window.location.assign("/sidepanel.html");
    return;
  }
  const currentWindow = await chrome.windows.getCurrent();
  if (currentWindow.id === undefined) throw new Error("Current Chrome window is unavailable");
  await chrome.sidePanel.open({ windowId: currentWindow.id });
  window.close();
}

export async function getSettings(): Promise<ExtensionSettings> {
  if (!hasChromeApi()) return defaultSettings;
  return chrome.storage.local.get(defaultSettings) as Promise<ExtensionSettings>;
}

export async function saveSettings(settings: Partial<ExtensionSettings>): Promise<void> {
  if (!hasChromeApi()) {
    localStorage.setItem("temoto-settings", JSON.stringify(settings));
    return;
  }
  await chrome.storage.local.set(settings);
}

export async function pickColor(): Promise<string> {
  if (!window.EyeDropper) throw new Error("Color Picker is not available in this version of Chrome");
  const result = await new window.EyeDropper().open();
  const color = result.sRGBHex.toUpperCase();
  await saveSettings({ lastColor: color });
  return color;
}

export function isExtensionRuntime(): boolean {
  return hasChromeApi();
}
