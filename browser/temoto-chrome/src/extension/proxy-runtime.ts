import { normalizeProxyProfile, proxyConfigFingerprint, proxyProfileToConfig } from "./proxy-core.js";
import type { ProxyProfile, ProxyState, SimpleProxyConfig } from "./proxy-core.js";

interface StoredState {
  proxyProfiles: ProxyProfile[];
  proxyActiveProfileId: string | null;
  proxyActiveFingerprint: string | null;
}

interface ProxySetting {
  levelOfControl?: chrome.types.LevelOfControl;
  value?: chrome.proxy.ProxyConfig;
}

const defaults: StoredState = { proxyProfiles: [], proxyActiveProfileId: null, proxyActiveFingerprint: null };
const message = (error: unknown) => error instanceof Error ? error.message : "Proxy operation failed";

export function createProxyRuntime(chromeApi: typeof chrome) {
  let pending: Promise<void> = Promise.resolve();

  function serialize<T>(operation: () => Promise<T>): Promise<T> {
    const result = pending.then(operation);
    // Only pending work is kept in memory; settings and active identity live in Chrome storage.
    pending = result.then(() => {}, () => {});
    return result;
  }

  async function stored(): Promise<StoredState> {
    const raw = await chromeApi.storage.local.get({ ...defaults });
    if (!Array.isArray(raw.proxyProfiles) || raw.proxyProfiles.length > 100) throw new Error("Saved proxy profiles are invalid");
    const profiles = raw.proxyProfiles.map(normalizeProxyProfile);
    if (new Set(profiles.map((profile) => profile.id)).size !== profiles.length) throw new Error("Saved proxy profile IDs are duplicated");
    if (raw.proxyActiveProfileId !== null && typeof raw.proxyActiveProfileId !== "string") throw new Error("Saved proxy state is invalid");
    return {
      proxyProfiles: profiles,
      proxyActiveProfileId: raw.proxyActiveProfileId,
      proxyActiveFingerprint: typeof raw.proxyActiveFingerprint === "string" ? raw.proxyActiveFingerprint : null,
    };
  }

  const setting = async (): Promise<ProxySetting> => await chromeApi.proxy.settings.get({ incognito: false }) as ProxySetting;
  const persist = async (state: StoredState) => { await chromeApi.storage.local.set({ ...state }); };

  function assertControllable(current: ProxySetting): void {
    if (current.levelOfControl === "controlled_by_other_extensions") throw new Error("Another extension controls Chrome proxy settings");
    if (current.levelOfControl === "not_controllable") throw new Error("Chrome or an administrator policy controls proxy settings");
    if (current.levelOfControl !== "controllable_by_this_extension" && current.levelOfControl !== "controlled_by_this_extension") {
      throw new Error("Chrome proxy control status is unavailable");
    }
  }

  async function readState(): Promise<ProxyState> {
    const state = await stored();
    const result = { profiles: state.proxyProfiles, activeProfileId: state.proxyActiveProfileId };
    let effective: ProxySetting;
    try { effective = await setting(); }
    catch (error) { return { ...result, status: "error", error: message(error) }; }
    if (effective.levelOfControl === "controlled_by_other_extensions" || effective.levelOfControl === "not_controllable") {
      return { ...result, status: "conflict", error: effective.levelOfControl === "controlled_by_other_extensions"
        ? "Another extension controls Chrome proxy settings" : "Chrome or an administrator policy controls proxy settings" };
    }
    if (effective.levelOfControl !== "controlled_by_this_extension" && effective.levelOfControl !== "controllable_by_this_extension") {
      return { ...result, status: "error", error: "Chrome proxy control status is unavailable" };
    }
    if (!state.proxyActiveProfileId) {
      return effective.levelOfControl === "controlled_by_this_extension"
        ? { ...result, status: "changed", error: "Chrome has an unrecognized temoto proxy setting. Turn Proxy off to clear it." }
        : { ...result, status: "off" };
    }
    const exists = state.proxyProfiles.some((profile) => profile.id === state.proxyActiveProfileId);
    if (exists && effective.levelOfControl === "controlled_by_this_extension" && state.proxyActiveFingerprint
      && proxyConfigFingerprint(effective.value) === state.proxyActiveFingerprint) return { ...result, status: "active" };
    return { ...result, status: "changed", error: "Chrome's effective proxy no longer matches the saved active profile" };
  }

  async function restoreChrome(previous: ProxySetting): Promise<void> {
    if (previous.levelOfControl === "controlled_by_this_extension" && previous.value) {
      assertControllable(await setting());
      await chromeApi.proxy.settings.set({ value: previous.value, scope: "regular_only" });
      const restored = await setting();
      if (restored.levelOfControl !== "controlled_by_this_extension"
        || proxyConfigFingerprint(restored.value) !== proxyConfigFingerprint(previous.value)) throw new Error("Chrome did not restore the previous proxy setting");
    } else {
      // Clearing this extension's override preserves the OS, command line, and other extensions.
      await chromeApi.proxy.settings.clear({ scope: "regular_only" });
      if ((await setting()).levelOfControl === "controlled_by_this_extension") throw new Error("Chrome did not clear temoto's proxy setting");
    }
  }

  async function commitOnly(previous: StoredState, next: StoredState): Promise<ProxyState> {
    try { await persist(next); }
    catch (error) {
      try { await persist(previous); }
      catch (rollback) { throw new Error(`${message(error)}. Proxy data could not be restored: ${message(rollback)}`); }
      throw error;
    }
    return readState();
  }

  async function configure(previous: StoredState, next: StoredState, config: SimpleProxyConfig | null): Promise<ProxyState> {
    const before = await setting();
    if (config) assertControllable(before);
    try {
      if (config) await chromeApi.proxy.settings.set({ value: config, scope: "regular_only" });
      else await chromeApi.proxy.settings.clear({ scope: "regular_only" });
      const verified = await setting();
      if (config) {
        assertControllable(verified);
        if (verified.levelOfControl !== "controlled_by_this_extension"
          || proxyConfigFingerprint(verified.value) !== proxyConfigFingerprint(config)) throw new Error("Chrome did not apply the requested proxy setting");
        next.proxyActiveFingerprint = proxyConfigFingerprint(verified.value);
      } else if (verified.levelOfControl === "controlled_by_this_extension") {
        throw new Error("Chrome did not clear temoto's proxy setting");
      }
      await persist(next);
    } catch (error) {
      const rollback = await Promise.allSettled([restoreChrome(before), persist(previous)]);
      const failure = rollback.find((result) => result.status === "rejected");
      if (failure?.status === "rejected") throw new Error(`${message(error)}. Previous proxy state could not be restored: ${message(failure.reason)}`);
      throw error;
    }
    return readState();
  }

  async function save(raw: unknown): Promise<ProxyState> {
    const profile = normalizeProxyProfile(raw);
    const previous = await stored();
    const exists = previous.proxyProfiles.some((item) => item.id === profile.id);
    if (!exists && previous.proxyProfiles.length >= 100) throw new Error("Up to 100 proxy profiles can be saved");
    const profiles = exists ? previous.proxyProfiles.map((item) => item.id === profile.id ? profile : item) : [...previous.proxyProfiles, profile];
    const next = { ...previous, proxyProfiles: profiles };
    return previous.proxyActiveProfileId === profile.id
      ? configure(previous, next, proxyProfileToConfig(profile))
      : commitOnly(previous, next);
  }

  async function activate(rawId: unknown): Promise<ProxyState> {
    const previous = await stored();
    const profile = previous.proxyProfiles.find((item) => item.id === rawId);
    if (typeof rawId !== "string" || !profile) throw new Error("Proxy profile not found");
    return configure(previous, { ...previous, proxyActiveProfileId: profile.id }, proxyProfileToConfig(profile));
  }

  async function off(): Promise<ProxyState> {
    const previous = await stored();
    return configure(previous, { ...previous, proxyActiveProfileId: null, proxyActiveFingerprint: null }, null);
  }

  async function remove(rawId: unknown): Promise<ProxyState> {
    const previous = await stored();
    if (typeof rawId !== "string" || !previous.proxyProfiles.some((item) => item.id === rawId)) throw new Error("Proxy profile not found");
    const next = { ...previous, proxyProfiles: previous.proxyProfiles.filter((item) => item.id !== rawId) };
    return previous.proxyActiveProfileId === rawId
      ? configure(previous, { ...next, proxyActiveProfileId: null, proxyActiveFingerprint: null }, null)
      : commitOnly(previous, next);
  }

  return {
    getState: () => serialize(readState),
    saveProfile: (profile: unknown) => serialize(() => save(profile)),
    deleteProfile: (id: unknown) => serialize(() => remove(id)),
    activate: (id: unknown) => serialize(() => activate(id)),
    off: () => serialize(off),
  };
}
