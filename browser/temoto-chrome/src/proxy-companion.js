export const COMPANION_PROTOCOL_VERSION = 1;
export const TEMOTO_PROXY_EXTENSION_ID = "einfookhmkjdeknjellhcamojihehcpj";
export const TEMOTO_PROXY_INSTALL_URL = `https://chromewebstore.google.com/detail/${TEMOTO_PROXY_EXTENSION_ID}`;

const ALLOWED_ACTIONS = new Set(["ACTIVATE_PROFILE", "DEACTIVATE", "OPEN_MANAGER"]);

function request(action, payload = {}) {
  return {
    namespace: "temoto-proxy",
    protocolVersion: COMPANION_PROTOCOL_VERSION,
    action,
    ...payload,
  };
}

function isValidSummary(summary) {
  return Boolean(
    summary
    && typeof summary.activeProfileId !== "undefined"
    && typeof summary.selectedProfileId !== "undefined"
    && typeof summary.status?.code === "string"
    && typeof summary.status?.tone === "string"
    && typeof summary.status?.label === "string"
    && Array.isArray(summary.profiles)
    && summary.profiles.every((profile) => (
      typeof profile.id === "string"
      && typeof profile.name === "string"
      && typeof profile.color === "string"
      && typeof profile.kind === "string"
    ))
  );
}

function summaryFromResponse(response) {
  if (!response?.ok || response.protocolVersion !== COMPANION_PROTOCOL_VERSION || !isValidSummary(response.summary)) {
    throw new Error("Invalid temoto Proxy response");
  }
  return response.summary;
}

export async function getProxyCompanion(runtimeApi = globalThis.chrome?.runtime) {
  if (!runtimeApi?.sendMessage) {
    return {
      availability: "preview",
      summary: {
        activeProfileId: null,
        selectedProfileId: "local",
        status: { code: "off", tone: "neutral", label: "Proxy off" },
        profiles: [{ id: "local", name: "Local proxy", color: "#9974F8", kind: "fixed" }],
      },
    };
  }
  try {
    const response = await runtimeApi.sendMessage(TEMOTO_PROXY_EXTENSION_ID, request("GET_SUMMARY"));
    return { availability: "installed", summary: summaryFromResponse(response) };
  } catch (error) {
    const message = error?.message || String(error || "");
    if (/receiving end does not exist|could not establish connection/i.test(message)) {
      return { availability: "missing", summary: null };
    }
    return { availability: "error", summary: null };
  }
}

export async function runProxyCompanionAction(action, payload = {}, runtimeApi = globalThis.chrome?.runtime) {
  if (!ALLOWED_ACTIONS.has(action)) throw new Error("Unsupported companion action");
  if (!runtimeApi?.sendMessage) {
    if (action === "OPEN_MANAGER") return null;
    const preview = (await getProxyCompanion()).summary;
    if (action === "ACTIVATE_PROFILE") {
      return { ...preview, activeProfileId: payload.profileId, status: { code: "active", tone: "active", label: "Proxy active" } };
    }
    return { ...preview, activeProfileId: null, status: { code: "off", tone: "neutral", label: "Proxy off" } };
  }
  const response = await runtimeApi.sendMessage(TEMOTO_PROXY_EXTENSION_ID, request(action, payload));
  if (!response?.ok || response.protocolVersion !== COMPANION_PROTOCOL_VERSION) {
    throw new Error(response?.error || "temoto Proxy could not complete the action");
  }
  if (action === "OPEN_MANAGER") return null;
  return summaryFromResponse(response);
}
