import assert from "node:assert/strict";
import test from "node:test";
import { captureVisible, captureFullPage, detectPage, getSettings, pickColor, refreshPage, startMeasure } from "../src/extension-api.ts";

test("old and malformed settings cannot corrupt color preferences", async () => {
  let requested;
  globalThis.chrome = {
    runtime: { id: "test-extension" },
    storage: { local: { get: async (keys) => {
      requested = keys;
      return {
        project: { name: "Old project" },
        lastSpeed: 3,
        lastColor: "#abc",
        colorFormat: "invalid",
        colorHistory: ["not-a-color", "#fff", "FFFFFF", "123456"],
        screenshot: { delayMs: 1234, forceReveal: "true" },
      };
    } } },
  };
  try {
    assert.deepEqual(await getSettings(), {
      lastColor: "#AABBCC", colorHistory: ["#FFFFFF", "#123456"], colorFormat: "hex",
    });
    assert.equal("project" in requested, false);
    assert.equal("lastSpeed" in requested, false);
    assert.equal("screenshot" in requested, false);
  } finally { delete globalThis.chrome; }
});

test("capture requests contain only the chosen visible or full-page mode", async () => {
  const requests = [];
  globalThis.chrome = { runtime: { id: "test-extension", sendMessage: async (message) => {
    requests.push(message);
    return { ok: true };
  } } };
  try {
    await captureVisible();
    await captureFullPage();
    assert.deepEqual(requests, [{ type: "CAPTURE_VISIBLE" }, { type: "CAPTURE_FULL_PAGE" }]);
  } finally { delete globalThis.chrome; }
});

test("built previews load the packaged inspector module and can restart it", async () => {
  const previousDocument = globalThis.document;
  const scripts = [];
  globalThis.document = {
    createElement: () => ({ remove() { this.removed = true; } }),
    documentElement: { appendChild(script) { scripts.push(script); script.onload(); } },
  };
  try {
    assert.deepEqual(await startMeasure(), { ok: true, preview: true });
    assert.deepEqual(await startMeasure(), { ok: true, preview: true });
    assert.equal(scripts.length, 2);
    assert.ok(scripts.every((script) => script.type === "module" && /^\.\/content\/measure\.js\?preview=/.test(script.src) && script.removed));
    assert.notEqual(scripts[0].src, scripts[1].src);
  } finally {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  }
});

test("observing video state uses a read request and preserves actual external rates", async () => {
  const requests = [];
  const page = { hostname: "example.com", origin: "https://example.com", url: "https://example.com", videoCount: 1, playbackRate: 6 };
  globalThis.chrome = { runtime: { id: "test-extension", sendMessage: async (message) => {
    requests.push(message.type);
    return { ok: true, page };
  } } };
  try {
    assert.deepEqual(await detectPage(), page);
    assert.deepEqual(await refreshPage(), page);
    assert.deepEqual(requests, ["DETECT_PAGE", "GET_PAGE_STATE"]);
  } finally { delete globalThis.chrome; }
});

test("a failed inspector start remains a failure for the popup to display", async () => {
  globalThis.chrome = { runtime: { id: "test-extension", sendMessage: async () => ({ ok: false, error: "Page unavailable" }) } };
  try { assert.deepEqual(await startMeasure(), { ok: false, error: "Page unavailable" }); }
  finally { delete globalThis.chrome; }
});

test("a cancelled color pick preserves the AbortError for the UI", async () => {
  const cancelled = new DOMException("Cancelled", "AbortError");
  const oldWindow = globalThis.window;
  globalThis.window = { EyeDropper: class { async open() { throw cancelled; } } };
  try { await assert.rejects(pickColor(), (error) => error === cancelled); }
  finally { if (oldWindow === undefined) delete globalThis.window; else globalThis.window = oldWindow; }
});
