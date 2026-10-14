import { useEffect, useId, useRef, useState } from "react";
import { GlobeSimple, PencilSimple, Plus, Power, Trash } from "@phosphor-icons/react";
import { isExtensionRuntime } from "./extension-api.ts";
import { activateProxyProfile, clearProxyDraft, deleteProxyProfile, getProxyState, loadProxyDraft, ProxyApiError, saveProxyDraft, saveProxyProfile, turnProxyOff } from "./proxy-api.ts";
import type { ProxyDraft, ProxyProfile, ProxyState } from "./proxy-api.ts";
import "./proxy.css";

function editorDraft(profile?: ProxyProfile): ProxyDraft {
  return { id: profile?.id || crypto.randomUUID(), isNew: !profile, name: profile?.name || "", kind: profile?.kind || "fixed", scheme: profile?.scheme || "http", host: profile?.host || "", port: profile ? String(profile.port) : "8080", pacUrl: profile?.pacUrl || "" };
}

function statusError(state: ProxyState | null): string {
  if (!state || state.status === "active" || state.status === "off") return "";
  return state.error || ({ conflict: "Another extension or Chrome policy controls proxy settings.", changed: "Chrome's proxy setting no longer matches this profile.", error: "Could not read proxy settings." }[state.status]);
}

export default function ProxyPanel() {
  const [state, setState] = useState<ProxyState | null>(null);
  const [draft, setDraft] = useState<ProxyDraft | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const [deleteChoice, setDeleteChoice] = useState(false);
  const [errorFocus, requestErrorFocus] = useState(0);
  const errorNode = useRef<HTMLParagraphElement>(null);
  const mounted = useRef(false);
  const locked = useRef(true);
  const refreshPending = useRef(false);
  const revision = useRef(0);
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const issue = error || statusError(state);

  function report(message: string, focus = false) {
    setError(message);
    if (focus) requestErrorFocus((value) => value + 1);
  }
  useEffect(() => {
    if (!errorFocus) return;
    errorNode.current?.focus({ preventScroll: true });
    errorNode.current?.scrollIntoView({ block: "nearest" });
  }, [errorFocus]);
  async function refresh() {
    const sequence = ++revision.current;
    try {
      const next = await getProxyState();
      if (mounted.current && sequence === revision.current) setState(next);
    } catch (failure) {
      if (mounted.current && sequence === revision.current) report(failure instanceof Error ? failure.message : "Could not read proxy settings.");
    }
  }

  useEffect(() => {
    mounted.current = true;
    locked.current = true;
    let disposed = false;
    const sequence = ++revision.current;
    void (async () => {
      const [stateResult, draftResult] = await Promise.allSettled([getProxyState(), loadProxyDraft()]);
      if (disposed) return;
      if (stateResult.status === "fulfilled") {
        setState(stateResult.value);
        if (draftResult.status === "fulfilled" && draftResult.value) {
          const saved = draftResult.value;
          const existing = stateResult.value.profiles.find((profile) => profile.id === saved.id);
          if (saved.isNew || existing) setDraft({ ...saved, isNew: !existing });
          else void clearProxyDraft().catch(() => {});
        }
      } else report(stateResult.reason instanceof Error ? stateResult.reason.message : "Could not read proxy settings.");
      if (draftResult.status === "rejected") report("Could not restore this draft.");
      if (sequence === revision.current) {
        locked.current = false;
        setBusy(false);
        if (refreshPending.current) { refreshPending.current = false; void refresh(); }
      }
    })();
    const onChange = () => {
      if (locked.current) refreshPending.current = true;
      else void refresh();
    };
    const event = isExtensionRuntime() ? chrome.proxy?.settings?.onChange : undefined;
    event?.addListener(onChange);
    return () => { disposed = true; mounted.current = false; revision.current++; event?.removeListener(onChange); };
  }, []);

  async function run(action: () => Promise<void>) {
    if (locked.current) return;
    locked.current = true;
    revision.current++;
    setBusy(true);
    report("");
    try { await action(); }
    catch (failure) {
      if (mounted.current) {
        if (failure instanceof ProxyApiError && failure.state) setState(failure.state);
        report(failure instanceof Error ? failure.message : "Could not update proxy settings.", Boolean(draft));
      }
    } finally {
      locked.current = false;
      if (mounted.current) {
        setBusy(false);
        if (refreshPending.current) { refreshPending.current = false; void refresh(); }
      }
    }
  }
  function openEditor(profile?: ProxyProfile) {
    if (locked.current) return;
    report(""); setDeleteChoice(false); setDraft(editorDraft(profile));
  }
  function update<Key extends keyof ProxyDraft>(key: Key, value: ProxyDraft[Key]) {
    if (!draft || locked.current) return;
    const next = { ...draft, [key]: value };
    setDraft(next); report(""); setDeleteChoice(false);
    void saveProxyDraft(next).catch(() => { if (mounted.current) report("Could not keep this draft. Save before closing."); });
  }
  async function cancel() { await clearProxyDraft(); if (mounted.current) { setDraft(null); setDeleteChoice(false); } }
  async function save() {
    if (!draft) return;
    const profile = { id: draft.id, name: draft.name, kind: draft.kind, scheme: draft.scheme, host: draft.host, port: Number(draft.port), pacUrl: draft.pacUrl };
    const next = await saveProxyProfile(profile);
    if (mounted.current) setState(next);
    try { await clearProxyDraft(); } catch { if (mounted.current) report("Profile saved, but its draft could not be cleared.", true); return; }
    if (mounted.current) { setDraft(null); setDeleteChoice(false); }
  }
  async function remove() {
    if (!draft) return;
    const next = await deleteProxyProfile(draft.id);
    if (mounted.current) setState(next);
    await cancel();
  }

  return <section className="tool-screen-body tool-detail-body proxy-panel" aria-busy={busy || undefined}>
    {issue && <p className="proxy-error" id={errorId} role="alert" tabIndex={-1} ref={errorNode}>{issue}</p>}
    {!state ? <button className="proxy-action" type="button" disabled={busy} onClick={() => void run(async () => { const next = await getProxyState(); if (mounted.current) setState(next); })}>{busy ? "Loading…" : "Retry"}</button> : draft ? <form className="proxy-editor" method="post" noValidate onSubmit={(event) => { event.preventDefault(); void run(save); }} aria-describedby={issue ? errorId : undefined}>
      <fieldset disabled={busy} className="proxy-fields">
        <label className="proxy-field" htmlFor={`${inputId}-name`}><span>Name</span><input id={`${inputId}-name`} name="name" value={draft.name} required maxLength={80} autoComplete="off" autoFocus onChange={(event) => update("name", event.target.value)} /></label>
        <div className="proxy-kind" role="group" aria-label="Connection type">
          <button type="button" aria-pressed={draft.kind === "fixed"} onClick={() => update("kind", "fixed")}>Fixed proxy</button><button type="button" aria-pressed={draft.kind === "pac"} onClick={() => update("kind", "pac")}>PAC URL</button>
        </div>
        {draft.kind === "fixed" ? <>
          <label className="proxy-field" htmlFor={`${inputId}-scheme`}><span>Type</span><select id={`${inputId}-scheme`} name="scheme" value={draft.scheme} onChange={(event) => update("scheme", event.target.value as ProxyProfile["scheme"])}>{["http", "https", "socks4", "socks5"].map((scheme) => <option key={scheme} value={scheme}>{scheme.toUpperCase()}</option>)}</select></label>
          <label className="proxy-field" htmlFor={`${inputId}-host`}><span>Host</span><input id={`${inputId}-host`} name="host" value={draft.host} required maxLength={253} autoCapitalize="none" spellCheck={false} autoComplete="off" onChange={(event) => update("host", event.target.value)} /></label>
          <label className="proxy-field" htmlFor={`${inputId}-port`}><span>Port</span><input id={`${inputId}-port`} name="port" type="number" required min={1} max={65535} inputMode="numeric" value={draft.port} onChange={(event) => update("port", event.target.value)} /></label>
        </> : <label className="proxy-field" htmlFor={`${inputId}-url`}><span>URL</span><input id={`${inputId}-url`} name="pacUrl" type="url" value={draft.pacUrl} required maxLength={2048} autoCapitalize="none" spellCheck={false} autoComplete="off" onChange={(event) => update("pacUrl", event.target.value)} /></label>}
      </fieldset>
      {!draft.isNew && <button className="proxy-delete" type="button" disabled={busy} onClick={() => setDeleteChoice(true)}><Trash size={18} aria-hidden="true" />Delete</button>}
      {deleteChoice && <div className="proxy-confirm"><p>{state.activeProfileId === draft.id ? "Delete this profile and turn it off?" : "Delete this profile?"}</p><div className="proxy-action-row"><button className="proxy-action" type="button" disabled={busy} onClick={() => void run(remove)}>Delete</button><button className="proxy-action" type="button" disabled={busy} onClick={() => setDeleteChoice(false)}>Keep</button></div></div>}
      <div className="proxy-action-row proxy-save-row"><button className="proxy-action" type="button" disabled={busy} onClick={() => void run(cancel)}>Cancel</button><button className="proxy-action" type="submit" disabled={busy}>{state.activeProfileId === draft.id ? "Save & reapply" : "Save"}</button></div>
    </form> : <>
      <button className="proxy-new" type="button" aria-label="New proxy profile" disabled={busy} onClick={() => openEditor()}><Plus size={18} aria-hidden="true" />New</button>
      <div className="proxy-connections" role="group" aria-label="Proxy connections">
        <button className={`proxy-select proxy-off${state.status === "off" ? " is-active" : ""}`} type="button" aria-pressed={state.status === "off"} disabled={busy} onClick={() => void run(async () => { const next = await turnProxyOff(); if (mounted.current) setState(next); })}><Power size={22} aria-hidden="true" /><strong>Off</strong></button>
        {state.profiles.map((profile) => {
          const active = state.status === "active" && state.activeProfileId === profile.id;
          return <div className={`proxy-profile-row${active ? " is-active" : ""}`} key={profile.id}>
            <button className="proxy-select" type="button" aria-pressed={active} disabled={busy} onClick={() => void run(async () => { const next = await activateProxyProfile(profile.id); if (mounted.current) setState(next); })}><GlobeSimple size={22} aria-hidden="true" /><span className="proxy-copy"><strong>{profile.name}</strong><small>{profile.kind === "pac" ? profile.pacUrl : `${profile.scheme.toUpperCase()} · ${profile.host}:${profile.port}`}</small></span></button>
            <div className="proxy-edit-cell"><button type="button" className="proxy-edit" aria-label={`Edit ${profile.name}`} disabled={busy} onClick={() => openEditor(profile)}><PencilSimple size={20} aria-hidden="true" /></button></div>
          </div>;
        })}
      </div>
    </>}
  </section>;
}
