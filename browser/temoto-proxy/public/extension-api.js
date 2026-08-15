import { createExportBundle, createProfile, normalizeProfile, parseImportBundle } from "./proxy-core.js";

const hasChromeRuntime = () => typeof chrome !== "undefined" && Boolean(chrome.runtime?.id);

let previewState = {
  profiles: [
    createProfile({ id: "charles", name: "Charles local", color: "#9974F8", auth: { enabled: false, username: "", allowedHosts: ["127.0.0.1"] } }),
    createProfile({ id: "staging", name: "Staging routes", color: "#6EBF93", kind: "rules", routingRules: [{ id: "rule-preview", pattern: "*.staging.example.com", action: "proxy" }] }),
    createProfile({ id: "company", name: "Company PAC", color: "#D2A154", kind: "pac", pac: { source: "url", value: "https://proxy.example.com/config.pac", mandatory: false } }),
  ],
  activeProfileId: "charles",
  activeFingerprint: "preview",
  incognitoEnabled: false,
  incognitoSessionOnly: true,
  incognitoAllowed: true,
  selectedProfileId: "charles",
  regular: { levelOfControl: "controlled_by_this_extension", value: { mode: "fixed_servers" } },
  incognito: { levelOfControl: "controllable_by_this_extension", value: { mode: "system" } },
  status: { tone: "active", code: "active", label: "Proxy active" },
};

async function previewMessage(type, payload) {
  const response = () => ({ ok: true, state: structuredClone(previewState) });
  if (type === "GET_STATE") return response();
  if (type === "ACTIVATE_PROFILE") {
    previewState.activeProfileId = payload.profileId;
    previewState.status = { tone: "active", code: "active", label: "Proxy active" };
    return response();
  }
  if (type === "DEACTIVATE") {
    previewState.activeProfileId = null;
    previewState.status = { tone: "neutral", code: "off", label: "Proxy off" };
    return response();
  }
  if (type === "SAVE_PROFILE") {
    const profile = normalizeProfile(payload.profile);
    const index = previewState.profiles.findIndex((item) => item.id === profile.id);
    if (index >= 0) previewState.profiles[index] = profile;
    else previewState.profiles.push(profile);
    previewState.selectedProfileId = profile.id;
    return response();
  }
  if (type === "DELETE_PROFILE") {
    previewState.profiles = previewState.profiles.filter((item) => item.id !== payload.profileId);
    if (previewState.activeProfileId === payload.profileId) previewState.activeProfileId = null;
    previewState.selectedProfileId = previewState.profiles[0]?.id || null;
    return response();
  }
  if (type === "DUPLICATE_PROFILE") {
    const source = previewState.profiles.find((item) => item.id === payload.profileId);
    const copy = createProfile({ ...source, id: crypto.randomUUID(), name: `${source.name} copy` });
    previewState.profiles.push(copy);
    previewState.selectedProfileId = copy.id;
    return response();
  }
  if (type === "SELECT_PROFILE") { previewState.selectedProfileId = payload.profileId; return response(); }
  if (type === "SET_CREDENTIALS" || type === "CLEAR_CREDENTIALS") return response();
  if (type === "SET_INCOGNITO") {
    previewState.incognitoEnabled = Boolean(payload.enabled);
    previewState.incognitoSessionOnly = Boolean(payload.sessionOnly);
    return response();
  }
  if (type === "DIAGNOSE") return { ok: true, result: { ok: true, reachable: true, status: 204, statusText: "No Content", latencyMs: 84, url: "https://example.com/" } };
  if (type === "EXPORT_PROFILES") return { ok: true, json: JSON.stringify(createExportBundle(previewState.profiles), null, 2) };
  if (type === "IMPORT_PROFILES") {
    const profiles = parseImportBundle(payload.json);
    previewState.profiles = payload.mode === "replace" ? profiles : [...previewState.profiles, ...profiles];
    previewState.selectedProfileId = previewState.profiles[0]?.id || null;
    return response();
  }
  if (type === "OPEN_MANAGER") { window.location.assign("manager.html"); return { ok: true }; }
  return { ok: false, error: "Unknown preview message" };
}

export async function sendMessage(type, payload = {}) {
  if (!hasChromeRuntime()) return previewMessage(type, payload);
  const response = await chrome.runtime.sendMessage({ type, ...payload });
  if (!response?.ok) throw new Error(response?.error || "temoto Proxy could not complete this action");
  return response;
}

export function endpointLabel(profile) {
  if (profile.kind === "pac") return profile.pac.source === "url" ? "PAC URL" : "PAC script";
  const endpoint = profile.endpoints?.single || profile.endpoints?.http || profile.endpoints?.https || profile.endpoints?.fallback;
  if (!endpoint) return "No endpoint";
  return `${endpoint.scheme.toUpperCase()} · ${endpoint.host}:${endpoint.port}`;
}

export function profileKindLabel(profile) {
  return { fixed: "FIXED", rules: "ROUTED", pac: "PAC" }[profile.kind] || "PROFILE";
}

export function el(tag, attributes = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) {
    if (key === "className") node.className = value;
    else if (key === "text") node.textContent = value;
    else if (key.startsWith("on") && typeof value === "function") node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (value !== undefined && value !== null) node.setAttribute(key, String(value));
  }
  for (const child of children.flat()) {
    if (child == null) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

export function downloadText(filename, text) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
