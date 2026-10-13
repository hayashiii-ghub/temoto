import type { RoutingRule } from "./proxy-core.js";

export interface EditorDraft {
  profileId: string;
  isNew: boolean;
  values: Record<string, string | boolean>;
  routingRules: RoutingRule[];
}

const STORAGE_KEY = "temotoProxyEditorDraft";
const VALUE_TYPES: Record<string, "string" | "boolean"> = {
  name: "string",
  kind: "string",
  perProtocol: "boolean",
  singleScheme: "string",
  singleHost: "string",
  singlePort: "string",
  httpScheme: "string",
  httpHost: "string",
  httpPort: "string",
  httpsScheme: "string",
  httpsHost: "string",
  httpsPort: "string",
  fallbackScheme: "string",
  fallbackHost: "string",
  fallbackPort: "string",
  defaultAction: "string",
  pacSource: "string",
  pacMandatory: "boolean",
  pacValue: "string",
  bypassList: "string",
  authEnabled: "boolean",
  username: "string",
  authHosts: "string",
  diagnosticUrl: "string",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function sanitizeEditorDraft(value: unknown): EditorDraft | null {
  if (!isRecord(value) || typeof value.profileId !== "string" || !value.profileId
    || typeof value.isNew !== "boolean" || !isRecord(value.values) || !Array.isArray(value.routingRules)) return null;

  const values: EditorDraft["values"] = {};
  // Incomplete fields stay verbatim; profile validation belongs to the explicit Save action.
  for (const [name, type] of Object.entries(VALUE_TYPES)) {
    if (!Object.prototype.hasOwnProperty.call(value.values, name)) continue;
    const field = value.values[name];
    if (typeof field !== type) return null;
    values[name] = field as string | boolean;
  }
  const routingRules: RoutingRule[] = [];
  for (const rule of value.routingRules) {
    if (!isRecord(rule) || typeof rule.id !== "string" || typeof rule.pattern !== "string"
      || (rule.action !== "proxy" && rule.action !== "direct")) return null;
    routingRules.push({ id: rule.id, pattern: rule.pattern, action: rule.action });
  }
  return { profileId: value.profileId, isNew: value.isNew, values, routingRules };
}

function draftStore() {
  if (typeof chrome !== "undefined" && chrome.runtime?.id) {
    const session = chrome.storage?.session;
    if (!session) throw new Error("Editor draft storage is unavailable");
    return {
      async read(): Promise<unknown> { return (await session.get(STORAGE_KEY))[STORAGE_KEY]; },
      async write(draft: EditorDraft): Promise<void> { await session.set({ [STORAGE_KEY]: draft }); },
      async clear(): Promise<void> { await session.remove(STORAGE_KEY); },
    };
  }
  const session = globalThis.sessionStorage;
  if (!session) throw new Error("Editor draft storage is unavailable");
  return {
    async read(): Promise<unknown> {
      const value = session.getItem(STORAGE_KEY);
      if (value === null) return null;
      try { return JSON.parse(value); }
      catch { throw new Error("Editor draft could not be restored"); }
    },
    async write(draft: EditorDraft): Promise<void> { session.setItem(STORAGE_KEY, JSON.stringify(draft)); },
    async clear(): Promise<void> { session.removeItem(STORAGE_KEY); },
  };
}

let pendingMutation: Promise<void> = Promise.resolve();

async function waitForMutation(mutation: Promise<void>): Promise<void> {
  try { await mutation; } catch {
    // A storage failure must not block a later discard or retry.
  }
}

function enqueueMutation(operation: () => Promise<void>): Promise<void> {
  const previous = pendingMutation;
  const next = (async () => {
    await waitForMutation(previous);
    await operation();
  })();
  pendingMutation = next;
  return next;
}

export async function loadEditorDraft(): Promise<EditorDraft | null> {
  const store = draftStore();
  await waitForMutation(pendingMutation);
  return sanitizeEditorDraft(await store.read());
}

export async function saveEditorDraft(draft: EditorDraft): Promise<void> {
  const snapshot = sanitizeEditorDraft(draft);
  if (!snapshot) throw new Error("Editor draft is invalid");
  const store = draftStore();
  await enqueueMutation(() => store.write(snapshot));
}

export async function clearEditorDraft(): Promise<void> {
  const store = draftStore();
  await enqueueMutation(() => store.clear());
}
