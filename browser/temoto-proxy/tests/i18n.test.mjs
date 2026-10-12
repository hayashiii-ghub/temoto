import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import { getUiLocale, localizeDocument, localizeError, t } from "../src/i18n.ts";

const root = new URL("../", import.meta.url);
const readJson = async (path) => JSON.parse(await readFile(new URL(path, root), "utf8"));

test("Proxy manifest resolves its product labels from the sole English catalog", async () => {
  const [manifest, en, catalogs] = await Promise.all([
    readJson("public/manifest.json"),
    readJson("public/_locales/en/messages.json"),
    readdir(new URL("public/_locales/", root)),
  ]);

  assert.equal(manifest.version, "1.2.0");
  assert.equal(manifest.default_locale, "en");
  assert.deepEqual(catalogs, ["en"]);
  assert.equal(en.extensionName.message, "temoto Proxy");
  for (const label of [manifest.name, manifest.description, manifest.action.default_title]) {
    const key = /^__MSG_(\w+)__$/.exec(label)?.[1];
    assert.ok(key && en[key]?.message, `unresolved manifest label: ${label}`);
  }
});

test("Japanese query, Chrome and browser languages cannot change Proxy's English interface", () => {
  const environment = {
    location: { search: "?lang=ja" },
    chrome: { i18n: { getUILanguage: () => "ja-JP" } },
    navigator: { language: "ja-JP", languages: ["ja-JP", "ja"] },
  };
  const originals = new Map(Object.keys(environment).map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  try {
    for (const [key, value] of Object.entries(environment)) Object.defineProperty(globalThis, key, { configurable: true, value });
    assert.equal(getUiLocale(), "en");
    assert.equal(t("Proxy active"), "Proxy active");
    assert.equal(t("{name} saved", { name: "会社用" }), "会社用 saved");
    assert.equal(localizeError(new Error("Chrome did not apply the proxy setting")), "Chrome did not apply the proxy setting");
    assert.equal(localizeError(new Error("Default proxy port must be between 1 and 65535")), "Default proxy port must be between 1 and 65535");
    const page = { documentElement: { lang: "ja" }, title: "temoto Proxy — Profiles" };
    localizeDocument(page);
    assert.equal(page.documentElement.lang, "en");
    assert.equal(page.title, "temoto Proxy — Profiles");
  } finally {
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
});

test("Proxy English helpers preserve replacement values and error details", () => {
  assert.equal(t("{count} profiles · {unknown}", { count: 0 }), "0 profiles · {unknown}");
  assert.equal(t("PAC"), "PAC");
  assert.equal(localizeError("Routing rule 2 needs a valid pattern"), "Routing rule 2 needs a valid pattern");
  assert.equal(localizeError(null), "");
});
