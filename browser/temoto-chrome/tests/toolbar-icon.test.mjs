import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

import { startToolbarIconSync } from "../dist/client/toolbar-icon.js";

function event() {
  const listeners = [];
  return { addListener: (listener) => listeners.push(listener), listeners, emit: (...args) => listeners.map((listener) => listener(...args)) };
}

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

async function until(predicate) {
  for (let i = 0; i < 100; i += 1) {
    if (predicate()) return;
    await new Promise((resolve) => setImmediate(resolve));
  }
  assert.fail("Timed out waiting for toolbar synchronization");
}

function fakeChrome({ dark = false, documentExists = false } = {}) {
  const state = { dark, documentExists, createCalls: 0, queries: 0, icons: [], failCreate: false, failIcon: false };
  const documentUrl = "chrome-extension://temoto/toolbar-theme.html";
  const runtime = {
    id: "temoto",
    ContextType: { OFFSCREEN_DOCUMENT: "OFFSCREEN_DOCUMENT" },
    onMessage: event(), onInstalled: event(), onStartup: event(),
    getURL: () => documentUrl,
    getContexts: async () => state.documentExists ? [{ documentUrl }] : [],
    sendMessage: async (message) => {
      assert.deepEqual(message, { target: "toolbar-theme", type: "GET_COLOR_SCHEME" });
      state.queries += 1;
      return { dark: state.dark };
    },
  };
  const offscreen = {
    Reason: { MATCH_MEDIA: "MATCH_MEDIA" },
    createDocument: async (options) => {
      state.createCalls += 1;
      assert.equal(options.url, "toolbar-theme.html");
      assert.deepEqual(options.reasons, ["MATCH_MEDIA"]);
      if (state.failCreate) { state.failCreate = false; throw new Error("create failed"); }
      state.documentExists = true;
    },
  };
  const action = { setIcon: async ({ path }) => {
    if (state.failIcon) { state.failIcon = false; throw new Error("setIcon failed"); }
    state.icons.push(path);
  } };
  return { api: { runtime, offscreen, action }, state, documentUrl };
}

function iconPaths(background) {
  return Object.fromEntries([16, 24, 32, 48].map((size) => [size, `icons/toolbar-${background}-${size}.png`]));
}

function changed(fake, sender = { id: "temoto", url: fake.documentUrl }) {
  return new Promise((resolve, reject) => {
    const results = fake.api.runtime.onMessage.emit(
      { target: "toolbar-icon", type: "COLOR_SCHEME_CHANGED" }, sender, resolve,
    );
    if (results.length !== 1) reject(new Error("Expected exactly one message listener"));
  });
}

for (const dark of [false, true]) {
  test(`worker startup queries the offscreen document for ${dark ? "dark" : "light"} icons`, async () => {
    const fake = fakeChrome({ dark });
    startToolbarIconSync(fake.api);
    await until(() => fake.state.icons.length === 1);
    assert.equal(fake.state.createCalls, 1);
    assert.equal(fake.state.queries, 1);
    assert.deepEqual(fake.state.icons[0], iconPaths(dark ? "dark" : "light"));
  });
}

test("theme changes update the icon without a popup", async () => {
  const fake = fakeChrome();
  startToolbarIconSync(fake.api);
  await until(() => fake.state.icons.length === 1);
  fake.state.dark = true;
  assert.deepEqual(await changed(fake), { ok: true });
  assert.deepEqual(fake.state.icons.at(-1), iconPaths("dark"));
});

test("overlapping startup and install events create one offscreen document", async () => {
  const fake = fakeChrome();
  const gate = deferred();
  const original = fake.api.offscreen.createDocument;
  fake.api.offscreen.createDocument = async (options) => { await gate.promise; await original(options); };
  startToolbarIconSync(fake.api);
  fake.api.runtime.onStartup.emit();
  fake.api.runtime.onInstalled.emit();
  gate.resolve();
  await until(() => fake.state.icons.length === 3);
  assert.equal(fake.state.createCalls, 1);
  assert.equal(fake.state.queries, 3);
});

test("worker restart reuses a live document and queries its current color", async () => {
  const fake = fakeChrome({ dark: true, documentExists: true });
  startToolbarIconSync(fake.api);
  await until(() => fake.state.icons.length === 1);
  assert.equal(fake.state.createCalls, 0);
  assert.equal(fake.state.queries, 1);
  assert.deepEqual(fake.state.icons[0], iconPaths("dark"));
});

for (const failure of ["failCreate", "failIcon"]) {
  test(`a later startup retries after ${failure}`, async () => {
    const fake = fakeChrome();
    fake.state[failure] = true;
    startToolbarIconSync(fake.api);
    await until(() => !fake.state[failure]);
    fake.api.runtime.onStartup.emit();
    await until(() => fake.state.icons.length === 1);
    assert.deepEqual(fake.state.icons[0], iconPaths("light"));
    assert.equal(fake.state.createCalls, failure === "failCreate" ? 2 : 1);
  });
}

test("only the extension's offscreen document may request a theme update", async () => {
  const fake = fakeChrome();
  startToolbarIconSync(fake.api);
  await until(() => fake.state.icons.length === 1);
  for (const sender of [
    { id: "another", url: fake.documentUrl },
    { id: "temoto", url: "chrome-extension://temoto/other.html" },
    { id: "temoto", url: fake.documentUrl, tab: { id: 1 } },
  ]) {
    assert.deepEqual(await changed(fake, sender), { ok: false, error: "Untrusted toolbar theme sender" });
  }
  assert.equal(fake.state.queries, 1);
  assert.equal(fake.state.icons.length, 1);
});

test("worker ignores messages intended for other listeners", async () => {
  const fake = fakeChrome();
  startToolbarIconSync(fake.api);
  await until(() => fake.state.icons.length === 1);
  let replied = false;
  const sender = { id: "temoto", url: fake.documentUrl };
  for (const message of [
    { target: "toolbar-theme", type: "COLOR_SCHEME_CHANGED" },
    { target: "toolbar-icon", type: "GET_COLOR_SCHEME" },
  ]) {
    assert.deepEqual(fake.api.runtime.onMessage.emit(message, sender, () => { replied = true; }), [false]);
  }
  assert.equal(replied, false);
  assert.equal(fake.state.queries, 1);
});

test("a later change wins over an earlier delayed theme response", async () => {
  const fake = fakeChrome();
  const gate = deferred();
  const original = fake.api.runtime.sendMessage;
  let first = true;
  fake.api.runtime.sendMessage = async (message) => {
    if (!first) return original(message);
    first = false;
    const response = await original(message);
    await gate.promise;
    return response;
  };
  startToolbarIconSync(fake.api);
  await until(() => fake.state.queries === 1);
  fake.state.dark = true;
  const result = changed(fake);
  gate.resolve();
  assert.deepEqual(await result, { ok: true });
  assert.deepEqual(fake.state.icons, [iconPaths("light"), iconPaths("dark")]);
});

test("offscreen polls the current preference and retries notifications without overlap", async () => {
  const source = (await readFile(new URL("../dist/client/toolbar-theme.js", import.meta.url), "utf8"))
    .replace(/^export\s*\{\s*\};?\s*$/m, "");
  const listeners = event();
  const media = { matches: false };
  const sent = [];
  const warnings = [];
  const responses = [];
  const runtime = { id: "temoto", onMessage: listeners, sendMessage(message) {
    sent.push(message);
    const response = deferred();
    responses.push(response);
    return response.promise;
  } };
  let tick;
  vm.runInNewContext(source, {
    chrome: { runtime },
    matchMedia: (query) => { assert.equal(query, "(prefers-color-scheme: dark)"); return media; },
    setInterval: (callback, delay) => { assert.equal(delay, 2000); assert.equal(tick, undefined); tick = callback; },
    console: { warn: (...args) => warnings.push(args) },
  });
  assert.equal(typeof tick, "function");
  const settle = () => new Promise((resolve) => setImmediate(resolve));
  const read = (sender) => {
    let response;
    const returns = listeners.emit({ target: "toolbar-theme", type: "GET_COLOR_SCHEME" }, sender, (value) => { response = value; });
    assert.deepEqual(returns, [false]);
    return response;
  };
  assert.equal(read({ id: "temoto" }).dark, false);
  assert.equal(read({ id: "other" }), undefined);
  assert.equal(read({ id: "temoto", tab: { id: 1 } }), undefined);
  let unexpectedReply = false;
  assert.deepEqual(listeners.emit(
    { target: "toolbar-icon", type: "GET_COLOR_SCHEME" },
    { id: "temoto" },
    () => { unexpectedReply = true; },
  ), [false]);
  assert.equal(unexpectedReply, false);
  tick();
  await settle();
  assert.equal(sent.length, 0);
  media.matches = true;
  tick();
  assert.equal(sent.length, 1);
  assert.equal(JSON.stringify(sent[0]), JSON.stringify({ target: "toolbar-icon", type: "COLOR_SCHEME_CHANGED" }));
  assert.equal(read({ id: "temoto" }).dark, true);
  tick();
  media.matches = false;
  tick();
  assert.equal(sent.length, 1, "no overlapping notification while the first is in flight");
  responses[0].resolve({ ok: true });
  await settle();
  tick();
  assert.equal(sent.length, 2, "a change during a request is reported on the next tick");
  responses[1].resolve({ ok: false, error: "temporary failure" });
  await settle();
  assert.equal(warnings.length, 1);
  tick();
  assert.equal(sent.length, 3, "failed notification is retried");
  responses[2].resolve({ ok: false, error: "still failing" });
  await settle();
  assert.equal(warnings.length, 1, "consecutive failures warn only once");
  tick();
  assert.equal(sent.length, 4);
  responses[3].resolve({ ok: true });
  await settle();
  tick();
  await settle();
  assert.equal(sent.length, 4, "unchanged preferences do not notify again");
});
