import { downloadText, el, endpointLabel, sendMessage } from "./extension-api.js";
import type { ProxyStatus } from "./proxy-core.js";
import type { EffectiveState } from "./proxy-runtime.js";
import { createProfileEditor } from "./profile-editor.js";
import { localizeDocument, localizeError, t } from "./i18n.js";

localizeDocument();
function query<T extends Element = HTMLElement>(selector: string): T {
  const node = document.querySelector<T>(selector);
  if (!node) throw new Error(`Missing required element: ${selector}`);
  return node;
}
const nodes = {
  home: query("#home-view"), statusDot: query("#status-dot"), statusLabel: query("#status-label"),
  activeName: query("#active-name"), activeDetail: query("#active-detail"), scope: query("#scope-status"),
  actions: query("#popup-actions"), toggle: query<HTMLButtonElement>("#toggle-active"), notice: query("#status-notice"),
  list: query("#profile-list"), count: query("#profile-count"), result: query("#action-result"),
  incognito: query<HTMLInputElement>("#incognito-enabled"), session: query<HTMLInputElement>("#incognito-session"),
};
let currentState: EffectiveState | null = null;
let busy = false;
let importJson: string | null = null;
const editor = createProfileEditor({
  getState: () => { if (!currentState) throw new Error("Proxy state is not loaded"); return currentState; },
  setState: (state) => { currentState = state; render(); },
  showHome: (profileId) => {
    query("#editor-view").hidden = true;
    nodes.home.hidden = false;
    render();
    const previous = profileId ? nodes.list.querySelector<HTMLButtonElement>(`[data-edit-profile="${CSS.escape(profileId)}"]`) : null;
    (previous || query<HTMLButtonElement>("#new-profile")).focus();
  },
});
function showResult(message: string, tone: "neutral" | "error" = "neutral") {
  nodes.result.textContent = message;
  nodes.result.dataset.tone = tone;
  nodes.result.setAttribute("role", tone === "error" ? "alert" : "status");
  nodes.result.hidden = !message;
}
async function run<T>(action: () => Promise<T>) {
  if (busy) return;
  busy = true;
  nodes.home.inert = true;
  showResult("");
  try {
    const response = await action();
    if (response && typeof response === "object" && "state" in response && response.state) currentState = response.state as EffectiveState;
  } catch (error) { showResult(localizeError(error), "error"); }
  finally {
    busy = false;
    nodes.home.inert = false;
    if (currentState) render();
    if (!nodes.result.hidden) nodes.result.scrollIntoView({ block: "nearest" });
  }
}
function statusMessage(status: ProxyStatus): string {
  const messages: Partial<Record<ProxyStatus["code"], string>> = {
    conflict: "Another extension currently has higher priority. Disable it before activating a temoto profile.",
    policy: "Chrome or an administrator policy controls this setting. temoto will not overwrite it.",
    changed: "Chrome's effective proxy no longer matches this profile. Reapply it or turn temoto off.",
    inactive: "The selected profile is saved but is not currently applied.",
    orphaned: "Chrome reports a temoto-controlled setting that is not linked to a saved profile.",
  };
  return messages[status.code] || "";
}
function editIcon(): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  for (const [key, value] of Object.entries({ viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "1.5", "aria-hidden": "true" })) svg.setAttribute(key, value);
  const path = document.createElementNS(svg.namespaceURI, "path");
  path.setAttribute("d", "m15 5 4 4M4 20l4-1L20 7a2.83 2.83 0 0 0-4-4L4 15z");
  svg.append(path);
  return svg;
}
function renderProfile(profile: EffectiveState["profiles"][number]) {
  const active = profile.id === currentState?.activeProfileId && currentState.status.code === "active";
  return el("div", { className: `profile-row${active ? " is-active" : ""}` },
    el("button", { className: "popup-profile", type: "button", "aria-pressed": active,
      onclick: () => run(() => sendMessage("ACTIVATE_PROFILE", { profileId: profile.id })) },
      el("i", { className: "profile-color", "aria-hidden": "true" }),
      el("span", { className: "profile-copy" }, el("strong", { text: profile.name, title: profile.name }), el("small", { text: endpointLabel(profile), title: endpointLabel(profile) }))),
    el("button", { className: "edit-profile", type: "button", "data-edit-profile": profile.id, "aria-label": `Edit ${profile.name}`, title: `Edit ${profile.name}`,
      onclick: () => run(() => editor.open(profile)) }, editIcon()),
  );
}
function render() {
  if (!currentState) return;
  const { status, profiles, activeProfileId } = currentState;
  const active = profiles.find((profile) => profile.id === activeProfileId);
  const clearable = Boolean(active) || status.code === "orphaned";
  nodes.statusDot.dataset.tone = status.tone;
  nodes.statusLabel.textContent = status.code === "active" ? "Proxy applied" : t(status.label);
  nodes.activeName.textContent = active?.name || "";
  nodes.activeName.title = active?.name || "";
  nodes.activeName.hidden = !active;
  nodes.activeDetail.textContent = active ? endpointLabel(active) : "";
  nodes.activeDetail.title = nodes.activeDetail.textContent;
  nodes.activeDetail.hidden = !active;
  nodes.scope.textContent = currentState.incognitoEnabled ? "Regular + Incognito" : "Regular";
  nodes.actions.hidden = !clearable;
  nodes.toggle.disabled = busy;
  const message = statusMessage(status);
  nodes.notice.hidden = !message;
  nodes.notice.textContent = message;
  nodes.count.textContent = String(profiles.length);
  nodes.list.replaceChildren(...profiles.map(renderProfile));
  if (!profiles.length) nodes.list.append(el("button", { className: "empty-profile", type: "button", onclick: () => run(() => editor.open()) }, "New profile"));
  nodes.incognito.checked = currentState.incognitoEnabled;
  nodes.incognito.disabled = !currentState.incognitoAllowed;
  nodes.session.checked = currentState.incognitoSessionOnly;
  query("#incognito-session-row").hidden = !currentState.incognitoEnabled;
  query("#incognito-help").hidden = currentState.incognitoAllowed;
  query("#incognito-help").textContent = currentState.incognitoAllowed ? "" : "Chrome incognito access is not enabled.";
}
query("#new-profile").addEventListener("click", () => run(() => editor.open()));
nodes.toggle.addEventListener("click", () => run(() => sendMessage("DEACTIVATE")));
nodes.incognito.addEventListener("change", () => run(() => sendMessage("SET_INCOGNITO", { enabled: nodes.incognito.checked, sessionOnly: nodes.session.checked })));
nodes.session.addEventListener("change", () => { if (nodes.incognito.checked) void run(() => sendMessage("SET_INCOGNITO", { enabled: true, sessionOnly: nodes.session.checked })); });
query("#export-profiles").addEventListener("click", () => run(async () => {
  const response = await sendMessage("EXPORT_PROFILES");
  downloadText(`temoto-proxy-${new Date().toISOString().slice(0, 10)}.json`, response.json);
}));
query("#import-profiles").addEventListener("click", () => query<HTMLInputElement>("#import-file").click());
query<HTMLInputElement>("#import-file").addEventListener("change", (event) => run(async () => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  importJson = await file.text();
  input.value = "";
  query("#import-choice").hidden = false;
}));
function importProfiles(mode: "merge" | "replace") {
  return run(async () => {
    if (importJson === null) return;
    const response = await sendMessage("IMPORT_PROFILES", { json: importJson, mode });
    query("#import-choice").hidden = true;
    importJson = null;
    showResult(mode === "replace" ? "Profiles replaced — enter passwords again" : "Profiles merged — test URLs reset");
    return response;
  });
}
query("#import-merge").addEventListener("click", () => importProfiles("merge"));
query("#import-replace").addEventListener("click", () => importProfiles("replace"));
query("#import-cancel").addEventListener("click", () => { importJson = null; query("#import-choice").hidden = true; query("#import-profiles").focus(); });
void run(async () => {
  const response = await sendMessage("GET_STATE");
  currentState = response.state;
  render();
  await editor.restore();
});
