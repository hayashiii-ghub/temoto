import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const readJson = async (path) => JSON.parse(await readFile(new URL(path, root), "utf8"));

test("manifest and locale catalogs describe the 0.2.0 localized extension", async () => {
  const [manifest, en, ja] = await Promise.all([
    readJson("public/manifest.json"),
    readJson("public/_locales/en/messages.json"),
    readJson("public/_locales/ja/messages.json"),
  ]);

  assert.equal(manifest.version, "0.2.0");
  assert.equal(manifest.default_locale, "en");
  assert.equal(manifest.name, "__MSG_extensionName__");
  assert.deepEqual(Object.keys(ja).sort(), Object.keys(en).sort());
  assert.equal(ja.extensionDescription.message.includes("開発ツール"), true);
});

test("popup and page overlays include Japanese translations", async () => {
  const [source, measure, selection, serviceWorker, capturePlan, ja] = await Promise.all([
    readFile(new URL("src/i18n.ts", root), "utf8"),
    readFile(new URL("src/extension/content/measure.ts", root), "utf8"),
    readFile(new URL("src/extension/content/selection.ts", root), "utf8"),
    readFile(new URL("src/extension/service-worker.ts", root), "utf8"),
    readFile(new URL("src/capture-plan.ts", root), "utf8"),
    readJson("public/_locales/ja/messages.json"),
  ]);

  assert.match(source, /"Color Picker": "カラーピッカー"/);
  assert.match(source, /chrome\.i18n\?\.getUILanguage/);
  for (const key of ["inspectStatus", "inspectInstruction", "inspectExit", "selectorCopied"]) {
    assert.match(measure, new RegExp(`"${key}"`));
    assert.ok(ja[key]);
  }
  assert.match(selection, /"captureSelectionHint"/);
  assert.ok(ja.captureSelectionHint);
  const surfacedErrors = [...serviceWorker.matchAll(/throw new Error\("([^"]+)"\)/g), ...capturePlan.matchAll(/throw new Error\("([^"]+)"\)/g)];
  for (const [, message] of surfacedErrors) assert.ok(source.includes(`"${message}"`), `missing Japanese error: ${message}`);
});
