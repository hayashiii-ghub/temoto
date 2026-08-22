import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const readJson = async (path) => JSON.parse(await readFile(new URL(path, root), "utf8"));

test("manifest and locale catalogs describe the 1.1.0 localized extension", async () => {
  const [manifest, en, ja] = await Promise.all([
    readJson("public/manifest.json"),
    readJson("public/_locales/en/messages.json"),
    readJson("public/_locales/ja/messages.json"),
  ]);

  assert.equal(manifest.version, "1.1.0");
  assert.equal(manifest.default_locale, "en");
  assert.equal(manifest.name, "__MSG_extensionName__");
  assert.deepEqual(Object.keys(ja).sort(), Object.keys(en).sort());
  assert.equal(ja.extensionDescription.message.includes("プロキシ"), true);
});

test("proxy UI selects Japanese from the requested locale", async () => {
  Object.defineProperty(globalThis, "location", { configurable: true, value: { search: "?lang=ja" } });
  const { localizeError, t } = await import(`../dist/client/i18n.js?test=${Date.now()}`);
  assert.equal(t("Proxy active"), "プロキシ有効");
  assert.equal(t("{name} saved", { name: "Charles" }), "Charlesを保存しました");
  assert.equal(t("PAC"), "PAC");
  assert.equal(localizeError(new Error("Chrome did not apply the proxy setting")), "Chromeでプロキシ設定を適用できませんでした");
  assert.equal(localizeError(new Error("Default proxy port must be between 1 and 65535")), "既定のプロキシのポートは1から65535で指定してください");
  assert.equal(localizeError(new Error("Routing rule 2 needs a valid pattern")), "ルーティングルール2に有効なパターンを指定してください");
});
