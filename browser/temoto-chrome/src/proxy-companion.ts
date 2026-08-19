export const COMPANION_PROTOCOL_VERSION = 1;
export const TEMOTO_PROXY_EXTENSION_ID = "hohabmdadcdkifcmbclkgnomhhlllnbb";
export const TEMOTO_PROXY_INSTALL_URL = `https://chromewebstore.google.com/detail/${TEMOTO_PROXY_EXTENSION_ID}`;

export type ProxyCompanionAction = "OPEN_MANAGER";

export interface ProxyProfileSummary {
  id: string;
  name: string;
  color: string;
  kind: string;
}

export interface ProxySummary {
  activeProfileId: string | null;
  selectedProfileId: string | null;
  status: { code: string; tone: string; label: string };
  profiles: ProxyProfileSummary[];
}

export interface ProxyCompanionConnection {
  availability: "preview" | "installed" | "missing" | "error";
  summary: ProxySummary | null;
}

export interface CompanionRuntimeApi {
  sendMessage(extensionId: string, message: CompanionRequest): Promise<unknown>;
}

type CompanionRequest = {
  namespace: "temoto-proxy";
  protocolVersion: typeof COMPANION_PROTOCOL_VERSION;
  action: "GET_SUMMARY" | ProxyCompanionAction;
};

type LooseRecord = Record<string, unknown>;

const ALLOWED_ACTIONS = new Set<ProxyCompanionAction>(["OPEN_MANAGER"]);

const previewSummary: ProxySummary = {
  activeProfileId: null,
  selectedProfileId: "local",
  status: { code: "off", tone: "neutral", label: "Proxy off" },
  profiles: [{ id: "local", name: "Local proxy", color: "#9974F8", kind: "fixed" }],
};

function record(value: unknown): LooseRecord | null {
  return value && typeof value === "object" ? value as LooseRecord : null;
}

function defaultRuntimeApi(): CompanionRuntimeApi | undefined {
  const host = globalThis as typeof globalThis & { chrome?: { runtime?: CompanionRuntimeApi } };
  return host.chrome?.runtime;
}

function request(action: CompanionRequest["action"]): CompanionRequest {
  return {
    namespace: "temoto-proxy",
    protocolVersion: COMPANION_PROTOCOL_VERSION,
    action,
  };
}

function isValidSummary(value: unknown): value is ProxySummary {
  const summary = record(value);
  const status = record(summary?.status);
  return Boolean(
    summary
    && (summary.activeProfileId === null || typeof summary.activeProfileId === "string")
    && (summary.selectedProfileId === null || typeof summary.selectedProfileId === "string")
    && typeof status?.code === "string"
    && typeof status.tone === "string"
    && typeof status.label === "string"
    && Array.isArray(summary.profiles)
    && summary.profiles.every((value) => {
      const profile = record(value);
      return Boolean(
        profile
        && typeof profile.id === "string"
        && typeof profile.name === "string"
        && typeof profile.color === "string"
        && typeof profile.kind === "string"
      );
    })
  );
}

function summaryFromResponse(value: unknown): ProxySummary {
  const response = record(value);
  if (!response?.ok || response.protocolVersion !== COMPANION_PROTOCOL_VERSION || !isValidSummary(response.summary)) {
    throw new Error("Invalid temoto Proxy response");
  }
  return response.summary;
}

export async function getProxyCompanion(
  runtimeApi = defaultRuntimeApi(),
): Promise<ProxyCompanionConnection> {
  if (!runtimeApi?.sendMessage) {
    return { availability: "preview", summary: previewSummary };
  }
  try {
    const response = await runtimeApi.sendMessage(TEMOTO_PROXY_EXTENSION_ID, request("GET_SUMMARY"));
    return { availability: "installed", summary: summaryFromResponse(response) };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error || "");
    if (/receiving end does not exist|could not establish connection/i.test(message)) {
      return { availability: "missing", summary: null };
    }
    return { availability: "error", summary: null };
  }
}

export async function runProxyCompanionAction(
  action: ProxyCompanionAction,
  runtimeApi = defaultRuntimeApi(),
): Promise<null> {
  if (!ALLOWED_ACTIONS.has(action)) throw new Error("Unsupported companion action");
  if (!runtimeApi?.sendMessage) return null;
  const response = await runtimeApi.sendMessage(TEMOTO_PROXY_EXTENSION_ID, request(action));
  const responseRecord = record(response);
  if (!responseRecord?.ok || responseRecord.protocolVersion !== COMPANION_PROTOCOL_VERSION) {
    throw new Error(typeof responseRecord?.error === "string" ? responseRecord.error : "temoto Proxy could not complete the action");
  }
  return null;
}
