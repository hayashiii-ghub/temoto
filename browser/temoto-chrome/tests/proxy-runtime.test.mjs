import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import vm from "node:vm";

const buildRoot = process.env.TEMOTO_PROXY_TEST_BUILD
  ? pathToFileURL(process.env.TEMOTO_PROXY_TEST_BUILD.replace(/\/$/, "") + "/")
  : new URL("../dist/client/", import.meta.url);
const { createProxyRuntime } = await import(new URL("proxy-runtime.js", buildRoot));
const { isTrustedProxyPopup, proxyProfileToConfig } = await import(new URL("proxy-core.js", buildRoot));
const profile = (id = "local", host = "proxy.test") => ({ id, name: id, kind: "fixed", scheme: "http", host, port: 8080, pacUrl: "" });

function mockChrome({ external = null } = {}) {
  const data = { lastColor: "#9974F8", profiles: [{ id: "legacy-separate-profile" }] };
  const calls = [];
  const behavior = { failSet: false, failClear: false, failStorage: false, ignoreSet: false, holdSet: null };
  const inherited = external || { value: { mode: "system" }, levelOfControl: "controllable_by_this_extension" };
  let effective = structuredClone(inherited);
  const chrome = {
    runtime: { id: "temoto" },
    storage: { local: {
      async get(defaults) { return structuredClone({ ...defaults, ...data }); },
      async set(next) {
        Object.assign(data, structuredClone(next));
        if (behavior.failStorage) { behavior.failStorage = false; throw new Error("Storage failed after writing"); }
      },
    } },
    proxy: { settings: {
      async get(options) { assert.deepEqual(options, { incognito: false }); return structuredClone(effective); },
      async set({ value, scope }) {
        calls.push(["set", scope, structuredClone(value)]);
        if (behavior.holdSet) await behavior.holdSet;
        if (!behavior.ignoreSet) effective = { levelOfControl: "controlled_by_this_extension", value: structuredClone(value) };
        if (behavior.failSet) { behavior.failSet = false; throw new Error("Chrome set failed after writing"); }
      },
      async clear({ scope }) {
        calls.push(["clear", scope]);
        if (behavior.failClear) { behavior.failClear = false; throw new Error("Chrome clear failed"); }
        effective = structuredClone(inherited);
      },
    } },
  };
  return { chrome, data, calls, behavior, get effective() { return effective; }, change(next) { effective = structuredClone(next); } };
}

test("Proxy starts empty and saving a profile never automatically applies it or overwrites other keys", async () => {
  const mock = mockChrome();
  const runtime = createProxyRuntime(mock.chrome);
  assert.deepEqual(await runtime.getState(), { profiles: [], activeProfileId: null, status: "off" });
  const saved = await runtime.saveProfile(profile());
  assert.equal(saved.profiles.length, 1);
  assert.equal(saved.activeProfileId, null);
  assert.equal(mock.calls.length, 0);
  assert.equal(mock.data.lastColor, "#9974F8");
  assert.deepEqual(mock.data.profiles, [{ id: "legacy-separate-profile" }]);
});

test("activation uses regular_only and a restarted worker verifies the actual setting", async () => {
  const mock = mockChrome();
  const runtime = createProxyRuntime(mock.chrome);
  await runtime.saveProfile(profile());
  const active = await runtime.activate("local");
  assert.equal(active.status, "active");
  assert.deepEqual(mock.calls, [["set", "regular_only", proxyProfileToConfig(profile())]]);
  assert.equal((await createProxyRuntime(mock.chrome).getState()).status, "active");
  mock.change({ levelOfControl: "controlled_by_this_extension", value: proxyProfileToConfig(profile("other", "other.test")) });
  assert.equal((await runtime.getState()).status, "changed");
});

test("Off clears only temoto's override and retains the inherited system setting", async () => {
  const external = { levelOfControl: "controllable_by_this_extension", value: { mode: "pac_script", pacScript: { url: "https://system.test/proxy.pac" } } };
  const mock = mockChrome({ external });
  const runtime = createProxyRuntime(mock.chrome);
  await runtime.saveProfile(profile());
  await runtime.activate("local");
  mock.calls.length = 0;
  const off = await runtime.off();
  assert.deepEqual(mock.calls, [["clear", "regular_only"]]);
  assert.deepEqual(mock.effective, external);
  assert.equal(off.activeProfileId, null);
  assert.equal(off.status, "off");
});

for (const levelOfControl of ["controlled_by_other_extensions", "not_controllable"]) {
  test(`${levelOfControl} is reported as conflict and never overwritten`, async () => {
    const external = { levelOfControl, value: { mode: "fixed_servers", rules: { singleProxy: { host: "external.test", port: 80 } } } };
    const mock = mockChrome({ external });
    const runtime = createProxyRuntime(mock.chrome);
    await runtime.saveProfile(profile());
    assert.equal((await runtime.getState()).status, "conflict");
    await assert.rejects(runtime.activate("local"), /controls/);
    assert.equal(mock.calls.length, 0);
    await runtime.off();
    assert.deepEqual(mock.calls, [["clear", "regular_only"]]);
    assert.deepEqual(mock.effective, external);
  });
}

test("failed first activation clears the partial override instead of forcing direct or system", async () => {
  const mock = mockChrome();
  const runtime = createProxyRuntime(mock.chrome);
  await runtime.saveProfile(profile());
  mock.behavior.failSet = true;
  await assert.rejects(runtime.activate("local"), /set failed/);
  assert.deepEqual(mock.calls.map((call) => call.slice(0, 2)), [["set", "regular_only"], ["clear", "regular_only"]]);
  assert.equal((await runtime.getState()).status, "off");
});

test("an ignored Chrome set is a failure rather than a false active label", async () => {
  const mock = mockChrome();
  const runtime = createProxyRuntime(mock.chrome);
  await runtime.saveProfile(profile());
  await runtime.activate("local");
  await runtime.saveProfile(profile("other", "other.test"));
  mock.behavior.ignoreSet = true;
  await assert.rejects(runtime.activate("other"), /did not apply/);
  assert.equal((await runtime.getState()).activeProfileId, "local");
});

test("failed active save restores both saved values and the previous effective proxy", async () => {
  const mock = mockChrome();
  const runtime = createProxyRuntime(mock.chrome);
  await runtime.saveProfile(profile());
  await runtime.activate("local");
  const previous = structuredClone(mock.effective);
  mock.behavior.failStorage = true;
  await assert.rejects(runtime.saveProfile(profile("local", "new.test")), /Storage failed/);
  assert.deepEqual(mock.effective, previous);
  assert.equal(mock.data.proxyProfiles[0].host, "proxy.test");
  assert.equal((await runtime.getState()).status, "active");
});

for (const operation of ["off", "deleteProfile"]) {
  test(`failed ${operation} leaves the active profile and effective setting recoverable`, async () => {
    const mock = mockChrome();
    const runtime = createProxyRuntime(mock.chrome);
    await runtime.saveProfile(profile());
    await runtime.activate("local");
    const previous = structuredClone(mock.effective);
    mock.behavior.failClear = true;
    await assert.rejects(operation === "off" ? runtime.off() : runtime.deleteProfile("local"), /clear failed/);
    assert.deepEqual(mock.effective, previous);
    const state = await runtime.getState();
    assert.equal(state.profiles.length, 1);
    assert.equal(state.activeProfileId, "local");
    assert.equal(state.status, "active");
  });
}

test("rapid activation and Off are serialized, and failed work does not poison the queue", async () => {
  const mock = mockChrome();
  const runtime = createProxyRuntime(mock.chrome);
  await runtime.saveProfile(profile());
  let release;
  mock.behavior.holdSet = new Promise((resolve) => { release = resolve; });
  const active = runtime.activate("local");
  const off = runtime.off();
  await new Promise(setImmediate);
  assert.deepEqual(mock.calls.map((call) => call[0]), ["set"]);
  release();
  await active;
  assert.equal((await off).status, "off");
  assert.deepEqual(mock.calls.map((call) => call[0]), ["set", "clear"]);
  await assert.rejects(runtime.activate("missing"), /not found/);
  assert.equal((await runtime.activate("local")).status, "active");
});

test("all five worker messages reject content scripts and non-popup extension pages before reading Proxy data", async () => {
  const source = (await readFile(new URL("service-worker.js", buildRoot), "utf8")).replace(/^import[\s\S]*?from\s+"[^"]+";\n/gm, "");
  let created = 0;
  const context = {
    chrome: { runtime: { id: "temoto", onMessage: { addListener() {} } } },
    startToolbarIconSync() {},
    isTrustedProxyPopup,
    createProxyRuntime() { created++; return { async getState() { return { profiles: [], activeProfileId: null, status: "off" }; } }; },
  };
  vm.runInNewContext(`${source}\nglobalThis.proxyMessage = handleMessage;`, context);
  for (const type of ["PROXY_GET_STATE", "PROXY_SAVE_PROFILE", "PROXY_DELETE_PROFILE", "PROXY_ACTIVATE", "PROXY_OFF"]) {
    for (const sender of [{ id: "temoto", url: "https://page.test/", tab: { id: 1 } }, { id: "temoto", url: "chrome-extension://temoto/capture.html" }, { id: "other", url: "chrome-extension://temoto/index.html" }]) {
      assert.equal((await context.proxyMessage({ type }, sender)).ok, false);
    }
  }
  assert.equal(created, 0);
  const response = await context.proxyMessage({ type: "PROXY_GET_STATE" }, { id: "temoto", url: "chrome-extension://temoto/index.html" });
  assert.equal(response.ok, true);
  assert.equal(created, 1);
});
