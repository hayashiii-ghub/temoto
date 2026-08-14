import { isValidHttpOrigin, replaceOrigin } from "./url-utils.js";

const hasChromeApi = () => typeof chrome !== "undefined" && Boolean(chrome.runtime?.id);

const previewPage = {
  hostname: "localhost",
  origin: "http://localhost:3000",
  url: "http://localhost:3000/products/123?preview=1",
  title: "Local development",
  videoCount: 1,
  playbackRate: 1.5,
};

export async function sendExtensionMessage(type, payload = {}) {
  if (!hasChromeApi()) return { ok: true, preview: true };
  return chrome.runtime.sendMessage({ type, ...payload });
}

export async function detectPage() {
  if (!hasChromeApi()) return previewPage;
  const response = await sendExtensionMessage("DETECT_PAGE");
  if (!response?.ok) throw new Error(response?.error || "Could not read the current page");
  return response.page;
}

export async function setVideoSpeed(speed) {
  if (!hasChromeApi()) return { ok: true, changed: 1 };
  return sendExtensionMessage("SET_VIDEO_SPEED", { speed });
}

export async function captureVisible(options) {
  return sendExtensionMessage("CAPTURE_VISIBLE", { options });
}

export async function captureFullPage(options) {
  return sendExtensionMessage("CAPTURE_FULL_PAGE", { options });
}

export async function captureRegion(options) {
  return sendExtensionMessage("START_REGION_CAPTURE", { options });
}

export async function startMeasure() {
  if (!hasChromeApi()) {
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `/content/measure.js?preview=${Date.now()}`;
      script.onload = () => { script.remove(); resolve(); };
      script.onerror = () => { script.remove(); reject(new Error("Could not start Inspect")); };
      document.documentElement.appendChild(script);
    });
    return { ok: true, preview: true };
  }
  return sendExtensionMessage("START_MEASURE");
}

export async function resetOrigin(origin) {
  if (!isValidHttpOrigin(origin)) return { ok: false, error: "Site Reset is unavailable on this page" };
  if (!hasChromeApi()) {
    await new Promise((resolve) => window.setTimeout(resolve, 900));
    return { ok: true, preview: true };
  }
  const granted = await chrome.permissions.request({ permissions: ["browsingData"] });
  if (!granted) return { ok: false, error: "Permission to clear site data is required" };
  return sendExtensionMessage("RESET_ORIGIN", { origin });
}

export async function switchEnvironment(targetOrigin, currentUrl) {
  const nextUrl = replaceOrigin(currentUrl, targetOrigin);
  if (!hasChromeApi()) {
    return { ok: true, preview: true, url: nextUrl };
  }
  return sendExtensionMessage("NAVIGATE", { url: nextUrl });
}

export async function openSidePanel() {
  if (!hasChromeApi()) {
    window.location.assign("/sidepanel.html");
    return;
  }
  const currentWindow = await chrome.windows.getCurrent();
  await chrome.sidePanel.open({ windowId: currentWindow.id });
  window.close();
}

export async function getSettings() {
  const defaults = {
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
  if (!hasChromeApi()) return defaults;
  const stored = await chrome.storage.local.get(defaults);
  return stored;
}

export async function saveSettings(settings) {
  if (!hasChromeApi()) {
    localStorage.setItem("temoto-settings", JSON.stringify(settings));
    return;
  }
  await chrome.storage.local.set(settings);
}

export async function pickColor() {
  if (!("EyeDropper" in window)) {
    throw new Error("Color Picker is not available in this version of Chrome");
  }
  const result = await new window.EyeDropper().open();
  const color = result.sRGBHex.toUpperCase();
  await saveSettings({ lastColor: color });
  return color;
}

export function isExtensionRuntime() {
  return hasChromeApi();
}
