import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../dist/client/content/video-speed.js", import.meta.url), "utf8");

function loadContentScript(initialSpeed = 1.5) {
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
  const videos = [new VideoElement(initialSpeed, 20), new VideoElement(initialSpeed, 380)];
  const windowListeners = new Map();
  const documentListeners = new Map();
  const messageListeners = new Set();
  const sentMessages = [];
  const window = {
    innerWidth: 1024,
    innerHeight: 768,
    addEventListener(type, listener) {
      if (!windowListeners.has(type)) windowListeners.set(type, new Set());
      windowListeners.get(type).add(listener);
    },
    removeEventListener(type, listener) { windowListeners.get(type)?.delete(listener); },
    requestAnimationFrame() { return 1; },
    cancelAnimationFrame() {},
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
  };
  class MutationObserver {
    constructor(callback) { this.callback = callback; }
    observe() {}
    disconnect() {}
  }
  const chrome = {
    runtime: {
      onMessage: {
        addListener(listener) { messageListeners.add(listener); },
        removeListener(listener) { messageListeners.delete(listener); },
      },
      sendMessage(message) {
        sentMessages.push(message);
        return Promise.resolve();
      },
    },
  };

  vm.runInNewContext(source, {
    window,
    document,
    chrome,
    HTMLElement,
    MutationObserver,
  });

  return {
    videos,
    sentMessages,
    badges: () => root.children.filter((element) => Object.hasOwn(element.dataset, "temotoVideoSpeed")),
    keydown(event) {
      for (const listener of windowListeners.get("keydown") || []) listener(event);
    },
    message(message) {
      for (const listener of messageListeners) listener(message);
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
  page.keydown(keyEvent("s", [page.element()], { metaKey: true }));
  assert.deepEqual(page.videos.map((video) => video.playbackRate), [1.5, 1.5]);
  assert.deepEqual(page.sentMessages, []);
});

test("background shortcut messages synchronize videos in the frame", () => {
  const page = loadContentScript();
  page.message({ type: "APPLY_VIDEO_SPEED", speed: 2.25 });
  assert.deepEqual(page.videos.map((video) => video.playbackRate), [2.25, 2.25]);
});
