import { isExtensionRuntime, sendExtensionMessage } from "./extension-api.ts";
import { normalizeProxyProfile } from "./extension/proxy-core.ts";
import type { ProxyProfile, ProxyState } from "./extension/proxy-core.ts";

export type { ProxyProfile, ProxyState };
type Response = { ok: boolean; state?: ProxyState; error?: string };
const PREVIEW_KEY = "temoto.core.proxy.preview";
const DRAFT_KEY = "temoto.core.proxy.draft";

export class ProxyApiError extends Error {
  state?: ProxyState;
  constructor(message: string, state?: ProxyState) { super(message); this.state = state; }
}

function previewState(): ProxyState {
  const stored = localStorage.getItem(PREVIEW_KEY);
  if (!stored) return { profiles: [], activeProfileId: null, status: "off" };
  const raw = JSON.parse(stored) as ProxyState;
  if (!Array.isArray(raw.profiles)) throw new Error("Could not read proxy profiles.");
  const profiles = raw.profiles.map(normalizeProxyProfile);
  const activeProfileId = profiles.some((profile) => profile.id === raw.activeProfileId) ? raw.activeProfileId : null;
  return { profiles, activeProfileId, status: activeProfileId ? "active" : "off" };
}

async function request(type: string, payload: Record<string, unknown> = {}): Promise<ProxyState> {
  if (isExtensionRuntime()) {
    const response = await sendExtensionMessage<Response>(type, payload);
    if (!response?.ok || !response.state) throw new ProxyApiError(response?.error || "Could not update proxy settings.", response?.state);
    return response.state;
  }
  const state = previewState();
  if (type === "PROXY_GET_STATE") return state;
  if (type === "PROXY_SAVE_PROFILE") {
    const profile = normalizeProxyProfile(payload.profile);
    const index = state.profiles.findIndex((item) => item.id === profile.id);
    if (index < 0) state.profiles.push(profile);
    else state.profiles[index] = profile;
  } else if (type === "PROXY_DELETE_PROFILE") {
    if (!state.profiles.some((profile) => profile.id === payload.profileId)) throw new Error("Profile not found.");
    state.profiles = state.profiles.filter((profile) => profile.id !== payload.profileId);
    if (state.activeProfileId === payload.profileId) state.activeProfileId = null;
  } else if (type === "PROXY_ACTIVATE") {
    if (!state.profiles.some((profile) => profile.id === payload.profileId)) throw new Error("Profile not found.");
    state.activeProfileId = String(payload.profileId);
  } else if (type === "PROXY_OFF") state.activeProfileId = null;
  else throw new Error("Unknown proxy action.");
  state.status = state.activeProfileId ? "active" : "off";
  localStorage.setItem(PREVIEW_KEY, JSON.stringify(state));
  return state;
}

export const getProxyState = (): Promise<ProxyState> => request("PROXY_GET_STATE");
export const saveProxyProfile = (profile: ProxyProfile): Promise<ProxyState> => request("PROXY_SAVE_PROFILE", { profile });
export const deleteProxyProfile = (profileId: string): Promise<ProxyState> => request("PROXY_DELETE_PROFILE", { profileId });
export const activateProxyProfile = (profileId: string): Promise<ProxyState> => request("PROXY_ACTIVATE", { profileId });
export const turnProxyOff = (): Promise<ProxyState> => request("PROXY_OFF");

export interface ProxyDraft {
  id: string;
  isNew: boolean;
  name: string;
  kind: ProxyProfile["kind"];
  scheme: ProxyProfile["scheme"];
  host: string;
  port: string;
  pacUrl: string;
}

function cleanDraft(raw: unknown): ProxyDraft | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const input = raw as Record<string, unknown>;
  if (typeof input.id !== "string" || !input.id || typeof input.isNew !== "boolean"
    || !["fixed", "pac"].includes(String(input.kind)) || !["http", "https", "socks4", "socks5"].includes(String(input.scheme))) return null;
  const values: Record<string, string> = {};
  for (const key of ["name", "host", "port", "pacUrl"] as const) {
    if (typeof input[key] !== "string") return null;
    values[key] = input[key];
  }
  if (values.host.includes("@")) values.host = "";
  try {
    const url = new URL(values.pacUrl);
    if (url.username || url.password) values.pacUrl = "";
  } catch { if (values.pacUrl.includes("@")) values.pacUrl = ""; }
  return { id: input.id, isNew: input.isNew, name: values.name, kind: input.kind as ProxyProfile["kind"], scheme: input.scheme as ProxyProfile["scheme"], host: values.host, port: values.port, pacUrl: values.pacUrl };
}

let draftQueue: Promise<void> = Promise.resolve();
function writeDraft(draft: ProxyDraft | null): Promise<void> {
  const previous = draftQueue;
  const next = (async () => {
    try { await previous; } catch { /* A failed write must still allow a later cancel or retry. */ }
    if (isExtensionRuntime()) {
      if (draft) await chrome.storage.session.set({ [DRAFT_KEY]: draft });
      else await chrome.storage.session.remove(DRAFT_KEY);
    } else if (draft) sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    else sessionStorage.removeItem(DRAFT_KEY);
  })();
  draftQueue = next;
  return next;
}
export async function loadProxyDraft(): Promise<ProxyDraft | null> {
  try { await draftQueue; } catch { /* Read the stored draft even when a previous write failed. */ }
  const raw = isExtensionRuntime()
    ? (await chrome.storage.session.get(DRAFT_KEY))[DRAFT_KEY]
    : JSON.parse(sessionStorage.getItem(DRAFT_KEY) || "null");
  const draft = cleanDraft(raw);
  if (raw && JSON.stringify(raw) !== JSON.stringify(draft)) await writeDraft(draft);
  return draft;
}
export function saveProxyDraft(draft: ProxyDraft): Promise<void> {
  const snapshot = cleanDraft(draft);
  if (!snapshot) return Promise.reject(new Error("Could not keep this draft."));
  return writeDraft(snapshot);
}
export const clearProxyDraft = (): Promise<void> => writeDraft(null);
