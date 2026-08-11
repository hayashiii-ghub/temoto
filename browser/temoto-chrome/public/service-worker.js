import { savePendingCapture } from "./capture-store.js";
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

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
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

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("No active tab found");
  return tab;
}

async function executeInTab(tabId, func, args = []) {
  const [result] = await chrome.scripting.executeScript({ target: { tabId }, func, args });
  return result?.result;
}

async function executeInActiveTab(func, args = [], allFrames = false) {
  const tab = await activeTab();
  return chrome.scripting.executeScript({ target: { tabId: tab.id, allFrames }, func, args });
}

async function installVideoSpeedShortcuts() {
  const tab = await activeTab();
  await chrome.scripting.executeScript({ target: { tabId: tab.id, allFrames: true }, files: ["content/video-speed.js"] });
}

async function applyVideoSpeed(rawSpeed) {
  const speed = Math.round(Math.min(5, Math.max(0.25, Number(rawSpeed) || 1)) * 100) / 100;
  const results = await executeInActiveTab((nextSpeed) => {
    const videos = Array.from(document.querySelectorAll("video"));
    videos.forEach((video) => { video.playbackRate = nextSpeed; });
    return videos.length;
  }, [speed], true);
  const changed = results.reduce((total, entry) => total + Number(entry.result || 0), 0);
  return { speed, changed };
}

async function setForceReveal(tabId, enabled) {
  await executeInTab(tabId, (styleId, css, shouldEnable) => {
    document.getElementById(styleId)?.remove();
    if (!shouldEnable) return;
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = css;
    document.documentElement.appendChild(style);
  }, [FORCE_REVEAL_STYLE_ID, FORCE_REVEAL_CSS, enabled]);
}

async function capture(rect = null, viewport = null, rawOptions = {}) {
  const options = normalizeScreenshotOptions(rawOptions);
  const tab = await activeTab();
  let dataUrl;
  try {
    if (options.forceReveal) await setForceReveal(tab.id, true);
    if (options.delayMs) await wait(options.delayMs);
    if (options.forceReveal) await wait(CAPTURE_SCROLL_SETTLE_MS);
    dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" });
  } finally {
    if (options.forceReveal) await setForceReveal(tab.id, false).catch(() => {});
  }
  const currentViewport = viewport || (await executeInActiveTab(() => ({ width: window.innerWidth, height: window.innerHeight })))[0].result;
  await savePendingCapture({ type: "single", dataUrl, rect, viewport: currentViewport, createdAt: Date.now() });
  await chrome.tabs.create({ url: chrome.runtime.getURL("capture.html") });
}

async function captureFullPage(rawOptions = {}) {
  const options = normalizeScreenshotOptions(rawOptions);
  const tab = await activeTab();
  if (options.delayMs) await wait(options.delayMs);
  const setup = await executeInTab(tab.id, (forceRevealCss) => {
    const stateKey = "__temotoFullPageCaptureState";
    const previous = window[stateKey];
    if (previous) {
      for (const item of previous.hiddenElements || []) {
        if (item.value) item.element.style.setProperty("visibility", item.value, item.priority);
        else item.element.style.removeProperty("visibility");
      }
      const restoreProperty = (element, name, saved) => {
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

    window[stateKey] = {
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
  }, [options.forceReveal ? FORCE_REVEAL_CSS : ""]);

  const frames = [];
  let captureY = 0;
  let documentHeight = setup.document.height;

  try {
    normalizeCaptureMetrics(setup.document.height, setup.viewport.height, setup.pixelRatio);
    const preloadedDocumentHeight = await executeInTab(tab.id, async (
      scrollStep,
      scrollInterval,
      settleTime,
      resourceWaitTime,
      maximumDocumentHeight,
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
    ]);
    documentHeight = Math.max(documentHeight, preloadedDocumentHeight);
    normalizeCaptureMetrics(documentHeight, setup.viewport.height, setup.pixelRatio);

    while (true) {
      const metrics = await executeInTab(tab.id, async (targetY, hideFloatingElements) => {
        const state = window.__temotoFullPageCaptureState;
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
          for (const element of document.body?.querySelectorAll("*") || []) {
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
      }, [captureY, frames.length > 0]);

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
      let duplicateOfPrevious = Boolean(previousFrame && previousFrame.dataUrl === dataUrl);
      if (duplicateOfPrevious) {
        await wait(CAPTURE_INTERVAL_MS);
        dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" });
        duplicateOfPrevious = previousFrame.dataUrl === dataUrl;
      }
      frames.push({ dataUrl, scrollY: metrics.scrollY, duplicateOfPrevious });

      await wait(CAPTURE_INTERVAL_MS);
      const latestDocumentHeight = await executeInTab(tab.id, () => Math.max(
        document.documentElement.scrollHeight,
        document.body?.scrollHeight || 0,
        window.innerHeight,
      ));
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
      const state = window.__temotoFullPageCaptureState;
      if (!state) return;
      for (const item of state.hiddenElements) {
        if (item.value) item.element.style.setProperty("visibility", item.value, item.priority);
        else item.element.style.removeProperty("visibility");
      }
      const restoreProperty = (element, name, saved) => {
        if (!element || !saved) return;
        if (saved.value) element.style.setProperty(name, saved.value, saved.priority);
        else element.style.removeProperty(name);
      };
      window.scrollTo(state.originalScroll.x, state.originalScroll.y);
      restoreProperty(document.documentElement, "scroll-behavior", state.rootScrollBehavior);
      restoreProperty(document.body, "scroll-behavior", state.bodyScrollBehavior);
      state.styleElement?.remove();
      delete window.__temotoFullPageCaptureState;
    }).catch(() => {});
  }

  await chrome.tabs.create({ url: chrome.runtime.getURL("capture.html") });
  return { frameCount: frames.length, height: documentHeight };
}

async function handleMessage(message, sender) {
  switch (message.type) {
    case "DETECT_PAGE": {
      await installVideoSpeedShortcuts();
      const results = await executeInActiveTab(() => {
        const videos = Array.from(document.querySelectorAll("video"));
        return { url: location.href, hostname: location.hostname, origin: location.origin, title: document.title, videoCount: videos.length, playbackRate: videos[0]?.playbackRate || 1 };
      }, [], true);
      const topFrame = results.find((entry) => entry.frameId === 0)?.result || results[0]?.result;
      const videoFrames = results.map((entry) => entry.result).filter((entry) => entry?.videoCount);
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
    case "VIDEO_SPEED_SHORTCUT": {
      const { speed, changed } = await applyVideoSpeed(message.speed);
      if (changed) await chrome.storage.local.set({ lastSpeed: speed });
      return { ok: changed > 0, changed, speed };
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
      if (!sender.tab?.active) return { ok: false, error: "The selected tab is not active" };
      const optionsKey = `pendingRegionCaptureOptions:${sender.tab.id}`;
      const storedOptions = (await chrome.storage.session.get(optionsKey))[optionsKey];
      await chrome.storage.session.remove(optionsKey);
      await new Promise((resolve) => setTimeout(resolve, 80));
      await capture(message.rect, message.viewport, { ...storedOptions, forceReveal: false });
      return { ok: true };
    }
    case "START_MEASURE": {
      const tab = await activeTab();
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content/measure.js"] });
      return { ok: true };
    }
    case "RESET_ORIGIN":
      await chrome.browsingData.remove({ origins: [message.origin] }, { cache: true, cacheStorage: true, cookies: true, indexedDB: true, localStorage: true, serviceWorkers: true });
      await chrome.tabs.reload((await activeTab()).id, { bypassCache: true });
      return { ok: true };
    case "NAVIGATE":
      await chrome.tabs.update((await activeTab()).id, { url: message.url });
      return { ok: true };
    default:
      return { ok: false, error: "Unknown message" };
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse).catch((error) => sendResponse({ ok: false, error: error.message }));
  return true;
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {});
});
