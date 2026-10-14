import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import vm from "node:vm";

const buildRoot = process.env.TEMOTO_PAGE_TEST_BUILD
  ? pathToFileURL(process.env.TEMOTO_PAGE_TEST_BUILD.replace(/\/$/, "") + "/")
  : new URL("../dist/client/", import.meta.url);
const workerSource = (await readFile(new URL("service-worker.js", buildRoot), "utf8"))
  .replace(/^import[\s\S]*?from\s+"[^"]+";\n/gm, "");
const unavailable = { ok: true, page: { url: "", hostname: "", origin: "", title: "", videoCount: 0, playbackRate: 1 } };

function createPageWorker({
  tab = { id: 7, windowId: 2, url: "https://page.test/watch" },
  frames = [{ frameId: 0, url: "https://page.test/watch", title: "Watch", rates: [] }],
  failure = null,
  failAt = 1,
} = {}) {
  const calls = { queries: 0, scripts: [], proxy: 0, storage: 0 };
  const chrome = {
    tabs: { async query() {
      calls.queries++;
      // A second query would select another tab. Detection must retain the first.
      return [calls.queries === 1 ? tab : { ...tab, id: 99 }];
    } },
    scripting: { async executeScript({ target, files, func, args = [] }) {
      calls.scripts.push({ target: structuredClone(target), files });
      if (failure && calls.scripts.length === failAt) throw new Error(failure);
      if (files) return [{ frameId: 0 }];
      return Promise.all(frames.map(async ({ frameId, url, title, rates }) => ({
        frameId,
        result: await vm.runInNewContext(`(${func.toString()})(...args)`, {
          args, location: new URL(url),
          document: { title, querySelectorAll(selector) {
            assert.equal(selector, "video");
            return rates.map((playbackRate) => ({ playbackRate }));
          } },
        }),
      })));
    } },
    storage: { local: { async get() { calls.storage++; throw new Error("Unexpected storage access"); } } },
    runtime: { id: "temoto", onMessage: { addListener() {} } },
  };
  Object.defineProperty(chrome, "proxy", { get() { calls.proxy++; throw new Error("Unexpected Proxy access"); } });
  const context = {
    chrome, Error, URL,
    withCaptureLock: (operation) => operation(),
    isTrustedProxyPopup: () => true,
    createProxyRuntime() { calls.proxy++; throw new Error("Unexpected Proxy runtime"); },
  };
  vm.runInNewContext(`${workerSource}\nglobalThis.pageMessage = handleMessage;`, context);
  return {
    calls,
    async message(type) { return structuredClone(await context.pageMessage({ type }, {})); },
  };
}

for (const type of ["DETECT_PAGE", "GET_PAGE_STATE"]) {
  test(`${type} skips internal, unsupported and Web Store pages before scripting`, async () => {
    for (const url of [
      "chrome://newtab/", "chrome://extensions/", "chrome-extension://other/index.html",
      "about:blank", "file:///tmp/page.html", "view-source:https://page.test/", "not a URL", undefined,
      "https://chromewebstore.google.com/", "https://chromewebstore.google.com/detail/extension/id",
      "https://chrome.google.com/webstore", "https://chrome.google.com/webstore/detail/extension/id",
    ]) {
      const worker = createPageWorker({ tab: { id: 7, windowId: 2, url } });
      assert.deepEqual(await worker.message(type), unavailable, url);
      assert.equal(worker.calls.queries, 1);
      assert.equal(worker.calls.scripts.length, 0);
      assert.equal(worker.calls.proxy, 0);
      assert.equal(worker.calls.storage, 0);
    }
  });

  test(`${type} quietly reports expected permission and navigation failures`, async () => {
    for (const failure of [
      "Cannot access a chrome:// URL",
      "Cannot access a chrome-extension:// URL of different extension",
      'Cannot access contents of url "https://page.test/watch". Extension manifest must request permission to access this host.',
      "Cannot access contents of the page. Extension manifest must request permission to access the respective host.",
      "The extensions gallery cannot be scripted.",
      "No tab with id: 7", "No tab with id: 7.",
      "No frame with ID: 0", "No frame with id 0 in tab with id 7",
      "Tab containing frame with ID 0 was removed.", "Frame with ID 0 was removed.",
      "Frame with ID 0 is not ready", "Frame with ID 0 is showing error page",
    ]) {
      const worker = createPageWorker({ failure });
      assert.deepEqual(await worker.message(type), unavailable, failure);
      assert.equal(worker.calls.proxy, 0);
      assert.equal(worker.calls.storage, 0);
    }
  });

  test(`${type} leaves unrelated scripting failures available to its caller`, async () => {
    const worker = createPageWorker({ failure: "Could not load file: content/video-speed.js" });
    await assert.rejects(worker.message(type), /Could not load file/);
    assert.equal(worker.calls.proxy, 0);
  });

  test(`${type} aggregates videos across frames and preserves the actual external rate`, async () => {
    const worker = createPageWorker({ frames: [
      { frameId: 0, url: "https://page.test/watch", title: "Watch", rates: [] },
      { frameId: 2, url: "https://embed.test/watch", title: "Embedded", rates: [6.25, 1.5] },
      { frameId: 3, url: "https://other.test/watch", title: "Other", rates: [2] },
    ] });
    assert.deepEqual(await worker.message(type), {
      ok: true, page: { url: "https://page.test/watch", hostname: "page.test", origin: "https://page.test", title: "Watch", videoCount: 3, playbackRate: 6.25 },
    });
    assert.equal(worker.calls.queries, 1);
    assert.ok(worker.calls.scripts.every(({ target }) => target.tabId === 7 && target.allFrames === true));
    assert.equal(worker.calls.scripts.filter(({ files }) => files).length, type === "DETECT_PAGE" ? 1 : 0);
    assert.equal(worker.calls.proxy, 0);
    assert.equal(worker.calls.storage, 0);
  });
}

test("DETECT_PAGE handles access loss between shortcut installation and the page read", async () => {
  const worker = createPageWorker({ failure: "Frame with ID 0 was removed.", failAt: 2 });
  assert.deepEqual(await worker.message("DETECT_PAGE"), unavailable);
  assert.equal(worker.calls.queries, 1);
  assert.equal(worker.calls.scripts.length, 2);
});

test("ordinary google.com pages and Store-like hostname or path prefixes remain detectable", async () => {
  for (const url of ["https://chrome.google.com/", "https://chrome.google.com/webstore-other", "https://chromewebstore.google.com.example.test/"]) {
    const worker = createPageWorker({ tab: { id: 7, windowId: 2, url } });
    assert.equal((await worker.message("GET_PAGE_STATE")).page.origin, "https://page.test");
    assert.equal(worker.calls.scripts.length, 1);
  }
});

test("explicit CSS, video and capture actions still reject access-denied failures", async () => {
  for (const type of ["START_MEASURE", "SET_VIDEO_SPEED", "CAPTURE_VISIBLE", "CAPTURE_FULL_PAGE"]) {
    const worker = createPageWorker({ failure: "Cannot access a chrome:// URL" });
    await assert.rejects(worker.message(type), /Cannot access a chrome:\/\/ URL/);
  }
});
