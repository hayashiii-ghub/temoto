import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../dist/client/content/video-speed.js", import.meta.url), "utf8");

function loadContentScript(initialSpeed = 1.5, videoCount = 2, fontOptions = null) {
  class HTMLElement {
    constructor(tagName = "DIV", isContentEditable = false) {
      this.tagName = tagName;
      this.isContentEditable = isContentEditable;
      this.dataset = {};
      this.style = {};
      this.textContent = "";
      this.attributes = {};
    }

    setAttribute(name, value) { this.attributes[name] = value; }
  }

  class VideoElement extends HTMLElement {
    constructor(playbackRate, left) {
      super("VIDEO");
      this._playbackRate = playbackRate;
      this.left = left;
      this.listeners = new Map();
    }

    get playbackRate() { return this._playbackRate; }
    set playbackRate(value) {
      this._playbackRate = value;
      this.listeners.get("ratechange")?.forEach((listener) => listener());
    }
    addEventListener(type, listener) {
      if (!this.listeners.has(type)) this.listeners.set(type, new Set());
      this.listeners.get(type).add(listener);
    }
    removeEventListener(type, listener) { this.listeners.get(type)?.delete(listener); }
    getBoundingClientRect() {
      return { left: this.left, top: 20, right: this.left + 320, bottom: 200, width: 320, height: 180 };
    }
  }

  const root = {
    children: [],
    append(element) {
      element.remove = () => {
        this.children = this.children.filter((child) => child !== element);
      };
      this.children.push(element);
    },
  };
  const videos = Array.from({ length: videoCount }, (_, index) => new VideoElement(initialSpeed, 20 + 360 * index));
  const windowListeners = new Map();
  const documentListeners = new Map();
  const messageListeners = new Set();
  const sentMessages = [];
  const notifications = [];
  const fonts = new Set();
  const requestedFonts = [];
  const createdFonts = [];
  let observerCallback = () => {};
  let disconnected = false;
  let canceledFrames = 0;
  let notificationError;
  let rejectNotification = false;
  let throwOnRemove = false;
  const window = {
    innerWidth: 1024,
    innerHeight: 768,
    addEventListener(type, listener) {
      if (!windowListeners.has(type)) windowListeners.set(type, new Set());
      windowListeners.get(type).add(listener);
    },
    removeEventListener(type, listener) { windowListeners.get(type)?.delete(listener); },
    requestAnimationFrame() { return 1; },
    cancelAnimationFrame() { canceledFrames++; },
  };
  const document = {
    body: root,
    documentElement: root,
    querySelectorAll: (selector) => selector === "video" ? videos : [],
    createElement: (tagName) => new HTMLElement(tagName.toUpperCase()),
    addEventListener(type, listener) {
      if (!documentListeners.has(type)) documentListeners.set(type, new Set());
      documentListeners.get(type).add(listener);
    },
    removeEventListener(type, listener) { documentListeners.get(type)?.delete(listener); },
    fonts,
  };
  class MutationObserver {
    constructor(callback) { observerCallback = callback; }
    observe() {}
    disconnect() { disconnected = true; }
  }
  const chrome = {
    runtime: {
      id: "temoto-test",
      getURL: (path) => `chrome-extension://temoto-test/${path}`,
      onMessage: {
        addListener(listener) { messageListeners.add(listener); },
        removeListener(listener) {
          if (throwOnRemove) throw new Error("Extension context invalidated.");
          messageListeners.delete(listener);
        },
      },
      sendMessage(message) {
        sentMessages.push(message);
        if (notificationError) {
          if (rejectNotification) return Promise.reject(notificationError);
          throw notificationError;
        }
        return Promise.resolve();
      },
    },
  };
  class MockFontFace {
    constructor(family, bytes, descriptors) {
      Object.assign(this, { family, bytes, descriptors });
      createdFonts.push(this);
    }
    async load() {
      if (fontOptions?.loadFont) await fontOptions.loadFont();
      return this;
    }
  }

  vm.runInNewContext(source, {
    window,
    document,
    chrome,
    HTMLElement,
    MutationObserver,
    queueMicrotask: (callback) => notifications.push(callback),
    ...(fontOptions && {
      FontFace: MockFontFace,
      AbortController,
      fetch: async (url, options) => {
        requestedFonts.push({ url, options });
        if (fontOptions.fetchFont) return fontOptions.fetchFont(url, options);
        return { ok: true, arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer };
      },
    }),
  });

  return {
    videos,
    sentMessages,
    fonts,
    requestedFonts,
    createdFonts,
    settleFont: () => new Promise(setImmediate),
    flushNotifications() {
      while (notifications.length) notifications.shift()();
    },
    invalidate() {
      chrome.runtime.id = undefined;
      throwOnRemove = true;
    },
    failNotification(message, asynchronous = false) {
      notificationError = new Error(message);
      rejectNotification = asynchronous;
      throwOnRemove = message === "Extension context invalidated.";
    },
    cleanup: () => window.__temotoVideoSpeedShortcutCleanup?.(),
    resources: () => ({
      disconnected,
      canceledFrames,
      windowListeners: [...windowListeners.values()].reduce((sum, set) => sum + set.size, 0),
      documentListeners: [...documentListeners.values()].reduce((sum, set) => sum + set.size, 0),
      videoListeners: videos.reduce((sum, video) => sum
        + [...video.listeners.values()].reduce((count, set) => count + set.size, 0), 0),
    }),
    badges: () => root.children.filter((element) => Object.hasOwn(element.dataset, "temotoVideoSpeed")),
    keydown(event) {
      for (const listener of windowListeners.get("keydown") || []) listener(event);
    },
    message(message) {
      let response;
      for (const listener of messageListeners) listener(message, {}, (value) => { response = value; });
      return response;
    },
    syncVideos() {
      observerCallback();
    },
    replaceVideo(index, playbackRate) {
      videos[index] = new VideoElement(playbackRate, videos[index].left);
      observerCallback();
    },
    silentReset(playbackRate) {
      videos.forEach((video) => { video._playbackRate = playbackRate; });
    },
    dispatch(type) {
      videos.forEach((video) => {
        video.listeners.get(type)?.forEach((listener) => listener({ type }));
      });
    },
    element: (tagName = "DIV", isContentEditable = false) => new HTMLElement(tagName, isContentEditable),
  };
}

function keyEvent(key, path, overrides = {}) {
  return {
    key,
    metaKey: false,
    ctrlKey: false,
    altKey: false,
    composedPath: () => path,
    preventDefault() {},
    stopPropagation() {},
    ...overrides,
  };
}

test("page shortcuts change every video without opening the popup", () => {
  const page = loadContentScript();
  page.keydown(keyEvent("d", [page.element()]));
  assert.deepEqual(page.videos.map((video) => video.playbackRate), [1.75, 1.75]);
  assert.equal(page.sentMessages.length, 1);
  assert.equal(page.sentMessages[0].type, "VIDEO_SPEED_SHORTCUT");
  assert.equal(page.sentMessages[0].speed, 1.75);
});

test("G toggles every video between 1x and 1.5x", () => {
  const page = loadContentScript();
  page.keydown(keyEvent("g", [page.element()]));
  assert.deepEqual(page.videos.map((video) => video.playbackRate), [1, 1]);
  page.keydown(keyEvent("G", [page.element()]));
  assert.deepEqual(page.videos.map((video) => video.playbackRate), [1.5, 1.5]);
});

test("each video shows a passive badge that follows rate changes", () => {
  const page = loadContentScript();
  assert.deepEqual(page.badges().map((badge) => badge.textContent), ["1.5×", "1.5×"]);
  assert.ok(page.badges().every((badge) => badge.style.pointerEvents === "none"));

  page.videos[1].playbackRate = 2.25;
  assert.deepEqual(page.badges().map((badge) => badge.textContent), ["1.5×", "2.25×"]);
});

test("page shortcuts ignore editable fields and modifier combinations", () => {
  const page = loadContentScript();
  page.keydown(keyEvent("g", [page.element("INPUT")]));
  for (const modifier of ["metaKey", "ctrlKey", "altKey", "shiftKey"]) {
    page.keydown(keyEvent("s", [page.element()], { [modifier]: true }));
  }
  assert.deepEqual(page.videos.map((video) => video.playbackRate), [1.5, 1.5]);
  assert.deepEqual(page.sentMessages, []);
});

test("page shortcuts ignore synthetic keydown events without event data", () => {
  const page = loadContentScript();
  assert.doesNotThrow(() => page.keydown(keyEvent(undefined, [page.element()])));
  assert.doesNotThrow(() => page.keydown(undefined));
  assert.deepEqual(page.videos.map((video) => video.playbackRate), [1.5, 1.5]);
  assert.deepEqual(page.sentMessages, []);
});

test("background shortcut messages synchronize videos in the frame", () => {
  const page = loadContentScript();
  const response = page.message({ type: "APPLY_VIDEO_SPEED", speed: 2.25 });
  assert.deepEqual(page.videos.map((video) => video.playbackRate), [2.25, 2.25]);
  assert.deepEqual(JSON.parse(JSON.stringify(response)), { changed: 2 });
});

test("a reused video's badge follows its actual speed after a silent reset", () => {
  const page = loadContentScript();
  page.keydown(keyEvent("d", [page.element()]));
  page.silentReset(1);
  page.dispatch("loadstart");
  assert.deepEqual(page.videos.map((video) => video.playbackRate), [1, 1]);
  assert.deepEqual(page.badges().map((badge) => badge.textContent), ["1×", "1×"]);
});

test("a newly inserted video keeps its own speed", () => {
  const page = loadContentScript();
  page.keydown(keyEvent("d", [page.element()]));
  page.replaceVideo(0, 1);
  assert.equal(page.videos[0].playbackRate, 1);
  assert.equal(page.videos[1].playbackRate, 1.75);
  assert.deepEqual(page.badges().map((badge) => badge.textContent).sort(), ["1.75×", "1×"]);
});

function assertStopped(page) {
  assert.equal(page.badges().length, 0);
  assert.deepEqual(page.resources(), {
    disconnected: true,
    canceledFrames: 1,
    windowListeners: 0,
    documentListeners: 0,
    videoListeners: 0,
  });
  const speeds = page.videos.map((video) => video.playbackRate);
  const sent = page.sentMessages.length;
  assert.doesNotThrow(() => {
    page.keydown(keyEvent("d", [page.element()]));
    page.syncVideos(); // A queued observer callback must not recreate badges.
    page.message({ type: "APPLY_VIDEO_SPEED", speed: 3 });
    page.cleanup();
  });
  assert.deepEqual(page.videos.map((video) => video.playbackRate), speeds);
  assert.equal(page.sentMessages.length, sent);
  assert.equal(page.badges().length, 0);
}

test("invalidated context releases resources without consuming the next shortcut", () => {
  const page = loadContentScript();
  page.dispatch("play"); // Schedule a badge-position frame before invalidation.
  page.invalidate();
  assert.doesNotThrow(() => page.keydown(keyEvent("d", [page.element()], {
    preventDefault() { assert.fail("stale handler consumed a key"); },
    stopPropagation() { assert.fail("stale handler stopped propagation"); },
  })));
  assert.deepEqual(page.videos.map((video) => video.playbackRate), [1.5, 1.5]);
  assert.equal(page.sentMessages.length, 0);
  assertStopped(page);
});

test("DOM activity also cleans up an invalidated script without a shortcut", () => {
  const page = loadContentScript();
  page.dispatch("play");
  page.invalidate();
  assert.doesNotThrow(() => page.syncVideos());
  assertStopped(page);
});

for (const asynchronous of [false, true]) {
  test(`notification invalidation is handled when ${asynchronous ? "rejected" : "thrown synchronously"}`, async () => {
    const page = loadContentScript();
    page.failNotification("Extension context invalidated.", asynchronous);
    assert.doesNotThrow(() => page.keydown(keyEvent("d", [page.element()])));
    await Promise.resolve();
    assert.equal(page.sentMessages.length, 1);
    assertStopped(page);
  });
}

test("a transient notification rejection does not disable local video controls", async () => {
  const page = loadContentScript();
  page.failNotification("Could not establish connection. Receiving end does not exist.", true);
  page.keydown(keyEvent("d", [page.element()]));
  await Promise.resolve();
  page.keydown(keyEvent("d", [page.element()]));
  await Promise.resolve();
  assert.deepEqual(page.videos.map((video) => video.playbackRate), [2, 2]);
  assert.equal(page.badges().length, 2);
  assert.equal(page.resources().disconnected, false);
});

test("badges show actual positive rates outside the control range", () => {
  const page = loadContentScript(6);
  assert.deepEqual(page.badges().map((badge) => badge.textContent), ["6×", "6×"]);
  page.videos[1].playbackRate = 0.1;
  assert.deepEqual(page.badges().map((badge) => badge.textContent), ["6×", "0.1×"]);
  page.videos[1].playbackRate = 0.001;
  assert.equal(page.badges()[1].textContent, "0.001×");
  page.message({ type: "APPLY_VIDEO_SPEED", speed: 7 });
  assert.deepEqual(page.videos.map((video) => video.playbackRate), [5, 5]);
  page.message({ type: "APPLY_VIDEO_SPEED", speed: 0.1 });
  assert.deepEqual(page.videos.map((video) => video.playbackRate), [0.25, 0.25]);
});

test("state notifications coalesce actual rates and ignore badge-only DOM changes", () => {
  const page = loadContentScript();
  page.flushNotifications();
  assert.deepEqual(JSON.parse(JSON.stringify(page.sentMessages)), [{ type: "VIDEO_STATE_CHANGED", videoCount: 2, playbackRate: 1.5 }]);
  page.videos[0].playbackRate = 6;
  page.videos[1].playbackRate = 0.1;
  page.syncVideos();
  page.flushNotifications();
  assert.equal(page.sentMessages.length, 2);
  assert.deepEqual(JSON.parse(JSON.stringify(page.sentMessages[1])), { type: "VIDEO_STATE_CHANGED", videoCount: 2, playbackRate: 6 });
  page.syncVideos();
  page.dispatch("play");
  page.flushNotifications();
  assert.equal(page.sentMessages.length, 2);
});

test("second video rate changes and media loads notify without forcing playback", () => {
  const page = loadContentScript();
  page.flushNotifications();
  page.videos[1].playbackRate = 3;
  page.flushNotifications();
  assert.equal(page.sentMessages.length, 2);
  assert.equal(page.sentMessages[1].playbackRate, 1.5);
  page.silentReset(1);
  page.dispatch("loadedmetadata");
  page.flushNotifications();
  assert.equal(page.sentMessages.length, 3);
  assert.equal(page.sentMessages[2].playbackRate, 1);
  assert.deepEqual(page.videos.map((video) => video.playbackRate), [1, 1]);
  page.dispatch("loadstart");
  page.flushNotifications();
  assert.equal(page.sentMessages.length, 4);
});

test("insertions, replacements and removals notify the actual video count", () => {
  const page = loadContentScript();
  page.flushNotifications();
  page.replaceVideo(0, 1);
  page.flushNotifications();
  assert.equal(page.sentMessages.at(-1).playbackRate, 1);
  assert.equal(page.videos[1].playbackRate, 1.5);
  page.videos.pop();
  page.syncVideos();
  page.flushNotifications();
  assert.equal(page.sentMessages.at(-1).videoCount, 1);
  page.videos.pop();
  page.syncVideos();
  page.flushNotifications();
  assert.deepEqual(JSON.parse(JSON.stringify(page.sentMessages.at(-1))), { type: "VIDEO_STATE_CHANGED", videoCount: 0, playbackRate: 1 });
  assert.equal(page.badges().length, 0);
});

test("pages without videos do not send an unchanged initial notification", () => {
  const page = loadContentScript(1, 0);
  page.flushNotifications();
  page.syncVideos();
  page.flushNotifications();
  assert.deepEqual(page.sentMessages, []);
});

test("a queued state notification cannot revive an invalidated script", () => {
  const page = loadContentScript();
  page.invalidate();
  page.flushNotifications();
  assert.equal(page.sentMessages.length, 0);
  assert.equal(page.badges().length, 0);
  assert.equal(page.resources().disconnected, true);
});

for (const asynchronous of [false, true]) {
  test(`state-notification invalidation cleans up when ${asynchronous ? "rejected" : "thrown synchronously"}`, async () => {
    const page = loadContentScript();
    page.dispatch("play");
    page.failNotification("Extension context invalidated.", asynchronous);
    assert.doesNotThrow(() => page.flushNotifications());
    await Promise.resolve();
    assert.equal(page.sentMessages.length, 1);
    assert.equal(page.sentMessages[0].type, "VIDEO_STATE_CHANGED");
    assertStopped(page);
  });
}

test("video badges remain readable sans text when FontFace is unavailable", () => {
  const page = loadContentScript();
  assert.ok(page.badges().every((badge) => badge.style.font.startsWith("600 12px/1.2")));
  assert.ok(page.badges().every((badge) => badge.style.font.endsWith("sans-serif")));
  assert.ok(page.badges().every((badge) => badge.style.fontVariantNumeric === "tabular-nums"));
  assert.equal(page.requestedFonts.length, 0);
  page.keydown(keyEvent("d", [page.element()]));
  assert.deepEqual(page.videos.map((video) => video.playbackRate), [1.75, 1.75]);
});

test("the first video loads one local variable font and cleanup removes only temoto's face", async () => {
  const page = loadContentScript(1.5, 2, {});
  const existingPageFont = { family: "page font" };
  page.fonts.add(existingPageFont);
  await page.settleFont();
  assert.equal(page.requestedFonts.length, 1);
  assert.equal(page.requestedFonts[0].url, "chrome-extension://temoto-test/fonts/geist-latin-wght-normal.woff2");
  assert.equal(page.createdFonts.length, 1);
  assert.equal(page.createdFonts[0].family, "temoto Geist Sans");
  assert.equal(page.createdFonts[0].descriptors.weight, "100 900");
  assert.ok(page.createdFonts[0].bytes instanceof ArrayBuffer);
  assert.ok(page.fonts.has(page.createdFonts[0]));
  page.replaceVideo(0, 1);
  await page.settleFont();
  assert.equal(page.requestedFonts.length, 1);
  page.cleanup();
  assert.deepEqual([...page.fonts], [existingPageFont]);
  assert.equal(page.badges().length, 0);
});

test("pages without videos wait to load the badge font until a video appears", async () => {
  const page = loadContentScript(1, 0, {});
  await page.settleFont();
  assert.equal(page.requestedFonts.length, 0);
  const firstVideo = loadContentScript(1, 1).videos[0];
  page.videos.push(firstVideo);
  page.syncVideos();
  await page.settleFont();
  assert.equal(page.requestedFonts.length, 1);
  assert.equal(page.fonts.size, 1);
});

for (const failure of ["fetch", "decode"]) {
  test(`a badge font ${failure} failure does not disable local video controls`, async () => {
    const options = failure === "fetch"
      ? { fetchFont: async () => { throw new TypeError("CSP blocked resource"); } }
      : { loadFont: async () => { throw new Error("Invalid font data"); } };
    const page = loadContentScript(1.5, 2, options);
    await page.settleFont();
    assert.equal(page.fonts.size, 0);
    assert.equal(page.badges().length, 2);
    page.keydown(keyEvent("d", [page.element()]));
    assert.deepEqual(page.videos.map((video) => video.playbackRate), [1.75, 1.75]);
    assert.equal(page.resources().disconnected, false);
  });
}

for (const pendingStage of ["fetch", "load"]) {
  test(`invalidating a script during font ${pendingStage} aborts work and prevents late font registration`, async () => {
    let finish;
    const pending = new Promise((resolve) => { finish = resolve; });
    const options = pendingStage === "fetch"
      ? { fetchFont: () => pending }
      : { loadFont: () => pending };
    const page = loadContentScript(1.5, 2, options);
    await page.settleFont();
    assert.equal(page.fonts.size, 0);
    page.invalidate();
    page.syncVideos();
    assert.equal(page.requestedFonts[0].options.signal.aborted, true);
    finish(pendingStage === "fetch" ? { ok: true, arrayBuffer: async () => new Uint8Array([1]).buffer } : undefined);
    await page.settleFont();
    assert.equal(page.fonts.size, 0);
    assert.equal(page.badges().length, 0);
    assert.equal(page.resources().disconnected, true);
  });
}
