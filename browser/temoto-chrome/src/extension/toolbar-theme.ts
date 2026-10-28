export {};

const colorScheme = matchMedia("(prefers-color-scheme: dark)");
let reportedDark = colorScheme.matches;
let reporting = false;
let warned = false;

async function reportChange(): Promise<void> {
  const dark = colorScheme.matches;
  if (reporting || dark === reportedDark) return;
  reporting = true;
  try {
    const response = await chrome.runtime.sendMessage({ target: "toolbar-icon", type: "COLOR_SCHEME_CHANGED" });
    if (!response?.ok) throw new Error(response?.error || "Toolbar icon update failed");
    reportedDark = dark;
    warned = false;
  } catch (error) {
    if (!warned) console.warn("temoto toolbar preference notification failed", error);
    warned = true;
  } finally {
    reporting = false;
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.target !== "toolbar-theme" || message?.type !== "GET_COLOR_SCHEME") return false;
  if (sender.id !== chrome.runtime.id || sender.tab) return false;
  sendResponse({ dark: colorScheme.matches });
  return false;
});
// Hidden documents can report a new matches value without firing change events.
// Check locally; only a changed preference wakes the service worker.
setInterval(() => { void reportChange(); }, 2000);
