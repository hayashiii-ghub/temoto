import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, MouseEventHandler, ReactNode } from "react";
import {
  ArrowLeft,
  ArrowCounterClockwise,
  ArrowSquareOut,
  ArrowsLeftRight,
  ArrowsOutLineVertical,
  BoundingBox,
  Camera,
  CaretDown,
  CaretRight,
  CaretUp,
  Check,
  Copy,
  DownloadSimple,
  EyedropperSample,
  LockSimple,
  Play,
  Power,
  Ruler,
  Selection,
  ShieldCheck,
  SlidersHorizontal,
  Speedometer,
  Trash,
  X,
} from "@phosphor-icons/react";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import {
  captureFullPage,
  captureRegion,
  captureVisible,
  detectPage,
  getSettings,
  isExtensionRuntime,
  openSidePanel,
  pickColor,
  resetOrigin,
  saveSettings,
  setVideoSpeed,
  startMeasure,
  switchEnvironment,
} from "./extension-api.ts";
import type {
  ExtensionSettings,
  PageInfo,
  ProjectSettings,
  ScreenshotOptions,
} from "./extension-api.ts";
import { planFullPageFrames } from "./capture-plan.ts";
import { isPageToolAvailable, isValidHttpOrigin } from "./url-utils.ts";
import {
  clampPlaybackSpeed,
  speedFromShortcut,
  SPEED_PRESETS,
  speedToSliderPosition,
  sliderPositionToSpeed,
} from "./video-speed.ts";
import {
  getProxyCompanion,
  runProxyCompanionAction,
  TEMOTO_PROXY_INSTALL_URL,
} from "./proxy-companion.ts";
import type {
  ProxyCompanionAction,
  ProxyCompanionConnection,
} from "./proxy-companion.ts";

const TOOL_DEFINITIONS = {
  color: { title: "Color Picker", icon: EyedropperSample },
  screenshot: { title: "Screenshot", icon: Selection },
  speed: { title: "Video Speed", icon: Speedometer },
  environment: { title: "Environments", icon: ArrowsLeftRight },
  reset: { title: "Site Reset", icon: ArrowCounterClockwise },
  inspect: { title: "Inspect", icon: BoundingBox },
} satisfies Record<string, { title: string; icon: PhosphorIcon }>;

type ToolId = keyof typeof TOOL_DEFINITIONS;
type CaptureKind = "region" | "visible" | "full";
type EnvironmentKey = "local" | "staging" | "production";

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function Brand({ descriptor }: { descriptor?: string }) {
  return (
    <div className="brand-lockup">
      <div className="brand-name">
        <span>temoto</span>
        {descriptor
          ? <span className="brand-context"> {descriptor}</span>
          : <><span className="brand-for"> for </span><span className="brand-chrome">Chrome</span></>}
      </div>
    </div>
  );
}

function IconButton({ label, children, onClick }: {
  label: string;
  children: ReactNode;
  onClick: MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <button className="icon-button" type="button" aria-label={label} title={label} onClick={onClick}>
      {children}
    </button>
  );
}

function StatusToast({ message }: { message: string }) {
  if (!message) return null;
  return <div className="status-toast" role="status">{message}</div>;
}

function LauncherCard({ icon: Icon, label, meta, onClick, danger = false, disabled = false }: {
  icon: PhosphorIcon;
  label: string;
  meta?: ReactNode;
  onClick: MouseEventHandler<HTMLButtonElement>;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button className={`launcher-card${danger ? " is-danger" : ""}`} type="button" onClick={onClick} disabled={disabled} title={disabled ? "Unavailable on this page" : undefined}>
      {meta && <span className="launcher-meta">{meta}</span>}
      <Icon size={42} weight="light" aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}

function ToolScreenHeader({ tool, onBack }: {
  tool: (typeof TOOL_DEFINITIONS)[ToolId];
  onBack: MouseEventHandler<HTMLButtonElement>;
}) {
  const Icon = tool.icon;
  return (
    <header className="tool-screen-header">
      <IconButton label="Back to tools" onClick={onBack}><ArrowLeft size={22} /></IconButton>
      <div className="tool-screen-identity">
        <Icon size={21} weight="light" aria-hidden="true" />
        <strong>{tool.title}</strong>
      </div>
    </header>
  );
}

function SpeedControl({ speed, onChange, disabled }: {
  speed: number;
  onChange: (speed: number) => void | Promise<void>;
  disabled: boolean;
}) {
  const update = (value: number) => onChange(clampPlaybackSpeed(value));
  return (
    <div className="speed-control">
      <div className="speed-value"><span>{speed}</span><small>×</small></div>
      <div className="speed-presets" role="group" aria-label="Playback speed presets">
        {SPEED_PRESETS.map((value) => (
          <button key={value} type="button" className={speed === value ? "is-active" : ""} onClick={() => update(value)} disabled={disabled}>
            {value}×
          </button>
        ))}
      </div>
      <div className="speed-slider-row">
        <button type="button" onClick={() => update(speed - 0.05)} disabled={disabled} aria-label="Decrease speed">−</button>
        <input type="range" min="0" max="1000" step="1" value={speedToSliderPosition(speed)} onChange={(event) => update(sliderPositionToSpeed(event.target.value))} disabled={disabled} aria-label="Playback speed" aria-valuetext={`${speed} times`} />
        <button type="button" onClick={() => update(speed + 0.05)} disabled={disabled} aria-label="Increase speed">＋</button>
      </div>
      <div className="speed-shortcuts" aria-label="Keyboard shortcuts">
        <span><kbd>S</kbd><small>−0.25</small></span>
        <span><kbd>G</kbd><small>1↔1.5×</small></span>
        <span><kbd>D</kbd><small>+0.25</small></span>
      </div>
    </div>
  );
}

function ScreenshotPanel({ onDone }: { onDone: (message: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [captureOptions, setCaptureOptions] = useState({ delayMs: 0, forceReveal: false });

  useEffect(() => {
    getSettings().then((settings) => {
      if (settings.screenshot) setCaptureOptions(settings.screenshot);
    }).catch((error) => onDone(error.message));
  }, [onDone]);

  const updateOption = <Key extends keyof ScreenshotOptions>(key: Key, value: ScreenshotOptions[Key]) => {
    const nextOptions = { ...captureOptions, [key]: value };
    setCaptureOptions(nextOptions);
    saveSettings({ screenshot: nextOptions }).catch((error) => onDone(error.message));
  };

  const run = async (kind: CaptureKind) => {
    setBusy(true);
    try {
      const result = kind === "region"
        ? await captureRegion(captureOptions)
        : kind === "full"
          ? await captureFullPage(captureOptions)
          : await captureVisible(captureOptions);
      if (!result?.ok) throw new Error(result?.error || "Could not capture this page");
      onDone(result?.preview ? "Capture starts in the installed extension" : "Capture started");
    } catch (error) {
      onDone(errorMessage(error, "Could not capture this page"));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="inline-panel screenshot-actions">
      <button className="primary-action" type="button" disabled={busy} onClick={() => run("region")}>
        <Ruler size={18} /> Select region
      </button>
      <button className="secondary-action" type="button" disabled={busy} onClick={() => run("visible")}>
        <Camera size={18} /> Visible area
      </button>
      <button className="secondary-action full-page-action" type="button" disabled={busy} onClick={() => run("full")}>
        <ArrowsOutLineVertical size={18} /> Full page
      </button>
      <p>Copy the result or save it as a PNG after capture.</p>
      <div className={`screenshot-options${optionsOpen ? " is-open" : ""}`}>
        <button className="screenshot-options-toggle" type="button" aria-expanded={optionsOpen} onClick={() => setOptionsOpen((open) => !open)}>
          <SlidersHorizontal size={15} weight="light" />
          <span>Capture options</span>
          <small>{captureOptions.delayMs ? `${captureOptions.delayMs / 1000}s delay` : "Automatic"}</small>
          {optionsOpen ? <CaretUp size={13} /> : <CaretDown size={13} />}
        </button>
        {optionsOpen && (
          <div className="screenshot-options-body">
            <label className="capture-option-row">
              <span><strong>Delay</strong><small>Wait before capture</small></span>
              <select value={captureOptions.delayMs} onChange={(event) => updateOption("delayMs", Number(event.target.value))}>
                <option value="0">None</option>
                <option value="1000">1 sec</option>
                <option value="3000">3 sec</option>
                <option value="5000">5 sec</option>
              </select>
            </label>
            <button className="capture-option-row capture-switch-row" type="button" role="switch" aria-checked={captureOptions.forceReveal} onClick={() => updateOption("forceReveal", !captureOptions.forceReveal)}>
              <span><strong>Force reveal</strong><small>Show scroll-reveal content</small></span>
              <i className={`capture-switch${captureOptions.forceReveal ? " is-on" : ""}`}><span /></i>
            </button>
            <p>Lazy content preload and animation freeze stay automatic.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function EnvironmentPanel({ page, project, onDone }: {
  page: PageInfo;
  project: ProjectSettings;
  onDone: (message: string) => void;
}) {
  const targets: Array<[string, string]> = [
    ["LOCAL", project.local],
    ["STAGING", project.staging],
    ["PRODUCTION", project.production],
  ];
  const currentUrl = page.url || page.origin;
  return (
    <div className="inline-panel environment-actions">
      <div className="environment-title"><span>{project.name}</span><small>Keep path, query and hash</small></div>
      <div className="environment-grid">
        {targets.map(([label, origin]) => (
          <button key={label} type="button" disabled={!isValidHttpOrigin(origin)} onClick={async () => {
            const result = await switchEnvironment(origin, currentUrl);
            if (result?.preview) onDone(`Switching to ${origin}`);
          }}>
            <span>{label}</span><small>{origin.replace(/^https?:\/\//, "")}</small>
          </button>
        ))}
      </div>
      <button className="text-action" type="button" onClick={openSidePanel}>Edit environments</button>
    </div>
  );
}

function PopupApp() {
  const [page, setPage] = useState<PageInfo>({ hostname: "Current page", origin: "", url: "", videoCount: 0, playbackRate: 1 });
  const [settings, setSettings] = useState<ExtensionSettings>({ project: { name: "Local project", local: "http://localhost:3000", staging: "https://staging.example.com", production: "https://example.com" }, lastColor: "#7C5CFC", lastSpeed: 1.5, screenshot: { delayMs: 0, forceReveal: false } });
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);
  const [speed, setSpeed] = useState(1.5);
  const [toast, setToast] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);

  useEffect(() => {
    Promise.allSettled([detectPage(), getSettings()]).then(([pageResult, settingsResult]) => {
      const nextPage = pageResult.status === "fulfilled" ? pageResult.value : null;
      const nextSettings = settingsResult.status === "fulfilled" ? settingsResult.value : null;
      if (nextPage) setPage(nextPage);
      if (nextSettings) setSettings(nextSettings);
      const initialSpeed = nextPage?.videoCount ? nextPage.playbackRate : nextSettings?.lastSpeed;
      setSpeed(initialSpeed || 1);
      const failure = pageResult.status === "rejected" ? pageResult.reason : settingsResult.status === "rejected" ? settingsResult.reason : null;
      if (failure) setToast(failure.message || "Could not initialize temoto");
    });
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const updateSpeed = async (value: number) => {
    setSpeed(value);
    setSettings((current) => ({ ...current, lastSpeed: value }));
    await saveSettings({ lastSpeed: value });
    const result = await setVideoSpeed(value);
    if (!result?.ok) setToast(result?.error || "Could not update playback speed");
  };

  useEffect(() => {
    if (activeTool !== "speed") return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (event.metaKey || event.ctrlKey || event.altKey || target?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target?.tagName || "")) return;
      const nextSpeed = speedFromShortcut(event.key, speed);
      if (nextSpeed === null) return;
      event.preventDefault();
      updateSpeed(nextSpeed);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeTool, speed]);

  const runPicker = async () => {
    try {
      const color = await pickColor();
      setSettings((current) => ({ ...current, lastColor: color }));
      setToast(`${color} copied`);
      await navigator.clipboard?.writeText(color);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setToast(errorMessage(error, "Could not pick a color"));
      }
    }
  };

  const runMeasure = async () => {
    const result = await startMeasure();
    setToast(result?.preview ? "Inspect mode active" : "Select an element on the page");
    if (!result?.preview) window.close();
  };

  const confirmReset = async () => {
    if (resetBusy) return;
    setResetBusy(true);
    try {
      const result = await resetOrigin(page.origin);
      setResetOpen(false);
      setToast(result?.ok ? `Cleared site data for ${page.hostname}` : result?.error || "Could not reset this site");
    } catch (error) {
      setToast(errorMessage(error, "Could not reset this site"));
    } finally {
      setResetBusy(false);
    }
  };

  const copyLastColor = async () => {
    await navigator.clipboard?.writeText(settings.lastColor);
    setToast(`${settings.lastColor} copied`);
  };

  const renderActiveTool = () => {
    if (activeTool === "color") {
      return (
        <section className="tool-screen-body tool-detail-body">
          <p className="tool-description">Pick any pixel from the current page and copy its color value.</p>
          <div className="color-readout">
            <i style={{ background: settings.lastColor }} />
            <strong>{settings.lastColor}</strong>
          </div>
          <div className="tool-primary-actions">
            <button className="primary-action" type="button" onClick={runPicker}><EyedropperSample size={18} /> Pick a color</button>
            <button className="secondary-action" type="button" onClick={copyLastColor}><Copy size={18} /> Copy value</button>
          </div>
        </section>
      );
    }
    if (activeTool === "screenshot") {
      return (
        <section className="tool-screen-body tool-detail-body screenshot-screen">
          <p className="tool-description">Capture a region, the visible area, or the full page.</p>
          <ScreenshotPanel onDone={setToast} />
        </section>
      );
    }
    if (activeTool === "speed") {
      return (
        <section className="tool-screen-body tool-detail-body speed-screen">
          <p className="tool-description">Set playback speed for videos on the current page.</p>
          {!page.videoCount && <p className="empty-note">No video found on this page. Your last speed is still saved.</p>}
          <SpeedControl speed={speed} onChange={updateSpeed} disabled={!page.videoCount && isExtensionRuntime()} />
        </section>
      );
    }
    if (activeTool === "environment") {
      return (
        <section className="tool-screen-body tool-detail-body environment-screen">
          <p className="tool-description">Move between project origins without losing the current path.</p>
          <EnvironmentPanel page={page} project={settings.project} onDone={setToast} />
        </section>
      );
    }
    if (activeTool === "reset") {
      return (
        <section className="tool-screen-body tool-detail-body danger-screen">
          <p className="tool-description">Clear cookies, local storage, cache, IndexedDB and service workers for {page.hostname}.</p>
          <button className="danger-primary" type="button" onClick={() => setResetOpen(true)}>Review and reset</button>
        </section>
      );
    }
    if (activeTool === "inspect") {
      return (
        <section className="tool-screen-body tool-detail-body">
          <p className="tool-description">Inspect size, spacing, type and color, then copy a stable CSS selector.</p>
          <button className="primary-action solo-action" type="button" onClick={runMeasure}><Ruler size={18} /> Start inspecting</button>
        </section>
      );
    }
    return null;
  };

  return (
    <main className="app-shell popup-shell">
      {activeTool ? (
        <>
          <ToolScreenHeader tool={TOOL_DEFINITIONS[activeTool]} onBack={() => setActiveTool(null)} />
          {renderActiveTool()}
        </>
      ) : (
        <>
          <header className="app-header launcher-header">
            <Brand />
            <IconButton label="Open settings" onClick={openSidePanel}><SlidersHorizontal size={22} weight="light" /></IconButton>
          </header>
          <section className="launcher-grid" aria-label="Developer tools">
            <LauncherCard icon={EyedropperSample} label="Color Picker" onClick={() => setActiveTool("color")} />
            <LauncherCard icon={Selection} label="Screenshot" onClick={() => setActiveTool("screenshot")} disabled={!isPageToolAvailable("screenshot", page)} />
            <LauncherCard icon={Speedometer} label="Video Speed" meta={isPageToolAvailable("speed", page) ? (page.videoCount ? `${speed}x` : "No video") : "Unavailable"} onClick={() => setActiveTool("speed")} disabled={!isPageToolAvailable("speed", page)} />
            <LauncherCard icon={ArrowsLeftRight} label="Environments" onClick={() => setActiveTool("environment")} disabled={!isPageToolAvailable("environment", page)} />
            <LauncherCard icon={ArrowCounterClockwise} label="Site Reset" onClick={() => setActiveTool("reset")} danger disabled={!isPageToolAvailable("reset", page)} />
            <LauncherCard icon={BoundingBox} label="Inspect" onClick={() => setActiveTool("inspect")} disabled={!isPageToolAvailable("inspect", page)} />
          </section>
        </>
      )}
      <StatusToast message={toast} />

      {resetOpen && (
        <div className="dialog-backdrop" role="presentation" onMouseDown={() => { if (!resetBusy) setResetOpen(false); }}>
          <div className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="reset-title" aria-busy={resetBusy} onMouseDown={(event) => event.stopPropagation()}>
            <div className="dialog-icon"><Trash size={22} /></div>
            <h2 id="reset-title">Reset {page.hostname}?</h2>
            <p>This clears cookies, local storage, cache, IndexedDB and service workers, then reloads the page.</p>
            <div className="dialog-actions">
              <button type="button" disabled={resetBusy} onClick={() => setResetOpen(false)}>Cancel</button>
              <button className="danger-button" type="button" disabled={resetBusy} onClick={confirmReset}>
                {resetBusy ? <><ArrowCounterClockwise className="reset-spinner" size={16} /> Resetting…</> : "Clear and reload"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function SidePanelApp() {
  const [project, setProject] = useState<ProjectSettings>({ name: "Local project", local: "http://localhost:3000", staging: "https://staging.example.com", production: "https://example.com" });
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<EnvironmentKey, string>>>({});

  useEffect(() => { getSettings().then((settings) => setProject(settings.project)); }, []);

  const update = (key: keyof ProjectSettings, value: string) => setProject((current) => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Partial<Record<EnvironmentKey, string>> = {};
    (["local", "staging", "production"] as const).forEach((key) => {
      if (!isValidHttpOrigin(project[key])) nextErrors[key] = "Enter an origin beginning with http(s)://";
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    await saveSettings({ project });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };

  return (
    <main className="app-shell sidepanel-shell">
      <header className="app-header"><Brand /><span className="panel-status"><i /> PROJECT SETTINGS</span></header>
      <div className="sidepanel-content">
        <section className="settings-intro">
          <p className="eyebrow">ENVIRONMENT SWITCHER</p>
          <h1>Switch origins. Keep your place.</h1>
          <p>Save Local, Staging and Production origins, then move between them without losing the current path, query or hash.</p>
        </section>
        <form className="settings-form" onSubmit={submit}>
          <label><span>PROJECT NAME</span><input value={project.name} onChange={(event) => update("name", event.target.value)} /></label>
          {([["local", "LOCAL"], ["staging", "STAGING"], ["production", "PRODUCTION"]] as const).map(([key, label]) => (
            <label key={key} className={errors[key] ? "has-error" : ""}>
              <span>{label}</span>
              <input value={project[key]} onChange={(event) => update(key, event.target.value)} spellCheck="false" />
              {errors[key] && <small>{errors[key]}</small>}
            </label>
          ))}
          <button className="save-button" type="submit">{saved ? <><Check size={18} /> Saved</> : "Save environments"}</button>
        </form>
        <ProxyCompanionSettings />
        <section className="settings-block compact">
          <div><strong>Privacy</strong><small>Video shortcuts run locally on HTTP(S) pages. Other tools access a page only when selected. Data is never sent outside the browser.</small></div>
          <LockSimple size={20} />
        </section>
      </div>
    </main>
  );
}

const PROXY_KIND_LABELS: Record<string, string> = {
  fixed: "Fixed proxy",
  rules: "Domain routing",
  pac: "PAC",
};

function ProxyCompanionSettings() {
  const [companion, setCompanion] = useState<ProxyCompanionConnection | { availability: "loading"; summary: null }>({ availability: "loading", summary: null });
  const [busyAction, setBusyAction] = useState("");
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const next = await getProxyCompanion();
    setCompanion(next);
    setError(next.availability === "error" ? "Update or reload temoto Proxy, then try again." : "");
  }, []);

  useEffect(() => {
    refresh();
    const refreshWhenVisible = () => { if (document.visibilityState === "visible") refresh(); };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [refresh]);

  const run = async (action: ProxyCompanionAction, payload: { profileId?: string } = {}) => {
    setBusyAction(action === "ACTIVATE_PROFILE" ? payload.profileId || action : action);
    setError("");
    try {
      const summary = await runProxyCompanionAction(action, payload);
      if (summary) {
        setCompanion((current) => ({
          availability: current.availability === "loading" ? "preview" : current.availability,
          summary,
        }));
      }
    } catch (nextError) {
      const message = errorMessage(nextError, "temoto Proxy could not complete the action.");
      setCompanion(await getProxyCompanion());
      setError(message);
    } finally {
      setBusyAction("");
    }
  };

  const availability = companion.availability;
  const summary = companion.summary;
  const active = summary?.profiles.find((profile) => profile.id === summary.activeProfileId);
  const statusCode = summary?.status?.code || availability;
  const installed = Boolean(summary) && (availability === "installed" || availability === "preview");

  return (
    <section className={`proxy-settings is-${statusCode}`} aria-busy={Boolean(busyAction)}>
      <div className="proxy-settings-header">
        <div>
          <strong>temoto Proxy</strong>
          <small>{summary ? (active ? `${active.name} is routing Chrome traffic.` : summary.status.label) : "Browser-wide proxy control stays in a separate companion."}</small>
        </div>
        <span className="proxy-state"><i />{summary ? summary.status.label : availability === "loading" ? "Checking" : availability === "error" ? "Unavailable" : "Not installed"}</span>
      </div>

      {availability === "missing" && (
        <button className="proxy-wide-action" type="button" onClick={() => window.open(TEMOTO_PROXY_INSTALL_URL, "_blank", "noopener,noreferrer")}>
          Install temoto Proxy <ArrowSquareOut size={15} />
        </button>
      )}

      {(availability === "loading" || availability === "error") && (
        <button className="proxy-wide-action" type="button" onClick={refresh} disabled={availability === "loading"}>
          {availability === "loading" ? "Checking companion…" : "Retry connection"}
        </button>
      )}

      {installed && summary && (
        <>
          <div className="proxy-profile-list" aria-label="Proxy profiles">
            {summary.profiles.length ? summary.profiles.map((profile) => (
              <button
                key={profile.id}
                className={profile.id === summary.activeProfileId ? "is-active" : ""}
                type="button"
                disabled={Boolean(busyAction)}
                onClick={() => run("ACTIVATE_PROFILE", { profileId: profile.id })}
              >
                <i style={{ background: profile.color }} />
                <span><strong>{profile.name}</strong><small>{PROXY_KIND_LABELS[profile.kind] || profile.kind}</small></span>
                <span>{busyAction === profile.id ? "Applying…" : profile.id === summary.activeProfileId ? "Active" : "Use"}</span>
              </button>
            )) : <p className="proxy-empty">Create a profile in temoto Proxy to get started.</p>}
          </div>
          <div className="proxy-actions">
            <button type="button" disabled={Boolean(busyAction)} onClick={() => run("OPEN_MANAGER")}>
              Manage profiles <ArrowSquareOut size={15} />
            </button>
            {summary.activeProfileId && (
              <button className="proxy-off-action" type="button" disabled={Boolean(busyAction)} onClick={() => run("DEACTIVATE")}>
                <Power size={15} /> {busyAction === "DEACTIVATE" ? "Turning off…" : "Turn off"}
              </button>
            )}
          </div>
        </>
      )}

      {error && <p className="proxy-error" role="status">{error}</p>}
    </section>
  );
}

interface CaptureRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CaptureViewport {
  width: number;
  height: number;
}

interface FullPageCapture {
  type: "fullPage";
  frames: Array<{ dataUrl: string; scrollY: number; duplicateOfPrevious?: boolean }>;
  viewport: CaptureViewport;
  document: { height: number };
}

interface SingleCapture {
  type: "single";
  dataUrl: string;
  viewport: CaptureViewport;
  rect?: CaptureRect;
}

type PendingCapture = FullPageCapture | SingleCapture;

interface CaptureStoreModule {
  readPendingCapture(): Promise<PendingCapture | null>;
  removePendingCapture(): Promise<void>;
}

function loadCaptureImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load the capture."));
    image.src = dataUrl;
  });
}

function captureImagesAreEquivalent(first: CanvasImageSource, second: CanvasImageSource): boolean {
  const sample = document.createElement("canvas");
  sample.width = 64;
  sample.height = 64;
  const context = sample.getContext("2d", { willReadFrequently: true });
  if (!context) return false;
  context.drawImage(first, 0, 0, sample.width, sample.height);
  const firstPixels = context.getImageData(0, 0, sample.width, sample.height).data;
  context.clearRect(0, 0, sample.width, sample.height);
  context.drawImage(second, 0, 0, sample.width, sample.height);
  const secondPixels = context.getImageData(0, 0, sample.width, sample.height).data;
  let difference = 0;
  for (let index = 0; index < firstPixels.length; index += 4) {
    difference += Math.abs(firstPixels[index] - secondPixels[index]);
    difference += Math.abs(firstPixels[index + 1] - secondPixels[index + 1]);
    difference += Math.abs(firstPixels[index + 2] - secondPixels[index + 2]);
  }
  return difference / (sample.width * sample.height * 3) < 0.5;
}

function CaptureApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState("Loading capture…");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isExtensionRuntime()) {
      setStatus("Capture from the installed extension to preview it here.");
      return;
    }
    let cancelled = false;
    const renderCapture = async () => {
      const captureStore = await import(/* @vite-ignore */ chrome.runtime.getURL("capture-store.js")) as CaptureStoreModule;
      const storedCapture = await captureStore.readPendingCapture();
      const legacyCapture = storedCapture
        ? null
        : (await chrome.storage.session.get("pendingCapture")).pendingCapture as PendingCapture | undefined;
      const pendingCapture = storedCapture || legacyCapture;
      if (!pendingCapture) {
        setStatus("No capture found.");
        return;
      }

      try {
        const canvas = canvasRef.current;
        if (pendingCapture.type === "fullPage") {
          const images = await Promise.all(pendingCapture.frames.map((frame) => loadCaptureImage(frame.dataUrl)));
          if (cancelled || !canvas || !images.length) return;
          const scaleY = images[0].naturalHeight / pendingCapture.viewport.height;
          const duplicateFlags = pendingCapture.frames.map((frame, index) => (
            index > 0 && (
              frame.duplicateOfPrevious
              || captureImagesAreEquivalent(images[index - 1], images[index])
            )
          ));
          const { renderFrames } = planFullPageFrames(pendingCapture.frames, duplicateFlags);
          const outputHeight = Math.round(pendingCapture.document.height * scaleY);
          if (outputHeight > 32000) throw new Error("This page is too tall to export as one PNG.");
          canvas.width = images[0].naturalWidth;
          canvas.height = outputHeight;
          const context = canvas.getContext("2d");
          if (!context) throw new Error("Could not prepare the capture canvas.");
          renderFrames.forEach(({ index, outputY }) => {
            context.drawImage(images[index], 0, Math.round(outputY * scaleY));
          });
        } else {
          const image = await loadCaptureImage(pendingCapture.dataUrl);
          if (cancelled || !canvas) return;
          const rect = pendingCapture.rect;
          if (rect) {
            const scaleX = image.naturalWidth / pendingCapture.viewport.width;
            const scaleY = image.naturalHeight / pendingCapture.viewport.height;
            canvas.width = Math.round(rect.width * scaleX);
            canvas.height = Math.round(rect.height * scaleY);
            const context = canvas.getContext("2d");
            if (!context) throw new Error("Could not prepare the capture canvas.");
            context.drawImage(image, rect.x * scaleX, rect.y * scaleY, rect.width * scaleX, rect.height * scaleY, 0, 0, canvas.width, canvas.height);
          } else {
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            const context = canvas.getContext("2d");
            if (!context) throw new Error("Could not prepare the capture canvas.");
            context.drawImage(image, 0, 0);
          }
        }
        if (!cancelled) {
          setReady(true);
          setStatus("");
        }
      } catch (error) {
        if (!cancelled) setStatus(errorMessage(error, "Could not load the capture."));
      } finally {
        await Promise.allSettled([
          captureStore.removePendingCapture(),
          chrome.storage.session.remove("pendingCapture"),
        ]);
      }
    };

    renderCapture().catch((error) => {
      if (!cancelled) setStatus(errorMessage(error, "Could not load the capture."));
    });
    return () => { cancelled = true; };
  }, []);

  const toBlob = () => new Promise<Blob>((resolve, reject) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      reject(new Error("Capture canvas is unavailable"));
      return;
    }
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not create a PNG")), "image/png");
  });
  const copy = async () => {
    const blob = await toBlob();
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    setStatus("Copied to clipboard");
  };
  const download = async () => {
    const blob = await toBlob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `temoto-${new Date().toISOString().replace(/[:.]/g, "-")}.png`;
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus("PNG saved");
  };

  return (
    <main className="app-shell capture-shell">
      <header className="app-header"><Brand descriptor="CAPTURE" /><IconButton label="Close" onClick={() => window.close()}><X size={22} /></IconButton></header>
      <section className="capture-content">
        <div className={`capture-stage${ready ? " is-ready" : ""}`}><canvas ref={canvasRef} />{!ready && <p>{status}</p>}</div>
        <div className="capture-actions">
          <button type="button" disabled={!ready} onClick={copy}><Copy size={19} />Copy</button>
          <button type="button" disabled={!ready} onClick={download}><DownloadSimple size={19} />Save PNG</button>
        </div>
        {ready && status && <p className="capture-status">{status}</p>}
      </section>
    </main>
  );
}

export function App({ surface = "popup" }: { surface?: string }) {
  const content = useMemo(() => {
    if (surface === "sidepanel") return <SidePanelApp />;
    if (surface === "capture") return <CaptureApp />;
    return <PopupApp />;
  }, [surface]);
  return content;
}
