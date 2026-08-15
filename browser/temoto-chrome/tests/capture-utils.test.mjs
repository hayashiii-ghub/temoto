import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_FULL_PAGE_HEIGHT,
  didFullPageCaptureAdvance,
  nextFullPageCaptureY,
  normalizeCaptureMetrics,
  normalizeScreenshotOptions,
} from "../src/extension/capture-utils.ts";

test("full-page capture advances by one viewport and aligns the final frame to the bottom", () => {
  assert.equal(nextFullPageCaptureY(0, 2500, 800), 800);
  assert.equal(nextFullPageCaptureY(800, 2500, 800), 1600);
  assert.equal(nextFullPageCaptureY(1600, 2500, 800), 1700);
  assert.equal(nextFullPageCaptureY(1700, 2500, 800), null);
});

test("short pages need only the initial frame", () => {
  assert.equal(nextFullPageCaptureY(0, 600, 800), null);
});

test("capture stops when the browser lands fractionally before the measured bottom", () => {
  assert.equal(nextFullPageCaptureY(1699.5, 2500, 800), null);
});

test("capture stops if a requested scroll does not advance the page", () => {
  assert.equal(didFullPageCaptureAdvance(1699, 1699), false);
  assert.equal(didFullPageCaptureAdvance(800, 1600), true);
});

test("capture metrics reject pages above the safe canvas height", () => {
  assert.throws(
    () => normalizeCaptureMetrics(MAX_FULL_PAGE_HEIGHT + 1, 800),
    /height limit/,
  );
});

test("capture metrics account for high-density displays", () => {
  assert.throws(
    () => normalizeCaptureMetrics(MAX_FULL_PAGE_HEIGHT / 2 + 1, 800, 2),
    /height limit/,
  );
});

test("screenshot options accept supported delays and normalize unsafe input", () => {
  assert.deepEqual(normalizeScreenshotOptions({ delayMs: 3000, forceReveal: true }), {
    delayMs: 3000,
    forceReveal: true,
  });
  assert.deepEqual(normalizeScreenshotOptions({ delayMs: 999999, forceReveal: "yes" }), {
    delayMs: 0,
    forceReveal: false,
  });
});
