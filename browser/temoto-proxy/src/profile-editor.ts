import { createProfile } from "./proxy-core.js";
import type { ProxyEndpoint, ProxyProfile, RoutingRule } from "./proxy-core.js";
import { el, sendMessage } from "./extension-api.js";
import type { EffectiveState } from "./proxy-runtime.js";
import { clearEditorDraft, loadEditorDraft, saveEditorDraft } from "./editor-draft.js";
import type { EditorDraft } from "./editor-draft.js";
import { localizeError } from "./i18n.js";

type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
type StoredProfile = EffectiveState["profiles"][number];
const endpointKeys = ["single", "http", "https", "fallback"] as const;

function query<T extends Element = HTMLElement>(selector: string): T {
  const node = document.querySelector<T>(selector);
  if (!node) throw new Error(`Missing required element: ${selector}`);
  return node;
}

export function createProfileEditor({ getState, setState, showHome }: {
  getState: () => EffectiveState;
  setState: (state: EffectiveState) => void;
  showHome: (profileId?: string) => void;
}) {
  const form = query<HTMLFormElement>("#profile-form");
  const panel = query("#editor-view");
  const result = query("#editor-result");
  const title = query("#editor-title");
  const saveButton = query<HTMLButtonElement>("#save-profile");
  let base: StoredProfile | null = null;
  let isNew = false;
  let busy = false;
  let rules: RoutingRule[] = [];

  function control(name: string): Control {
    const input = form.elements.namedItem(name);
    if (!(input instanceof HTMLInputElement || input instanceof HTMLSelectElement || input instanceof HTMLTextAreaElement)) throw new Error(`Missing form input: ${name}`);
    return input;
  }
  const value = (name: string) => control(name).value;
  const checked = (name: string) => (control(name) as HTMLInputElement).checked;
  const kind = () => form.querySelector<HTMLInputElement>('input[name="kind"]:checked')!.value as ProxyProfile["kind"];

  for (const container of form.querySelectorAll<HTMLElement>("[data-endpoint]")) {
    const key = container.dataset.endpoint;
    container.append(
      el("label", { className: "field" }, el("span", { text: "Type" }), el("select", { name: `${key}Scheme` },
        ...["http", "https", "socks4", "socks5"].map((scheme) => el("option", { value: scheme, text: scheme.toUpperCase() })))),
      el("label", { className: "field endpoint-host" }, el("span", { text: "Host" }), el("input", { name: `${key}Host`, spellcheck: "false", autocapitalize: "off", autocomplete: "off", placeholder: "127.0.0.1" })),
      el("label", { className: "field" }, el("span", { text: "Port" }), el("input", { name: `${key}Port`, type: "number", min: "1", max: "65535", inputmode: "numeric" })),
    );
  }

  function showResult(message: string, error = true) {
    result.textContent = message;
    result.hidden = !message;
    result.dataset.tone = error ? "error" : "neutral";
    result.setAttribute("role", error ? "alert" : "status");
  }

  function snapshot(): EditorDraft {
    if (!base) throw new Error("No profile is selected");
    const values: Record<string, string | boolean> = {};
    for (const input of Array.from(form.elements)) {
      if (!(input instanceof HTMLInputElement || input instanceof HTMLSelectElement || input instanceof HTMLTextAreaElement) || !input.name || input.type === "password") continue;
      if (input instanceof HTMLInputElement && input.type === "radio" && !input.checked) continue;
      values[input.name] = input instanceof HTMLInputElement && input.type === "checkbox" ? input.checked : input.value;
    }
    return { profileId: base.id, isNew, values, routingRules: structuredClone(rules) };
  }

  function persist() {
    if (!base || busy) return;
    const profileId = base.id;
    void saveEditorDraft(snapshot()).catch(() => {
      if (base?.id === profileId && !panel.hidden) showResult("Could not keep this draft. Save before closing the popup.");
    });
  }

  function updateVisibility() {
    const selectedKind = kind();
    query("#fixed-section").hidden = selectedKind === "pac";
    query("#routing-section").hidden = selectedKind !== "rules";
    query("#pac-section").hidden = selectedKind !== "pac";
    query("#bypass-section").hidden = selectedKind === "pac";
    query("#single-endpoint").hidden = selectedKind === "fixed" && checked("perProtocol");
    query("#protocol-endpoints").hidden = selectedKind !== "fixed" || !checked("perProtocol");
    control("perProtocol").closest<HTMLElement>("label")!.hidden = selectedKind !== "fixed" || base?.endpointMode !== "perProtocol";
    query("#auth-fields").hidden = !checked("authEnabled");
    control("pacSource").closest<HTMLElement>("label")!.hidden = base?.kind !== "pac" || base?.pac.source !== "inline";
    query("#pac-value-label").textContent = value("pacSource") === "url" ? "PAC URL" : "PAC script";
    (control("pacValue") as HTMLTextAreaElement).rows = value("pacSource") === "url" ? 2 : 7;
    query("#routing-kind").hidden = base?.kind !== "rules";
    form.querySelector('input[name="kind"][value="pac"] + span')!.textContent = base?.kind === "pac" && base.pac.source === "inline" ? "PAC" : "PAC URL";
    query("#profile-tools").hidden = isNew;
    query("#connection-test-section").hidden = isNew || getState().activeProfileId !== base?.id;
    saveButton.textContent = !isNew && getState().activeProfileId === base?.id ? "Save & reapply" : "Save";
  }

  function renderRules() {
    query("#rule-list").replaceChildren(...rules.map((rule, index) => el("div", { className: "rule-row" },
      el("span", { className: "rule-index", text: String(index + 1).padStart(2, "0") }),
      el("input", { value: rule.pattern, placeholder: "*.staging.example.com", "aria-label": `Rule ${index + 1} pattern`,
        oninput: ((event: Event) => { rules[index].pattern = (event.target as HTMLInputElement).value; persist(); }) as EventListener }),
      el("select", { "aria-label": `Rule ${index + 1} action`,
        onchange: ((event: Event) => { rules[index].action = (event.target as HTMLSelectElement).value as RoutingRule["action"]; persist(); }) as EventListener },
        el("option", { value: "proxy", text: "USE PROXY", selected: rule.action === "proxy" ? "selected" : null }),
        el("option", { value: "direct", text: "DIRECT", selected: rule.action === "direct" ? "selected" : null })),
      el("button", { type: "button", className: "rule-delete", "aria-label": `Delete rule ${index + 1}`, text: "×", onclick: () => { rules.splice(index, 1); renderRules(); persist(); } }),
    )));
  }

  function populate(profile: StoredProfile, restore?: EditorDraft) {
    base = structuredClone(profile);
    form.reset();
    for (const details of form.querySelectorAll("details")) details.open = false;
    control("name").value = profile.name;
    form.querySelector<HTMLInputElement>(`input[name="kind"][value="${profile.kind}"]`)!.checked = true;
    (control("perProtocol") as HTMLInputElement).checked = profile.endpointMode === "perProtocol";
    for (const key of endpointKeys) {
      const endpoint = profile.endpoints[key];
      control(`${key}Scheme`).value = endpoint?.scheme || (key === "fallback" ? "socks5" : "http");
      control(`${key}Host`).value = endpoint?.host || "";
      control(`${key}Port`).value = endpoint ? String(endpoint.port) : "";
    }
    control("defaultAction").value = profile.defaultAction;
    control("pacSource").value = profile.kind === "pac" ? profile.pac.source : "url";
    control("pacValue").value = profile.pac.value;
    (control("pacMandatory") as HTMLInputElement).checked = profile.pac.mandatory;
    control("bypassList").value = profile.bypassList.join("\n");
    (control("authEnabled") as HTMLInputElement).checked = profile.auth.enabled;
    control("username").value = profile.auth.username;
    control("authHosts").value = profile.auth.allowedHosts.join("\n");
    control("diagnosticUrl").value = profile.diagnosticUrl;
    rules = structuredClone(profile.routingRules);
    if (restore) {
      for (const [name, saved] of Object.entries(restore.values)) {
        if (name === "kind") {
          const radio = form.querySelector<HTMLInputElement>(`input[name="kind"][value="${CSS.escape(String(saved))}"]`);
          if (radio) radio.checked = true;
        } else {
          const input = form.elements.namedItem(name);
          if (input instanceof HTMLInputElement && input.type === "checkbox") input.checked = Boolean(saved);
          else if (input instanceof HTMLInputElement || input instanceof HTMLSelectElement || input instanceof HTMLTextAreaElement) input.value = String(saved);
        }
      }
      rules = structuredClone(restore.routingRules);
    }
    control("password").value = "";
    (control("password") as HTMLInputElement).placeholder = profile.auth.passwordReady ? "Leave blank to keep" : "Password";
    query("#credential-state").textContent = profile.auth.passwordReady ? "Session password ready" : "No session password";
    query<HTMLDetailsElement>("#authentication-section").open = checked("authEnabled");
    query("#diagnostic-result").hidden = true;
    query("#delete-choice").hidden = true;
    title.textContent = isNew ? "New profile" : "Edit profile";
    showResult("");
    renderRules();
    updateVisibility();
  }

  function readEndpoint(key: typeof endpointKeys[number]): ProxyEndpoint {
    return { scheme: value(`${key}Scheme`) as ProxyEndpoint["scheme"], host: value(`${key}Host`).trim(), port: Number(value(`${key}Port`)) };
  }
  function collect(): ProxyProfile {
    if (!base) throw new Error("No profile is selected");
    return {
      ...structuredClone(base), name: value("name"), kind: kind(), endpointMode: checked("perProtocol") ? "perProtocol" : "single",
      endpoints: Object.fromEntries(endpointKeys.map((key) => [key, readEndpoint(key)])),
      bypassList: value("bypassList").split(/\r?\n/).map((entry) => entry.trim()).filter(Boolean),
      routingRules: structuredClone(rules), defaultAction: value("defaultAction") as ProxyProfile["defaultAction"],
      pac: { source: value("pacSource") as ProxyProfile["pac"]["source"], value: value("pacValue"), mandatory: checked("pacMandatory") },
      auth: { enabled: checked("authEnabled"), username: value("username"), allowedHosts: value("authHosts").split(/\r?\n/).map((entry) => entry.trim()).filter(Boolean) },
      diagnosticUrl: value("diagnosticUrl"),
    };
  }

  async function run(action: () => Promise<void>) {
    if (busy) return;
    busy = true;
    form.inert = true;
    query<HTMLButtonElement>("#close-editor").disabled = true;
    showResult("");
    try { await action(); }
    catch (error) { showResult(localizeError(error)); }
    finally {
      busy = false;
      form.inert = false;
      query<HTMLButtonElement>("#close-editor").disabled = false;
      if (!result.hidden && !panel.hidden) { result.scrollIntoView({ block: "nearest" }); result.focus(); }
    }
  }

  async function save() {
    const profile = collect();
    const response = await sendMessage("SAVE_PROFILE", { profile, password: value("password") });
    setState(response.state);
    isNew = false;
    const saved = response.state.profiles.find((item) => item.id === profile.id)!;
    populate(saved);
    await clearEditorDraft();
    return saved;
  }

  async function cancel() {
    await clearEditorDraft();
    control("password").value = "";
    const id = base?.id;
    base = null;
    showHome(id);
  }

  form.addEventListener("input", () => { showResult(""); persist(); });
  form.addEventListener("change", () => { updateVisibility(); persist(); });
  form.addEventListener("submit", (event) => { event.preventDefault(); void run(async () => { const saved = await save(); showHome(saved.id); }); });
  query("#close-editor").setAttribute("aria-label", "Cancel editing");
  query("#close-editor").addEventListener("click", () => void run(cancel));
  query("#cancel-edit").addEventListener("click", () => void run(cancel));
  query("#add-rule").addEventListener("click", () => {
    rules.push({ id: crypto.randomUUID(), pattern: "", action: "proxy" });
    renderRules(); persist(); query<HTMLInputElement>("#rule-list .rule-row:last-child input").focus();
  });
  query("#run-diagnostic").addEventListener("click", () => void run(async () => {
    const saved = await save();
    const response = await sendMessage("DIAGNOSE", { profileId: saved.id });
    const diagnostic = query("#diagnostic-result");
    query<HTMLDetailsElement>("#connection-test-section").open = true;
    diagnostic.hidden = false;
    diagnostic.setAttribute("role", response.result.ok ? "status" : "alert");
    diagnostic.textContent = response.result.reachable ? `HTTP ${response.result.status} · ${response.result.latencyMs} ms` : response.result.error || "Connection test failed";
    diagnostic.scrollIntoView({ block: "nearest" });
  }));
  query("#duplicate-profile").setAttribute("title", "Duplicate the saved profile");
  query("#duplicate-profile").addEventListener("click", () => void run(async () => {
    if (!base) return;
    const response = await sendMessage("DUPLICATE_PROFILE", { profileId: base.id });
    setState(response.state);
    await clearEditorDraft();
    const copy = response.state.profiles.find((item) => item.id === response.state.selectedProfileId)!;
    isNew = false; populate(copy); control("name").focus();
  }));
  query("#delete-profile").addEventListener("click", () => {
    query("#delete-choice").hidden = false;
    query("#delete-message").textContent = base?.id === getState().activeProfileId ? "Delete this profile and clear its active proxy setting?" : "Delete this profile?";
    query("#delete-confirm").focus();
  });
  query("#delete-cancel").addEventListener("click", () => { query("#delete-choice").hidden = true; query("#delete-profile").focus(); });
  query("#delete-confirm").addEventListener("click", () => void run(async () => {
    if (!base) return;
    const response = await sendMessage("DELETE_PROFILE", { profileId: base.id });
    setState(response.state); await cancel();
  }));

  return {
    async open(profile?: StoredProfile, restore?: EditorDraft) {
      isNew = !profile;
      const fresh = createProfile({ ...(restore ? { id: restore.profileId } : {}), name: "", endpoints: { single: { scheme: "http", host: "", port: 8080 } }, pac: { source: "url", value: "", mandatory: false } });
      populate(profile || { ...fresh, auth: { ...fresh.auth, passwordReady: false } }, restore);
      query("#home-view").hidden = true;
      panel.hidden = false;
      query(".editor-scroll").scrollTop = 0;
      control("name").focus();
    },
    async restore() {
      const draft = await loadEditorDraft();
      if (!draft) return;
      const profile = getState().profiles.find((item) => item.id === draft.profileId);
      if (!draft.isNew && !profile) { await clearEditorDraft(); return; }
      await this.open(profile, draft);
    },
  };
}
