((): void => {
  type BridgeRequest = {
    source: "temoto-webmcp";
    kind: "request";
    id: string;
    message: { type: "WEBMCP_PING" } | { type: "WEBMCP_SET_VIDEO_SPEED"; speed: number };
  };

  const optedIn = document.querySelector('meta[name="temoto-webmcp"][content="enabled"]');
  if (!optedIn) return;

  const isBridgeRequest = (value: unknown): value is BridgeRequest => {
    if (!value || typeof value !== "object") return false;
    const request = value as Partial<BridgeRequest>;
    if (request.source !== "temoto-webmcp" || request.kind !== "request" || typeof request.id !== "string") {
      return false;
    }
    const message = request.message;
    if (!message || typeof message !== "object") return false;
    if (message.type === "WEBMCP_PING") return true;
    return message.type === "WEBMCP_SET_VIDEO_SPEED"
      && typeof message.speed === "number"
      && Number.isFinite(message.speed)
      && message.speed >= 0.25
      && message.speed <= 5;
  };

  const onMessage = async (event: MessageEvent): Promise<void> => {
    if (event.source !== window || !isBridgeRequest(event.data)) return;

    let response: unknown;
    try {
      response = await chrome.runtime.sendMessage(event.data.message) as unknown;
      response ||= { ok: false, error: "The extension returned no response" };
    } catch (error) {
      response = {
        ok: false,
        error: error instanceof Error ? error.message : "The extension call failed",
      };
    }

    window.postMessage({
      source: "temoto-webmcp",
      kind: "response",
      id: event.data.id,
      response,
    }, "*");
  };

  window.addEventListener("message", onMessage);
  window.addEventListener("pagehide", () => window.removeEventListener("message", onMessage), { once: true });
})();
