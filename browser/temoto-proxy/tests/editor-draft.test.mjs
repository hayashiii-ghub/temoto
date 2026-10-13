import assert from "node:assert/strict";
import test from "node:test";
import { clearEditorDraft, loadEditorDraft, sanitizeEditorDraft, saveEditorDraft } from "../dist/client/editor-draft.js";

function draft(overrides = {}) {
  return {
    profileId: "profile-1",
    isNew: false,
    values: { name: "Local", kind: "fixed", singleScheme: "http", singleHost: "127.0.0.1", singlePort: "8080", authEnabled: false },
    routingRules: [{ id: "rule-1", pattern: "*.internal.test", action: "proxy" }],
    ...overrides,
  };
}

function replaceGlobal(t, name, value) {
  const original = Object.getOwnPropertyDescriptor(globalThis, name);
  Object.defineProperty(globalThis, name, { configurable: true, value });
  t.after(() => {
    if (original) Object.defineProperty(globalThis, name, original);
    else delete globalThis[name];
  });
}

function chromeStore(t, hooks = {}) {
  const data = {};
  const calls = [];
  const store = {
    async get(key) { calls.push("get"); await hooks.get?.(); return { [key]: data[key] }; },
    async set(values) { calls.push("set"); await hooks.set?.(values); Object.assign(data, structuredClone(values)); },
    async remove(key) { calls.push("remove"); await hooks.remove?.(); delete data[key]; },
  };
  replaceGlobal(t, "chrome", { runtime: { id: "test-proxy" }, storage: { session: store, local: { set() { throw new Error("Drafts must never use local storage"); } } } });
  return { data, calls, seed(value) { data.temotoProxyEditorDraft = value; } };
}

test("draft roundtrip preserves unfinished values and strips password and unknown fields at every serialized level", async (t) => {
  const store = chromeStore(t);
  const unfinished = draft({
    isNew: true,
    password: "top-secret",
    unknown: "unrelated",
    values: {
      name: "", kind: "pac", perProtocol: true, singlePort: "", httpHost: "not a valid host yet",
      pacSource: "inline", pacMandatory: false, pacValue: "function FindProxyForURL(", bypassList: "*.incomplete",
      authEnabled: true, username: "user", authHosts: "proxy.example.com\n", diagnosticUrl: "https://",
      password: "field-secret", unrelated: { anything: true },
    },
    routingRules: [{ id: "rule-1", pattern: "", action: "direct", password: "rule-secret" }],
  });
  await saveEditorDraft(unfinished);
  const restored = await loadEditorDraft();
  assert.deepEqual(restored.values, {
    name: "", kind: "pac", perProtocol: true, singlePort: "", httpHost: "not a valid host yet", pacSource: "inline",
    pacMandatory: false, pacValue: "function FindProxyForURL(", bypassList: "*.incomplete", authEnabled: true,
    username: "user", authHosts: "proxy.example.com\n", diagnosticUrl: "https://",
  });
  assert.deepEqual(restored.routingRules, [{ id: "rule-1", pattern: "", action: "direct" }]);
  assert.equal(restored.isNew, true);
  assert.doesNotMatch(JSON.stringify(store.data), /password|secret|unrelated/);
});

test("restoration validates its shape without silently dropping malformed known fields or routing rules", async (t) => {
  const store = chromeStore(t);
  for (const invalid of [
    null, [], draft({ profileId: "" }), draft({ isNew: "true" }), draft({ values: [] }),
    draft({ values: { name: true } }), draft({ values: { authEnabled: "true" } }),
    draft({ routingRules: {} }), draft({ routingRules: [{ id: 1, pattern: "example.com", action: "proxy" }] }),
    draft({ routingRules: [{ id: "rule-1", pattern: "", action: "unknown" }] }),
  ]) {
    store.seed(invalid);
    assert.equal(await loadEditorDraft(), null);
  }
  assert.equal(sanitizeEditorDraft({ ...draft(), values: { singlePort: 8080 } }), null);
  await assert.rejects(saveEditorDraft(draft({ values: { singlePort: 8080 } })), /draft is invalid/);
});

test("discard waits for a pending save so an old draft cannot reappear", async (t) => {
  let begin;
  let finish;
  const started = new Promise((resolve) => { begin = resolve; });
  const gate = new Promise((resolve) => { finish = resolve; });
  const store = chromeStore(t, { async set() { begin(); await gate; } });
  const saving = saveEditorDraft(draft());
  await started;
  const clearing = clearEditorDraft();
  assert.deepEqual(store.calls, ["set"]);
  finish();
  await Promise.all([saving, clearing]);
  assert.deepEqual(store.calls, ["set", "remove"]);
  assert.equal(await loadEditorDraft(), null);
});

test("save, discard and a new save retain call order and snapshot the caller's values", async (t) => {
  let finish;
  let begin;
  const started = new Promise((resolve) => { begin = resolve; });
  const gate = new Promise((resolve) => { finish = resolve; });
  const written = [];
  let writeCount = 0;
  const store = chromeStore(t, { async set(values) { written.push(structuredClone(Object.values(values)[0])); if (++writeCount === 1) { begin(); await gate; } } });
  const oldDraft = draft();
  const first = saveEditorDraft(oldDraft);
  oldDraft.values.name = "Changed after saving";
  oldDraft.routingRules[0].pattern = "changed.example.com";
  await started;
  const clearing = clearEditorDraft();
  const newDraft = draft({ profileId: "profile-2", values: { name: "Next" }, routingRules: [] });
  const savingNext = saveEditorDraft(newDraft);
  newDraft.values.name = "Changed after queuing";
  finish();
  await Promise.all([first, clearing, savingNext]);
  assert.deepEqual(store.calls, ["set", "remove", "set"]);
  assert.equal(written[0].values.name, "Local");
  assert.equal(written[0].routingRules[0].pattern, "*.internal.test");
  assert.deepEqual(await loadEditorDraft(), draft({ profileId: "profile-2", values: { name: "Next" }, routingRules: [] }));
});

test("restoration waits for an earlier queued write instead of reading a stale draft", async (t) => {
  let begin;
  let finish;
  const started = new Promise((resolve) => { begin = resolve; });
  const gate = new Promise((resolve) => { finish = resolve; });
  const store = chromeStore(t, { async set() { begin(); await gate; } });
  store.seed(draft({ values: { name: "Old" } }));
  const next = draft({ values: { name: "New" } });
  const saving = saveEditorDraft(next);
  await started;
  const restoring = loadEditorDraft();
  assert.deepEqual(store.calls, ["set"]);
  finish();
  await saving;
  assert.deepEqual(await restoring, next);
});

test("storage failures reject and a failed write does not poison later discard or retry", async (t) => {
  let failWrite = true;
  let failRead = false;
  let failClear = false;
  chromeStore(t, {
    async set() { if (failWrite) throw new Error("write denied"); },
    async get() { if (failRead) throw new Error("read denied"); },
    async remove() { if (failClear) throw new Error("clear denied"); },
  });
  await assert.rejects(saveEditorDraft(draft()), /write denied/);
  await clearEditorDraft();
  failWrite = false;
  await saveEditorDraft(draft());
  failRead = true;
  await assert.rejects(loadEditorDraft(), /read denied/);
  failRead = false;
  failClear = true;
  await assert.rejects(clearEditorDraft(), /clear denied/);
  failClear = false;
  await clearEditorDraft();
  assert.equal(await loadEditorDraft(), null);
});

test("preview uses sessionStorage without persisting a password and supports discard", async (t) => {
  const data = new Map();
  replaceGlobal(t, "chrome", {});
  replaceGlobal(t, "sessionStorage", {
    getItem(key) { return data.get(key) ?? null; },
    setItem(key, value) { data.set(key, value); },
    removeItem(key) { data.delete(key); },
  });
  const input = draft({ values: { name: "Preview", username: "user", password: "preview-secret" } });
  await saveEditorDraft(input);
  assert.doesNotMatch([...data.values()].join(""), /password|preview-secret/);
  assert.deepEqual((await loadEditorDraft()).values, { name: "Preview", username: "user" });
  await clearEditorDraft();
  assert.equal(data.size, 0);
  assert.equal(await loadEditorDraft(), null);
});

test("missing extension session storage fails instead of falling back to preview storage", async (t) => {
  replaceGlobal(t, "chrome", { runtime: { id: "test-proxy" }, storage: {} });
  replaceGlobal(t, "sessionStorage", { setItem() { assert.fail("extension drafts cannot use preview storage"); } });
  await assert.rejects(saveEditorDraft(draft()), /storage is unavailable/);
  await assert.rejects(loadEditorDraft(), /storage is unavailable/);
  await assert.rejects(clearEditorDraft(), /storage is unavailable/);
});

test("a corrupted preview draft rejects restoration and can still be explicitly discarded", async (t) => {
  let value = "{corrupted";
  replaceGlobal(t, "chrome", {});
  replaceGlobal(t, "sessionStorage", {
    getItem() { return value; },
    removeItem() { value = null; },
  });
  await assert.rejects(loadEditorDraft(), /could not be restored/);
  await clearEditorDraft();
  assert.equal(await loadEditorDraft(), null);
});
