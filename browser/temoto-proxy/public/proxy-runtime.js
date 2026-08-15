import {
  configFingerprint,
  createExportBundle,
  createProfile,
  normalizeProfile,
  parseImportBundle,
  profileToProxyConfig,
  statusFromEffectiveState,
} from "./proxy-core.js";

export const LOCAL_DEFAULTS = {
  profiles: [],
  activeProfileId: null,
  activeFingerprint: null,
  incognitoEnabled: false,
  incognitoSessionOnly: true,
  selectedProfileId: null,
};

const SESSION_DEFAULTS = { proxyCredentials: {} };

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error || "Unknown error");
}

function assertControllable(setting) {
  const level = setting?.levelOfControl;
  if (level === "controlled_by_other_extensions") throw new Error("Proxy settings are controlled by another extension");
  if (level === "not_controllable") throw new Error("Proxy settings are controlled by Chrome or an administrator policy");
}

export function createProxyRuntime(chromeApi, fetchImpl = globalThis.fetch, now = () => Date.now()) {
  const local = () => chromeApi.storage.local.get(LOCAL_DEFAULTS);
  const session = () => chromeApi.storage.session.get(SESSION_DEFAULTS);
  const profileFor = (state, id) => state.profiles.find((profile) => profile.id === id);

  async function incognitoAllowed() {
    return Boolean(await chromeApi.extension.isAllowedIncognitoAccess());
  }

  async function effectiveState() {
    const state = await local();
    const regular = await chromeApi.proxy.settings.get({ incognito: false });
    const allowed = await incognitoAllowed();
    const incognito = allowed ? await chromeApi.proxy.settings.get({ incognito: true }) : null;
    const credentials = await session();
    const profiles = state.profiles.map((profile) => ({
      ...profile,
      auth: {
        ...profile.auth,
        passwordReady: Boolean(credentials.proxyCredentials?.[profile.id]?.password),
      },
    }));
    const status = statusFromEffectiveState({
      activeProfileId: state.activeProfileId,
      expectedFingerprint: state.activeFingerprint,
      regular,
    });
    return { ...state, profiles, regular, incognito, incognitoAllowed: allowed, status };
  }

  async function restoreIncognito(setting, sessionOnly) {
    const scope = sessionOnly ? "incognito_session_only" : "incognito_persistent";
    const alternateScope = sessionOnly ? "incognito_persistent" : "incognito_session_only";
    if (setting?.levelOfControl === "controlled_by_this_extension" && setting.value) {
      await chromeApi.proxy.settings.set({ value: setting.value, scope });
      await chromeApi.proxy.settings.clear({ scope: alternateScope });
      return;
    }
    await Promise.allSettled([
      chromeApi.proxy.settings.clear({ scope: "incognito_session_only" }),
      chromeApi.proxy.settings.clear({ scope: "incognito_persistent" }),
    ]);
  }

  async function clearIncognito() {
    const results = await Promise.allSettled([
      chromeApi.proxy.settings.clear({ scope: "incognito_session_only" }),
      chromeApi.proxy.settings.clear({ scope: "incognito_persistent" }),
    ]);
    const effective = await chromeApi.proxy.settings.get({ incognito: true });
    if (effective.levelOfControl === "controlled_by_this_extension") {
      const rejected = results.find((result) => result.status === "rejected");
      throw new Error(rejected ? `Chrome could not clear the incognito proxy setting: ${errorMessage(rejected.reason)}` : "Chrome did not clear the incognito proxy setting");
    }
    return effective;
  }

  async function applyIncognito(config, state, previousSessionOnly = state.incognitoSessionOnly) {
    if (!state.incognitoEnabled) return { applied: false };
    if (!(await incognitoAllowed())) throw new Error("Enable temoto Proxy in Chrome's incognito extension settings first");
    const scope = state.incognitoSessionOnly ? "incognito_session_only" : "incognito_persistent";
    const previousScope = previousSessionOnly ? "incognito_session_only" : "incognito_persistent";
    const alternateScope = state.incognitoSessionOnly ? "incognito_persistent" : "incognito_session_only";
    const current = await chromeApi.proxy.settings.get({ incognito: true });
    assertControllable(current);
    try {
      await chromeApi.proxy.settings.set({ value: config, scope });
      const verified = await chromeApi.proxy.settings.get({ incognito: true });
      if (verified.levelOfControl !== "controlled_by_this_extension") throw new Error("Chrome did not apply the incognito proxy setting");
      if (alternateScope !== scope) await chromeApi.proxy.settings.clear({ scope: alternateScope });
    } catch (error) {
      if (current.levelOfControl === "controlled_by_this_extension" && current.value) {
        await chromeApi.proxy.settings.set({ value: current.value, scope: previousScope }).catch(() => {});
      } else {
        await chromeApi.proxy.settings.clear({ scope }).catch(() => {});
      }
      throw error;
    }
    return { applied: true, scope };
  }

  async function activate(profileId) {
    const state = await local();
    const profile = profileFor(state, profileId);
    if (!profile) throw new Error("Profile not found");
    const normalized = normalizeProfile(profile);
    const config = profileToProxyConfig(normalized);
    const current = await chromeApi.proxy.settings.get({ incognito: false });
    assertControllable(current);
    let currentIncognito = null;
    if (state.incognitoEnabled) {
      if (!(await incognitoAllowed())) throw new Error("Enable temoto Proxy in Chrome's incognito extension settings first");
      currentIncognito = await chromeApi.proxy.settings.get({ incognito: true });
    }
    try {
      await chromeApi.proxy.settings.set({ value: config, scope: "regular_only" });
      const verified = await chromeApi.proxy.settings.get({ incognito: false });
      if (verified.levelOfControl !== "controlled_by_this_extension") throw new Error("Chrome did not apply the proxy setting");
      await applyIncognito(config, state);
      const fingerprint = configFingerprint(verified.value);
      await chromeApi.storage.local.set({ activeProfileId: profileId, activeFingerprint: fingerprint, selectedProfileId: profileId });
    } catch (error) {
      if (currentIncognito) await restoreIncognito(currentIncognito, state.incognitoSessionOnly).catch(() => {});
      if (current.levelOfControl === "controlled_by_this_extension" && current.value) {
        await chromeApi.proxy.settings.set({ value: current.value, scope: "regular_only" }).catch(() => {});
      } else {
        await chromeApi.proxy.settings.clear({ scope: "regular_only" }).catch(() => {});
      }
      throw error;
    }
    return effectiveState();
  }

  async function deactivate() {
    const state = await local();
    const previousRegular = await chromeApi.proxy.settings.get({ incognito: false });
    const allowed = await incognitoAllowed();
    const previousIncognito = allowed ? await chromeApi.proxy.settings.get({ incognito: true }) : null;
    try {
      await chromeApi.proxy.settings.clear({ scope: "regular_only" });
      const regular = await chromeApi.proxy.settings.get({ incognito: false });
      if (regular.levelOfControl === "controlled_by_this_extension") throw new Error("Chrome did not clear the regular proxy setting");
      if (allowed) await clearIncognito();
    } catch (error) {
      if (previousRegular.levelOfControl === "controlled_by_this_extension" && previousRegular.value) {
        await chromeApi.proxy.settings.set({ value: previousRegular.value, scope: "regular_only" }).catch(() => {});
      }
      if (previousIncognito) await restoreIncognito(previousIncognito, state.incognitoSessionOnly).catch(() => {});
      throw error;
    }
    await chromeApi.storage.local.set({ activeProfileId: null, activeFingerprint: null, incognitoEnabled: false });
    return effectiveState();
  }

  async function saveProfile(rawProfile, password = "") {
    const profile = normalizeProfile(rawProfile);
    const state = await local();
    const exists = profileFor(state, profile.id);
    const profiles = exists
      ? state.profiles.map((item) => item.id === profile.id ? profile : item)
      : [...state.profiles, profile];
    if (state.activeProfileId === profile.id) {
      const oldProfiles = state.profiles;
      await chromeApi.storage.local.set({ profiles, selectedProfileId: profile.id });
      try {
        await activate(profile.id);
      } catch (error) {
        await chromeApi.storage.local.set({ profiles: oldProfiles });
        throw error;
      }
    } else {
      await chromeApi.storage.local.set({ profiles, selectedProfileId: profile.id });
    }
    if (profile.auth.enabled && password) await setCredentials(profile.id, profile.auth.username, password);
    if (!profile.auth.enabled) await clearCredentials(profile.id);
    return effectiveState();
  }

  async function deleteProfile(profileId) {
    const state = await local();
    if (!profileFor(state, profileId)) return effectiveState();
    if (state.activeProfileId === profileId) await deactivate();
    const profiles = state.profiles.filter((profile) => profile.id !== profileId);
    await chromeApi.storage.local.set({ profiles, selectedProfileId: profiles[0]?.id || null });
    await clearCredentials(profileId);
    return effectiveState();
  }

  async function duplicateProfile(profileId) {
    const state = await local();
    const source = profileFor(state, profileId);
    if (!source) throw new Error("Profile not found");
    const copy = createProfile({ ...structuredClone(source), id: crypto.randomUUID(), name: `${source.name} copy` });
    await chromeApi.storage.local.set({ profiles: [...state.profiles, copy], selectedProfileId: copy.id });
    return effectiveState();
  }

  async function setCredentials(profileId, username, password) {
    const state = await local();
    const profile = profileFor(state, profileId);
    if (!profile?.auth?.enabled) throw new Error("Authentication is not enabled for this profile");
    if (typeof password !== "string" || !password) throw new Error("A session password is required");
    if (password.length > 4096) throw new Error("Session password is too long");
    const stored = await session();
    await chromeApi.storage.session.set({
      proxyCredentials: {
        ...stored.proxyCredentials,
        [profileId]: { username: String(username || profile.auth.username || ""), password },
      },
    });
    return effectiveState();
  }

  async function clearCredentials(profileId) {
    const stored = await session();
    const next = { ...stored.proxyCredentials };
    delete next[profileId];
    await chromeApi.storage.session.set({ proxyCredentials: next });
  }

  async function setIncognito(enabled, sessionOnly = true) {
    const state = await local();
    if (enabled && !(await incognitoAllowed())) throw new Error("Enable temoto Proxy in Chrome's incognito extension settings first");
    if (!enabled) {
      await clearIncognito();
      await chromeApi.storage.local.set({ incognitoEnabled: false, incognitoSessionOnly: Boolean(sessionOnly) });
      return effectiveState();
    }
    const nextState = { ...state, incognitoEnabled: true, incognitoSessionOnly: Boolean(sessionOnly) };
    if (state.activeProfileId) {
      const profile = profileFor(state, state.activeProfileId);
      const previous = await chromeApi.proxy.settings.get({ incognito: true });
      try {
        await applyIncognito(profileToProxyConfig(profile), nextState, state.incognitoSessionOnly);
        await chromeApi.storage.local.set({ incognitoEnabled: true, incognitoSessionOnly: Boolean(sessionOnly) });
      } catch (error) {
        await restoreIncognito(previous, state.incognitoSessionOnly).catch(() => {});
        throw error;
      }
      return effectiveState();
    }
    await chromeApi.storage.local.set({ incognitoEnabled: true, incognitoSessionOnly: Boolean(sessionOnly) });
    return effectiveState();
  }

  async function diagnose(profileId) {
    const state = await local();
    if (state.activeProfileId !== profileId) throw new Error("Activate this profile before running a connection test");
    const storedProfile = profileFor(state, profileId);
    if (!storedProfile) throw new Error("Profile not found");
    const profile = normalizeProfile(storedProfile);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const startedAt = now();
    try {
      const response = await fetchImpl(profile.diagnosticUrl, {
        method: "HEAD",
        cache: "no-store",
        credentials: "omit",
        redirect: "manual",
        signal: controller.signal,
      });
      return { ok: response.ok, reachable: true, status: response.status, statusText: response.statusText, latencyMs: Math.max(0, now() - startedAt), url: response.url || profile.diagnosticUrl };
    } catch (error) {
      return { ok: false, reachable: false, latencyMs: Math.max(0, now() - startedAt), error: error.name === "AbortError" ? "Connection test timed out after 10 seconds" : errorMessage(error), url: profile.diagnosticUrl };
    } finally {
      clearTimeout(timeout);
    }
  }

  async function exportProfiles() {
    const state = await local();
    return JSON.stringify(createExportBundle(state.profiles), null, 2);
  }

  async function importProfiles(input, mode = "merge") {
    const incoming = parseImportBundle(input);
    const state = await local();
    if (mode === "replace" && state.activeProfileId) await deactivate();
    let profiles;
    if (mode === "replace") {
      await chromeApi.storage.session.set({ proxyCredentials: {} });
      profiles = incoming;
    } else {
      const ids = new Set(state.profiles.map((profile) => profile.id));
      profiles = [...state.profiles, ...incoming.map((profile) => {
        if (!ids.has(profile.id)) {
          ids.add(profile.id);
          return profile;
        }
        const copy = { ...profile, id: crypto.randomUUID(), name: `${profile.name} imported` };
        ids.add(copy.id);
        return copy;
      })];
    }
    await chromeApi.storage.local.set({ profiles, selectedProfileId: profiles[0]?.id || null });
    return effectiveState();
  }

  async function selectProfile(profileId) {
    const state = await local();
    if (profileId && !profileFor(state, profileId)) throw new Error("Profile not found");
    await chromeApi.storage.local.set({ selectedProfileId: profileId || null });
    return effectiveState();
  }

  return {
    activate,
    clearCredentials,
    deactivate,
    deleteProfile,
    diagnose,
    duplicateProfile,
    effectiveState,
    exportProfiles,
    importProfiles,
    local,
    saveProfile,
    selectProfile,
    setCredentials,
    setIncognito,
  };
}
