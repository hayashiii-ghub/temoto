import assert from "node:assert/strict";
import test from "node:test";
import { loadProxyDraft, saveProxyDraft } from "../src/proxy-api.ts";

const key = "temoto.core.proxy.draft";
const draft = { id: "draft", isNew: true, name: "Local", kind: "pac", scheme: "http", host: "user:secret@proxy.test", port: "8080", pacUrl: "https://user:secret@proxy.test/config.pac" };

function session(initial = {}) {
  const data = structuredClone(initial);
  globalThis.chrome = { runtime: { id: "test-extension" }, storage: { session: {
    get: async () => structuredClone(data),
    set: async (values) => Object.assign(data, structuredClone(values)),
    remove: async (name) => { delete data[name]; },
  } } };
  return data;
}

test("unfinished Proxy input does not persist embedded endpoint credentials", async () => {
  const data = session();
  try {
    await saveProxyDraft(draft);
    assert.deepEqual(data[key], { ...draft, host: "", pacUrl: "" });
    assert.equal(draft.pacUrl, "https://user:secret@proxy.test/config.pac");
    const safeUrl = "https://proxy.test/config/team@example.pac";
    await saveProxyDraft({ ...draft, host: "proxy.test", pacUrl: safeUrl });
    assert.equal(data[key].pacUrl, safeUrl);
  } finally { delete globalThis.chrome; }
});

test("restoring an older credential-bearing draft clears the stored credentials", async () => {
  const data = session({ [key]: { ...draft, password: "extra-secret" } });
  try {
    assert.deepEqual(await loadProxyDraft(), { ...draft, host: "", pacUrl: "" });
    assert.deepEqual(data[key], { ...draft, host: "", pacUrl: "" });
  } finally { delete globalThis.chrome; }
});
