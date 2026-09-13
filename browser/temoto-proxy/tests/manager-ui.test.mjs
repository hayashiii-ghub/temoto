import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("manager packages its own styling without changing the popup entrypoint", async () => {
  const [manager, popup, css] = await Promise.all([
    read("../dist/client/manager.html"), read("../dist/client/popup.html"), read("../dist/client/manager.css"),
  ]);
  assert.match(manager, /href="manager.css"/);
  assert.doesNotMatch(popup, /manager.css/);
  assert.match(css, /\.manager-page/);
  assert.doesNotMatch(manager, /danger-text|type="color"/);
});

test("advanced manager controls use native disclosures and retain their form controls", async () => {
  const html = await read("../dist/client/manager.html");
  for (const id of ["bypass-section", "authentication-section", "connection-test-section"]) {
    assert.match(html, new RegExp(`<details[^>]*id="${id}"[^>]*>\\s*<summary>`));
  }
  for (const name of ["name", "kind", "perProtocol", "bypassList", "authEnabled", "password", "authHosts", "pacSource", "pacValue", "diagnosticUrl"]) {
    assert.match(html, new RegExp(`name="${name}"`));
  }
  assert.match(html, /class="brand" translate="no"/);
});

test("manager palette stays monochrome with purple reserved for accent", async () => {
  const css = await read("../dist/client/manager.css");
  const allowed = new Set(["#080808", "#111111", "#191919", "#242424", "#3c3c3b", "#92928f", "#f4f3ef", "#a6a6a3", "#9974f8", "#18131f", "#bda5ff"]);
  const colors = css.match(/#[\da-f]{6}\b/gi) || [];
  assert.ok(colors.length > 0);
  for (const color of colors) assert.ok(allowed.has(color.toLowerCase()), `Unexpected manager color: ${color}`);
  assert.doesNotMatch(css, /rgba?\(|hsla?\(/i);
});

test("endpoint focus uses one bottom rule instead of nested outlines", async () => {
  const css = await read("../dist/client/manager.css");
  assert.match(css, /\.endpoint-grid \.field \{[^}]*border: 0;[^}]*border-bottom: 1px solid var\(--line\)/);
  assert.match(css, /\.endpoint-grid \.field:focus-within \{[^}]*border-bottom-color: var\(--purple\)/);
  assert.match(css, /\.endpoint-grid \.field :is\(input, select\):focus-visible \{ outline: none; \}/);
});
