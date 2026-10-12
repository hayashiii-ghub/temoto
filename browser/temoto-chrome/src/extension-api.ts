import { normalizeHexColor, normalizeColorHistory } from "./color-utils.ts";
import type { ColorFormat } from "./color-utils.ts";
import { t } from "./i18n.ts";

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

export interface ExtensionSettings {
  lastColor: string;
  colorHistory: string[];
  colorFormat: ColorFormat;
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
  title: t("Local development"),
  videoCount: 1,
  playbackRate: 1.5,
};

const defaultSettings: ExtensionSettings = {
  lastColor: "#9974F8",
  colorHistory: [],
  colorFormat: "hex",
};

export async function sendExtensionMessage<T = ExtensionResponse>(
  type: string,
  payload: MessagePayload = {},
): Promise<T> {
  if (!hasChromeApi()) return { ok: true, preview: true } as T;
  return chrome.runtime.sendMessage({ type, ...payload }) as Promise<T>;
}

async function readPage(type: string): Promise<PageInfo> {
  if (!hasChromeApi()) return previewPage;
  const response = await sendExtensionMessage<ExtensionResponse & { page?: PageInfo }>(type);
  if (!response.ok || !response.page) throw new Error(t(response.error || "Could not read the current page"));
  return response.page;
}

export function detectPage(): Promise<PageInfo> { return readPage("DETECT_PAGE"); }
export function refreshPage(): Promise<PageInfo> { return readPage("GET_PAGE_STATE"); }

export async function setVideoSpeed(speed: number): Promise<ExtensionResponse> {
  if (!hasChromeApi()) return { ok: true, changed: 1 };
  return sendExtensionMessage("SET_VIDEO_SPEED", { speed });
}

export function captureVisible(): Promise<ExtensionResponse> {
  return sendExtensionMessage("CAPTURE_VISIBLE");
}

export function captureFullPage(): Promise<ExtensionResponse> {
  return sendExtensionMessage("CAPTURE_FULL_PAGE");
}

export async function startMeasure(): Promise<ExtensionResponse> {
  if (!hasChromeApi()) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.type = "module";
      const source = import.meta.env?.DEV ? "/src/extension/content/measure.ts" : "./content/measure.js";
      script.src = `${source}?preview=${Date.now()}-${Math.random().toString(36).slice(2)}`;
      script.onload = () => { script.remove(); resolve(); };
      script.onerror = () => { script.remove(); reject(new Error(t("Could not start Inspect"))); };
      document.documentElement.appendChild(script);
    });
    return { ok: true, preview: true };
  }
  return sendExtensionMessage("START_MEASURE");
}

export async function getSettings(): Promise<ExtensionSettings> {
  if (!hasChromeApi()) return defaultSettings;
  const raw = await chrome.storage.local.get({ ...defaultSettings }) as Partial<ExtensionSettings>;
  return {
    lastColor: normalizeHexColor(raw.lastColor) || defaultSettings.lastColor,
    colorHistory: normalizeColorHistory(raw.colorHistory),
    colorFormat: ["hex", "rgb", "hsl"].includes(raw.colorFormat || "") ? raw.colorFormat as ColorFormat : "hex",
  };
}

export async function saveSettings(settings: Partial<ExtensionSettings>): Promise<void> {
  if (!hasChromeApi()) return;
  await chrome.storage.local.set(settings);
}

export async function pickColor(): Promise<string> {
  if (!window.EyeDropper) throw new Error(t("Color Picker is not available in this version of Chrome"));
  const result = await new window.EyeDropper().open();
  const color = result.sRGBHex.toUpperCase();
  return color;
}

export function isExtensionRuntime(): boolean {
  return hasChromeApi();
}
