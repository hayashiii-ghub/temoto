import { createProfile } from "./proxy-core.js";
import { downloadText, el, endpointLabel, profileKindLabel, sendMessage } from "./extension-api.js";

const form = document.querySelector("#profile-form");
const profileList = document.querySelector("#manager-profile-list");
const toast = document.querySelector("#manager-toast");
const notice = document.querySelector("#manager-notice");
const empty = document.querySelector("#empty-manager");
const statusNode = document.querySelector("#manager-status");
const statusDot = document.querySelector("#manager-status-dot");
const globalToggle = document.querySelector("#global-toggle");
const diagnosticResult = document.querySelector("#diagnostic-result");

let state = null;
let draft = null;
let ruleDraft = [];
let busy = false;

for (const container of document.querySelectorAll("[data-endpoint]")) {
  const key = container.dataset.endpoint;
  container.append(
    el("label", { className: "field" }, el("span", { text: "Type" }), el("select", { name: `${key}Scheme` },
      ...["http", "https", "socks4", "socks5"].map((value) => el("option", { value, text: value.toUpperCase() })),
    )),
    el("label", { className: "field endpoint-host" }, el("span", { text: "Host" }), el("input", { name: `${key}Host`, spellcheck: "false", placeholder: "127.0.0.1" })),
    el("label", { className: "field" }, el("span", { text: "Port" }), el("input", { name: `${key}Port`, type: "number", min: "1", max: "65535", inputmode: "numeric" })),
  );
}

function showToast(message, tone = "neutral") {
  toast.textContent = message;
  toast.dataset.tone = tone;
  toast.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => { toast.hidden = true; }, 3200);
}

async function run(action) {
  if (busy) return null;
  busy = true;
  document.body.dataset.busy = "true";
  try {
    const response = await action();
    if (response?.state) {
      state = response.state;
      renderShell();
    }
    return response;
  } catch (error) {
    showToast(error.message, "error");
    return null;
  } finally {
    busy = false;
    document.body.dataset.busy = "false";
  }
}

function activeProfile() {
  return state?.profiles.find((profile) => profile.id === state.activeProfileId) || null;
}

function selectedProfile() {
  return state?.profiles.find((profile) => profile.id === state.selectedProfileId)
    || state?.profiles[0]
    || null;
}

function statusMessage(status) {
  return {
    conflict: "Another extension has higher priority. temoto will not overwrite it.",
    policy: "Chrome or an administrator policy controls proxy settings.",
    changed: "The effective Chrome setting changed after activation. Reapply the profile or turn temoto off.",
    inactive: "A profile is selected but Chrome is not currently using it.",
    orphaned: "Chrome reports a temoto-controlled setting that is not linked to a saved profile. Turn temoto off to clear it.",
  }[status.code] || "";
}

function renderShell() {
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

function renderSidebar() {
  profileList.replaceChildren(...state.profiles.map((profile) => {
    const active = profile.id === state.activeProfileId && state.status.code === "active";
    const selected = profile.id === state.selectedProfileId || (!state.selectedProfileId && profile.id === state.profiles[0]?.id);
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

function setEndpoint(key, endpoint = {}) {
  form.elements[`${key}Scheme`].value = endpoint.scheme || (key === "fallback" ? "socks5" : "http");
  form.elements[`${key}Host`].value = endpoint.host || "";
  form.elements[`${key}Port`].value = endpoint.port || "";
}

function readEndpoint(key) {
  return {
    scheme: form.elements[`${key}Scheme`].value,
    host: form.elements[`${key}Host`].value.trim(),
    port: Number(form.elements[`${key}Port`].value),
  };
}

function populateForm(profile) {
  draft = structuredClone(profile);
  ruleDraft = structuredClone(profile.routingRules || []);
  form.elements.name.value = profile.name;
  form.elements.color.value = profile.color;
  form.querySelector(`input[name="kind"][value="${profile.kind}"]`).checked = true;
  form.elements.perProtocol.checked = profile.endpointMode === "perProtocol";
  for (const key of ["single", "http", "https", "fallback"]) setEndpoint(key, profile.endpoints?.[key]);
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
  document.querySelector("#editor-title").textContent = profile.name;
  document.querySelector("#footer-profile-name").textContent = profile.name;
  document.querySelector("#credential-state").textContent = profile.auth?.passwordReady
    ? "Session password is ready. Leave the password field blank to keep it."
    : "No session password is loaded. It will be requested again after Chrome restarts.";
  diagnosticResult.hidden = true;
  renderRules();
  updateVisibility();
  updateActiveControls();
}

function renderRules() {
  const list = document.querySelector("#rule-list");
  list.replaceChildren(...ruleDraft.map((rule, index) => el("div", { className: "rule-row" },
    el("span", { className: "rule-index", text: String(index + 1).padStart(2, "0") }),
    el("input", {
      value: rule.pattern,
      placeholder: "*.staging.example.com",
      "aria-label": `Rule ${index + 1} pattern`,
      onchange: (event) => { ruleDraft[index].pattern = event.target.value; },
    }),
    el("select", {
      "aria-label": `Rule ${index + 1} action`,
      onchange: (event) => { ruleDraft[index].action = event.target.value; },
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

function currentKind() {
  return form.querySelector('input[name="kind"]:checked')?.value || "fixed";
}

function updateVisibility() {
  const kind = currentKind();
  const perProtocol = form.elements.perProtocol.checked;
  document.querySelector("#fixed-section").hidden = kind === "pac";
  document.querySelector("#routing-section").hidden = kind !== "rules";
  document.querySelector("#pac-section").hidden = kind !== "pac";
  document.querySelector("#bypass-section").hidden = kind === "pac";
  document.querySelector("#single-endpoint").hidden = kind === "fixed" && perProtocol;
  document.querySelector("#protocol-endpoints").hidden = kind !== "fixed" || !perProtocol;
  form.elements.perProtocol.closest("label").hidden = kind !== "fixed";
  document.querySelector("#auth-fields").hidden = !form.elements.authEnabled.checked;
  document.querySelector("#pac-value-label").textContent = form.elements.pacSource.value === "url" ? "PAC URL" : "PAC script";
  form.elements.pacValue.rows = form.elements.pacSource.value === "url" ? 2 : 9;
}

function collectProfile() {
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
    defaultAction: form.elements.defaultAction.value,
    pac: {
      source: form.elements.pacSource.value,
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

async function save({ activate = false } = {}) {
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
  const activateButton = document.querySelector("#activate-profile");
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
  if (["kind", "perProtocol", "authEnabled", "pacSource"].includes(event.target.name)) updateVisibility();
  if (event.target.name === "name") {
    document.querySelector("#editor-title").textContent = event.target.value || "Untitled profile";
    document.querySelector("#footer-profile-name").textContent = event.target.value || "Untitled profile";
  }
});

document.querySelector("#add-rule").addEventListener("click", () => {
  ruleDraft.push({ id: crypto.randomUUID(), pattern: "*.example.com", action: "proxy" });
  renderRules();
  document.querySelector("#rule-list .rule-row:last-child input")?.focus();
});
document.querySelector("#activate-profile").addEventListener("click", () => run(() => save({ activate: true })));
document.querySelector("#run-diagnostic").addEventListener("click", () => run(async () => {
  const saved = await save({ activate: false });
  if (!saved) return null;
  if (state.activeProfileId !== draft?.id && state.activeProfileId !== selectedProfile()?.id) throw new Error("Activate this profile before running a connection test");
  const profileId = selectedProfile().id;
  const response = await sendMessage("DIAGNOSE", { profileId });
  diagnosticResult.hidden = false;
  diagnosticResult.dataset.tone = response.result.ok ? "success" : "error";
  diagnosticResult.textContent = response.result.reachable
    ? `${response.result.status} ${response.result.statusText || ""} · ${response.result.latencyMs} ms · ${response.result.url}`
    : `${response.result.error} · ${response.result.latencyMs} ms`;
  return response;
}));
document.querySelector("#duplicate-profile").addEventListener("click", () => run(async () => {
  const response = await sendMessage("DUPLICATE_PROFILE", { profileId: draft.id });
  draft = null;
  showToast("Profile duplicated", "success");
  return response;
}));
document.querySelector("#delete-profile").addEventListener("click", () => {
  if (!confirm(`Delete “${draft.name}”?${draft.id === state.activeProfileId ? " temoto will first clear its active proxy setting." : ""}`)) return;
  run(async () => {
    const response = await sendMessage("DELETE_PROFILE", { profileId: draft.id });
    draft = null;
    showToast("Profile deleted", "success");
    return response;
  });
});

document.querySelector("#new-profile").addEventListener("click", newProfile);
document.querySelector("#empty-create").addEventListener("click", newProfile);
document.querySelector("#export-profiles").addEventListener("click", () => run(async () => {
  const response = await sendMessage("EXPORT_PROFILES");
  downloadText(`temoto-proxy-${new Date().toISOString().slice(0, 10)}.json`, response.json);
  showToast("Profiles exported without secrets", "success");
  return response;
}));
document.querySelector("#import-profiles").addEventListener("click", () => document.querySelector("#import-file").click());
document.querySelector("#import-file").addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const json = await file.text();
  const replace = confirm("Replace all saved profiles with this file?\n\nChoose Cancel to merge the imported profiles instead.");
  await run(async () => {
    const response = await sendMessage("IMPORT_PROFILES", { json, mode: replace ? "replace" : "merge" });
    draft = null;
    showToast(replace ? "Profiles replaced — enter passwords again" : "Profiles merged — test URLs reset", "success");
    return response;
  });
  event.target.value = "";
});

const incognitoEnabled = document.querySelector("#incognito-enabled");
const incognitoSession = document.querySelector("#incognito-session");
incognitoEnabled.addEventListener("change", () => run(async () => {
  const response = await sendMessage("SET_INCOGNITO", { enabled: incognitoEnabled.checked, sessionOnly: incognitoSession.checked });
  showToast(incognitoEnabled.checked ? "Incognito proxy enabled explicitly" : "Incognito proxy cleared", "success");
  return response;
}));
incognitoSession.addEventListener("change", () => {
  if (!incognitoEnabled.checked) return;
  run(() => sendMessage("SET_INCOGNITO", { enabled: true, sessionOnly: incognitoSession.checked }));
});

function renderIncognitoControls() {
  incognitoEnabled.checked = Boolean(state.incognitoEnabled);
  incognitoEnabled.disabled = !state.incognitoAllowed;
  incognitoSession.checked = Boolean(state.incognitoSessionOnly);
  document.querySelector("#incognito-session-row").hidden = !state.incognitoEnabled;
  document.querySelector("#incognito-help").textContent = state.incognitoAllowed
    ? "Explicitly applies the active profile only to incognito windows."
    : "Enable “Allow in Incognito” for temoto Proxy in Chrome extensions first.";
}

run(async () => {
  const response = await sendMessage("GET_STATE");
  state = response.state;
  if (!state.selectedProfileId && state.profiles[0]) await sendMessage("SELECT_PROFILE", { profileId: state.profiles[0].id });
  return response;
});
