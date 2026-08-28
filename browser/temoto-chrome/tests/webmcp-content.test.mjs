import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const bridgeSource = await readFile(new URL("../dist/client/content/webmcp.js", import.meta.url), "utf8");
const providerSource = await readFile(new URL("../dist/client/content/webmcp-provider.js", import.meta.url), "utf8");

function loadWebMCPContentScripts({ optedIn = true, supported = true } = {}) {
  const tools = [];
  const sentMessages = [];
  const windowListeners = new Map();
  const dispatchMessage = (data) => {
    const event = { source: window, data };
    for (const listener of windowListeners.get("message") || []) listener(event);
  };
  const document = {
    querySelector(selector) {
      return optedIn && selector === 'meta[name="temoto-webmcp"][content="enabled"]' ? {} : null;
    },
    modelContext: supported
      ? {
          registerTool(tool, options) {
            tools.push({ ...tool, signal: options?.signal });
            return Promise.resolve();
          },
        }
      : undefined,
  };
  const window = {
    addEventListener(type, listener) {
      if (!windowListeners.has(type)) windowListeners.set(type, new Set());
      windowListeners.get(type).add(listener);
    },
    removeEventListener(type, listener) {
      windowListeners.get(type)?.delete(listener);
    },
    postMessage(data) {
      queueMicrotask(() => dispatchMessage(data));
    },
  };
  window.top = window;
  const chrome = {
    runtime: {
      async sendMessage(message) {
        sentMessages.push(message);
        if (message.type === "WEBMCP_PING") {
          return { ok: true, name: "temoto for Chrome", version: "0.2.0" };
        }
        if (message.type === "WEBMCP_SET_VIDEO_SPEED") {
          return { ok: true, speed: message.speed, changed: 2 };
        }
        return { ok: false, error: "Unknown message" };
      },
    },
  };

  const context = {
    window,
    document,
    chrome,
    AbortController,
    crypto,
    setTimeout,
    clearTimeout,
    queueMicrotask,
  };
  assert.doesNotThrow(() => vm.runInNewContext(bridgeSource, context));
  assert.doesNotThrow(() => vm.runInNewContext(providerSource, context));

  return {
    tools,
    sentMessages,
    pagehide() {
      for (const listener of windowListeners.get("pagehide") || []) listener();
    },
  };
}

test("registers no tools unless the page explicitly enables the temoto WebMCP bridge", () => {
  assert.deepEqual(loadWebMCPContentScripts({ optedIn: false }).tools, []);
});

test("degrades safely when WebMCP is unavailable", () => {
  assert.deepEqual(loadWebMCPContentScripts({ supported: false }).tools, []);
});

test("registers ping and video speed tools on an opted-in WebMCP page", () => {
  const page = loadWebMCPContentScripts();
  assert.deepEqual(page.tools.map((tool) => tool.name), ["temoto_ping", "temoto_set_video_speed"]);
  assert.equal(page.tools[0].annotations.readOnlyHint, true);
  assert.equal(page.tools[1].annotations.readOnlyHint, false);
});

test("bridges WebMCP calls to the extension runtime", async () => {
  const page = loadWebMCPContentScripts();
  const pingResult = await page.tools.find((tool) => tool.name === "temoto_ping").execute({});
  const speedResult = await page.tools.find((tool) => tool.name === "temoto_set_video_speed").execute({ speed: 2.25 });

  assert.deepEqual(JSON.parse(JSON.stringify(page.sentMessages)), [
    { type: "WEBMCP_PING" },
    { type: "WEBMCP_SET_VIDEO_SPEED", speed: 2.25 },
  ]);
  assert.deepEqual(JSON.parse(pingResult.content[0].text), {
    ok: true,
    name: "temoto for Chrome",
    version: "0.2.0",
  });
  assert.deepEqual(JSON.parse(speedResult.content[0].text), {
    ok: true,
    speed: 2.25,
    changed: 2,
  });
});

test("unregisters the tools when the page is discarded", () => {
  const page = loadWebMCPContentScripts();
  assert.ok(page.tools.every((tool) => !tool.signal.aborted));
  page.pagehide();
  assert.ok(page.tools.every((tool) => tool.signal.aborted));
});
