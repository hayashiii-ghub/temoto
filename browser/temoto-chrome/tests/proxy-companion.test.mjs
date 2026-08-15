import assert from "node:assert/strict";
import test from "node:test";
import {
  COMPANION_PROTOCOL_VERSION,
  getProxyCompanion,
  runProxyCompanionAction,
  TEMOTO_PROXY_EXTENSION_ID,
} from "../src/proxy-companion.ts";

const summary = {
  activeProfileId: "local",
  selectedProfileId: "local",
  status: { code: "active", tone: "active", label: "Proxy active" },
  profiles: [{ id: "local", name: "Local proxy", color: "#9974F8", kind: "fixed" }],
};

test("the companion target uses the reserved temoto Proxy store identity", () => {
  assert.equal(TEMOTO_PROXY_EXTENSION_ID, "hohabmdadcdkifcmbclkgnomhhlllnbb");
});

test("for Chrome discovers the companion and validates its response", async () => {
  const calls = [];
  const runtimeApi = {
    async sendMessage(extensionId, message) {
      calls.push([extensionId, message]);
      return { ok: true, protocolVersion: COMPANION_PROTOCOL_VERSION, summary };
    },
  };
  assert.deepEqual(await getProxyCompanion(runtimeApi), { availability: "installed", summary });
  assert.deepEqual(calls, [[TEMOTO_PROXY_EXTENSION_ID, {
    namespace: "temoto-proxy",
    protocolVersion: COMPANION_PROTOCOL_VERSION,
    action: "GET_SUMMARY",
  }]]);
});

test("for Chrome treats a missing receiver as an uninstalled companion", async () => {
  const runtimeApi = { async sendMessage() { throw new Error("Receiving end does not exist"); } };
  assert.deepEqual(await getProxyCompanion(runtimeApi), { availability: "missing", summary: null });
});

test("for Chrome rejects malformed companion responses", async () => {
  const runtimeApi = { async sendMessage() { return { ok: true, protocolVersion: 99, summary }; } };
  assert.deepEqual(await getProxyCompanion(runtimeApi), { availability: "error", summary: null });

  const malformedRuntime = {
    async sendMessage() {
      return { ok: true, protocolVersion: COMPANION_PROTOCOL_VERSION, summary: { ...summary, activeProfileId: 42 } };
    },
  };
  assert.deepEqual(await getProxyCompanion(malformedRuntime), { availability: "error", summary: null });
});

test("for Chrome sends only the bounded companion actions", async () => {
  const calls = [];
  const runtimeApi = {
    async sendMessage(extensionId, message) {
      calls.push([extensionId, message]);
      return { ok: true, protocolVersion: COMPANION_PROTOCOL_VERSION, summary };
    },
  };
  assert.deepEqual(await runProxyCompanionAction("ACTIVATE_PROFILE", { profileId: "local" }, runtimeApi), summary);
  await assert.rejects(runProxyCompanionAction("SAVE_PROFILE", {}, runtimeApi), /Unsupported companion action/);
  assert.equal(calls.length, 1);
});
