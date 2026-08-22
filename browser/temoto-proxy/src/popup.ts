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
  toggle: query<HTMLButtonElement>("#toggle-active"),
  test: query<HTMLButtonElement>("#test-active"),
  notice: query("#status-notice"),
  list: query("#profile-list"),
  count: query("#profile-count"),
  toast: query("#toast"),
};

let currentState: EffectiveState | null = null;
let busy = false;

function showToast(message: string, tone = "neutral"): void {
  nodes.toast.textContent = message;
  nodes.toast.dataset.tone = tone;
  nodes.toast.hidden = false;
  setTimeout(() => { nodes.toast.hidden = true; }, 2600);
}

async function run<T>(action: () => Promise<T>): Promise<void> {
  if (busy) return;
  busy = true;
  document.body.dataset.busy = "true";
  try {
    const response = await action();
    if (response && typeof response === "object" && "state" in response && response.state) {
      currentState = response.state as EffectiveState;
      render();
    }
  } catch (error) {
    showToast(localizeError(error), "error");
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
    onclick: () => run(async () => {
      const response = await sendMessage("ACTIVATE_PROFILE", { profileId: profile.id });
      showToast(t("{name} is active", { name: profile.name }), "success");
      return response;
    }),
  },
  el("i", { className: "profile-color", style: `--profile-color:${profile.color}` }),
  el("span", { className: "profile-copy" },
    el("strong", { text: profile.name }),
    el("small", { text: endpointLabel(profile) }),
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
  nodes.statusDot.dataset.tone = status.tone;
  nodes.statusLabel.textContent = t(status.label);
  nodes.activeName.textContent = active?.name || t("Chrome's default connection");
  nodes.activeDetail.textContent = active ? endpointLabel(active) : t("temoto is not overriding your proxy settings.");
  nodes.toggle.disabled = busy;
  nodes.toggle.textContent = active ? t("Turn off safely") : profiles.length ? t("Select a profile below") : t("Create a profile");
  nodes.toggle.classList.toggle("danger-soft", Boolean(active));
  nodes.toggle.onclick = active
    ? () => run(async () => { const response = await sendMessage("DEACTIVATE"); showToast(t("temoto control cleared"), "success"); return response; })
    : () => sendMessage("OPEN_MANAGER").then(() => window.close());
  nodes.test.hidden = !active || status.code !== "active";
  nodes.test.onclick = active ? () => run(async () => {
    const response = await sendMessage("DIAGNOSE", { profileId: active.id });
    showToast(response.result.reachable ? `${response.result.status} · ${response.result.latencyMs} ms` : t(response.result.error || "Connection test failed"), response.result.ok ? "success" : "error");
  }) : null;
  const message = statusMessage(status);
  nodes.notice.hidden = !message;
  nodes.notice.textContent = message;
  nodes.notice.dataset.tone = status.tone;
  nodes.count.textContent = String(profiles.length);
  nodes.list.replaceChildren(...profiles.map(renderProfile));
  if (!profiles.length) nodes.list.append(el("button", { className: "empty-profile", type: "button", onclick: () => sendMessage("OPEN_MANAGER").then(() => window.close()) }, t("Create your first proxy profile")));
}

const openManager = () => sendMessage("OPEN_MANAGER").then(() => window.close());
query("#open-manager").addEventListener("click", openManager);
query("#manage-footer").addEventListener("click", openManager);

run(async () => {
  const response = await sendMessage("GET_STATE");
  currentState = response.state;
  return response;
});
