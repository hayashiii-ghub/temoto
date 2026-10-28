const themeDocument = "toolbar-theme.html";

export function startToolbarIconSync(api: Pick<typeof chrome, "runtime" | "offscreen" | "action"> = chrome) {
  const documentUrl = api.runtime.getURL(themeDocument);
  let pending = Promise.resolve();

  async function synchronizeOnce(): Promise<void> {
    const contexts = await api.runtime.getContexts({
      contextTypes: [api.runtime.ContextType.OFFSCREEN_DOCUMENT],
      documentUrls: [documentUrl],
    });
    if (contexts.length === 0) {
      await api.offscreen.createDocument({
        url: themeDocument,
        reasons: [api.offscreen.Reason.MATCH_MEDIA],
        justification: "Match the toolbar icon to the user's light or dark display preference.",
      });
    }
    const response: unknown = await api.runtime.sendMessage({ target: "toolbar-theme", type: "GET_COLOR_SCHEME" });
    if (!response || typeof response !== "object" || !("dark" in response) || typeof response.dark !== "boolean") {
      throw new Error("Toolbar display preference is unavailable");
    }
    const theme = response.dark ? "dark" : "light";
    await api.action.setIcon({
      path: Object.fromEntries([16, 24, 32, 48].map((size) => [size, `icons/toolbar-${theme}-${size}.png`])),
    });
  }

  function synchronize(): Promise<void> {
    const previous = pending;
    // Serialize creation and read the current preference inside each task so a
    // delayed reply cannot restore an old color after a newer theme change.
    pending = (async () => {
      try { await previous; } catch { /* A later event can retry a failed sync. */ }
      await synchronizeOnce();
    })();
    return pending;
  }

  function synchronizeInBackground(): void {
    void (async () => {
      try { await synchronize(); }
      catch (error) { console.warn("temoto toolbar icon sync failed", error); }
    })();
  }

  api.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.target !== "toolbar-icon" || message?.type !== "COLOR_SCHEME_CHANGED") return false;
    if (sender.id !== api.runtime.id || sender.tab || sender.url !== documentUrl) {
      sendResponse({ ok: false, error: "Untrusted toolbar theme sender" });
      return false;
    }
    void (async () => {
      try {
        await synchronize();
        sendResponse({ ok: true });
      } catch (error) {
        sendResponse({ ok: false, error: error instanceof Error ? error.message : "Toolbar icon sync failed" });
      }
    })();
    return true;
  });
  api.runtime.onInstalled.addListener(synchronizeInBackground);
  api.runtime.onStartup.addListener(synchronizeInBackground);
  // A worker may restart while its offscreen document is still alive. Always
  // query that document again; no saved or worker-local color is authoritative.
  synchronizeInBackground();
}
