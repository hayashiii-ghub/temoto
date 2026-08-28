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
  CaretUp,
  Check,
  Copy,
  DownloadSimple,
  EyedropperSample,
  LockSimple,
  Ruler,
  Selection,
  SlidersHorizontal,
  Speedometer,
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
import type { ProxyCompanionConnection } from "./proxy-companion.ts";
import { localizeError, t } from "./i18n.ts";

const TOOL_DEFINITIONS = {
  color: { title: t("Color Picker"), icon: EyedropperSample },
  screenshot: { title: t("Screenshot"), icon: Selection },
  speed: { title: t("Video Speed"), icon: Speedometer },
  environment: { title: t("Switch Origin"), icon: ArrowsLeftRight },
  reset: { title: t("Site Reset"), icon: ArrowCounterClockwise },
  inspect: { title: t("Inspect"), icon: BoundingBox },
} satisfies Record<string, { title: string; icon: PhosphorIcon }>;

type ToolId = keyof typeof TOOL_DEFINITIONS;
type CaptureKind = "region" | "visible" | "full";
type EnvironmentKey = "local" | "staging" | "production";

function errorMessage(error: unknown, fallback: string): string {
  return localizeError(error, fallback);
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
  return (
    <div className={`status-toast${message ? " is-visible" : ""}`} role="status" aria-live="polite" aria-atomic="true">
      {message}
    </div>
  );
}

function LauncherCard({ icon: Icon, label, description, meta, metaAccent = false, onClick, danger = false, disabled = false }: {
  icon: PhosphorIcon;
  label: string;
  description: string;
  meta?: ReactNode;
  metaAccent?: boolean;
  onClick: MouseEventHandler<HTMLButtonElement>;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button className={`launcher-card${danger ? " is-danger" : ""}`} type="button" onClick={onClick} disabled={disabled} title={disabled ? t("Unavailable on this page") : undefined}>
      <span className="launcher-card-head">
        <Icon size={28} weight="light" aria-hidden="true" />
        {meta && <span className={`launcher-meta${metaAccent ? " is-accent" : ""}`}>{meta}</span>}
      </span>
      <span className="launcher-copy">
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
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
      <IconButton label={t("Back to tools")} onClick={onBack}><ArrowLeft size={22} /></IconButton>
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
      <div className="speed-presets" role="group" aria-label={t("Playback speed presets")}>
        {SPEED_PRESETS.map((value) => (
          <button key={value} type="button" className={speed === value ? "is-active" : ""} onClick={() => update(value)} disabled={disabled}>
            {value}×
          </button>
        ))}
      </div>
      <div className="speed-slider-row">
        <button type="button" onClick={() => update(speed - 0.05)} disabled={disabled} aria-label={t("Decrease speed")}>−</button>
        <input type="range" min="0" max="1000" step="1" value={speedToSliderPosition(speed)} onChange={(event) => update(sliderPositionToSpeed(event.target.value))} disabled={disabled} aria-label={t("Playback speed")} aria-valuetext={t("{speed} times", { speed })} />
        <button type="button" onClick={() => update(speed + 0.05)} disabled={disabled} aria-label={t("Increase speed")}>＋</button>
      </div>
      <div className="speed-shortcuts" aria-label={t("Keyboard shortcuts")}>
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
      if (!result?.ok) throw new Error(t(result?.error || "Could not capture this page"));
      onDone(t(result?.preview ? "Capture starts in the installed extension" : "Capture started"));
    } catch (error) {
      onDone(errorMessage(error, t("Could not capture this page")));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="inline-panel screenshot-actions">
      <button className="primary-action" type="button" disabled={busy} onClick={() => run("region")}>
        <Ruler size={18} /> {t("Select region")}
      </button>
      <button className="secondary-action" type="button" disabled={busy} onClick={() => run("visible")}>
        <Camera size={18} /> {t("Visible area")}
      </button>
      <button className="secondary-action full-page-action" type="button" disabled={busy} onClick={() => run("full")}>
        <ArrowsOutLineVertical size={18} /> {t("Full page")}
      </button>
      <p>{t("Copy the result or save it as a PNG after capture.")}</p>
      <div className="screenshot-options">
        <button className="screenshot-options-toggle" type="button" aria-expanded={optionsOpen} onClick={() => setOptionsOpen((open) => !open)}>
          <SlidersHorizontal size={15} weight="light" />
          <span>{t("Capture options")}</span>
          <small>{captureOptions.delayMs ? t("{seconds}s delay", { seconds: captureOptions.delayMs / 1000 }) : t("Automatic")}</small>
          {optionsOpen ? <CaretUp size={13} /> : <CaretDown size={13} />}
        </button>
        {optionsOpen && (
          <div className="screenshot-options-body">
            <label className="capture-option-row">
              <span><strong>{t("Delay")}</strong><small>{t("Wait before capture")}</small></span>
              <select value={captureOptions.delayMs} onChange={(event) => updateOption("delayMs", Number(event.target.value))}>
                <option value="0">{t("None")}</option>
                <option value="1000">{t("1 sec")}</option>
                <option value="3000">{t("3 sec")}</option>
                <option value="5000">{t("5 sec")}</option>
              </select>
            </label>
            <button className="capture-option-row capture-switch-row" type="button" role="switch" aria-checked={captureOptions.forceReveal} onClick={() => updateOption("forceReveal", !captureOptions.forceReveal)}>
              <span><strong>{t("Force reveal")}</strong><small>{t("Show scroll-reveal content")}</small></span>
              <i className={`capture-switch${captureOptions.forceReveal ? " is-on" : ""}`}><span /></i>
            </button>
            <p>{t("Lazy content preload and animation freeze stay automatic.")}</p>
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
    [t("LOCAL"), project.local],
    [t("STAGING"), project.staging],
    [t("PRODUCTION"), project.production],
  ];
  const currentUrl = page.url || page.origin;
  return (
    <div className="inline-panel">
      <div className="environment-title"><span>{project.name}</span><small>{t("Keep path, query and hash")}</small></div>
      <div className="environment-grid">
        {targets.map(([label, origin]) => (
          <button key={label} type="button" disabled={!isValidHttpOrigin(origin)} onClick={async () => {
            const result = await switchEnvironment(origin, currentUrl);
            if (result?.preview) onDone(t("Switching to {origin}", { origin }));
          }}>
            <span>{label}</span><small>{origin.replace(/^https?:\/\//, "")}</small>
          </button>
        ))}
      </div>
      <button className="text-action" type="button" onClick={openSidePanel}>{t("Manage project settings")}</button>
    </div>
  );
}

function PopupApp() {
  const [page, setPage] = useState<PageInfo>({ hostname: t("Current page"), origin: "", url: "", videoCount: 0, playbackRate: 1 });
  const [settings, setSettings] = useState<ExtensionSettings>({ project: { name: t("Local project"), local: "http://localhost:3000", staging: "https://staging.example.com", production: "https://example.com" }, lastColor: "#7C5CFC", lastSpeed: 1.5, screenshot: { delayMs: 0, forceReveal: false } });
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
      if (failure) setToast(t(failure.message || "Could not initialize temoto"));
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
    if (!result?.ok) setToast(t(result?.error || "Could not update playback speed"));
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
      setToast(t("{color} copied", { color }));
      await navigator.clipboard?.writeText(color);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setToast(errorMessage(error, t("Could not pick a color")));
      }
    }
  };

  const runMeasure = async () => {
    const result = await startMeasure();
    setToast(t(result?.preview ? "Inspect mode active" : "Select an element on the page"));
    if (!result?.preview) window.close();
  };

  const confirmReset = async () => {
    if (resetBusy) return;
    setResetBusy(true);
    try {
      const result = await resetOrigin(page.origin);
      setResetOpen(false);
      setToast(result?.ok ? t("Cleared site data for {host}", { host: page.hostname }) : t(result?.error || "Could not reset this site"));
    } catch (error) {
      setToast(errorMessage(error, t("Could not reset this site")));
    } finally {
      setResetBusy(false);
    }
  };

  const copyLastColor = async () => {
    await navigator.clipboard?.writeText(settings.lastColor);
    setToast(t("{color} copied", { color: settings.lastColor }));
  };

  const renderActiveTool = () => {
    if (activeTool === "color") {
      return (
        <section className="tool-screen-body tool-detail-body">
          <p className="tool-description">{t("Pick any pixel from the current page and copy its color value.")}</p>
          <div className="color-readout">
            <i style={{ background: settings.lastColor }} />
            <strong>{settings.lastColor}</strong>
          </div>
          <div className="tool-primary-actions">
            <button className="primary-action" type="button" onClick={runPicker}><EyedropperSample size={18} /> {t("Pick a color")}</button>
            <button className="secondary-action" type="button" onClick={copyLastColor}><Copy size={18} /> {t("Copy value")}</button>
          </div>
        </section>
      );
    }
    if (activeTool === "screenshot") {
      return (
        <section className="tool-screen-body tool-detail-body screenshot-screen">
          <p className="tool-description">{t("Capture a region, the visible area, or the full page.")}</p>
          <ScreenshotPanel onDone={setToast} />
        </section>
      );
    }
    if (activeTool === "speed") {
      return (
        <section className="tool-screen-body tool-detail-body speed-screen">
          <p className="tool-description">{t("Set playback speed for videos on the current page.")}</p>
          {!page.videoCount && <p className="empty-note">{t("No video found on this page. Your last speed is still saved.")}</p>}
          <SpeedControl speed={speed} onChange={updateSpeed} disabled={!page.videoCount && isExtensionRuntime()} />
        </section>
      );
    }
    if (activeTool === "environment") {
      return (
        <section className="tool-screen-body tool-detail-body">
          <p className="tool-description">{t("Move between project origins without losing the current path.")}</p>
          <EnvironmentPanel page={page} project={settings.project} onDone={setToast} />
        </section>
      );
    }
    if (activeTool === "reset") {
      return (
        <section className="tool-screen-body tool-detail-body">
          <p className="tool-description">{t("Clear cookies, local storage, cache, IndexedDB and service workers for {host}.", { host: page.hostname })}</p>
          <button className="danger-primary" type="button" onClick={() => setResetOpen(true)}>{t("Review and reset")}</button>
        </section>
      );
    }
    if (activeTool === "inspect") {
      return (
        <section className="tool-screen-body tool-detail-body">
          <p className="tool-description">{t("Inspect size, spacing, type and color, then copy a stable CSS selector.")}</p>
          <button className="primary-action solo-action" type="button" onClick={runMeasure}><Ruler size={18} /> {t("Start inspecting")}</button>
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
            <IconButton label={t("Open settings")} onClick={openSidePanel}><SlidersHorizontal size={22} weight="light" /></IconButton>
          </header>
          <section className="launcher-grid" aria-label={t("Developer tools")}>
            <LauncherCard icon={EyedropperSample} label={t("Color Picker")} description={t("Pick from the page")} onClick={() => setActiveTool("color")} />
            <LauncherCard icon={Selection} label={t("Screenshot")} description={t("Region, viewport, or full")} onClick={() => setActiveTool("screenshot")} disabled={!isPageToolAvailable("screenshot", page)} />
            <LauncherCard icon={Speedometer} label={t("Video Speed")} description={t("Control page playback")} meta={isPageToolAvailable("speed", page) ? (page.videoCount ? `${speed}x` : t("No video")) : t("Unavailable")} metaAccent={Boolean(page.videoCount)} onClick={() => setActiveTool("speed")} disabled={!isPageToolAvailable("speed", page)} />
            <LauncherCard icon={ArrowsLeftRight} label={t("Switch Origin")} description={t("Local, staging, or production")} onClick={() => setActiveTool("environment")} disabled={!isPageToolAvailable("environment", page)} />
            <LauncherCard icon={ArrowCounterClockwise} label={t("Site Reset")} description={t("Clear the current site")} onClick={() => setActiveTool("reset")} danger disabled={!isPageToolAvailable("reset", page)} />
            <LauncherCard icon={BoundingBox} label={t("Inspect")} description={t("Measure and copy CSS")} onClick={() => setActiveTool("inspect")} disabled={!isPageToolAvailable("inspect", page)} />
          </section>
        </>
      )}
      <StatusToast message={toast} />

      {resetOpen && (
        <div className="dialog-backdrop" role="presentation" onMouseDown={() => { if (!resetBusy) setResetOpen(false); }}>
          <div className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="reset-title" aria-busy={resetBusy} onMouseDown={(event) => event.stopPropagation()}>
            <h2 id="reset-title">{t("Reset {host}?", { host: page.hostname })}</h2>
            <p>{t("This clears cookies, local storage, cache, IndexedDB and service workers, then reloads the page.")}</p>
            <div className="dialog-actions">
              <button type="button" disabled={resetBusy} onClick={() => setResetOpen(false)}>{t("Cancel")}</button>
              <button className="danger-button" type="button" disabled={resetBusy} onClick={confirmReset}>
                {resetBusy ? <><ArrowCounterClockwise className="reset-spinner" size={16} /> {t("Resetting…")}</> : t("Clear and reload")}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function SidePanelApp() {
  const [project, setProject] = useState<ProjectSettings>({ name: t("Local project"), local: "http://localhost:3000", staging: "https://staging.example.com", production: "https://example.com" });
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<EnvironmentKey, string>>>({});

  useEffect(() => { getSettings().then((settings) => setProject(settings.project)); }, []);

  const update = (key: keyof ProjectSettings, value: string) => setProject((current) => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Partial<Record<EnvironmentKey, string>> = {};
    (["local", "staging", "production"] as const).forEach((key) => {
      if (!isValidHttpOrigin(project[key])) nextErrors[key] = t("Enter an origin beginning with http(s)://");
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    await saveSettings({ project });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };

  return (
    <main className="app-shell sidepanel-shell">
      <header className="app-header"><Brand /><span className="panel-status"><i /> {t("PROJECT SETTINGS")}</span></header>
      <div className="sidepanel-content">
        <section className="settings-intro">
          <p className="eyebrow">{t("ORIGIN CONFIGURATION")}</p>
          <h1>{t("Set project origins.")}</h1>
          <p>{t("Choose the Local, Staging and Production origins used by Switch Origin in the popup.")}</p>
        </section>
        <form className="settings-form" onSubmit={submit}>
          <label><span>{t("PROJECT NAME")}</span><input value={project.name} onChange={(event) => update("name", event.target.value)} /></label>
          {([["local", "LOCAL"], ["staging", "STAGING"], ["production", "PRODUCTION"]] as const).map(([key, label]) => (
            <label key={key} className={errors[key] ? "has-error" : ""}>
              <span>{t(label)}</span>
              <input value={project[key]} onChange={(event) => update(key, event.target.value)} spellCheck="false" />
              {errors[key] && <small>{errors[key]}</small>}
            </label>
          ))}
          <button className="save-button" type="submit">{saved ? <><Check size={18} /> {t("Saved")}</> : t("Save origins")}</button>
        </form>
        <ProxyCompanionSummary />
        <section className="settings-block">
          <div><strong>{t("Privacy")}</strong><small>{t("Video shortcuts run locally on HTTP(S) pages. Other tools access a page only when selected. Data is never sent outside the browser.")}</small></div>
          <LockSimple size={20} />
        </section>
      </div>
    </main>
  );
}

function ProxyCompanionSummary() {
  const [companion, setCompanion] = useState<ProxyCompanionConnection | { availability: "loading"; summary: null }>({ availability: "loading", summary: null });
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const next = await getProxyCompanion();
    setCompanion(next);
    setError(next.availability === "error" ? t("Update or reload temoto Proxy, then try again.") : "");
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

  const openProxy = async () => {
    setError("");
    try {
      await runProxyCompanionAction("OPEN_MANAGER");
    } catch (nextError) {
      setError(errorMessage(nextError, t("temoto Proxy could not open.")));
    }
  };

  const summary = companion.summary;
  const active = summary?.profiles.find((profile) => profile.id === summary.activeProfileId);
  const statusCode = summary?.status.code || companion.availability;
  const description = summary
    ? active ? `${active.name} · ${t(summary.status.label)}` : t(summary.status.label)
    : companion.availability === "loading" ? t("Checking companion…")
      : companion.availability === "missing" ? t("Not installed")
        : t("Companion unavailable");

  return (
    <section className={`proxy-summary is-${statusCode}`}>
      <div>
        <strong>temoto Proxy</strong>
        <small>{description}</small>
      </div>
      {companion.availability === "missing" && (
        <button type="button" onClick={() => window.open(TEMOTO_PROXY_INSTALL_URL, "_blank", "noopener,noreferrer")}>
          {t("Install")} <ArrowSquareOut size={15} />
        </button>
      )}
      {companion.availability === "error" && (
        <button type="button" onClick={refresh}>{t("Retry")} <ArrowCounterClockwise size={15} /></button>
      )}
      {summary && (
        <button type="button" onClick={openProxy}>{t("Open Proxy")} <ArrowSquareOut size={15} /></button>
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
    image.onerror = () => reject(new Error(t("Could not load the capture.")));
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
  const [status, setStatus] = useState(t("Loading capture…"));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isExtensionRuntime()) {
      setStatus(t("Capture from the installed extension to preview it here."));
      return;
    }
    let cancelled = false;
    const renderCapture = async () => {
      const captureStore = await import(/* @vite-ignore */ chrome.runtime.getURL("capture-store.js")) as CaptureStoreModule;
      const pendingCapture = await captureStore.readPendingCapture();
      if (!pendingCapture) {
        setStatus(t("No capture found."));
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
          if (outputHeight > 32000) throw new Error(t("This page is too tall to export as one PNG."));
          canvas.width = images[0].naturalWidth;
          canvas.height = outputHeight;
          const context = canvas.getContext("2d");
          if (!context) throw new Error(t("Could not prepare the capture canvas."));
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
            if (!context) throw new Error(t("Could not prepare the capture canvas."));
            context.drawImage(image, rect.x * scaleX, rect.y * scaleY, rect.width * scaleX, rect.height * scaleY, 0, 0, canvas.width, canvas.height);
          } else {
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            const context = canvas.getContext("2d");
            if (!context) throw new Error(t("Could not prepare the capture canvas."));
            context.drawImage(image, 0, 0);
          }
        }
        if (!cancelled) {
          setReady(true);
          setStatus("");
        }
      } catch (error) {
        if (!cancelled) setStatus(errorMessage(error, t("Could not load the capture.")));
      } finally {
        await captureStore.removePendingCapture();
      }
    };

    renderCapture().catch((error) => {
      if (!cancelled) setStatus(errorMessage(error, t("Could not load the capture.")));
    });
    return () => { cancelled = true; };
  }, []);

  const toBlob = () => new Promise<Blob>((resolve, reject) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      reject(new Error(t("Capture canvas is unavailable")));
      return;
    }
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error(t("Could not create a PNG"))), "image/png");
  });
  const copy = async () => {
    const blob = await toBlob();
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    setStatus(t("Copied to clipboard"));
  };
  const download = async () => {
    const blob = await toBlob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `temoto-${new Date().toISOString().replace(/[:.]/g, "-")}.png`;
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus(t("PNG saved"));
  };

  return (
    <main className="app-shell capture-shell">
      <header className="app-header"><Brand descriptor={t("CAPTURE")} /><IconButton label={t("Close")} onClick={() => window.close()}><X size={22} /></IconButton></header>
      <section className="capture-content">
        <div className={`capture-stage${ready ? " is-ready" : ""}`}><canvas ref={canvasRef} />{!ready && <p>{status}</p>}</div>
        <div className="capture-actions">
          <button type="button" disabled={!ready} onClick={copy}><Copy size={19} />{t("Copy")}</button>
          <button type="button" disabled={!ready} onClick={download}><DownloadSimple size={19} />{t("Save PNG")}</button>
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
