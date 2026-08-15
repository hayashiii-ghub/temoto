import { createProxyRuntime } from "./proxy-runtime.js";
import { credentialsForProxyChallenge, proxyControlMatches } from "./proxy-core.js";
import {
  handleCompanionMessage,
  isTrustedCompanionSender,
} from "./companion-api.js";

const runtime = createProxyRuntime(chrome);
const authAttempts = new Map();

async function refreshAction() {
  const state = await runtime.effectiveState();
  const active = state.profiles.find((profile) => profile.id === state.activeProfileId);
  const presentation = {
    active: { text: "ON", color: "#7651D6", title: active ? `temoto Proxy — ${active.name}` : "temoto Proxy — active" },
    conflict: { text: "!", color: "#D85C62", title: "temoto Proxy — controlled by another extension" },
    policy: { text: "!", color: "#D85C62", title: "temoto Proxy — controlled by policy" },
    changed: { text: "?", color: "#C38C39", title: "temoto Proxy — settings changed" },
    orphaned: { text: "?", color: "#C38C39", title: "temoto Proxy — unrecognized setting" },
    inactive: { text: "?", color: "#C38C39", title: "temoto Proxy — profile not applied" },
    off: { text: "", color: "#7651D6", title: "temoto Proxy — off" },
    unknown: { text: "?", color: "#C38C39", title: "temoto Proxy — unknown state" },
  }[state.status.code];
  await Promise.all([
    chrome.action.setBadgeText({ text: presentation.text }),
    chrome.action.setBadgeBackgroundColor({ color: presentation.color }),
    chrome.action.setTitle({ title: presentation.title }),
  ]);
}

async function handleMessage(message) {
  switch (message?.type) {
    case "GET_STATE": return { ok: true, state: await runtime.effectiveState() };
    case "ACTIVATE_PROFILE": return { ok: true, state: await runtime.activate(message.profileId) };
    case "DEACTIVATE": return { ok: true, state: await runtime.deactivate() };
    case "SAVE_PROFILE": return { ok: true, state: await runtime.saveProfile(message.profile, message.password || "") };
    case "DELETE_PROFILE": return { ok: true, state: await runtime.deleteProfile(message.profileId) };
    case "DUPLICATE_PROFILE": return { ok: true, state: await runtime.duplicateProfile(message.profileId) };
    case "SELECT_PROFILE": return { ok: true, state: await runtime.selectProfile(message.profileId) };
    case "SET_CREDENTIALS": return { ok: true, state: await runtime.setCredentials(message.profileId, message.username, message.password) };
    case "CLEAR_CREDENTIALS": await runtime.clearCredentials(message.profileId); return { ok: true, state: await runtime.effectiveState() };
    case "SET_INCOGNITO": return { ok: true, state: await runtime.setIncognito(message.enabled, message.sessionOnly) };
    case "DIAGNOSE": return { ok: true, result: await runtime.diagnose(message.profileId) };
    case "EXPORT_PROFILES": return { ok: true, json: await runtime.exportProfiles() };
    case "IMPORT_PROFILES": return { ok: true, state: await runtime.importProfiles(message.json, message.mode) };
    case "OPEN_MANAGER": await chrome.tabs.create({ url: chrome.runtime.getURL("manager.html") }); return { ok: true };
    default: return { ok: false, error: "Unknown message" };
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handleMessage(message)
    .then(async (response) => { await refreshAction().catch(() => {}); sendResponse(response); })
    .catch((error) => sendResponse({ ok: false, error: error?.message || String(error) }));
  return true;
});

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if (!isTrustedCompanionSender(sender)) return false;
  handleCompanionMessage(message, {
    runtime,
    openManager: () => chrome.tabs.create({ url: chrome.runtime.getURL("manager.html") }),
  })
    .then(async (response) => { await refreshAction().catch(() => {}); sendResponse(response); })
    .catch((error) => sendResponse({
      ok: false,
      protocolVersion: 1,
      error: error?.message || String(error),
    }));
  return true;
});

chrome.proxy.settings.onChange.addListener(() => refreshAction().catch(() => {}));
chrome.storage.onChanged.addListener((_changes, area) => { if (area === "local") refreshAction().catch(() => {}); });

chrome.webRequest.onAuthRequired.addListener(
  (details, callback) => {
    if (!details.isProxy) { callback({}); return; }
    Promise.all([
      runtime.local(),
      chrome.storage.session.get({ proxyCredentials: {} }),
      chrome.proxy.settings.get({ incognito: Boolean(details.incognito) }),
    ])
      .then(([state, session, effective]) => {
        const profile = state.profiles.find((item) => item.id === state.activeProfileId);
        if (!profile || !proxyControlMatches(effective, state.activeFingerprint)) { callback({}); return; }
        const credentials = profile && session.proxyCredentials?.[profile.id];
        const attemptKey = `${details.requestId}:${profile?.id || "none"}`;
        const attempts = authAttempts.get(attemptKey) || 0;
        const authCredentials = credentialsForProxyChallenge(details, profile, credentials, attempts);
        if (!authCredentials) { callback({}); return; }
        authAttempts.set(attemptKey, attempts + 1);
        callback({ authCredentials });
      })
      .catch(() => callback({}));
  },
  { urls: ["<all_urls>"] },
  ["asyncBlocking"],
);

const clearAuthAttempt = (details) => {
  for (const key of authAttempts.keys()) if (key.startsWith(`${details.requestId}:`)) authAttempts.delete(key);
};
chrome.webRequest.onCompleted.addListener(clearAuthAttempt, { urls: ["<all_urls>"] });
chrome.webRequest.onErrorOccurred.addListener(clearAuthAttempt, { urls: ["<all_urls>"] });

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  const state = await runtime.local();
  if (reason === "install" && !state.profiles.length) {
    const profile = createDefaultProfile();
    await chrome.storage.local.set({ profiles: [profile], selectedProfileId: profile.id });
    await chrome.tabs.create({ url: chrome.runtime.getURL("manager.html?welcome=1") });
  }
  await refreshAction();
});

function createDefaultProfile() {
  return {
    id: crypto.randomUUID(),
    name: "Local proxy",
    color: "#9974F8",
    kind: "fixed",
    endpointMode: "single",
    endpoints: {
      single: { scheme: "http", host: "127.0.0.1", port: 8080 },
      http: { scheme: "http", host: "127.0.0.1", port: 8080 },
      https: { scheme: "http", host: "127.0.0.1", port: 8080 },
      fallback: { scheme: "socks5", host: "127.0.0.1", port: 1080 },
    },
    bypassList: ["<local>", "localhost", "127.0.0.1"],
    routingRules: [],
    defaultAction: "proxy",
    pac: { source: "inline", value: "function FindProxyForURL(url, host) { return 'DIRECT'; }", mandatory: false },
    auth: { enabled: false, username: "", allowedHosts: ["127.0.0.1"] },
    diagnosticUrl: "https://example.com/",
  };
}

refreshAction().catch(() => {});
