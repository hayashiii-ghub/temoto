import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

import { applyDocumentLocale, getUiLocale, localizeError, t } from "../src/i18n.ts";

const root = new URL("../", import.meta.url);
const readJson = async (path) => JSON.parse(await readFile(new URL(path, root), "utf8"));

test("the core manifest resolves its product labels from the sole English catalog", async () => {
  const [manifest, en, catalogs, popup, capture] = await Promise.all([
    readJson("public/manifest.json"),
    readJson("public/_locales/en/messages.json"),
    readdir(new URL("public/_locales/", root)),
    readFile(new URL("index.html", root), "utf8"),
    readFile(new URL("capture.html", root), "utf8"),
  ]);

  assert.equal(manifest.version, "1.2.6");
  assert.equal(manifest.default_locale, "en");
  assert.deepEqual(catalogs, ["en"]);
  for (const label of [manifest.name, manifest.description, manifest.action.default_title, manifest.commands._execute_action.description]) {
    const key = /^__MSG_(\w+)__$/.exec(label)?.[1];
    assert.ok(key && en[key]?.message, `unresolved manifest label: ${label}`);
  }
  assert.equal(en.extensionName.message, "temoto");
  assert.match(popup, /<html lang="en">/);
  assert.match(capture, /<html lang="en">/);
  const badgeFont = manifest.web_accessible_resources?.find((entry) => entry.resources.includes("fonts/geist-latin-wght-normal.woff2"));
  assert.deepEqual(badgeFont?.matches, ["http://*/*", "https://*/*"]);
});

test("Japanese query, Chrome and browser languages still produce English controls and errors", () => {
  const environment = {
    location: { search: "?lang=ja" },
    chrome: { i18n: { getUILanguage: () => "ja-JP" } },
    navigator: { language: "ja-JP", languages: ["ja-JP", "ja"] },
    document: { documentElement: { lang: "ja" } },
  };
  const originals = new Map(Object.keys(environment).map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  try {
    for (const [key, value] of Object.entries(environment)) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
    assert.equal(getUiLocale(), "en");
    assert.equal(t("Color Picker"), "Color Picker");
    assert.equal(t("{count} videos on this page", { count: 2 }), "2 videos on this page");
    assert.equal(localizeError(new Error("Could not copy. Please try again."), "Copy failed"), "Could not copy. Please try again.");
    assert.equal(localizeError(null, "Could not pick a color"), "Could not pick a color");
    applyDocumentLocale();
    assert.equal(document.documentElement.lang, "en");
  } finally {
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
});

test("English replacement and error helpers preserve meaningful values and unknown tokens", () => {
  assert.equal(t("{count} · {color} · {missing}", { count: 0, color: "#9974F8" }), "0 · #9974F8 · {missing}");
  assert.equal(localizeError("The page changed", "Capture failed"), "The page changed");
  assert.equal(localizeError(new Error(""), "Capture failed"), "Capture failed");
});
