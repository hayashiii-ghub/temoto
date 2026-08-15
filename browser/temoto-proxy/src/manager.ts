import { createProfile } from "./proxy-core.js";
import type { ProxyEndpoint, ProxyProfile, ProxyStatus, RoutingRule } from "./proxy-core.js";
import { downloadText, el, endpointLabel, profileKindLabel, sendMessage } from "./extension-api.js";
import type { EffectiveState } from "./proxy-runtime.js";

type FormControl = HTMLInputElement & HTMLSelectElement & HTMLTextAreaElement;
type ProxyForm = HTMLFormElement & {
  elements: HTMLFormControlsCollection & Record<string, FormControl>;
};

function query<T extends Element = HTMLElement>(selector: string): T {
  const node = document.querySelector<T>(selector);
  if (!node) throw new Error(`Missing required element: ${selector}`);
  return node;
}

function queryAll<T extends Element = HTMLElement>(selector: string): NodeListOf<T> {
  return document.querySelectorAll<T>(selector);
}

const form = query<ProxyForm>("#profile-form");
const profileList = query("#manager-profile-list");
const toast = query("#manager-toast");
const notice = query("#manager-notice");
const empty = query("#empty-manager");
const statusNode = query("#manager-status");
const statusDot = query("#manager-status-dot");
const globalToggle = query<HTMLButtonElement>("#global-toggle");
const diagnosticResult = query("#diagnostic-result");

let state: EffectiveState | null = null;
let draft: EffectiveState["profiles"][number] | null = null;
let ruleDraft: RoutingRule[] = [];
let busy = false;
let toastTimer: ReturnType<typeof setTimeout> | undefined;

for (const container of queryAll<HTMLElement>("[data-endpoint]")) {
  const key = container.dataset.endpoint;
  container.append(
    el("label", { className: "field" }, el("span", { text: "Type" }), el("select", { name: `${key}Scheme` },
      ...["http", "https", "socks4", "socks5"].map((value) => el("option", { value, text: value.toUpperCase() })),
    )),
    el("label", { className: "field endpoint-host" }, el("span", { text: "Host" }), el("input", { name: `${key}Host`, spellcheck: "false", placeholder: "127.0.0.1" })),
    el("label", { className: "field" }, el("span", { text: "Port" }), el("input", { name: `${key}Port`, type: "number", min: "1", max: "65535", inputmode: "numeric" })),
  );
}

function showToast(message: string, tone = "neutral"): void {
  toast.textContent = message;
  toast.dataset.tone = tone;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 3200);
}

async function run<T>(action: () => Promise<T>): Promise<T | null> {
  if (busy) return null;
  busy = true;
  document.body.dataset.busy = "true";
  try {
    const response = await action();
    if (response && typeof response === "object" && "state" in response && response.state) {
      state = response.state as EffectiveState;
      renderShell();
    }
    return response;
  } catch (error) {
    showToast(error instanceof Error ? error.message : String(error), "error");
    return null;
  } finally {
    busy = false;
    document.body.dataset.busy = "false";
  }
}

function activeProfile(): EffectiveState["profiles"][number] | null {
  const snapshot = state;
  return snapshot?.profiles.find((profile) => profile.id === snapshot.activeProfileId) || null;
}

function selectedProfile(): EffectiveState["profiles"][number] | null {
  const snapshot = state;
  return snapshot?.profiles.find((profile) => profile.id === snapshot.selectedProfileId)
    || snapshot?.profiles[0]
    || null;
}

function statusMessage(status: ProxyStatus): string {
  const messages: Partial<Record<ProxyStatus["code"], string>> = {
    conflict: "Another extension has higher priority. temoto will not overwrite it.",
    policy: "Chrome or an administrator policy controls proxy settings.",
    changed: "The effective Chrome setting changed after activation. Reapply the profile or turn temoto off.",
    inactive: "A profile is selected but Chrome is not currently using it.",
    orphaned: "Chrome reports a temoto-controlled setting that is not linked to a saved profile. Turn temoto off to clear it.",
  };
  return messages[status.code] || "";
}

function renderShell(): void {
  if (!state) return;
  const active = activeProfile();
  statusNode.textContent = active && state.status.code === "active" ? `${active.name} · active` : state.status.label;
  statusDot.dataset.tone = state.status.tone;
  globalToggle.disabled = false;
  globalToggle.textContent = active ? "Turn off safely" : "Proxy off";
  globalToggle.classList.toggle("danger-text", Boolean(active));
  globalToggle.onclick = active || state.status.code === "orphaned"
    ? () => run(async () => { const response = await sendMessage("DEACTIVATE"); showToast("temoto control cleared", "success"); return response; })
    : null;

  const message = statusMessage(state.status);
  notice.hidden = !message;
  notice.textContent = message;
  notice.dataset.tone = state.status.tone;
  renderSidebar();
  const selected = selectedProfile();
  empty.hidden = Boolean(selected);
  form.hidden = !selected;
  if (selected && draft?.id !== selected.id) populateForm(selected);
  if (selected) updateActiveControls();
  renderIncognitoControls();
}

function renderSidebar(): void {
  if (!state) return;
  const snapshot = state;
  profileList.replaceChildren(...snapshot.profiles.map((profile) => {
    const active = profile.id === snapshot.activeProfileId && snapshot.status.code === "active";
    const selected = profile.id === snapshot.selectedProfileId || (!snapshot.selectedProfileId && profile.id === snapshot.profiles[0]?.id);
    return el("button", {
      className: `sidebar-profile${selected ? " is-selected" : ""}`,
      type: "button",
      onclick: () => run(async () => {
        const response = await sendMessage("SELECT_PROFILE", { profileId: profile.id });
        draft = null;
        return response;
      }),
    },
    el("i", { className: "profile-color", style: `--profile-color:${profile.color}` }),
    el("span", { className: "profile-copy" }, el("strong", { text: profile.name }), el("small", { text: endpointLabel(profile) })),
    active ? el("span", { className: "active-pip", title: "Active", text: "ON" }) : null,
    );
  }));
}

function setEndpoint(key: keyof ProxyProfile["endpoints"], endpoint?: ProxyEndpoint): void {
  form.elements[`${key}Scheme`].value = endpoint?.scheme || (key === "fallback" ? "socks5" : "http");
  form.elements[`${key}Host`].value = endpoint?.host || "";
  form.elements[`${key}Port`].value = endpoint?.port ? String(endpoint.port) : "";
}

function readEndpoint(key: keyof ProxyProfile["endpoints"]): ProxyEndpoint {
  return {
    scheme: form.elements[`${key}Scheme`].value as ProxyEndpoint["scheme"],
    host: form.elements[`${key}Host`].value.trim(),
    port: Number(form.elements[`${key}Port`].value),
  };
}

function populateForm(profile: EffectiveState["profiles"][number]): void {
  draft = structuredClone(profile);
  ruleDraft = structuredClone(profile.routingRules || []);
  form.elements.name.value = profile.name;
  form.elements.color.value = profile.color;
  form.querySelector<HTMLInputElement>(`input[name="kind"][value="${profile.kind}"]`)!.checked = true;
  form.elements.perProtocol.checked = profile.endpointMode === "perProtocol";
  for (const key of ["single", "http", "https", "fallback"] as const) setEndpoint(key, profile.endpoints[key]);
  form.elements.defaultAction.value = profile.defaultAction || "proxy";
  form.elements.pacSource.value = profile.pac?.source || "inline";
  form.elements.pacMandatory.checked = Boolean(profile.pac?.mandatory);
  form.elements.pacValue.value = profile.pac?.value || "";
  form.elements.bypassList.value = (profile.bypassList || []).join("\n");
  form.elements.authEnabled.checked = Boolean(profile.auth?.enabled);
  form.elements.username.value = profile.auth?.username || "";
  form.elements.password.value = "";
  form.elements.authHosts.value = (profile.auth?.allowedHosts || []).join("\n");
  form.elements.diagnosticUrl.value = profile.diagnosticUrl || "https://example.com/";
  query("#editor-title").textContent = profile.name;
  query("#footer-profile-name").textContent = profile.name;
  query("#credential-state").textContent = profile.auth?.passwordReady
    ? "Session password is ready. Leave the password field blank to keep it."
    : "No session password is loaded. It will be requested again after Chrome restarts.";
  diagnosticResult.hidden = true;
  renderRules();
  updateVisibility();
  updateActiveControls();
}

function renderRules(): void {
  const list = query("#rule-list");
  list.replaceChildren(...ruleDraft.map((rule, index) => el("div", { className: "rule-row" },
    el("span", { className: "rule-index", text: String(index + 1).padStart(2, "0") }),
    el("input", {
      value: rule.pattern,
      placeholder: "*.staging.example.com",
      "aria-label": `Rule ${index + 1} pattern`,
      onchange: ((event: Event) => { ruleDraft[index].pattern = (event.target as HTMLInputElement).value; }) as EventListener,
    }),
    el("select", {
      "aria-label": `Rule ${index + 1} action`,
      onchange: ((event: Event) => { ruleDraft[index].action = (event.target as HTMLSelectElement).value as RoutingRule["action"]; }) as EventListener,
    },
    el("option", { value: "proxy", text: "USE PROXY", selected: rule.action === "proxy" ? "selected" : null }),
    el("option", { value: "direct", text: "DIRECT", selected: rule.action === "direct" ? "selected" : null }),
    ),
    el("button", {
      type: "button",
      className: "rule-delete",
      "aria-label": `Delete rule ${index + 1}`,
      text: "×",
      onclick: () => { ruleDraft.splice(index, 1); renderRules(); },
    }),
  )));
  if (!ruleDraft.length) list.append(el("div", { className: "empty-rules", text: "No domain rules yet. The fallback below handles every destination." }));
}

function currentKind(): ProxyProfile["kind"] {
  return form.querySelector<HTMLInputElement>('input[name="kind"]:checked')?.value as ProxyProfile["kind"] || "fixed";
}

function updateVisibility(): void {
  const kind = currentKind();
  const perProtocol = form.elements.perProtocol.checked;
  query("#fixed-section").hidden = kind === "pac";
  query("#routing-section").hidden = kind !== "rules";
  query("#pac-section").hidden = kind !== "pac";
  query("#bypass-section").hidden = kind === "pac";
  query("#single-endpoint").hidden = kind === "fixed" && perProtocol;
  query("#protocol-endpoints").hidden = kind !== "fixed" || !perProtocol;
  query<HTMLElement>("#profile-form [name=perProtocol]").closest<HTMLElement>("label")!.hidden = kind !== "fixed";
  query("#auth-fields").hidden = !form.elements.authEnabled.checked;
  query("#pac-value-label").textContent = form.elements.pacSource.value === "url" ? "PAC URL" : "PAC script";
  form.elements.pacValue.rows = form.elements.pacSource.value === "url" ? 2 : 9;
}

function collectProfile(): ProxyProfile {
  if (!draft) throw new Error("No profile is selected");
  const kind = currentKind();
  return {
    ...structuredClone(draft),
    name: form.elements.name.value,
    color: form.elements.color.value,
    kind,
    endpointMode: form.elements.perProtocol.checked ? "perProtocol" : "single",
    endpoints: {
      single: readEndpoint("single"),
      http: readEndpoint("http"),
      https: readEndpoint("https"),
      fallback: readEndpoint("fallback"),
    },
    bypassList: form.elements.bypassList.value.split(/\r?\n/).map((value) => value.trim()).filter(Boolean),
    routingRules: ruleDraft.map((rule) => ({ ...rule })),
    defaultAction: form.elements.defaultAction.value as ProxyProfile["defaultAction"],
    pac: {
      source: form.elements.pacSource.value as ProxyProfile["pac"]["source"],
      value: form.elements.pacValue.value,
      mandatory: form.elements.pacMandatory.checked,
    },
    auth: {
      enabled: form.elements.authEnabled.checked,
      username: form.elements.username.value,
      allowedHosts: form.elements.authHosts.value.split(/\r?\n/).map((value) => value.trim()).filter(Boolean),
    },
    diagnosticUrl: form.elements.diagnosticUrl.value,
  };
}

async function save({ activate = false }: { activate?: boolean } = {}) {
  const profile = collectProfile();
  const response = await sendMessage("SAVE_PROFILE", { profile, password: form.elements.password.value });
  state = response.state;
  draft = null;
  renderShell();
  if (activate) {
    const activated = await sendMessage("ACTIVATE_PROFILE", { profileId: profile.id });
    state = activated.state;
    renderShell();
    showToast(`${profile.name} saved and activated`, "success");
    return activated;
  }
  showToast(`${profile.name} saved`, "success");
  return response;
}

function updateActiveControls() {
  if (!draft || !state) return;
  const isActive = draft.id === state.activeProfileId && state.status.code === "active";
  const activateButton = query("#activate-profile");
  activateButton.textContent = isActive ? "Save & reapply" : "Save & activate";
}

function newProfile() {
  const profile = createProfile();
  run(async () => {
    const response = await sendMessage("SAVE_PROFILE", { profile });
    draft = null;
    showToast("New profile created", "success");
    return response;
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  run(() => save());
});
form.addEventListener("change", (event) => {
  const target = event.target as FormControl;
  if (["kind", "perProtocol", "authEnabled", "pacSource"].includes(target.name)) updateVisibility();
  if (target.name === "name") {
    query("#editor-title").textContent = target.value || "Untitled profile";
    query("#footer-profile-name").textContent = target.value || "Untitled profile";
  }
});

query("#add-rule").addEventListener("click", () => {
  ruleDraft.push({ id: crypto.randomUUID(), pattern: "*.example.com", action: "proxy" });
  renderRules();
  query<HTMLInputElement>("#rule-list .rule-row:last-child input").focus();
});
query("#activate-profile").addEventListener("click", () => run(() => save({ activate: true })));
query("#run-diagnostic").addEventListener("click", () => run(async () => {
  const saved = await save({ activate: false });
  if (!saved) return null;
  const selected = selectedProfile();
  if (!state || !selected || (state.activeProfileId !== draft?.id && state.activeProfileId !== selected.id)) throw new Error("Activate this profile before running a connection test");
  const profileId = selected.id;
  const response = await sendMessage("DIAGNOSE", { profileId });
  diagnosticResult.hidden = false;
  diagnosticResult.dataset.tone = response.result.ok ? "success" : "error";
  diagnosticResult.textContent = response.result.reachable
    ? `${response.result.status} ${response.result.statusText || ""} · ${response.result.latencyMs} ms · ${response.result.url}`
    : `${response.result.error} · ${response.result.latencyMs} ms`;
  return response;
}));
query("#duplicate-profile").addEventListener("click", () => run(async () => {
  if (!draft) throw new Error("No profile is selected");
  const response = await sendMessage("DUPLICATE_PROFILE", { profileId: draft.id });
  draft = null;
  showToast("Profile duplicated", "success");
  return response;
}));
query("#delete-profile").addEventListener("click", () => {
  if (!draft || !state) return;
  const profile = draft;
  if (!confirm(`Delete “${profile.name}”?${profile.id === state.activeProfileId ? " temoto will first clear its active proxy setting." : ""}`)) return;
  run(async () => {
    const response = await sendMessage("DELETE_PROFILE", { profileId: profile.id });
    draft = null;
    showToast("Profile deleted", "success");
    return response;
  });
});

query("#new-profile").addEventListener("click", newProfile);
query("#empty-create").addEventListener("click", newProfile);
query("#export-profiles").addEventListener("click", () => run(async () => {
  const response = await sendMessage("EXPORT_PROFILES");
  downloadText(`temoto-proxy-${new Date().toISOString().slice(0, 10)}.json`, response.json);
  showToast("Profiles exported without secrets", "success");
  return response;
}));
query("#import-profiles").addEventListener("click", () => query<HTMLInputElement>("#import-file").click());
query<HTMLInputElement>("#import-file").addEventListener("change", async (event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  const json = await file.text();
  const replace = confirm("Replace all saved profiles with this file?\n\nChoose Cancel to merge the imported profiles instead.");
  await run(async () => {
    const response = await sendMessage("IMPORT_PROFILES", { json, mode: replace ? "replace" : "merge" });
    draft = null;
    showToast(replace ? "Profiles replaced — enter passwords again" : "Profiles merged — test URLs reset", "success");
    return response;
  });
  target.value = "";
});

const incognitoEnabled = query<HTMLInputElement>("#incognito-enabled");
const incognitoSession = query<HTMLInputElement>("#incognito-session");
incognitoEnabled.addEventListener("change", () => run(async () => {
  const response = await sendMessage("SET_INCOGNITO", { enabled: incognitoEnabled.checked, sessionOnly: incognitoSession.checked });
  showToast(incognitoEnabled.checked ? "Incognito proxy enabled explicitly" : "Incognito proxy cleared", "success");
  return response;
}));
incognitoSession.addEventListener("change", () => {
  if (!incognitoEnabled.checked) return;
  run(() => sendMessage("SET_INCOGNITO", { enabled: true, sessionOnly: incognitoSession.checked }));
});

function renderIncognitoControls(): void {
  if (!state) return;
  incognitoEnabled.checked = Boolean(state.incognitoEnabled);
  incognitoEnabled.disabled = !state.incognitoAllowed;
  incognitoSession.checked = Boolean(state.incognitoSessionOnly);
  query("#incognito-session-row").hidden = !state.incognitoEnabled;
  query("#incognito-help").textContent = state.incognitoAllowed
    ? "Explicitly applies the active profile only to incognito windows."
    : "Enable “Allow in Incognito” for temoto Proxy in Chrome extensions first.";
}

run(async () => {
  const response = await sendMessage("GET_STATE");
  state = response.state;
  if (!state.selectedProfileId && state.profiles[0]) await sendMessage("SELECT_PROFILE", { profileId: state.profiles[0].id });
  return response;
});
