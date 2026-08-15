import { el, endpointLabel, profileKindLabel, sendMessage } from "./extension-api.js";

const nodes = {
  statusDot: document.querySelector("#status-dot"),
  statusLabel: document.querySelector("#status-label"),
  activeName: document.querySelector("#active-name"),
  activeDetail: document.querySelector("#active-detail"),
  toggle: document.querySelector("#toggle-active"),
  test: document.querySelector("#test-active"),
  notice: document.querySelector("#status-notice"),
  list: document.querySelector("#profile-list"),
  count: document.querySelector("#profile-count"),
  toast: document.querySelector("#toast"),
};

let currentState = null;
let busy = false;

function showToast(message, tone = "neutral") {
  nodes.toast.textContent = message;
  nodes.toast.dataset.tone = tone;
  nodes.toast.hidden = false;
  setTimeout(() => { nodes.toast.hidden = true; }, 2600);
}

async function run(action) {
  if (busy) return;
  busy = true;
  document.body.dataset.busy = "true";
  try {
    const response = await action();
    if (response?.state) {
      currentState = response.state;
      render();
    }
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    busy = false;
    document.body.dataset.busy = "false";
    if (currentState) render();
  }
}

function statusMessage(status) {
  return {
    conflict: "Another extension currently has higher priority. Disable it before activating a temoto profile.",
    policy: "Chrome or an administrator policy controls this setting. temoto will not overwrite it.",
    changed: "Chrome's effective proxy no longer matches this profile. Reapply it or turn temoto off.",
    inactive: "The selected profile is saved but is not currently applied.",
    orphaned: "Chrome reports a temoto-controlled setting that is not linked to a saved profile.",
  }[status.code] || "";
}

function renderProfile(profile) {
  const active = profile.id === currentState.activeProfileId && currentState.status.code === "active";
  const button = el("button", {
    className: `popup-profile${active ? " is-active" : ""}`,
    type: "button",
    "aria-pressed": active,
    onclick: () => run(async () => {
      const response = await sendMessage("ACTIVATE_PROFILE", { profileId: profile.id });
      showToast(`${profile.name} is active`, "success");
      return response;
    }),
  },
  el("i", { className: "profile-color", style: `--profile-color:${profile.color}` }),
  el("span", { className: "profile-copy" },
    el("strong", { text: profile.name }),
    el("small", { text: endpointLabel(profile) }),
  ),
  el("span", { className: "profile-kind", text: active ? "ACTIVE" : profileKindLabel(profile) }),
  );
  return button;
}

function render() {
  const { status, profiles, activeProfileId } = currentState;
  const active = profiles.find((profile) => profile.id === activeProfileId);
  nodes.statusDot.dataset.tone = status.tone;
  nodes.statusLabel.textContent = status.label;
  nodes.activeName.textContent = active?.name || "Chrome's default connection";
  nodes.activeDetail.textContent = active ? endpointLabel(active) : "temoto is not overriding your proxy settings.";
  nodes.toggle.disabled = busy;
  nodes.toggle.textContent = active ? "Turn off safely" : profiles.length ? "Select a profile below" : "Create a profile";
  nodes.toggle.classList.toggle("danger-soft", Boolean(active));
  nodes.toggle.onclick = active
    ? () => run(async () => { const response = await sendMessage("DEACTIVATE"); showToast("temoto control cleared", "success"); return response; })
    : () => sendMessage("OPEN_MANAGER").then(() => window.close());
  nodes.test.hidden = !active || status.code !== "active";
  nodes.test.onclick = () => run(async () => {
    const response = await sendMessage("DIAGNOSE", { profileId: active.id });
    showToast(response.result.reachable ? `${response.result.status} · ${response.result.latencyMs} ms` : response.result.error, response.result.ok ? "success" : "error");
  });
  const message = statusMessage(status);
  nodes.notice.hidden = !message;
  nodes.notice.textContent = message;
  nodes.notice.dataset.tone = status.tone;
  nodes.count.textContent = String(profiles.length);
  nodes.list.replaceChildren(...profiles.map(renderProfile));
  if (!profiles.length) nodes.list.append(el("button", { className: "empty-profile", type: "button", onclick: () => sendMessage("OPEN_MANAGER").then(() => window.close()) }, "Create your first proxy profile"));
}

const openManager = () => sendMessage("OPEN_MANAGER").then(() => window.close());
document.querySelector("#open-manager").addEventListener("click", openManager);
document.querySelector("#manage-footer").addEventListener("click", openManager);

run(async () => {
  const response = await sendMessage("GET_STATE");
  currentState = response.state;
  return response;
});
