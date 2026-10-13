import assert from "node:assert/strict";
import test from "node:test";
import {
  COMPANION_PROTOCOL_VERSION,
  handleCompanionMessage,
  isTrustedCompanionSender,
  summarizeProxyState,
  TEMOTO_FOR_CHROME_EXTENSION_ID,
} from "../dist/client/companion-api.js";

const state = {
  activeProfileId: "local",
  selectedProfileId: "local",
  status: { code: "active", tone: "active", label: "Proxy active" },
  profiles: [
    {
      id: "local",
      name: "Local proxy",
      color: "#9974F8",
      kind: "fixed",
      endpoints: { single: { scheme: "http", host: "127.0.0.1", port: 8080 } },
      auth: { enabled: true, username: "developer", passwordReady: true },
      pac: { source: "inline", value: "secret PAC body" },
    },
  ],
};

test("the companion allowlist uses the reserved temoto for Chrome store identity", () => {
  assert.equal(TEMOTO_FOR_CHROME_EXTENSION_ID, "gcncgknjklghkoeiapcbdghodepnllid");
});

test("companion summaries expose status and profile identity without configuration or secrets", () => {
  assert.deepEqual(summarizeProxyState(state), {
    activeProfileId: "local",
    selectedProfileId: "local",
    status: { code: "active", tone: "active", label: "Proxy active" },
    profiles: [{ id: "local", name: "Local proxy", color: "#9974F8", kind: "fixed" }],
  });
});

test("external callers are accepted only when their extension ID matches", () => {
  assert.equal(isTrustedCompanionSender({ id: "allowed" }, "allowed"), true);
  assert.equal(isTrustedCompanionSender({ id: "other" }, "allowed"), false);
  assert.equal(isTrustedCompanionSender({}, "allowed"), false);
});

test("the companion API keeps summaries and directs legacy manager requests to the toolbar", async () => {
  const calls = [];
  const runtime = {
    async effectiveState() { calls.push(["summary"]); return state; },
  };
  const message = (action, payload = {}) => ({ namespace: "temoto-proxy", protocolVersion: COMPANION_PROTOCOL_VERSION, action, ...payload });

  assert.equal((await handleCompanionMessage(message("GET_SUMMARY"), { runtime })).summary.status.code, "active");
  assert.deepEqual(await handleCompanionMessage(message("OPEN_MANAGER"), { runtime }), {
    ok: false, protocolVersion: COMPANION_PROTOCOL_VERSION, error: "Open temoto Proxy from the Chrome toolbar.",
  });
  await assert.rejects(handleCompanionMessage(message("ACTIVATE_PROFILE", { profileId: "staging" }), { runtime }), /Unsupported companion action/);
  await assert.rejects(handleCompanionMessage(message("DEACTIVATE"), { runtime }), /Unsupported companion action/);
  assert.deepEqual(calls, [["summary"]]);
});

test("the companion API rejects unknown versions, actions and invalid profile IDs", async () => {
  const dependencies = { runtime: {} };
  await assert.rejects(handleCompanionMessage({ namespace: "other", protocolVersion: 1, action: "GET_SUMMARY" }, dependencies), /Unsupported companion request/);
  await assert.rejects(handleCompanionMessage({ namespace: "temoto-proxy", protocolVersion: 2, action: "GET_SUMMARY" }, dependencies), /Unsupported companion request/);
  await assert.rejects(handleCompanionMessage({ namespace: "temoto-proxy", protocolVersion: 1, action: "SAVE_PROFILE" }, dependencies), /Unsupported companion action/);
  await assert.rejects(handleCompanionMessage({ namespace: "temoto-proxy", protocolVersion: 1, action: "ACTIVATE_PROFILE", profileId: "" }, dependencies), /Unsupported companion action/);
});
