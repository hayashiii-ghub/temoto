import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MouseEventHandler, ReactNode } from "react";
import {
  ArrowLeft,
  ArrowsOutLineVertical,
  BracketsCurly,
  Camera,
  Copy,
  DownloadSimple,
  Eyedropper,
  Scan,
  Gauge,
  X,
} from "@phosphor-icons/react";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import {
  captureFullPage,
  captureVisible,
  detectPage,
  refreshPage,
  getSettings,
  isExtensionRuntime,
  pickColor,
  saveSettings,
  setVideoSpeed,
  startMeasure,
} from "./extension-api.ts";
import type {
  ExtensionSettings,
  PageInfo,
} from "./extension-api.ts";
import { planFullPageFrames } from "./capture-plan.ts";
import { isPageToolAvailable } from "./url-utils.ts";
import {
  clampPlaybackSpeed,
  speedFromShortcut,
  SPEED_PRESETS,
} from "./video-speed.ts";
import { formatColor, addColorToHistory } from "./color-utils.ts";
import type { ColorFormat } from "./color-utils.ts";
import { localizeError, t } from "./i18n.ts";

const TOOL_DEFINITIONS = {
  color: { title: t("Color Picker"), icon: Eyedropper },
  screenshot: { title: t("Screenshot"), icon: Scan },
  speed: { title: t("Video Speed"), icon: Gauge },
} satisfies Record<string, { title: string; icon: PhosphorIcon }>;

type ToolId = keyof typeof TOOL_DEFINITIONS;
type CaptureKind = "visible" | "full";

function errorMessage(error: unknown, fallback: string): string {
  return localizeError(error, fallback);
}

function Brand({ descriptor }: { descriptor?: string }) {
  return (
    <div className="brand-lockup">
      <div className="brand-name">
        <span>temoto</span>
        {descriptor && <span className="brand-context"> {descriptor}</span>}
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

function ToolError({ message }: { message: string }) {
  return message ? <p className="tool-error" role="alert">{message}</p> : null;
}

function LauncherRow({ icon: Icon, label, meta, metaAccent = false, error, busy = false, onClick, disabled = false }: {
  icon: PhosphorIcon;
  label: string;
  meta?: ReactNode;
  metaAccent?: boolean;
  error?: string;
  busy?: boolean;
  onClick: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
}) {
  return (
    <button className={`launcher-card${error ? " has-error" : ""}`} type="button" onClick={onClick} disabled={disabled} aria-busy={busy || undefined} title={disabled && !busy ? t("Unavailable on this page") : undefined}>
      <Icon size={22} weight="regular" aria-hidden="true" />
      <span className="launcher-label"><strong>{label}</strong>{error && <small className="launcher-error" role="alert">{error}</small>}</span>
      {meta && <span className={`launcher-meta${metaAccent ? " is-accent" : ""}`}>{meta}</span>}
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
      <IconButton label={t("Back to tools")} onClick={onBack}><ArrowLeft size={20} aria-hidden="true" /></IconButton>
      <div className="tool-screen-identity">
        <Icon size={20} weight="regular" aria-hidden="true" />
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
          <button key={value} type="button" className={speed === value ? "is-active" : ""} aria-pressed={speed === value} onClick={() => update(value)} disabled={disabled}>
            {value}×
          </button>
        ))}
      </div>
      <div className="speed-stepper" role="group" aria-label={t("Adjust playback speed")}>
        <button type="button" onClick={() => update(speed - 0.05)} disabled={disabled} aria-label={t("Decrease speed by 0.05")}>−0.05</button>
        <button type="button" onClick={() => update(speed + 0.05)} disabled={disabled} aria-label={t("Increase speed by 0.05")}>+0.05</button>
      </div>
      <div className="speed-shortcuts" aria-label={t("Keyboard shortcuts")}>
        <span><kbd>S</kbd><small>−0.25</small></span>
        <span><kbd>G</kbd><small>1↔1.5×</small></span>
        <span><kbd>D</kbd><small>+0.25</small></span>
      </div>
    </div>
  );
}

function ScreenshotPanel({ onError }: { onError: (message: string) => void }) {
  const [busy, setBusy] = useState(false);
  const run = async (kind: CaptureKind) => {
    onError("");
    setBusy(true);
    try {
      const result = kind === "full" ? await captureFullPage() : await captureVisible();
      if (!result?.ok) throw new Error(t(result?.error || "Could not capture this page"));
    } catch (error) {
      onError(errorMessage(error, t("Could not capture this page")));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="inline-panel screenshot-actions">
      <button className="secondary-action" type="button" disabled={busy} onClick={() => run("visible")}>
        <Camera size={18} /> {t("Visible area")}
      </button>
      <button className="secondary-action full-page-action" type="button" disabled={busy} onClick={() => run("full")}>
        <ArrowsOutLineVertical size={18} /> {t("Full page")}
      </button>
      {busy && <p role="status">{t("Capturing… Keep the page active.")}</p>}
    </div>
  );
}

function ColorPanel({ settings, onChange, onError }: {
  settings: ExtensionSettings;
  onChange: (settings: Partial<ExtensionSettings>) => void;
  onError: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const value = formatColor(settings.lastColor, settings.colorFormat);
  const copy = async (color = settings.lastColor) => {
    onError("");
    try {
      if (!navigator.clipboard?.writeText) throw new Error(t("Clipboard is unavailable"));
      const text = formatColor(color, settings.colorFormat);
      await navigator.clipboard.writeText(text);
    } catch {
      onError(t("Could not copy. Please try again."));
    }
  };
  const changeFormat = async (colorFormat: ColorFormat) => {
    if (busy) return;
    onError("");
    setBusy(true);
    try {
      await saveSettings({ colorFormat });
      onChange({ colorFormat });
    } catch (error) { onError(errorMessage(error, t("Could not save settings"))); }
    finally { setBusy(false); }
  };
  const pick = async () => {
    if (busy) return;
    onError("");
    setBusy(true);
    try {
      const color = await pickColor();
      const colorHistory = addColorToHistory(settings.colorHistory, color);
      onChange({ lastColor: color, colorHistory });
      await saveSettings({ lastColor: color, colorHistory });
      await copy(color);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        onError(errorMessage(error, t("Could not pick a color")));
      }
    } finally { setBusy(false); }
  };
  const selectColor = async (color: string) => {
    onError("");
    onChange({ lastColor: color });
    try { await saveSettings({ lastColor: color }); }
    catch (error) { onError(errorMessage(error, t("Could not save settings"))); }
  };
  return <section className="tool-screen-body tool-detail-body color-screen">
    <div className="color-readout"><i style={{ background: settings.lastColor }} /><strong>{value}</strong></div>
    <div className="color-formats" role="group" aria-label={t("Color format")}>
      {(["hex", "rgb", "hsl"] as const).map((format) => <button key={format} type="button" aria-pressed={settings.colorFormat === format} onClick={() => changeFormat(format)} disabled={busy}>{format.toUpperCase()}</button>)}
    </div>
    <div className="tool-primary-actions">
      <button className="primary-action" type="button" onClick={pick} disabled={busy}><Eyedropper size={18} aria-hidden="true" />{t("Pick a color")}</button>
      <button className="secondary-action" type="button" onClick={() => copy()} disabled={busy}><Copy size={18} />{t("Copy value")}</button>
    </div>
    {settings.colorHistory.length > 0 && <div className="color-history" role="group" aria-label={t("Recent colors")}>
      {settings.colorHistory.map((color) => <button key={color} type="button" aria-label={t("Select {color}", { color })} title={color} aria-pressed={settings.lastColor === color} onClick={() => selectColor(color)} disabled={busy}><i style={{ background: color }} /></button>)}
    </div>}
  </section>;
}

function PopupApp() {
  const [page, setPage] = useState<PageInfo>({ hostname: t("Current page"), origin: "", url: "", videoCount: 0, playbackRate: 1 });
  const [settings, setSettings] = useState<ExtensionSettings>({ lastColor: "#9974F8", colorHistory: [], colorFormat: "hex" });
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);
  const [error, setError] = useState("");
  const [speedBusy, setSpeedBusy] = useState(false);
  const [inspectBusy, setInspectBusy] = useState(false);
  const [inspectError, setInspectError] = useState("");
  const inspectInFlight = useRef(false);
  const speedQueue = useRef<number | null>(null);
  const applyingSpeed = useRef(false);
  const mounted = useRef(true);
  const refreshSequence = useRef(0);
  const toolSession = useRef(0);
  const onToolError = useMemo(() => {
    const session = toolSession.current;
    return (message: string) => {
      if (mounted.current && session === toolSession.current) setError(message);
    };
  }, [activeTool]);

  const refresh = useCallback(async () => {
    const sequence = ++refreshSequence.current;
    const next = await refreshPage();
    if (mounted.current && sequence === refreshSequence.current) setPage(next);
    return next;
  }, []);

  useEffect(() => {
    mounted.current = true;
    let disposed = false;
    const initialSequence = ++refreshSequence.current;
    const initialSession = toolSession.current;
    Promise.allSettled([detectPage(), getSettings()]).then(([pageResult, settingsResult]) => {
      if (disposed) return;
      if (pageResult.status === "fulfilled" && initialSequence === refreshSequence.current) setPage(pageResult.value);
      if (settingsResult.status === "fulfilled") setSettings(settingsResult.value);
      const failure = pageResult.status === "rejected" ? pageResult.reason : settingsResult.status === "rejected" ? settingsResult.reason : null;
      if (failure && initialSession === toolSession.current) setError(errorMessage(failure, t("Could not initialize temoto")));
    });
    let timer: number | undefined;
    const onMessage = (message: { type?: string }, sender: chrome.runtime.MessageSender) => {
      if (message.type !== "VIDEO_STATE_CHANGED" || !sender.tab?.active) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => { refresh().catch(() => {}); }, 80);
    };
    if (isExtensionRuntime()) chrome.runtime.onMessage.addListener(onMessage);
    return () => {
      disposed = true;
      mounted.current = false;
      window.clearTimeout(timer);
      if (isExtensionRuntime()) chrome.runtime.onMessage.removeListener(onMessage);
    };
  }, [refresh]);

  const updateSpeed = useCallback(async (value: number) => {
    const session = toolSession.current;
    setError("");
    speedQueue.current = value;
    if (applyingSpeed.current) return;
    applyingSpeed.current = true;
    setSpeedBusy(true);
    try {
      while (speedQueue.current !== null) {
        const next = speedQueue.current;
        speedQueue.current = null;
        const result = await setVideoSpeed(next);
        if (!result.ok) throw new Error(result.error || t("Could not update playback speed"));
        if (isExtensionRuntime()) await refresh();
        else setPage((current) => ({ ...current, playbackRate: next }));
      }
    } catch (error) {
      speedQueue.current = null;
      if (mounted.current && session === toolSession.current) setError(errorMessage(error, t("Could not update playback speed")));
      await refresh().catch(() => {});
    } finally {
      applyingSpeed.current = false;
      if (mounted.current) setSpeedBusy(false);
    }
  }, [refresh]);

  useEffect(() => {
    if (activeTool !== "speed") return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || target?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target?.tagName || "")) return;
      const nextSpeed = speedFromShortcut(event.key, page.playbackRate);
      if (nextSpeed === null || !page.videoCount) return;
      event.preventDefault();
      updateSpeed(nextSpeed);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeTool, page.playbackRate, page.videoCount, updateSpeed]);

  const runMeasure = async () => {
    if (inspectInFlight.current) return;
    inspectInFlight.current = true;
    const session = toolSession.current;
    setInspectError("");
    setInspectBusy(true);
    try {
      const result = await startMeasure();
      if (!result.ok) throw new Error(result.error || t("Could not start Inspect"));
      if (!result.preview && mounted.current && session === toolSession.current) window.close();
    } catch (error) {
      if (mounted.current && session === toolSession.current) setInspectError(errorMessage(error, t("Could not start Inspect")));
    } finally {
      inspectInFlight.current = false;
      if (mounted.current) setInspectBusy(false);
    }
  };

  const openTool = (tool: ToolId | null) => {
    toolSession.current += 1;
    setError("");
    setInspectError("");
    setActiveTool(tool);
  };

  return <main className="app-shell popup-shell">
    {activeTool ? <>
      <ToolScreenHeader tool={TOOL_DEFINITIONS[activeTool]} onBack={() => openTool(null)} />
      <ToolError message={error} />
      {activeTool === "color" && <ColorPanel settings={settings} onChange={(update) => setSettings((current) => ({ ...current, ...update }))} onError={onToolError} />}
      {activeTool === "screenshot" && <section className="tool-screen-body tool-detail-body screenshot-screen"><ScreenshotPanel onError={onToolError} /></section>}
      {activeTool === "speed" && <section className="tool-screen-body tool-detail-body speed-screen">{!page.videoCount && <p className="empty-note">{t("No video found on this page.")}</p>}<SpeedControl speed={page.playbackRate} onChange={updateSpeed} disabled={!page.videoCount} />{speedBusy && <p className="speed-state" role="status">{t("Updating playback speed…")}</p>}</section>}
    </> : <>
      <header className="app-header launcher-header"><Brand /></header>
      <ToolError message={error} />
      <section className="launcher-list" aria-label={t("Developer tools")}>
        <LauncherRow icon={Eyedropper} label={t("Color Picker")} onClick={() => openTool("color")} />
        <LauncherRow icon={Scan} label={t("Screenshot")} onClick={() => openTool("screenshot")} disabled={!isPageToolAvailable("screenshot", page)} />
        <LauncherRow icon={BracketsCurly} label="CSS" error={inspectError} busy={inspectBusy} meta={inspectBusy ? t("Starting…") : inspectError ? t("Retry") : undefined} onClick={runMeasure} disabled={inspectBusy || !isPageToolAvailable("inspect", page)} />
        <LauncherRow icon={Gauge} label={t("Video Speed")} meta={isPageToolAvailable("speed", page) ? (page.videoCount ? String(page.playbackRate) + "×" : t("No video")) : t("Unavailable")} metaAccent={Boolean(page.videoCount)} onClick={() => openTool("speed")} disabled={!isPageToolAvailable("speed", page)} />
      </section>
    </>}
  </main>;
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
  frames: Array<{ dataUrl: string; scrollY: number }>;
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
  loadPendingCapture(id: string): Promise<PendingCapture | null>;
  clearPendingCapture(id: string): Promise<void>;
}

function loadCaptureImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(t("Could not load the capture.")));
    image.src = dataUrl;
  });
}

function CaptureApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState(t("Loading capture…"));
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [zoom, setZoom] = useState<"fit" | "actual">("fit");
  const [dimensions, setDimensions] = useState("");

  useEffect(() => {
    if (!isExtensionRuntime()) {
      setStatus(t("Capture from the installed extension to preview it here."));
      return;
    }
    let cancelled = false;
    const renderCapture = async () => {
      const captureStore = await import(/* @vite-ignore */ chrome.runtime.getURL("capture-store.js")) as CaptureStoreModule;
      const id = new URLSearchParams(location.search).get("id");
      const pendingCapture = id ? await captureStore.loadPendingCapture(id) : null;
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
          const { renderFrames } = planFullPageFrames(pendingCapture.frames);
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
          setDimensions(String(canvas.width) + " × " + String(canvas.height) + " px");
          setReady(true);
          setStatus("");
        }
      } catch (error) {
        if (!cancelled) setStatus(errorMessage(error, t("Could not load the capture.")));
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
  const exportCapture = async (kind: "copy" | "download") => {
    if (busy) return;
    setStatus("");
    setBusy(true);
    try {
      const blob = await toBlob();
      if (kind === "copy") {
        if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") throw new Error(t("Clipboard is unavailable"));
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      } else {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "temoto-" + new Date().toISOString().replace(/[:.]/g, "-") + ".png";
        anchor.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 10000);
      }
    } catch { setStatus(t("Could not export the capture. Please try again.")); }
    finally { setBusy(false); }
  };
  const close = async () => {
    try {
      if (isExtensionRuntime()) {
        const id = new URLSearchParams(location.search).get("id");
        if (id) {
          const store = await import(/* @vite-ignore */ chrome.runtime.getURL("capture-store.js")) as CaptureStoreModule;
          await store.clearPendingCapture(id);
        }
      }
      window.close();
    } catch (error) { setStatus(errorMessage(error, t("Could not close capture"))); }
  };

  return (
    <main className="app-shell capture-shell">
      <header className="app-header"><Brand descriptor={t("CAPTURE")} /><IconButton label={t("Close")} onClick={close}><X size={22} /></IconButton></header>
      <section className="capture-content">
        <div className="capture-toolbar"><span className={dimensions ? "capture-dimensions" : undefined}>{dimensions || t("Capture preview")}</span><div role="group" aria-label={t("Preview zoom")}><button type="button" aria-pressed={zoom === "fit"} onClick={() => setZoom("fit")}>{t("Fit")}</button><button type="button" aria-pressed={zoom === "actual"} onClick={() => setZoom("actual")}>100%</button></div></div>
        <div className={"capture-stage" + (ready ? " is-ready" : "") + (zoom === "actual" ? " is-actual" : "")}><canvas ref={canvasRef} />{!ready && <p>{status}</p>}</div>
        <div className="capture-actions">
          <button type="button" disabled={!ready || busy} onClick={() => exportCapture("copy")}><Copy size={19} />{t("Copy")}</button>
          <button type="button" disabled={!ready || busy} onClick={() => exportCapture("download")}><DownloadSimple size={19} />{t("Save PNG")}</button>
        </div>
        {ready && status && <p className="capture-status" role="alert">{status}</p>}
      </section>
    </main>
  );
}

export function App({ surface = "popup" }: { surface?: string }) {
  return surface === "capture" ? <CaptureApp /> : <PopupApp />;
}
