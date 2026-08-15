import assert from "node:assert/strict";
import test from "node:test";
import { createProfile, profileToProxyConfig } from "../public/proxy-core.js";
import { createProxyRuntime } from "../public/proxy-runtime.js";

function storageArea(initial = {}) {
  const data = structuredClone(initial);
  return {
    data,
    async get(defaults = {}) { return { ...structuredClone(defaults), ...structuredClone(data) }; },
    async set(values) { Object.assign(data, structuredClone(values)); },
  };
}

function chromeMock({ regularLevel = "controllable_by_this_extension", incognitoAllowed = true } = {}) {
  const local = storageArea();
  const session = storageArea();
  const settings = {
    regular: { value: { mode: "system" }, levelOfControl: regularLevel },
    incognito: { value: { mode: "system" }, levelOfControl: "controllable_by_this_extension" },
  };
  const calls = [];
  const behavior = { failNextSetAfterWrite: false, failNextClearBeforeWrite: false };
  let incognitoScope = null;
  const proxySettings = {
    async get({ incognito }) { return structuredClone(settings[incognito ? "incognito" : "regular"]); },
    async set({ value, scope }) {
      calls.push(["set", scope, structuredClone(value)]);
      const key = scope.startsWith("incognito") ? "incognito" : "regular";
      settings[key] = { value: structuredClone(value), levelOfControl: "controlled_by_this_extension" };
      if (key === "incognito") incognitoScope = scope;
      if (behavior.failNextSetAfterWrite) {
        behavior.failNextSetAfterWrite = false;
        throw new Error("simulated set failure");
      }
    },
    async clear({ scope }) {
      calls.push(["clear", scope]);
      if (behavior.failNextClearBeforeWrite) {
        behavior.failNextClearBeforeWrite = false;
        throw new Error("simulated clear failure");
      }
      const key = scope.startsWith("incognito") ? "incognito" : "regular";
      if (key === "incognito" && scope !== incognitoScope) return;
      settings[key] = { value: { mode: "system" }, levelOfControl: "controllable_by_this_extension" };
      if (key === "incognito") incognitoScope = null;
    },
  };
  return {
    api: {
      storage: { local, session },
      proxy: { settings: proxySettings },
      extension: { async isAllowedIncognitoAccess() { return incognitoAllowed; } },
    },
    behavior,
    calls,
    local,
    session,
    settings,
  };
}

test("activation uses regular_only, verifies Chrome state, and stores the active profile", async () => {
  const mock = chromeMock();
  const profile = createProfile({ id: "local" });
  await mock.local.set({ profiles: [profile] });
  const runtime = createProxyRuntime(mock.api);
  const state = await runtime.activate(profile.id);
  assert.deepEqual(mock.calls[0], ["set", "regular_only", profileToProxyConfig(profile)]);
  assert.equal(state.activeProfileId, profile.id);
  assert.equal(state.status.code, "active");
  assert.equal(mock.settings.incognito.value.mode, "system");
});

test("effective state survives a Manifest V3 service-worker restart", async () => {
  const mock = chromeMock();
  const profile = createProfile({ id: "local" });
  await mock.local.set({ profiles: [profile] });
  await createProxyRuntime(mock.api).activate(profile.id);
  const restartedRuntime = createProxyRuntime(mock.api);
  const state = await restartedRuntime.effectiveState();
  assert.equal(state.activeProfileId, profile.id);
  assert.equal(state.status.code, "active");
  assert.deepEqual(state.regular.value, profileToProxyConfig(profile));
});

test("deactivation clears temoto scopes instead of forcing direct mode", async () => {
  const mock = chromeMock();
  const profile = createProfile({ id: "local" });
  await mock.local.set({ profiles: [profile] });
  const runtime = createProxyRuntime(mock.api);
  await runtime.activate(profile.id);
  mock.calls.length = 0;
  const state = await runtime.deactivate();
  assert.deepEqual(mock.calls, [
    ["clear", "regular_only"],
    ["clear", "incognito_session_only"],
    ["clear", "incognito_persistent"],
  ]);
  assert.equal(state.status.code, "off");
  assert.equal(mock.settings.regular.value.mode, "system");
});

test("policy and extension conflicts fail before settings are changed", async () => {
  const mock = chromeMock({ regularLevel: "controlled_by_other_extensions" });
  const profile = createProfile({ id: "local" });
  await mock.local.set({ profiles: [profile] });
  const runtime = createProxyRuntime(mock.api);
  await assert.rejects(runtime.activate(profile.id), /another extension/);
  assert.deepEqual(mock.calls, []);
  assert.equal(mock.local.data.activeProfileId, undefined);
});

test("incognito is opt-in, supports session-only scope, and requires Chrome access", async () => {
  const denied = chromeMock({ incognitoAllowed: false });
  const deniedRuntime = createProxyRuntime(denied.api);
  await assert.rejects(deniedRuntime.setIncognito(true, true), /incognito extension settings/);

  const mock = chromeMock();
  const profile = createProfile({ id: "local" });
  await mock.local.set({ profiles: [profile] });
  const runtime = createProxyRuntime(mock.api);
  await runtime.activate(profile.id);
  mock.calls.length = 0;
  const state = await runtime.setIncognito(true, true);
  assert.equal(state.incognitoEnabled, true);
  assert.deepEqual(mock.calls[0], ["set", "incognito_session_only", profileToProxyConfig(profile)]);
});

test("failed incognito disable preserves truthful enabled state and the active scope", async () => {
  const mock = chromeMock();
  const profile = createProfile({ id: "local" });
  await mock.local.set({ profiles: [profile] });
  const runtime = createProxyRuntime(mock.api);
  await runtime.activate(profile.id);
  await runtime.setIncognito(true, true);
  mock.behavior.failNextClearBeforeWrite = true;
  await assert.rejects(runtime.setIncognito(false, true), /could not clear the incognito proxy setting/);
  assert.equal(mock.local.data.incognitoEnabled, true);
  assert.equal(mock.settings.incognito.levelOfControl, "controlled_by_this_extension");
});

test("credentials are written only to session storage and surfaced as readiness", async () => {
  const mock = chromeMock();
  const profile = createProfile({ id: "secure", auth: { enabled: true, username: "dev", allowedHosts: ["proxy.test"] } });
  await mock.local.set({ profiles: [profile] });
  const runtime = createProxyRuntime(mock.api);
  const state = await runtime.setCredentials(profile.id, "dev", "session-secret");
  assert.equal(mock.local.data.proxyCredentials, undefined);
  assert.equal(mock.session.data.proxyCredentials.secure.password, "session-secret");
  assert.equal(state.profiles[0].auth.passwordReady, true);
});

test("editing an active profile reapplies its validated Chrome configuration", async () => {
  const mock = chromeMock();
  const profile = createProfile({ id: "local" });
  await mock.local.set({ profiles: [profile] });
  const runtime = createProxyRuntime(mock.api);
  await runtime.activate(profile.id);
  mock.calls.length = 0;
  const edited = createProfile({ ...profile, name: "Edited", endpoints: { ...profile.endpoints, single: { scheme: "socks5", host: "proxy.test", port: 1080 } } });
  const state = await runtime.saveProfile(edited);
  assert.equal(state.profiles[0].name, "Edited");
  assert.equal(mock.calls[0][0], "set");
  assert.equal(mock.settings.regular.value.rules.singleProxy.scheme, "socks5");
});

test("failed reconfiguration restores the previous effective proxy and active profile", async () => {
  const mock = chromeMock();
  const profile = createProfile({ id: "local" });
  await mock.local.set({ profiles: [profile] });
  const runtime = createProxyRuntime(mock.api);
  await runtime.activate(profile.id);
  const previousConfig = structuredClone(mock.settings.regular.value);
  const edited = createProfile({ ...profile, endpoints: { ...profile.endpoints, single: { scheme: "socks5", host: "proxy.test", port: 1080 } } });
  mock.behavior.failNextSetAfterWrite = true;
  await assert.rejects(runtime.saveProfile(edited), /simulated set failure/);
  assert.deepEqual(mock.settings.regular.value, previousConfig);
  assert.equal(mock.local.data.activeProfileId, profile.id);
  assert.equal(mock.local.data.profiles[0].endpoints.single.scheme, "http");
});

test("failed Off keeps active state instead of claiming temoto control was cleared", async () => {
  const mock = chromeMock();
  const profile = createProfile({ id: "local" });
  await mock.local.set({ profiles: [profile] });
  const runtime = createProxyRuntime(mock.api);
  await runtime.activate(profile.id);
  mock.behavior.failNextClearBeforeWrite = true;
  await assert.rejects(runtime.deactivate(), /simulated clear failure/);
  assert.equal(mock.local.data.activeProfileId, profile.id);
  assert.equal(mock.settings.regular.levelOfControl, "controlled_by_this_extension");
});

test("diagnostics use the selected URL without sending credentials", async () => {
  const mock = chromeMock();
  const profile = createProfile({ id: "local", diagnosticUrl: "https://health.test/ping" });
  await mock.local.set({ profiles: [profile] });
  const requests = [];
  const runtime = createProxyRuntime(mock.api, async (url, options) => {
    requests.push([url, options]);
    return { ok: true, status: 204, statusText: "No Content", url };
  }, (() => { let time = 100; return () => (time += 25); })());
  await runtime.activate(profile.id);
  const result = await runtime.diagnose(profile.id);
  assert.equal(result.ok, true);
  assert.equal(result.latencyMs, 25);
  assert.equal(requests[0][0], "https://health.test/ping");
  assert.equal(requests[0][1].credentials, "omit");
  assert.equal(requests[0][1].redirect, "manual");
});

test("diagnostics revalidate stored profiles before any network request", async () => {
  const mock = chromeMock();
  const profile = createProfile({ id: "legacy", diagnosticUrl: "http://127.0.0.1/private" });
  await mock.local.set({ profiles: [profile], activeProfileId: profile.id });
  const requests = [];
  const runtime = createProxyRuntime(mock.api, async (...args) => {
    requests.push(args);
    return { ok: true, status: 200, statusText: "OK", url: args[0] };
  });
  await assert.rejects(runtime.diagnose(profile.id), /public network destination/);
  assert.deepEqual(requests, []);
});

test("replace imports deactivate first and never import credentials", async () => {
  const mock = chromeMock();
  const profile = createProfile({ id: "shared", auth: { enabled: true, username: "dev", allowedHosts: ["old-proxy.test"] } });
  const incoming = createProfile({
    id: "shared",
    name: "Shared",
    endpoints: { single: { scheme: "http", host: "new-proxy.test", port: 8080 } },
    auth: { enabled: true, username: "", allowedHosts: ["new-proxy.test"] },
  });
  await mock.local.set({ profiles: [profile] });
  const runtime = createProxyRuntime(mock.api);
  await runtime.setCredentials(profile.id, "dev", "session-secret");
  await runtime.activate(profile.id);
  const bundle = JSON.stringify({ product: "temoto-proxy", schemaVersion: 1, exportedAt: "2026-08-14T00:00:00Z", profiles: [incoming] });
  const state = await runtime.importProfiles(bundle, "replace");
  assert.equal(state.activeProfileId, null);
  assert.deepEqual(state.profiles.map((item) => item.id), ["shared"]);
  assert.equal(state.profiles[0].auth.username, "");
  assert.equal(state.profiles[0].auth.passwordReady, false);
  assert.deepEqual(mock.session.data.proxyCredentials, {});
});

test("replace imports also clear dormant session credentials", async () => {
  const mock = chromeMock();
  const profile = createProfile({ id: "dormant", auth: { enabled: true, username: "dev", allowedHosts: ["old-proxy.test"] } });
  await mock.local.set({ profiles: [profile] });
  const runtime = createProxyRuntime(mock.api);
  await runtime.setCredentials(profile.id, "dev", "session-secret");
  const incoming = createProfile({ id: "replacement" });
  const bundle = JSON.stringify({ product: "temoto-proxy", schemaVersion: 1, exportedAt: "2026-08-14T00:00:00Z", profiles: [incoming] });
  const state = await runtime.importProfiles(bundle, "replace");
  assert.equal(state.profiles[0].auth.passwordReady, false);
  assert.deepEqual(mock.session.data.proxyCredentials, {});
});

test("merge imports remap collisions without rebinding existing credentials", async () => {
  const mock = chromeMock();
  const profile = createProfile({ id: "shared", auth: { enabled: true, username: "dev", allowedHosts: ["old-proxy.test"] } });
  await mock.local.set({ profiles: [profile] });
  const runtime = createProxyRuntime(mock.api);
  await runtime.setCredentials(profile.id, "dev", "session-secret");
  const incoming = createProfile({ id: "shared", auth: { enabled: true, username: "", allowedHosts: ["new-proxy.test"] } });
  const bundle = JSON.stringify({ product: "temoto-proxy", schemaVersion: 1, exportedAt: "2026-08-14T00:00:00Z", profiles: [incoming] });
  const state = await runtime.importProfiles(bundle, "merge");
  assert.equal(state.profiles.length, 2);
  assert.equal(state.profiles[0].id, "shared");
  assert.equal(state.profiles[0].auth.passwordReady, true);
  assert.notEqual(state.profiles[1].id, "shared");
  assert.equal(state.profiles[1].auth.passwordReady, false);
});
