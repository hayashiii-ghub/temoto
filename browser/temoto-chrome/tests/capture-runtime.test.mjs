import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import * as captureUtils from "../src/extension/capture-utils.ts";
import { CAPTURE_LOCK_KEY, withCaptureLock } from "../src/extension/capture-lock.ts";

const workerSource = (await readFile(new URL("../dist/client/service-worker.js", import.meta.url), "utf8"))
  .replace(/^import[\s\S]*?from\s+"[^"]+";\n/gm, "");

function useLockEnvironment(t) {
  const previousChrome = globalThis.chrome;
  const previousNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  const session = {};
  let locked = false;
  const locks = { async request(_name, options, callback) {
    assert.equal(options.ifAvailable, true);
    if (locked) return callback(null);
    locked = true;
    try { return await callback({ name: "temoto-capture" }); }
    finally { locked = false; }
  } };
  const storage = {
    async get(key) { return { [key]: session[key] }; },
    async set(next) { Object.assign(session, next); },
    async remove(key) { delete session[key]; },
  };
  globalThis.chrome = { storage: { session: storage } };
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { locks } });
  t.after(() => {
    globalThis.chrome = previousChrome;
    if (previousNavigator) Object.defineProperty(globalThis, "navigator", previousNavigator);
    else delete globalThis.navigator;
  });
  return { session };
}

function createCaptureWorker(t, { blockScroll = false, failCaptureAt = Infinity } = {}) {
  const { session } = useLockEnvironment(t);
  const saved = [];
  const opened = [];
  const styles = [];
  const capturedOverlayStates = [];
  const waits = [];
  let blocked = false;
  const style = (initial = {}) => {
    const properties = new Map(Object.entries(initial).map(([name, value]) => [name, typeof value === "object" ? value : { value, priority: "important" }]));
    return {
      getPropertyValue: (name) => properties.get(name)?.value || "",
      getPropertyPriority: (name) => properties.get(name)?.priority || "",
      setProperty: (name, value, priority) => properties.set(name, { value, priority }),
      removeProperty: (name) => properties.delete(name),
    };
  };
  const inspector = { style: style({ all: "initial", visibility: { value: "visible", priority: "" } }), selectedElement: "#selected", matches: () => true };
  const badge = { style: style(), matches: () => true };
  const frameBadge = { style: style({ visibility: "visible" }), matches: () => true };
  const ordinary = { style: style({ visibility: { value: "visible", priority: "" } }), matches: () => false, getBoundingClientRect: () => ({ left: 0, top: 0, right: 1000, bottom: 60, width: 1000, height: 60 }) };
  const overlays = [inspector, badge];
  const root = { scrollWidth: 1000, scrollHeight: 2400, style: style({ "scroll-behavior": "smooth" }), appendChild(element) { styles.push(element); } };
  const body = { scrollWidth: 1000, scrollHeight: 2400, style: style(), querySelectorAll: () => [badge, ordinary] };
  const window = {
    innerWidth: 1000, innerHeight: 800, devicePixelRatio: 1, scrollX: 12, scrollY: 400,
    scrollTo(x, y) {
      if (!blocked) { window.scrollX = x; window.scrollY = Math.min(1600, Math.max(0, y)); }
    },
  };
  const document = {
    documentElement: root, body, images: [], fonts: { ready: Promise.resolve() },
    querySelectorAll: (selector) => selector === "[data-temoto-inspect], [data-temoto-video-speed]" ? overlays : [...overlays, ordinary],
    createElement: () => ({ remove() { this.removed = true; } }),
    getElementById: () => null,
  };
  const frameWindow = {};
  const frameDocument = { querySelectorAll: () => [frameBadge] };
  const immediateTimeout = (callback, delay) => { waits.push(delay); callback(); return 1; };
  const chrome = Object.assign(globalThis.chrome, {
    tabs: {
      async query() { return [{ id: 1, windowId: 1, active: true }]; },
      async captureVisibleTab() {
        capturedOverlayStates.push([inspector, badge, frameBadge].map((element) => ({
          value: element.style.getPropertyValue("visibility"), priority: element.style.getPropertyPriority("visibility"),
        })));
        if (capturedOverlayStates.length === failCaptureAt) throw new Error("Native capture failed");
        return "data:image/png;base64,identical";
      },
      async create(tab) { opened.push(tab); },
    },
    scripting: { async executeScript({ func, args = [], target }) {
      if (!func) return [{}];
      blocked = blockScroll && func.toString().includes("hideFloatingElements") && args[1] === true;
      try {
        const result = await vm.runInNewContext(`(${func.toString()})(...args)`, {
          window, document, args, setTimeout: immediateTimeout, requestAnimationFrame: (callback) => callback(),
          getComputedStyle: () => ({ position: "fixed" }),
        });
        const results = [{ frameId: 0, result }];
        if (target.allFrames) {
          const frameResult = await vm.runInNewContext(`(${func.toString()})(...args)`, { window: frameWindow, document: frameDocument, args });
          results.push({ frameId: 1, result: frameResult });
        }
        return results;
      } finally { blocked = false; }
    } },
    runtime: { getURL: (path) => `chrome-extension://temoto/${path}`, onMessage: { addListener() {} } },
  });
  const context = {
    ...captureUtils, chrome, withCaptureLock, setTimeout: immediateTimeout,
    async savePendingCapture(capture) { saved.push(structuredClone(capture)); return `capture-${saved.length}`; },
  };
  vm.runInNewContext(`${workerSource}\nglobalThis.captureMessage = handleMessage;`, context);
  return { session, saved, opened, styles, root, window, inspector, badge, frameBadge, ordinary, capturedOverlayStates, waits, message: (message, sender = {}) => context.captureMessage(message, sender) };
}

test("full-page capture preserves identical image sections and restores the original page", async (t) => {
  const page = createCaptureWorker(t);
  const result = await page.message({ type: "CAPTURE_FULL_PAGE" });
  assert.equal(result.ok, true);
  assert.equal(result.frameCount, 3);
  assert.deepEqual(page.saved[0].frames.map((frame) => frame.scrollY), [0, 800, 1600]);
  assert.equal(new Set(page.saved[0].frames.map((frame) => frame.dataUrl)).size, 1);
  assert.match(page.opened[0].url, /capture\.html\?id=capture-1$/);
  assert.equal(page.window.scrollX, 12);
  assert.equal(page.window.scrollY, 400);
  assert.equal(page.root.style.getPropertyValue("scroll-behavior"), "smooth");
  assert.ok(page.styles.every((element) => element.removed));
  assert.equal(page.session[CAPTURE_LOCK_KEY], undefined);
});

test("a page that cannot advance fails without a partial export and still restores state", async (t) => {
  const page = createCaptureWorker(t, { blockScroll: true });
  await assert.rejects(page.message({ type: "CAPTURE_FULL_PAGE" }), /could not capture every section/);
  assert.equal(page.saved.length, 0);
  assert.equal(page.opened.length, 0);
  assert.equal(page.window.scrollY, 400);
  assert.ok(page.styles.every((element) => element.removed));
  assert.equal(page.session[CAPTURE_LOCK_KEY], undefined);
});

function assertOverlaysRestored(page) {
  assert.equal(page.inspector.style.getPropertyValue("visibility"), "visible");
  assert.equal(page.inspector.style.getPropertyPriority("visibility"), "");
  assert.equal(page.inspector.style.getPropertyValue("all"), "initial");
  assert.equal(page.inspector.style.getPropertyPriority("all"), "important");
  assert.equal(page.inspector.selectedElement, "#selected");
  assert.equal(page.badge.style.getPropertyValue("visibility"), "");
  assert.equal(page.badge.style.getPropertyPriority("visibility"), "");
  assert.equal(page.frameBadge.style.getPropertyValue("visibility"), "visible");
  assert.equal(page.frameBadge.style.getPropertyPriority("visibility"), "important");
  assert.equal(page.ordinary.style.getPropertyValue("visibility"), "visible");
  assert.equal(page.ordinary.style.getPropertyPriority("visibility"), "");
}

for (const type of ["CAPTURE_VISIBLE", "CAPTURE_FULL_PAGE"]) {
  test(`${type} hides only temoto overlays in every frame and preserves inspector state`, async (t) => {
    const page = createCaptureWorker(t);
    await page.message({ type });
    assert.ok(page.capturedOverlayStates.length > 0);
    assert.ok(page.capturedOverlayStates.every((states) => states.every((state) => state.value === "hidden" && state.priority === "important")));
    assertOverlaysRestored(page);
  });

  test(`${type} restores overlay visibility and priorities after a native capture failure`, async (t) => {
    const page = createCaptureWorker(t, { failCaptureAt: type === "CAPTURE_FULL_PAGE" ? 2 : 1 });
    await assert.rejects(page.message({ type }), /Native capture failed/);
    assert.ok(page.capturedOverlayStates.every((states) => states.every((state) => state.value === "hidden" && state.priority === "important")));
    assertOverlaysRestored(page);
    assert.equal(page.saved.length, 0);
  });
}

test("visible capture does not use legacy delay or reveal preferences", async (t) => {
  const page = createCaptureWorker(t);
  await page.message({ type: "CAPTURE_VISIBLE", options: { delayMs: 3000, forceReveal: true } });
  assert.equal(page.saved.length, 1);
  assert.equal(page.styles.length, 0);
  assert.equal(page.waits.includes(3000), false);
  assert.equal("rect" in page.saved[0], false);
  assert.equal(page.session[CAPTURE_LOCK_KEY], undefined);
});

test("full-page capture handles preparation automatically without forcing hidden content visible", async (t) => {
  const page = createCaptureWorker(t);
  await page.message({ type: "CAPTURE_FULL_PAGE", options: { delayMs: 3000, forceReveal: true } });
  assert.equal(page.saved[0].frames.length, 3);
  assert.equal(page.waits.includes(3000), false);
  assert.ok(page.waits.includes(captureUtils.CAPTURE_PRELOAD_SCROLL_INTERVAL_MS));
  assert.ok(page.styles.every((style) => !/opacity\s*:|visibility\s*:|transform\s*:/.test(style.textContent)));
  assertOverlaysRestored(page);
});

test("overlapping screenshot starts are rejected even before the first storage write finishes", async (t) => {
  const { session } = useLockEnvironment(t);
  let finish;
  const pending = new Promise((resolve) => { finish = resolve; });
  const first = withCaptureLock(() => pending);
  await assert.rejects(withCaptureLock(async () => "second"), /already being captured/);
  finish("first");
  assert.equal(await first, "first");
  assert.equal(session[CAPTURE_LOCK_KEY], undefined);
});

test("a live persisted job blocks restarts, an expired job recovers, and failures release the lock", async (t) => {
  const { session } = useLockEnvironment(t);
  session[CAPTURE_LOCK_KEY] = { id: "interrupted", expiresAt: Date.now() + 60000 };
  await assert.rejects(withCaptureLock(async () => "blocked"), /already being captured/);
  session[CAPTURE_LOCK_KEY].expiresAt = Date.now() - 1;
  await assert.rejects(withCaptureLock(async () => { throw new Error("capture failed"); }), /capture failed/);
  assert.equal(session[CAPTURE_LOCK_KEY], undefined);
  assert.equal(await withCaptureLock(async () => "recovered"), "recovered");
});
