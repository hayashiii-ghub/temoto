import { savePendingCapture } from "./capture-store.js";
import { normalizeResetOrigin } from "./reset-origin.js";
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
  normalizeScreenshotOptions,
} from "./capture-utils.js";

interface ScreenshotOptions {
  delayMs: number;
  forceReveal: boolean;
}

interface CaptureRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CaptureViewport {
  width: number;
  height: number;
}

interface CaptureFrame {
  dataUrl: string;
  scrollY: number;
  duplicateOfPrevious: boolean;
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
  options?: Partial<ScreenshotOptions>;
  rect?: CaptureRect;
  viewport?: CaptureViewport;
  origin?: string;
  url?: string;
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
const FORCE_REVEAL_STYLE_ID = "__temoto-force-reveal-style";
const FORCE_REVEAL_CSS = `
  [data-aos], [data-sr], .reveal, .scroll-reveal,
  .wow, .animated, [class*="fadeIn"], [class*="slideIn"],
  [class*="fade-in"], [class*="slide-in"] {
    opacity: 1 !important;
    transform: none !important;
    visibility: visible !important;
  }
`;

async function activeTab(): Promise<chrome.tabs.Tab & { id: number; windowId: number }> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id === undefined || tab.windowId === undefined) throw new Error("No active tab found");
  return tab as chrome.tabs.Tab & { id: number; windowId: number };
}

async function executeInTab<Args extends unknown[] = [], Result = unknown>(
  tabId: number,
  func: (...args: Args) => Result,
  args: Args = [] as unknown as Args,
): Promise<chrome.scripting.Awaited<Result> | undefined> {
  const [result] = await chrome.scripting.executeScript<Args, Result>({ target: { tabId }, func, args });
  return result?.result;
}

async function executeInActiveTab<Args extends unknown[] = [], Result = unknown>(
  func: (...args: Args) => Result,
  args: Args = [] as unknown as Args,
  allFrames = false,
): Promise<Array<chrome.scripting.InjectionResult<chrome.scripting.Awaited<Result>>>> {
  const tab = await activeTab();
  return chrome.scripting.executeScript<Args, Result>({ target: { tabId: tab.id, allFrames }, func, args });
}

async function installVideoSpeedShortcuts() {
  const tab = await activeTab();
  await chrome.scripting.executeScript({ target: { tabId: tab.id, allFrames: true }, files: ["content/video-speed.js"] });
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

async function setForceReveal(tabId: number, enabled: boolean): Promise<void> {
  await executeInTab(tabId, (styleId: string, css: string, shouldEnable: boolean) => {
    document.getElementById(styleId)?.remove();
    if (!shouldEnable) return;
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = css;
    document.documentElement.appendChild(style);
  }, [FORCE_REVEAL_STYLE_ID, FORCE_REVEAL_CSS, enabled] as [string, string, boolean]);
}

async function capture(
  rect: CaptureRect | null = null,
  viewport: CaptureViewport | null = null,
  rawOptions: Partial<ScreenshotOptions> = {},
  sourceTab: (chrome.tabs.Tab & { id: number; windowId: number }) | null = null,
): Promise<void> {
  const options = normalizeScreenshotOptions(rawOptions);
  const tab = sourceTab || await activeTab();
  let dataUrl;
  try {
    if (options.forceReveal) await setForceReveal(tab.id, true);
    if (options.delayMs) await wait(options.delayMs);
    if (options.forceReveal) await wait(CAPTURE_SCROLL_SETTLE_MS);
    const [visibleTab] = await chrome.tabs.query({ active: true, windowId: tab.windowId });
    if (visibleTab?.id !== tab.id) throw new Error("Keep the selected page active until the capture finishes");
    dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" });
  } finally {
    if (options.forceReveal) await setForceReveal(tab.id, false).catch(() => {});
  }
  const currentViewport = viewport || await executeInTab(tab.id, () => ({ width: window.innerWidth, height: window.innerHeight }));
  if (!currentViewport) throw new Error("The selected page viewport is unavailable");
  await savePendingCapture({ type: "single", dataUrl, rect, viewport: currentViewport, createdAt: Date.now() });
  await chrome.tabs.create({ url: chrome.runtime.getURL("capture.html") });
}

async function captureFullPage(rawOptions: Partial<ScreenshotOptions> = {}): Promise<{ frameCount: number; height: number }> {
  const options = normalizeScreenshotOptions(rawOptions);
  const tab = await activeTab();
  if (options.delayMs) await wait(options.delayMs);
  const setup = await executeInTab(tab.id, (forceRevealCss: string) => {
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
      ${forceRevealCss}
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
  }, [options.forceReveal ? FORCE_REVEAL_CSS : ""] as [string]);

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
        };
      }, [captureY, frames.length > 0] as [number, boolean]);
      if (!metrics) throw new Error("The page capture metrics are unavailable");

      const previousFrame = frames.at(-1);
      if (previousFrame && !didFullPageCaptureAdvance(previousFrame.scrollY, metrics.scrollY)) {
        documentHeight = Math.min(documentHeight, Math.ceil(previousFrame.scrollY + setup.viewport.height));
        break;
      }

      documentHeight = Math.max(documentHeight, metrics.documentHeight);
      normalizeCaptureMetrics(documentHeight, setup.viewport.height, setup.pixelRatio);

      const currentTab = await activeTab();
      if (currentTab.id !== tab.id) throw new Error("Keep the page active until the full-page capture finishes");

      await wait(CAPTURE_SCROLL_SETTLE_MS);
      let dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" });
      let duplicateOfPrevious = previousFrame?.dataUrl === dataUrl;
      if (duplicateOfPrevious) {
        await wait(CAPTURE_INTERVAL_MS);
        dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" });
        duplicateOfPrevious = previousFrame?.dataUrl === dataUrl;
      }
      if (duplicateOfPrevious) {
        throw new Error("Full-page capture could not capture every section. Please try again.");
      }
      frames.push({ dataUrl, scrollY: metrics.scrollY, duplicateOfPrevious });

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

    await savePendingCapture({
      type: "fullPage",
      frames,
      viewport: setup.viewport,
      document: { width: setup.viewport.width, height: documentHeight },
      createdAt: Date.now(),
    });
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
  }

  await chrome.tabs.create({ url: chrome.runtime.getURL("capture.html") });
  return { frameCount: frames.length, height: documentHeight };
}

async function handleMessage(message: ExtensionMessage, sender: chrome.runtime.MessageSender): Promise<Record<string, unknown>> {
  switch (message.type) {
    case "DETECT_PAGE": {
      await installVideoSpeedShortcuts();
      const results = await executeInActiveTab(() => {
        const videos = Array.from(document.querySelectorAll("video"));
        return { url: location.href, hostname: location.hostname, origin: location.origin, title: document.title, videoCount: videos.length, playbackRate: videos[0]?.playbackRate || 1 };
      }, [], true);
      const topFrame: PageDetection = results.find((entry) => entry.frameId === 0)?.result
        || results[0]?.result
        || { url: "", hostname: "", origin: "", title: "", videoCount: 0, playbackRate: 1 };
      const videoFrames = results
        .map((entry) => entry.result)
        .filter((entry): entry is PageDetection => Boolean(entry?.videoCount));
      const page = {
        ...topFrame,
        videoCount: videoFrames.reduce((total, frame) => total + frame.videoCount, 0),
        playbackRate: videoFrames[0]?.playbackRate || 1,
      };
      return { ok: true, page };
    }
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
      await chrome.storage.local.set({ lastSpeed: speed });
      if (sender.tab?.id) {
        await chrome.tabs.sendMessage(sender.tab.id, { type: "APPLY_VIDEO_SPEED", speed }).catch(() => {});
      }
      return { ok: true, speed };
    }
    case "CAPTURE_VISIBLE":
      await capture(null, null, message.options);
      return { ok: true };
    case "CAPTURE_FULL_PAGE": {
      const result = await captureFullPage(message.options);
      return { ok: true, ...result };
    }
    case "START_REGION_CAPTURE": {
      const tab = await activeTab();
      const optionsKey = `pendingRegionCaptureOptions:${tab.id}`;
      await chrome.storage.session.set({ [optionsKey]: normalizeScreenshotOptions(message.options) });
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content/selection.js"] });
      return { ok: true };
    }
    case "CAPTURE_REGION_SELECTED": {
      if (sender.tab?.id === undefined || sender.tab.windowId === undefined || !message.rect || !message.viewport) {
        return { ok: false, error: "The selected tab is unavailable" };
      }
      const optionsKey = `pendingRegionCaptureOptions:${sender.tab.id}`;
      const storedOptions = (await chrome.storage.session.get(optionsKey))[optionsKey] as Partial<ScreenshotOptions> | undefined;
      await chrome.storage.session.remove(optionsKey);
      if (!sender.tab.active) return { ok: false, error: "The selected tab is not active" };
      await new Promise((resolve) => setTimeout(resolve, 80));
      await capture(
        message.rect,
        message.viewport,
        { ...storedOptions, forceReveal: false },
        sender.tab as chrome.tabs.Tab & { id: number; windowId: number },
      );
      return { ok: true };
    }
    case "START_MEASURE": {
      const tab = await activeTab();
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content/measure.js"] });
      return { ok: true };
    }
    case "RESET_ORIGIN":
      if (!message.origin) return { ok: false, error: "Site Reset is unavailable on this page" };
      await chrome.browsingData.remove({ origins: [normalizeResetOrigin(message.origin)] }, { cache: true, cacheStorage: true, cookies: true, indexedDB: true, localStorage: true, serviceWorkers: true });
      await chrome.tabs.reload((await activeTab()).id, { bypassCache: true });
      return { ok: true };
    case "NAVIGATE":
      if (!message.url) return { ok: false, error: "The destination is unavailable" };
      await chrome.tabs.update((await activeTab()).id, { url: message.url });
      return { ok: true };
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

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {});
});
