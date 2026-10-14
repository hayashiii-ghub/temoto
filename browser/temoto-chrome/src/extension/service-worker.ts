import { savePendingCapture } from "./capture-store.js";
import { withCaptureLock } from "./capture-lock.js";
import { isTrustedProxyPopup } from "./proxy-core.js";
import { createProxyRuntime } from "./proxy-runtime.js";
import {
  CAPTURE_INTERVAL_MS,
  CAPTURE_PRELOAD_SCROLL_INTERVAL_MS,
  CAPTURE_PRELOAD_SCROLL_STEP,
  CAPTURE_PRELOAD_SETTLE_MS,
  CAPTURE_RESOURCE_WAIT_MS,
  CAPTURE_SCROLL_SETTLE_MS,
  MAX_FULL_PAGE_HEIGHT,
  didFullPageCaptureAdvance,
  nextFullPageCaptureY,
  normalizeCaptureMetrics,
} from "./capture-utils.js";

interface CaptureViewport {
  width: number;
  height: number;
}

interface CaptureFrame {
  dataUrl: string;
  scrollY: number;
}

interface CaptureTarget {
  id: number;
  windowId: number;
}

interface SavedStyleProperty {
  value: string;
  priority: string;
}

interface FullPageCaptureState {
  originalScroll: { x: number; y: number };
  rootScrollBehavior: SavedStyleProperty;
  bodyScrollBehavior: SavedStyleProperty | null;
  floatingElements: HTMLElement[];
  hiddenElements: Array<{ element: HTMLElement; value: string; priority: string }>;
  styleElement: HTMLStyleElement;
}

interface ExtensionMessage {
  type: string;
  speed?: unknown;
  profile?: unknown;
  profileId?: unknown;
}

interface PageDetection {
  url: string;
  hostname: string;
  origin: string;
  title: string;
  videoCount: number;
  playbackRate: number;
}

const wait = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
const proxyMessages = new Set(["PROXY_GET_STATE", "PROXY_SAVE_PROFILE", "PROXY_DELETE_PROFILE", "PROXY_ACTIVATE", "PROXY_OFF"]);
let proxyRuntime: ReturnType<typeof createProxyRuntime> | undefined;

async function handleProxyMessage(message: ExtensionMessage, sender: chrome.runtime.MessageSender): Promise<Record<string, unknown>> {
  if (!isTrustedProxyPopup(sender, chrome.runtime.id)) return { ok: false, error: "Proxy controls are available only in temoto's popup" };
  const runtime = proxyRuntime ||= createProxyRuntime(chrome);
  try {
    switch (message.type) {
      case "PROXY_GET_STATE": return { ok: true, state: await runtime.getState() };
      case "PROXY_SAVE_PROFILE": return { ok: true, state: await runtime.saveProfile(message.profile) };
      case "PROXY_DELETE_PROFILE": return { ok: true, state: await runtime.deleteProfile(message.profileId) };
      case "PROXY_ACTIVATE": return { ok: true, state: await runtime.activate(message.profileId) };
      case "PROXY_OFF": return { ok: true, state: await runtime.off() };
      default: return { ok: false, error: "Unknown proxy message" };
    }
  } catch (error) {
    const state = await runtime.getState().catch(() => undefined);
    return { ok: false, error: error instanceof Error ? error.message : "Proxy operation failed", ...(state ? { state } : {}) };
  }
}

async function activeTab(): Promise<chrome.tabs.Tab & { id: number; windowId: number }> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id === undefined || tab.windowId === undefined) throw new Error("No active tab found");
  return tab as chrome.tabs.Tab & { id: number; windowId: number };
}

async function withCaptureTarget<T>(
  capture: (tab: CaptureTarget, captureFrame: () => Promise<string>) => Promise<T>,
): Promise<T> {
  const tab = await activeTab();
  let changed = false;
  const onActivated = (info: chrome.tabs.OnActivatedInfo) => {
    if (info.windowId === tab.windowId && info.tabId !== tab.id) changed = true;
  };
  const activation = chrome.tabs.onActivated;
  activation?.addListener(onActivated);
  const assertActive = async () => {
    const [visibleTab] = await chrome.tabs.query({ active: true, windowId: tab.windowId });
    if (changed || visibleTab?.id !== tab.id) {
      throw new Error("Keep the selected page active until the capture finishes");
    }
  };
  const captureFrame = async () => {
    await assertActive();
    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" });
    await assertActive();
    return dataUrl;
  };
  try {
    // Remember a switch away and back while the native screenshot is pending.
    return await capture(tab, captureFrame);
  } finally {
    activation?.removeListener(onActivated);
  }
}

async function executeInTab<Args extends unknown[] = [], Result = unknown>(
  tabId: number,
  func: (...args: Args) => Result,
  args: Args = [] as unknown as Args,
): Promise<chrome.scripting.Awaited<Result> | undefined> {
  const [result] = await chrome.scripting.executeScript<Args, Result>({ target: { tabId }, func, args });
  return result?.result;
}

function unavailablePage(): PageDetection {
  return { url: "", hostname: "", origin: "", title: "", videoCount: 0, playbackRate: 1 };
}

function isDetectablePageUrl(value: string | undefined): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol)
      && url.hostname !== "chromewebstore.google.com"
      && !(url.hostname === "chrome.google.com" && /^\/webstore(?:\/|$)/.test(url.pathname));
  } catch {
    return false;
  }
}

function isUnavailablePageError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  return /^Cannot access a chrome:\/\/ URL\.?$/i.test(message)
    || /^Cannot access a chrome-extension:\/\/ URL of different extension\.?$/i.test(message)
    || /^Cannot access contents of (?:url "[^"]+"|the page)\. Extension manifest must request permission to access (?:this|the respective) host\.$/i.test(message)
    || /^The (?:extensions gallery|New Tab Page|sign-in page) cannot be scripted\.$/i.test(message)
    || /^No tab with id: \d+\.?$/i.test(message)
    || /^No frame with id:? \d+(?: in tab (?:with id )?\d+)?\.?$/i.test(message)
    || /^(?:Tab containing frame with ID \d+|Frame with ID \d+) was removed\.$/i.test(message)
    || /^Frame with ID \d+ is (?:not ready|showing error page)\.?$/i.test(message);
}

async function detectPageState(installShortcuts: boolean): Promise<PageDetection> {
  const tab = await activeTab();
  if (!isDetectablePageUrl(tab.url)) return unavailablePage();

  try {
    if (installShortcuts) {
      await chrome.scripting.executeScript({ target: { tabId: tab.id, allFrames: true }, files: ["content/video-speed.js"] });
    }
    const results = await chrome.scripting.executeScript({ target: { tabId: tab.id, allFrames: true }, func: () => {
      const videos = Array.from(document.querySelectorAll("video"));
      return { url: location.href, hostname: location.hostname, origin: location.origin, title: document.title, videoCount: videos.length, playbackRate: videos[0]?.playbackRate || 1 };
    } });
    const topFrame = results.find((entry) => entry.frameId === 0)?.result
      || results[0]?.result
      || unavailablePage();
    const videoFrames = results
      .map((entry) => entry.result)
      .filter((entry): entry is PageDetection => Boolean(entry?.videoCount));
    return {
      ...topFrame,
      videoCount: videoFrames.reduce((total, frame) => total + frame.videoCount, 0),
      playbackRate: videoFrames[0]?.playbackRate || 1,
    };
  } catch (error) {
    if (isUnavailablePageError(error)) return unavailablePage();
    throw error;
  }
}

async function applyVideoSpeed(rawSpeed: unknown, tabId?: number): Promise<{ speed: number; changed: number }> {
  const speed = Math.round(Math.min(5, Math.max(0.25, Number(rawSpeed) || 1)) * 100) / 100;
  const targetTabId = tabId ?? (await activeTab()).id;
  const results = await chrome.scripting.executeScript({ target: { tabId: targetTabId, allFrames: true }, func: (nextSpeed) => {
    const videos = Array.from(document.querySelectorAll("video"));
    videos.forEach((video) => { video.playbackRate = nextSpeed; });
    return videos.length;
  }, args: [speed] });
  const changed = results.reduce((total, entry) => total + Number(entry.result || 0), 0);
  return { speed, changed };
}

async function setTemotoOverlayVisibility(tabId: number, hidden: boolean): Promise<void> {
  await chrome.scripting.executeScript({ target: { tabId, allFrames: true }, func: (shouldHide: boolean) => {
    const captureWindow = window as typeof window & {
      __temotoCaptureOverlayState?: Array<{ element: HTMLElement; value: string; priority: string }>;
    };
    const saved = captureWindow.__temotoCaptureOverlayState || [];
    if (!shouldHide) {
      for (const item of saved) {
        if (item.value) item.element.style.setProperty("visibility", item.value, item.priority);
        else item.element.style.removeProperty("visibility");
      }
      delete captureWindow.__temotoCaptureOverlayState;
      return;
    }
    captureWindow.__temotoCaptureOverlayState = saved;
    for (const element of document.querySelectorAll<HTMLElement>("[data-temoto-inspect], [data-temoto-video-speed]")) {
      if (!saved.some((item) => item.element === element)) {
        saved.push({ element, value: element.style.getPropertyValue("visibility"), priority: element.style.getPropertyPriority("visibility") });
      }
      // Append after the inspector host's all: initial !important reset.
      element.style.removeProperty("visibility");
      element.style.setProperty("visibility", "hidden", "important");
    }
  }, args: [hidden] });
}

async function capture(tab: CaptureTarget, captureFrame: () => Promise<string>): Promise<void> {
  let dataUrl;
  let currentViewport: CaptureViewport | undefined;
  try {
    currentViewport = await executeInTab(tab.id, () => ({ width: window.innerWidth, height: window.innerHeight }));
    if (!currentViewport) throw new Error("The selected page viewport is unavailable");
    await setTemotoOverlayVisibility(tab.id, true);
    await wait(CAPTURE_SCROLL_SETTLE_MS);
    dataUrl = await captureFrame();
  } finally {
    await setTemotoOverlayVisibility(tab.id, false).catch(() => {});
  }
  const captureId = await savePendingCapture({ type: "single", dataUrl, viewport: currentViewport });
  await chrome.tabs.create({ url: chrome.runtime.getURL(`capture.html?id=${encodeURIComponent(captureId)}`) });
}

async function captureFullPage(tab: CaptureTarget, captureFrame: () => Promise<string>): Promise<{ frameCount: number; height: number }> {
  const setup = await executeInTab(tab.id, () => {
    const stateKey = "__temotoFullPageCaptureState";
    const captureWindow = window as typeof window & { __temotoFullPageCaptureState?: FullPageCaptureState };
    const previous = captureWindow.__temotoFullPageCaptureState;
    if (previous) {
      for (const item of previous.hiddenElements || []) {
        if (item.value) item.element.style.setProperty("visibility", item.value, item.priority);
        else item.element.style.removeProperty("visibility");
      }
      const restoreProperty = (element: HTMLElement | null, name: string, saved: SavedStyleProperty | null) => {
        if (!element || !saved) return;
        if (saved.value) element.style.setProperty(name, saved.value, saved.priority);
        else element.style.removeProperty(name);
      };
      window.scrollTo(previous.originalScroll?.x || 0, previous.originalScroll?.y || 0);
      restoreProperty(document.documentElement, "scroll-behavior", previous.rootScrollBehavior);
      restoreProperty(document.body, "scroll-behavior", previous.bodyScrollBehavior);
      previous.styleElement?.remove();
    }

    const root = document.documentElement;
    const body = document.body;
    const styleElement = document.createElement("style");
    styleElement.textContent = `
      html::-webkit-scrollbar, body::-webkit-scrollbar { display: none !important; }
      *, *::before, *::after {
        animation-duration: 0.001s !important;
        animation-delay: 0s !important;
        transition-duration: 0.001s !important;
        transition-delay: 0s !important;
      }
    `;
    root.appendChild(styleElement);

    captureWindow.__temotoFullPageCaptureState = {
      originalScroll: { x: window.scrollX, y: window.scrollY },
      rootScrollBehavior: { value: root.style.getPropertyValue("scroll-behavior"), priority: root.style.getPropertyPriority("scroll-behavior") },
      bodyScrollBehavior: body ? { value: body.style.getPropertyValue("scroll-behavior"), priority: body.style.getPropertyPriority("scroll-behavior") } : null,
      floatingElements: [],
      hiddenElements: [],
      styleElement,
    };
    root.style.setProperty("scroll-behavior", "auto", "important");
    body?.style.setProperty("scroll-behavior", "auto", "important");

    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      pixelRatio: window.devicePixelRatio || 1,
      document: {
        width: Math.max(root.scrollWidth, body?.scrollWidth || 0, window.innerWidth),
        height: Math.max(root.scrollHeight, body?.scrollHeight || 0, window.innerHeight),
      },
    };
  });

  if (!setup) throw new Error("The selected page could not be prepared for capture");

  const frames: CaptureFrame[] = [];
  let captureY = 0;
  let documentHeight = setup.document.height;

  try {
    normalizeCaptureMetrics(setup.document.height, setup.viewport.height, setup.pixelRatio);
    const preloadedDocumentHeight = await executeInTab(tab.id, async (
      scrollStep: number,
      scrollInterval: number,
      settleTime: number,
      resourceWaitTime: number,
      maximumDocumentHeight: number,
    ) => {
      const pageHeight = () => Math.max(
        document.documentElement.scrollHeight,
        document.body?.scrollHeight || 0,
        window.innerHeight,
      );
      let currentY = 0;
      let attempts = 0;
      window.scrollTo(0, 0);

      while (attempts < 200) {
        const height = pageHeight();
        if (height > maximumDocumentHeight) break;
        const maximumY = Math.max(0, height - window.innerHeight);
        if (maximumY - currentY <= 1) break;
        const targetY = Math.min(currentY + scrollStep, maximumY);
        window.scrollTo(0, targetY);
        await new Promise((resolve) => setTimeout(resolve, scrollInterval));
        const nextY = window.scrollY;
        attempts += 1;
        if (nextY <= currentY + 1) break;
        currentY = nextY;
      }

      await new Promise((resolve) => setTimeout(resolve, settleTime));
      const resourcesReady = Promise.allSettled([
        document.fonts?.ready || Promise.resolve(),
        Promise.all(Array.from(document.images).map((image) => {
          if (image.complete) return Promise.resolve();
          return new Promise((resolve) => {
            image.addEventListener("load", resolve, { once: true });
            image.addEventListener("error", resolve, { once: true });
          });
        })),
      ]);
      await Promise.race([
        resourcesReady,
        new Promise((resolve) => setTimeout(resolve, resourceWaitTime)),
      ]);

      window.scrollTo(0, 0);
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      await new Promise((resolve) => setTimeout(resolve, settleTime));
      return pageHeight();
    }, [
      CAPTURE_PRELOAD_SCROLL_STEP,
      CAPTURE_PRELOAD_SCROLL_INTERVAL_MS,
      CAPTURE_PRELOAD_SETTLE_MS,
      CAPTURE_RESOURCE_WAIT_MS,
      MAX_FULL_PAGE_HEIGHT / setup.pixelRatio,
    ] as [number, number, number, number, number]);
    if (preloadedDocumentHeight === undefined) throw new Error("The page height is unavailable");
    documentHeight = Math.max(documentHeight, preloadedDocumentHeight);
    normalizeCaptureMetrics(documentHeight, setup.viewport.height, setup.pixelRatio);

    while (true) {
      const metrics = await executeInTab(tab.id, async (targetY: number, hideFloatingElements: boolean) => {
        const captureWindow = window as typeof window & { __temotoFullPageCaptureState?: FullPageCaptureState };
        const state = captureWindow.__temotoFullPageCaptureState;
        if (!state) throw new Error("The page changed while it was being captured");

        if (hideFloatingElements && state.hiddenElements.length === 0) {
          for (const element of state.floatingElements) {
            state.hiddenElements.push({
              element,
              value: element.style.getPropertyValue("visibility"),
              priority: element.style.getPropertyPriority("visibility"),
            });
            element.style.setProperty("visibility", "hidden", "important");
          }
        }

        window.scrollTo(0, targetY);
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        if (!hideFloatingElements && state.floatingElements.length === 0) {
          const maxFloatingHeight = window.innerHeight * 0.45;
          for (const element of document.body?.querySelectorAll<HTMLElement>("*") || []) {
            if (element.matches("[data-temoto-inspect], [data-temoto-video-speed]")) continue;
            const position = getComputedStyle(element).position;
            if (position !== "fixed" && position !== "sticky") continue;
            const rect = element.getBoundingClientRect();
            const visible = rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;
            if (!visible || rect.width <= 0 || rect.height <= 0 || rect.height > maxFloatingHeight) continue;
            state.floatingElements.push(element);
          }
        }
        const root = document.documentElement;
        const body = document.body;
        return {
          scrollY: window.scrollY,
          documentHeight: Math.max(root.scrollHeight, body?.scrollHeight || 0, window.innerHeight),
          viewport: { width: window.innerWidth, height: window.innerHeight },
        };
      }, [captureY, frames.length > 0] as [number, boolean]);
      if (!metrics) throw new Error("The page capture metrics are unavailable");
      if (metrics.viewport.width !== setup.viewport.width || metrics.viewport.height !== setup.viewport.height) {
        throw new Error("The page size changed while it was being captured");
      }

      const previousFrame = frames.at(-1);
      if ((!previousFrame && Math.abs(metrics.scrollY) > 1)
        || (previousFrame && (!didFullPageCaptureAdvance(previousFrame.scrollY, metrics.scrollY)
          || metrics.scrollY > previousFrame.scrollY + setup.viewport.height + 1))) {
        throw new Error("Full-page capture could not capture every section. Please try again.");
      }

      documentHeight = Math.max(documentHeight, metrics.documentHeight);
      normalizeCaptureMetrics(documentHeight, setup.viewport.height, setup.pixelRatio);

      await setTemotoOverlayVisibility(tab.id, true);
      await wait(CAPTURE_SCROLL_SETTLE_MS);
      const dataUrl = await captureFrame();
      frames.push({ dataUrl, scrollY: metrics.scrollY });

      await wait(CAPTURE_INTERVAL_MS);
      const latestDocumentHeight = await executeInTab(tab.id, () => Math.max(
        document.documentElement.scrollHeight,
        document.body?.scrollHeight || 0,
        window.innerHeight,
      ));
      if (latestDocumentHeight === undefined) throw new Error("The latest page height is unavailable");
      documentHeight = Math.max(documentHeight, latestDocumentHeight);
      normalizeCaptureMetrics(documentHeight, setup.viewport.height, setup.pixelRatio);

      const nextY = nextFullPageCaptureY(metrics.scrollY, documentHeight, setup.viewport.height, setup.pixelRatio);
      if (nextY === null) break;
      captureY = nextY;
    }
  } finally {
    await executeInTab(tab.id, () => {
      const captureWindow = window as typeof window & { __temotoFullPageCaptureState?: FullPageCaptureState };
      const state = captureWindow.__temotoFullPageCaptureState;
      if (!state) return;
      for (const item of state.hiddenElements) {
        if (item.value) item.element.style.setProperty("visibility", item.value, item.priority);
        else item.element.style.removeProperty("visibility");
      }
      const restoreProperty = (element: HTMLElement | null, name: string, saved: SavedStyleProperty | null) => {
        if (!element || !saved) return;
        if (saved.value) element.style.setProperty(name, saved.value, saved.priority);
        else element.style.removeProperty(name);
      };
      window.scrollTo(state.originalScroll.x, state.originalScroll.y);
      restoreProperty(document.documentElement, "scroll-behavior", state.rootScrollBehavior);
      restoreProperty(document.body, "scroll-behavior", state.bodyScrollBehavior);
      state.styleElement?.remove();
      delete captureWindow.__temotoFullPageCaptureState;
    }).catch(() => {});
    await setTemotoOverlayVisibility(tab.id, false).catch(() => {});
  }

  const captureId = await savePendingCapture({
    type: "fullPage",
    frames,
    viewport: setup.viewport,
    document: { width: setup.viewport.width, height: documentHeight },
  });
  await chrome.tabs.create({ url: chrome.runtime.getURL(`capture.html?id=${encodeURIComponent(captureId)}`) });
  return { frameCount: frames.length, height: documentHeight };
}

async function handleMessage(message: ExtensionMessage, sender: chrome.runtime.MessageSender): Promise<Record<string, unknown>> {
  if (proxyMessages.has(message?.type)) return handleProxyMessage(message, sender);
  switch (message.type) {
    case "DETECT_PAGE":
    case "GET_PAGE_STATE": {
      return { ok: true, page: await detectPageState(message.type === "DETECT_PAGE") };
    }
    case "VIDEO_STATE_CHANGED":
      return { ok: true };
    case "SET_VIDEO_SPEED": {
      const { changed } = await applyVideoSpeed(message.speed);
      return { ok: changed > 0, changed, error: changed ? undefined : "No video found on this page" };
    }
    case "WEBMCP_PING":
      return {
        ok: true,
        name: "temoto for Chrome",
        version: chrome.runtime.getManifest().version,
      };
    case "WEBMCP_SET_VIDEO_SPEED": {
      if (sender.tab?.id === undefined) return { ok: false, error: "The WebMCP tab is unavailable" };
      const speed = Math.round(Math.min(5, Math.max(0.25, Number(message.speed) || 1)) * 100) / 100;
      const response = await chrome.tabs.sendMessage(sender.tab.id, {
        type: "APPLY_VIDEO_SPEED",
        speed,
      }) as { changed?: unknown } | undefined;
      const changed = Number(response?.changed || 0);
      return {
        ok: changed > 0,
        speed,
        changed,
        error: changed ? undefined : "No video found on this page",
      };
    }
    case "VIDEO_SPEED_SHORTCUT": {
      const speed = Math.round(Math.min(5, Math.max(0.25, Number(message.speed) || 1)) * 100) / 100;
      if (sender.tab?.id) {
        await chrome.tabs.sendMessage(sender.tab.id, { type: "APPLY_VIDEO_SPEED", speed }).catch(() => {});
      }
      return { ok: true, speed };
    }
    case "CAPTURE_VISIBLE":
      await withCaptureLock(() => withCaptureTarget(capture));
      return { ok: true };
    case "CAPTURE_FULL_PAGE": {
      const result = await withCaptureLock(() => withCaptureTarget(captureFullPage));
      return { ok: true, ...result };
    }
    case "START_MEASURE": {
      const tab = await activeTab();
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content/measure.js"] });
      return { ok: true };
    }
    default:
      return { ok: false, error: "Unknown message" };
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message as ExtensionMessage, sender).then(sendResponse).catch((error: unknown) => {
    sendResponse({ ok: false, error: error instanceof Error ? error.message : "Unexpected extension error" });
  });
  return true;
});
