((): void => {
  type ToolResult = {
    content: Array<{ type: "text"; text: string }>;
    isError?: boolean;
  };

  type ToolDefinition = {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
    annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
    execute: (input: Record<string, unknown>) => Promise<ToolResult>;
  };

  type ModelContext = {
    registerTool: (
      tool: ToolDefinition,
      options?: { signal?: AbortSignal },
    ) => Promise<void>;
  };

  type BridgeResponse = {
    source: "temoto-webmcp";
    kind: "response";
    id: string;
    response: unknown;
  };

  const optedIn = document.querySelector('meta[name="temoto-webmcp"][content="enabled"]');
  const modelContext = (document as Document & { modelContext?: ModelContext }).modelContext;
  if (!optedIn || !modelContext) return;

  const controller = new AbortController();
  const pending = new Map<string, {
    resolve: (value: ToolResult) => void;
    timeout: ReturnType<typeof setTimeout>;
  }>();
  let sequence = 0;

  const result = (value: unknown, isError = false): ToolResult => ({
    content: [{ type: "text", text: JSON.stringify(value) }],
    ...(isError ? { isError: true } : {}),
  });

  const onMessage = (event: MessageEvent): void => {
    const response = event.data as Partial<BridgeResponse> | undefined;
    if (
      event.source !== window
      || response?.source !== "temoto-webmcp"
      || response.kind !== "response"
      || typeof response.id !== "string"
    ) return;

    const request = pending.get(response.id);
    if (!request) return;
    clearTimeout(request.timeout);
    pending.delete(response.id);
    const payload = response.response as { ok?: unknown } | undefined;
    request.resolve(result(
      response.response ?? { ok: false, error: "The extension returned no response" },
      payload?.ok === false,
    ));
  };

  const callExtension = (message: Record<string, unknown>): Promise<ToolResult> => {
    const id = `${Date.now()}-${sequence += 1}`;
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        pending.delete(id);
        resolve(result({ ok: false, error: "The extension did not respond" }, true));
      }, 5_000);
      pending.set(id, { resolve, timeout });
      window.postMessage({ source: "temoto-webmcp", kind: "request", id, message }, "*");
    });
  };

  window.addEventListener("message", onMessage);

  const tools: ToolDefinition[] = [
    {
      name: "temoto_ping",
      description: "Check that temoto for Chrome is installed and reachable from this page.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: async () => callExtension({ type: "WEBMCP_PING" }),
    },
    {
      name: "temoto_set_video_speed",
      description: "Set the playback speed of every HTML video in the current browser tab.",
      inputSchema: {
        type: "object",
        properties: {
          speed: {
            type: "number",
            minimum: 0.25,
            maximum: 5,
            description: "Playback speed from 0.25 to 5.",
          },
        },
        required: ["speed"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: async ({ speed }) => {
        const numericSpeed = Number(speed);
        if (!Number.isFinite(numericSpeed) || numericSpeed < 0.25 || numericSpeed > 5) {
          return result({ ok: false, error: "Speed must be between 0.25 and 5" }, true);
        }
        return callExtension({ type: "WEBMCP_SET_VIDEO_SPEED", speed: numericSpeed });
      },
    },
  ];

  void Promise.all(tools.map((tool) => modelContext.registerTool(tool, { signal: controller.signal })))
    .catch(() => controller.abort());
  window.addEventListener("pagehide", () => {
    controller.abort();
    window.removeEventListener("message", onMessage);
    for (const request of pending.values()) clearTimeout(request.timeout);
    pending.clear();
  }, { once: true });
})();
