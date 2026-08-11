async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("No active tab found");
  return tab;
}

async function executeInActiveTab(func, args = [], allFrames = false) {
  const tab = await activeTab();
  return chrome.scripting.executeScript({ target: { tabId: tab.id, allFrames }, func, args });
}

async function capture(rect = null, viewport = null) {
  const tab = await activeTab();
  const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" });
  const currentViewport = viewport || (await executeInActiveTab(() => ({ width: window.innerWidth, height: window.innerHeight })))[0].result;
  await chrome.storage.session.set({ pendingCapture: { dataUrl, rect, viewport: currentViewport, createdAt: Date.now() } });
  await chrome.tabs.create({ url: chrome.runtime.getURL("capture.html") });
}

async function handleMessage(message, sender) {
  switch (message.type) {
    case "DETECT_PAGE": {
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
      const speed = Number(message.speed);
      const results = await executeInActiveTab((nextSpeed) => {
        const videos = Array.from(document.querySelectorAll("video"));
        videos.forEach((video) => { video.playbackRate = nextSpeed; });
        return videos.length;
      }, [speed], true);
      const changed = results.reduce((total, entry) => total + Number(entry.result || 0), 0);
      return { ok: changed > 0, changed, error: changed ? undefined : "No video found on this page" };
    }
    case "CAPTURE_VISIBLE":
      await capture();
      return { ok: true };
    case "START_REGION_CAPTURE": {
      const tab = await activeTab();
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content/selection.js"] });
      return { ok: true };
    }
    case "CAPTURE_REGION_SELECTED": {
      if (!sender.tab?.active) return { ok: false, error: "The selected tab is not active" };
      await new Promise((resolve) => setTimeout(resolve, 80));
      await capture(message.rect, message.viewport);
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
