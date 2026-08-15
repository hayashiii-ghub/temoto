import test from "node:test";
import assert from "node:assert/strict";
import { normalizeResetOrigin } from "../public/reset-origin.js";
import { resetOrigin } from "../src/extension-api.js";
import { isPageToolAvailable } from "../src/url-utils.ts";

test("page-dependent tools are unavailable until an HTTP(S) page is detected", () => {
  const unavailablePage = { origin: "" };
  const supportedPage = { origin: "https://example.com" };

  assert.equal(isPageToolAvailable("color", unavailablePage), true);
  for (const tool of ["screenshot", "speed", "environment", "reset", "inspect"]) {
    assert.equal(isPageToolAvailable(tool, unavailablePage), false);
    assert.equal(isPageToolAvailable(tool, supportedPage), true);
  }
});

test("Site Reset accepts only an exact HTTP(S) origin", () => {
  assert.equal(normalizeResetOrigin("https://example.com"), "https://example.com");
  assert.equal(normalizeResetOrigin("http://localhost:3000"), "http://localhost:3000");
  assert.throws(() => normalizeResetOrigin(""), /unavailable/i);
  assert.throws(() => normalizeResetOrigin("chrome://extensions"), /unavailable/i);
  assert.throws(() => normalizeResetOrigin("https://example.com/path"), /unavailable/i);
});

test("Site Reset rejects an unavailable page before requesting permission", async () => {
  let permissionRequested = false;
  globalThis.chrome = {
    runtime: { id: "test-extension" },
    permissions: { request: async () => { permissionRequested = true; return true; } },
  };

  try {
    assert.deepEqual(await resetOrigin(""), {
      ok: false,
      error: "Site Reset is unavailable on this page",
    });
    assert.equal(permissionRequested, false);
  } finally {
    delete globalThis.chrome;
  }
});
