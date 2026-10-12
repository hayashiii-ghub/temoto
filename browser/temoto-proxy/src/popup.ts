import { el, endpointLabel, profileKindLabel, sendMessage } from "./extension-api.js";
import type { ProxyProfile, ProxyStatus } from "./proxy-core.js";
import type { EffectiveState } from "./proxy-runtime.js";
import { localizeDocument, localizeError, t } from "./i18n.js";

localizeDocument();

function query<T extends Element = HTMLElement>(selector: string): T {
  const node = document.querySelector<T>(selector);
  if (!node) throw new Error(`Missing required element: ${selector}`);
  return node;
}

const nodes = {
  statusDot: query("#status-dot"),
  statusLabel: query("#status-label"),
  activeName: query("#active-name"),
  activeDetail: query("#active-detail"),
  scope: query("#scope-status"),
  actions: query("#popup-actions"),
  toggle: query<HTMLButtonElement>("#toggle-active"),
  test: query<HTMLButtonElement>("#test-active"),
  notice: query("#status-notice"),
  list: query("#profile-list"),
  count: query("#profile-count"),
  result: query("#action-result"),
};

let currentState: EffectiveState | null = null;
let busy = false;

function showResult(message: string, tone: "neutral" | "error" = "neutral"): void {
  nodes.result.textContent = message;
  nodes.result.dataset.tone = tone;
  nodes.result.setAttribute("role", tone === "error" ? "alert" : "status");
  nodes.result.hidden = !message;
}

async function run<T>(action: () => Promise<T>): Promise<void> {
  if (busy) return;
  busy = true;
  document.body.dataset.busy = "true";
  showResult("");
  try {
    const response = await action();
    if (response && typeof response === "object" && "state" in response && response.state) {
      currentState = response.state as EffectiveState;
      render();
    }
  } catch (error) {
    showResult(localizeError(error), "error");
  } finally {
    busy = false;
    document.body.dataset.busy = "false";
    if (currentState) render();
  }
}

function statusMessage(status: ProxyStatus): string {
  const messages: Partial<Record<ProxyStatus["code"], string>> = {
    conflict: t("Another extension currently has higher priority. Disable it before activating a temoto profile."),
    policy: t("Chrome or an administrator policy controls this setting. temoto will not overwrite it."),
    changed: t("Chrome's effective proxy no longer matches this profile. Reapply it or turn temoto off."),
    inactive: t("The selected profile is saved but is not currently applied."),
    orphaned: t("Chrome reports a temoto-controlled setting that is not linked to a saved profile."),
  };
  return messages[status.code] || "";
}

function renderProfile(profile: ProxyProfile): HTMLButtonElement {
  if (!currentState) throw new Error("Proxy state is not loaded");
  const active = profile.id === currentState.activeProfileId && currentState.status.code === "active";
  const button = el("button", {
    className: `popup-profile${active ? " is-active" : ""}`,
    type: "button",
    "aria-pressed": active,
    onclick: () => run(() => sendMessage("ACTIVATE_PROFILE", { profileId: profile.id })),
  },
  el("i", { className: "profile-color", style: `--profile-color:${profile.color}` }),
  el("span", { className: "profile-copy" },
    el("strong", { text: profile.name, title: profile.name }),
    el("small", { text: endpointLabel(profile), title: endpointLabel(profile) }),
  ),
  el("span", { className: "profile-kind", text: active ? t("ACTIVE") : profileKindLabel(profile) }),
  );
  return button;
}

function render(): void {
  if (!currentState) return;
  const snapshot = currentState;
  const { status, profiles, activeProfileId } = snapshot;
  const active = profiles.find((profile) => profile.id === activeProfileId);
  const clearable = Boolean(active) || status.code === "orphaned";
  nodes.statusDot.dataset.tone = status.tone;
  nodes.statusLabel.textContent = t(status.label);
  nodes.activeName.textContent = active?.name || "";
  nodes.activeName.setAttribute("title", active?.name || "");
  nodes.activeName.hidden = !active;
  nodes.activeDetail.textContent = active ? endpointLabel(active) : "";
  nodes.activeDetail.setAttribute("title", nodes.activeDetail.textContent || "");
  nodes.activeDetail.hidden = !active;
  nodes.scope.textContent = snapshot.incognitoEnabled ? "Regular + Incognito" : "Regular";
  nodes.actions.hidden = !clearable;
  nodes.toggle.disabled = busy;
  nodes.toggle.textContent = "Off";
  nodes.toggle.classList.toggle("danger-soft", clearable);
  nodes.toggle.onclick = clearable ? () => run(() => sendMessage("DEACTIVATE")) : null;
  nodes.test.hidden = !active || status.code !== "active";
  nodes.test.onclick = active ? () => run(async () => {
    const response = await sendMessage("DIAGNOSE", { profileId: active.id });
    showResult(response.result.reachable ? `HTTP ${response.result.status} · ${response.result.latencyMs} ms` : t(response.result.error || "Connection test failed"), response.result.ok ? "neutral" : "error");
  }) : null;
  const message = statusMessage(status);
  nodes.notice.hidden = !message;
  nodes.notice.textContent = message;
  nodes.notice.dataset.tone = status.tone;
  nodes.count.textContent = String(profiles.length);
  nodes.list.replaceChildren(...profiles.map(renderProfile));
  if (!profiles.length) nodes.list.append(el("button", { className: "empty-profile", type: "button", onclick: openManager }, "New profile"));
}

const openManager = () => run(async () => {
  await sendMessage("OPEN_MANAGER");
  window.close();
});
query("#open-manager").addEventListener("click", openManager);

run(async () => {
  const response = await sendMessage("GET_STATE");
  currentState = response.state;
  return response;
});
