import { createExportBundle, createProfile, normalizeProfile, parseImportBundle } from "./proxy-core.js";
import type { ProxyProfile } from "./proxy-core.js";
import type { DiagnosticResult, EffectiveState } from "./proxy-runtime.js";

interface StateResponse { ok: true; state: EffectiveState }
interface DiagnosticResponse { ok: true; result: DiagnosticResult }
interface ExportResponse { ok: true; json: string }
interface BasicResponse { ok: true }

interface MessagePayloads {
  GET_STATE: undefined;
  ACTIVATE_PROFILE: { profileId: string };
  DEACTIVATE: undefined;
  SAVE_PROFILE: { profile: ProxyProfile; password?: string };
  DELETE_PROFILE: { profileId: string };
  DUPLICATE_PROFILE: { profileId: string };
  SELECT_PROFILE: { profileId: string | null };
  SET_CREDENTIALS: { profileId: string; username: string; password: string };
  CLEAR_CREDENTIALS: { profileId: string };
  SET_INCOGNITO: { enabled: boolean; sessionOnly: boolean };
  DIAGNOSE: { profileId: string };
  EXPORT_PROFILES: undefined;
  IMPORT_PROFILES: { json: string; mode: "replace" | "merge" };
  OPEN_MANAGER: undefined;
}

interface MessageResponses {
  GET_STATE: StateResponse;
  ACTIVATE_PROFILE: StateResponse;
  DEACTIVATE: StateResponse;
  SAVE_PROFILE: StateResponse;
  DELETE_PROFILE: StateResponse;
  DUPLICATE_PROFILE: StateResponse;
  SELECT_PROFILE: StateResponse;
  SET_CREDENTIALS: StateResponse;
  CLEAR_CREDENTIALS: StateResponse;
  SET_INCOGNITO: StateResponse;
  DIAGNOSE: DiagnosticResponse;
  EXPORT_PROFILES: ExportResponse;
  IMPORT_PROFILES: StateResponse;
  OPEN_MANAGER: BasicResponse;
}

type MessageType = keyof MessagePayloads;
type MessageArguments<T extends MessageType> = MessagePayloads[T] extends undefined
  ? [payload?: MessagePayloads[T]]
  : [payload: MessagePayloads[T]];

type ElementAttribute = string | number | boolean | null | undefined | EventListener;
type ElementChild = Node | string | number | null | undefined;

const hasChromeRuntime = () => typeof chrome !== "undefined" && Boolean(chrome.runtime?.id);

let previewState: EffectiveState = {
  profiles: [
    createProfile({ id: "charles", name: "Charles local", color: "#9974F8", auth: { enabled: false, username: "", allowedHosts: ["127.0.0.1"] } }),
    createProfile({ id: "staging", name: "Staging routes", color: "#6EBF93", kind: "rules", routingRules: [{ id: "rule-preview", pattern: "*.staging.example.com", action: "proxy" }] }),
    createProfile({ id: "company", name: "Company PAC", color: "#D2A154", kind: "pac", pac: { source: "url", value: "https://proxy.example.com/config.pac", mandatory: false } }),
  ].map((profile) => ({ ...profile, auth: { ...profile.auth, passwordReady: false } })),
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

async function previewMessage<T extends MessageType>(type: T, payload: MessagePayloads[T]): Promise<unknown> {
  const data = (payload ?? {}) as Record<string, unknown>;
  const response = () => ({ ok: true, state: structuredClone(previewState) });
  if (type === "GET_STATE") return response();
  if (type === "ACTIVATE_PROFILE") {
    previewState.activeProfileId = String(data.profileId);
    previewState.status = { tone: "active", code: "active", label: "Proxy active" };
    return response();
  }
  if (type === "DEACTIVATE") {
    previewState.activeProfileId = null;
    previewState.status = { tone: "neutral", code: "off", label: "Proxy off" };
    return response();
  }
  if (type === "SAVE_PROFILE") {
    const normalized = normalizeProfile(data.profile as ProxyProfile);
    const profile = { ...normalized, auth: { ...normalized.auth, passwordReady: false } };
    const index = previewState.profiles.findIndex((item) => item.id === profile.id);
    if (index >= 0) previewState.profiles[index] = profile;
    else previewState.profiles.push(profile);
    previewState.selectedProfileId = profile.id;
    return response();
  }
  if (type === "DELETE_PROFILE") {
    previewState.profiles = previewState.profiles.filter((item) => item.id !== data.profileId);
    if (previewState.activeProfileId === data.profileId) previewState.activeProfileId = null;
    previewState.selectedProfileId = previewState.profiles[0]?.id || null;
    return response();
  }
  if (type === "DUPLICATE_PROFILE") {
    const source = previewState.profiles.find((item) => item.id === data.profileId);
    if (!source) throw new Error("Profile not found");
    const normalizedCopy = createProfile({ ...source, id: crypto.randomUUID(), name: `${source.name} copy` });
    const copy = { ...normalizedCopy, auth: { ...normalizedCopy.auth, passwordReady: false } };
    previewState.profiles.push(copy);
    previewState.selectedProfileId = copy.id;
    return response();
  }
  if (type === "SELECT_PROFILE") { previewState.selectedProfileId = typeof data.profileId === "string" ? data.profileId : null; return response(); }
  if (type === "SET_CREDENTIALS" || type === "CLEAR_CREDENTIALS") return response();
  if (type === "SET_INCOGNITO") {
    previewState.incognitoEnabled = Boolean(data.enabled);
    previewState.incognitoSessionOnly = Boolean(data.sessionOnly);
    return response();
  }
  if (type === "DIAGNOSE") return { ok: true, result: { ok: true, reachable: true, status: 204, statusText: "No Content", latencyMs: 84, url: "https://example.com/" } };
  if (type === "EXPORT_PROFILES") return { ok: true, json: JSON.stringify(createExportBundle(previewState.profiles), null, 2) };
  if (type === "IMPORT_PROFILES") {
    const profiles = parseImportBundle(String(data.json));
    const effectiveProfiles = profiles.map((profile) => ({ ...profile, auth: { ...profile.auth, passwordReady: false } }));
    previewState.profiles = data.mode === "replace" ? effectiveProfiles : [...previewState.profiles, ...effectiveProfiles];
    previewState.selectedProfileId = previewState.profiles[0]?.id || null;
    return response();
  }
  if (type === "OPEN_MANAGER") { window.location.assign("manager.html"); return { ok: true }; }
  throw new Error("Unknown preview message");
}

export async function sendMessage<T extends MessageType>(type: T, ...args: MessageArguments<T>): Promise<MessageResponses[T]> {
  const payload = args[0];
  if (!hasChromeRuntime()) return await previewMessage(type, payload as MessagePayloads[T]) as MessageResponses[T];
  const response = await chrome.runtime.sendMessage({ type, ...(payload ?? {}) }) as MessageResponses[T] | { ok: false; error?: string };
  if (!response?.ok) throw new Error(response?.error || "temoto Proxy could not complete this action");
  return response as MessageResponses[T];
}

export function endpointLabel(profile: ProxyProfile): string {
  if (profile.kind === "pac") return profile.pac.source === "url" ? "PAC URL" : "PAC script";
  const endpoint = profile.endpoints?.single || profile.endpoints?.http || profile.endpoints?.https || profile.endpoints?.fallback;
  if (!endpoint) return "No endpoint";
  return `${endpoint.scheme.toUpperCase()} · ${endpoint.host}:${endpoint.port}`;
}

export function profileKindLabel(profile: ProxyProfile): string {
  return { fixed: "FIXED", rules: "ROUTED", pac: "PAC" }[profile.kind];
}

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attributes: Record<string, ElementAttribute> = {},
  ...children: Array<ElementChild | ElementChild[]>
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) {
    if (key === "className") node.className = String(value);
    else if (key === "text") node.textContent = String(value);
    else if (key.startsWith("on") && typeof value === "function") node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (value !== undefined && value !== null) node.setAttribute(key, String(value));
  }
  for (const child of children.flat()) {
    if (child == null) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

export function downloadText(filename: string, text: string): void {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
