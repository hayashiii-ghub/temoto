export const COMPANION_PROTOCOL_VERSION = 1;
export const COMPANION_NAMESPACE = "temoto-proxy";
export const TEMOTO_FOR_CHROME_EXTENSION_ID = "gcncgknjklghkoeiapcbdghodepnllid";

const ALLOWED_ACTIONS = new Set(["GET_SUMMARY", "ACTIVATE_PROFILE", "DEACTIVATE", "OPEN_MANAGER"]);

export function isTrustedCompanionSender(sender, allowedExtensionId = TEMOTO_FOR_CHROME_EXTENSION_ID) {
  return Boolean(allowedExtensionId && sender?.id === allowedExtensionId);
}

export function summarizeProxyState(state) {
  return {
    activeProfileId: typeof state?.activeProfileId === "string" ? state.activeProfileId : null,
    selectedProfileId: typeof state?.selectedProfileId === "string" ? state.selectedProfileId : null,
    status: {
      code: String(state?.status?.code || "unknown"),
      tone: String(state?.status?.tone || "error"),
      label: String(state?.status?.label || "Unknown state"),
    },
    profiles: Array.isArray(state?.profiles)
      ? state.profiles.map((profile) => ({
        id: String(profile.id),
        name: String(profile.name),
        color: String(profile.color),
        kind: String(profile.kind),
      }))
      : [],
  };
}

function responseWithSummary(state) {
  return {
    ok: true,
    protocolVersion: COMPANION_PROTOCOL_VERSION,
    summary: summarizeProxyState(state),
  };
}

export async function handleCompanionMessage(message, { runtime, openManager }) {
  if (message?.namespace !== COMPANION_NAMESPACE || message?.protocolVersion !== COMPANION_PROTOCOL_VERSION) {
    throw new Error("Unsupported companion request");
  }
  if (!ALLOWED_ACTIONS.has(message.action)) throw new Error("Unsupported companion action");

  switch (message.action) {
    case "GET_SUMMARY":
      return responseWithSummary(await runtime.effectiveState());
    case "ACTIVATE_PROFILE":
      if (typeof message.profileId !== "string" || !message.profileId || message.profileId.length > 120) {
        throw new Error("Invalid profile ID");
      }
      return responseWithSummary(await runtime.activate(message.profileId));
    case "DEACTIVATE":
      return responseWithSummary(await runtime.deactivate());
    case "OPEN_MANAGER":
      await openManager();
      return { ok: true, protocolVersion: COMPANION_PROTOCOL_VERSION };
    default:
      throw new Error("Unsupported companion action");
  }
}
