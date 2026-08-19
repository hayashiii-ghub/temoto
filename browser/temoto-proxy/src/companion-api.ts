export const COMPANION_PROTOCOL_VERSION = 1;
export const COMPANION_NAMESPACE = "temoto-proxy";
export const TEMOTO_FOR_CHROME_EXTENSION_ID = "gcncgknjklghkoeiapcbdghodepnllid";

export type CompanionAction = "GET_SUMMARY" | "OPEN_MANAGER";

export interface CompanionProfileSummary {
  id: string;
  name: string;
  color: string;
  kind: string;
}

export interface CompanionSummary {
  activeProfileId: string | null;
  selectedProfileId: string | null;
  status: { code: string; tone: string; label: string };
  profiles: CompanionProfileSummary[];
}

export type CompanionRequest =
  | { namespace: typeof COMPANION_NAMESPACE; protocolVersion: typeof COMPANION_PROTOCOL_VERSION; action: "GET_SUMMARY" }
  | { namespace: typeof COMPANION_NAMESPACE; protocolVersion: typeof COMPANION_PROTOCOL_VERSION; action: "OPEN_MANAGER" };

export type CompanionResponse =
  | { ok: true; protocolVersion: typeof COMPANION_PROTOCOL_VERSION; summary: CompanionSummary }
  | { ok: true; protocolVersion: typeof COMPANION_PROTOCOL_VERSION };

interface CompanionRuntime {
  effectiveState(): Promise<unknown>;
}

type LooseRecord = Record<string, any>;

const ALLOWED_ACTIONS = new Set<CompanionAction>(["GET_SUMMARY", "OPEN_MANAGER"]);

export function isTrustedCompanionSender(
  sender: { id?: string } | null | undefined,
  allowedExtensionId = TEMOTO_FOR_CHROME_EXTENSION_ID,
): boolean {
  return Boolean(allowedExtensionId && sender?.id === allowedExtensionId);
}

export function summarizeProxyState(state: LooseRecord | null | undefined): CompanionSummary {
  return {
    activeProfileId: typeof state?.activeProfileId === "string" ? state.activeProfileId : null,
    selectedProfileId: typeof state?.selectedProfileId === "string" ? state.selectedProfileId : null,
    status: {
      code: String(state?.status?.code || "unknown"),
      tone: String(state?.status?.tone || "error"),
      label: String(state?.status?.label || "Unknown state"),
    },
    profiles: Array.isArray(state?.profiles)
      ? state.profiles.map((profile: LooseRecord) => ({
        id: String(profile.id),
        name: String(profile.name),
        color: String(profile.color),
        kind: String(profile.kind),
      }))
      : [],
  };
}

function responseWithSummary(state: unknown): Extract<CompanionResponse, { summary: CompanionSummary }> {
  return {
    ok: true,
    protocolVersion: COMPANION_PROTOCOL_VERSION,
    summary: summarizeProxyState(state as LooseRecord | null | undefined),
  };
}

export async function handleCompanionMessage(
  message: unknown,
  { runtime, openManager }: { runtime: CompanionRuntime; openManager: () => Promise<void> },
): Promise<CompanionResponse> {
  const request = message as Partial<CompanionRequest> | null | undefined;
  if (request?.namespace !== COMPANION_NAMESPACE || request?.protocolVersion !== COMPANION_PROTOCOL_VERSION) {
    throw new Error("Unsupported companion request");
  }
  if (!request.action || !ALLOWED_ACTIONS.has(request.action)) throw new Error("Unsupported companion action");

  switch (request.action) {
    case "GET_SUMMARY":
      return responseWithSummary(await runtime.effectiveState());
    case "OPEN_MANAGER":
      await openManager();
      return { ok: true, protocolVersion: COMPANION_PROTOCOL_VERSION };
    default:
      throw new Error("Unsupported companion action");
  }
}
