import test from "node:test";
import assert from "node:assert/strict";
import { isPageToolAvailable } from "../src/url-utils.ts";

test("page-dependent tools are unavailable until an HTTP(S) page is detected", () => {
  const unavailablePage = { origin: "" };
  const supportedPage = { origin: "https://example.com" };

  assert.equal(isPageToolAvailable("color", unavailablePage), true);
  for (const tool of ["screenshot", "speed", "inspect"]) {
    assert.equal(isPageToolAvailable(tool, unavailablePage), false);
    assert.equal(isPageToolAvailable(tool, supportedPage), true);
  }
});
