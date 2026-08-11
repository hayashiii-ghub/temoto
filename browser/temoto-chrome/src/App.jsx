import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowCounterClockwise,
  ArrowsLeftRight,
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
  Ruler,
  Selection,
  ShieldCheck,
  SlidersHorizontal,
  Speedometer,
  Trash,
  X,
} from "@phosphor-icons/react";
import {
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
} from "./extension-api.js";
import { isValidHttpOrigin } from "./url-utils.js";

const speedPresets = [0.5, 1, 1.5, 2];

function Brand({ descriptor }) {
  return (
    <div className="brand-lockup">
      <img src="/icons/temoto-mark.svg" alt="" className="brand-mark" />
      <div className="brand-name">
        <span>temoto</span>
        {descriptor
          ? <span className="brand-context"> {descriptor}</span>
          : <span className="brand-chrome"> for Chrome</span>}
      </div>
    </div>
  );
}

function IconButton({ label, children, onClick }) {
  return (
    <button className="icon-button" type="button" aria-label={label} title={label} onClick={onClick}>
      {children}
    </button>
  );
}

function StatusToast({ message }) {
  if (!message) return null;
  return <div className="status-toast" role="status">{message}</div>;
}

function LauncherCard({ icon: Icon, label, meta, onClick, danger = false }) {
  return (
    <button className={`launcher-card${danger ? " is-danger" : ""}`} type="button" onClick={onClick}>
      {meta && <span className="launcher-meta">{meta}</span>}
      <Icon size={42} weight="light" aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}

function ToolScreenHeader({ title, onBack }) {
  return (
    <header className="tool-screen-header">
      <IconButton label="Back to tools" onClick={onBack}><ArrowLeft size={22} /></IconButton>
      <div><small>TOOL</small><strong>{title}</strong></div>
      <span className="tool-header-spacer" aria-hidden="true" />
    </header>
  );
}

function SpeedControl({ speed, onChange, disabled }) {
  const update = (value) => onChange(Math.round(Math.min(4, Math.max(0.25, value)) * 20) / 20);
  return (
    <div className="speed-control">
      <div className="speed-value"><span>{speed}</span><small>×</small></div>
      <div className="speed-presets" role="group" aria-label="Playback speed presets">
        {speedPresets.map((value) => (
          <button key={value} type="button" className={speed === value ? "is-active" : ""} onClick={() => update(value)} disabled={disabled}>
            {value}×
          </button>
        ))}
      </div>
      <div className="speed-slider-row">
        <button type="button" onClick={() => update(speed - 0.05)} disabled={disabled} aria-label="Decrease speed">−</button>
        <input type="range" min="0.25" max="4" step="0.05" value={speed} onChange={(event) => update(Number(event.target.value))} disabled={disabled} aria-label="Playback speed" />
        <button type="button" onClick={() => update(speed + 0.05)} disabled={disabled} aria-label="Increase speed">＋</button>
      </div>
    </div>
  );
}

function ScreenshotPanel({ onDone }) {
  const [busy, setBusy] = useState(false);
  const run = async (kind) => {
    setBusy(true);
    const result = kind === "region" ? await captureRegion() : await captureVisible();
    setBusy(false);
    onDone(result?.preview ? "Capture starts in the installed extension" : "Capture started");
  };
  return (
    <div className="inline-panel screenshot-actions">
      <button className="primary-action" type="button" disabled={busy} onClick={() => run("region")}>
        <Ruler size={18} /> Select region
      </button>
      <button className="secondary-action" type="button" disabled={busy} onClick={() => run("visible")}>
        <Camera size={18} /> Visible area
      </button>
      <p>Copy the result or save it as a PNG after capture.</p>
    </div>
  );
}

function EnvironmentPanel({ page, project, onDone }) {
  const targets = [
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
  const [page, setPage] = useState({ hostname: "Current page", origin: "https://example.com", videoCount: 0, playbackRate: 1 });
  const [settings, setSettings] = useState({ project: { name: "Local project", local: "http://localhost:3000", staging: "https://staging.example.com", production: "https://example.com" }, lastColor: "#7C5CFC", lastSpeed: 1.5 });
  const [activeTool, setActiveTool] = useState(null);
  const [speed, setSpeed] = useState(1.5);
  const [toast, setToast] = useState("");
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    Promise.all([detectPage(), getSettings()]).then(([nextPage, nextSettings]) => {
      setPage(nextPage);
      setSettings(nextSettings);
      const initialSpeed = nextPage.videoCount ? nextPage.playbackRate : nextSettings.lastSpeed;
      setSpeed(initialSpeed || 1);
    }).catch((error) => setToast(error.message));
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const updateSpeed = async (value) => {
    setSpeed(value);
    setSettings((current) => ({ ...current, lastSpeed: value }));
    await saveSettings({ lastSpeed: value });
    const result = await setVideoSpeed(value);
    if (!result?.ok) setToast(result?.error || "Could not update playback speed");
  };

  const runPicker = async () => {
    try {
      const color = await pickColor();
      setSettings((current) => ({ ...current, lastColor: color }));
      setToast(`${color} copied`);
      await navigator.clipboard?.writeText(color);
    } catch (error) {
      if (error.name !== "AbortError") setToast(error.message);
    }
  };

  const runMeasure = async () => {
    const result = await startMeasure();
    setToast(result?.preview ? "Inspect starts in the installed extension" : "Select an element on the page");
    if (!result?.preview) window.close();
  };

  const confirmReset = async () => {
    const result = await resetOrigin(page.origin);
    setResetOpen(false);
    setToast(result?.ok ? `Cleared site data for ${page.hostname}` : result?.error);
  };

  const copyLastColor = async () => {
    await navigator.clipboard?.writeText(settings.lastColor);
    setToast(`${settings.lastColor} copied`);
  };

  const toolTitles = {
    color: "Color Picker",
    screenshot: "Screenshot",
    speed: "Video Speed",
    environment: "Environments",
    reset: "Site Reset",
    inspect: "Inspect",
  };

  const renderActiveTool = () => {
    if (activeTool === "color") {
      return (
        <section className="tool-screen-body tool-focus">
          <span className="feature-icon"><EyedropperSample size={58} /></span>
          <div className="color-readout">
            <i style={{ background: settings.lastColor }} />
            <strong>{settings.lastColor}</strong>
          </div>
          <p>Pick any pixel from the current page.</p>
          <div className="tool-primary-actions">
            <button className="primary-action" type="button" onClick={runPicker}><EyedropperSample size={18} /> Pick a color</button>
            <button className="secondary-action" type="button" onClick={copyLastColor}><Copy size={18} /> Copy value</button>
          </div>
        </section>
      );
    }
    if (activeTool === "screenshot") {
      return (
        <section className="tool-screen-body tool-focus">
          <span className="feature-icon"><Selection size={58} weight="light" /></span>
          <h2>Capture the current page</h2>
          <p>Choose a region or capture everything currently visible.</p>
          <ScreenshotPanel onDone={setToast} />
        </section>
      );
    }
    if (activeTool === "speed") {
      return (
        <section className="tool-screen-body speed-screen">
          {!page.videoCount && <p className="empty-note">No video found on this page. Your last speed is still saved.</p>}
          <SpeedControl speed={speed} onChange={updateSpeed} disabled={!page.videoCount && isExtensionRuntime()} />
        </section>
      );
    }
    if (activeTool === "environment") {
      return (
        <section className="tool-screen-body environment-screen">
          <span className="feature-icon"><ArrowsLeftRight size={56} /></span>
          <p>Move between project origins without losing the current path.</p>
          <EnvironmentPanel page={page} project={settings.project} onDone={setToast} />
        </section>
      );
    }
    if (activeTool === "reset") {
      return (
        <section className="tool-screen-body tool-focus danger-screen">
          <span className="feature-icon"><ArrowCounterClockwise size={54} weight="light" /></span>
          <h2>Reset {page.hostname}</h2>
          <p>Clear cookies, local storage, cache, IndexedDB and service workers for this site.</p>
          <button className="danger-primary" type="button" onClick={() => setResetOpen(true)}>Review and reset</button>
        </section>
      );
    }
    if (activeTool === "inspect") {
      return (
        <section className="tool-screen-body tool-focus">
          <span className="feature-icon"><BoundingBox size={58} weight="light" /></span>
          <h2>Measure any element</h2>
          <p>Inspect size, spacing, type, color and copy a stable CSS selector.</p>
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
          <ToolScreenHeader title={toolTitles[activeTool]} onBack={() => setActiveTool(null)} />
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
            <LauncherCard icon={Selection} label="Screenshot" onClick={() => setActiveTool("screenshot")} />
            <LauncherCard icon={Speedometer} label="Video Speed" meta={page.videoCount ? `${speed}x` : "No video"} onClick={() => setActiveTool("speed")} />
            <LauncherCard icon={ArrowsLeftRight} label="Environments" onClick={() => setActiveTool("environment")} />
            <LauncherCard icon={ArrowCounterClockwise} label="Site Reset" onClick={() => setActiveTool("reset")} danger />
            <LauncherCard icon={BoundingBox} label="Inspect" onClick={() => setActiveTool("inspect")} />
          </section>
        </>
      )}
      <StatusToast message={toast} />

      {resetOpen && (
        <div className="dialog-backdrop" role="presentation" onMouseDown={() => setResetOpen(false)}>
          <div className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="reset-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="dialog-icon"><Trash size={22} /></div>
            <h2 id="reset-title">Reset {page.hostname}?</h2>
            <p>This clears cookies, local storage, cache, IndexedDB and service workers, then reloads the page.</p>
            <div className="dialog-actions">
              <button type="button" onClick={() => setResetOpen(false)}>Cancel</button>
              <button className="danger-button" type="button" onClick={confirmReset}>Clear and reload</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function SidePanelApp() {
  const [project, setProject] = useState({ name: "Local project", local: "http://localhost:3000", staging: "https://staging.example.com", production: "https://example.com" });
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => { getSettings().then((settings) => setProject(settings.project)); }, []);

  const update = (key, value) => setProject((current) => ({ ...current, [key]: value }));
  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    ["local", "staging", "production"].forEach((key) => {
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
          {[["local", "LOCAL"], ["staging", "STAGING"], ["production", "PRODUCTION"]].map(([key, label]) => (
            <label key={key} className={errors[key] ? "has-error" : ""}>
              <span>{label}</span>
              <input value={project[key]} onChange={(event) => update(key, event.target.value)} spellCheck="false" />
              {errors[key] && <small>{errors[key]}</small>}
            </label>
          ))}
          <button className="save-button" type="submit">{saved ? <><Check size={18} /> Saved</> : "Save environments"}</button>
        </form>
        <section className="settings-block">
          <div><strong>temoto Proxy</strong><small>Development proxy profiles will ship as a separate companion.</small></div>
          <span className="module-pill">COMING NEXT</span>
        </section>
        <section className="settings-block compact">
          <div><strong>Privacy</strong><small>Page access is requested only when you run a tool. Data is never sent outside the browser.</small></div>
          <LockSimple size={20} />
        </section>
      </div>
    </main>
  );
}

function CaptureApp() {
  const canvasRef = useRef(null);
  const [status, setStatus] = useState("Loading capture…");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isExtensionRuntime()) {
      setStatus("Capture from the installed extension to preview it here.");
      return;
    }
    chrome.storage.session.get("pendingCapture").then(({ pendingCapture }) => {
      if (!pendingCapture) { setStatus("No capture found."); return; }
      const image = new Image();
      image.onload = () => {
        const canvas = canvasRef.current;
        const rect = pendingCapture.rect;
        if (rect) {
          const scaleX = image.naturalWidth / pendingCapture.viewport.width;
          const scaleY = image.naturalHeight / pendingCapture.viewport.height;
          canvas.width = Math.round(rect.width * scaleX);
          canvas.height = Math.round(rect.height * scaleY);
          canvas.getContext("2d").drawImage(image, rect.x * scaleX, rect.y * scaleY, rect.width * scaleX, rect.height * scaleY, 0, 0, canvas.width, canvas.height);
        } else {
          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;
          canvas.getContext("2d").drawImage(image, 0, 0);
        }
        setReady(true);
        setStatus("");
        chrome.storage.session.remove("pendingCapture").catch(() => {});
      };
      image.onerror = () => {
        setStatus("Could not load the capture.");
        chrome.storage.session.remove("pendingCapture").catch(() => {});
      };
      image.src = pendingCapture.dataUrl;
    });
  }, []);

  const toBlob = () => new Promise((resolve) => canvasRef.current.toBlob(resolve, "image/png"));
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

export function App({ surface = "popup" }) {
  const content = useMemo(() => {
    if (surface === "sidepanel") return <SidePanelApp />;
    if (surface === "capture") return <CaptureApp />;
    return <PopupApp />;
  }, [surface]);
  return content;
}
