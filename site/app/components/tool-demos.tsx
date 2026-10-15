"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

function useCopy() {
  const [error, setError] = useState("");
  async function copy(value: string) {
    setError("");
    try { await navigator.clipboard.writeText(value); }
    catch { setError("Clipboard unavailable. Select and copy the value instead."); }
  }
  return { copy, error };
}

function Failure({ message }: { message: string }) {
  return message ? <p className="demo-error" role="alert">{message}</p> : null;
}

const colors = [
  { hex: "#9974F8", rgb: "rgb(153, 116, 248)", hsl: "hsl(257, 90%, 71%)" },
  { hex: "#F4F4F2", rgb: "rgb(244, 244, 242)", hsl: "hsl(60, 8%, 95%)" },
  { hex: "#080808", rgb: "rgb(8, 8, 8)", hsl: "hsl(0, 0%, 3%)" },
  { hex: "#C7B5FA", rgb: "rgb(199, 181, 250)", hsl: "hsl(256, 87%, 85%)" },
  { hex: "#62625E", rgb: "rgb(98, 98, 94)", hsl: "hsl(60, 2%, 38%)" },
  { hex: "#D8CFFA", rgb: "rgb(216, 207, 250)", hsl: "hsl(253, 81%, 90%)" },
] as const;

export function ColorDemo() {
  const [selected, setSelected] = useState(0);
  const [format, setFormat] = useState<"hex" | "rgb" | "hsl">("hex");
  const [picking, setPicking] = useState(false);
  const [recent, setRecent] = useState<number[]>([]);
  const { copy, error } = useCopy();
  const value = colors[selected][format];
  function pick(index: number) {
    setSelected(index);
    setRecent(previous => [index, ...previous.filter(item => item !== index)].slice(0, 8));
    setPicking(false);
  }
  return <>
    <div className="demo-color" style={{ background: colors[selected].hex }} aria-label={`Selected color ${colors[selected].hex}`} />
    <div className="demo-columns">{(["hex", "rgb", "hsl"] as const).map(item => <button key={item} aria-pressed={format === item} onClick={() => setFormat(item)}>{item.toUpperCase()}</button>)}</div>
    <output className="demo-value">{value}</output>
    <div className="demo-columns"><button onClick={() => setPicking(!picking)} aria-expanded={picking}>{picking ? "Cancel" : "Pick a color"}</button><button onClick={() => void copy(value)}>Copy value</button></div>
    {picking && <div className="demo-palette" aria-label="Sample colors">{colors.map((color, index) => <button key={color.hex} aria-label={`Pick ${color.hex}`} style={{ "--swatch": color.hex } as CSSProperties} onClick={() => pick(index)}><span /></button>)}</div>}
    {!picking && recent.length > 0 && <div className="demo-palette" aria-label="Recent colors">{recent.map(index => <button key={index} aria-label={`Use ${colors[index].hex}`} style={{ "--swatch": colors[index].hex } as CSSProperties} onClick={() => setSelected(index)}><span /></button>)}</div>}
    <Failure message={error} />
  </>;
}

type Capture = { blob: Blob; url: string; width: number; height: number };

export function ScreenshotDemo() {
  const [capture, setCapture] = useState<Capture | null>(null);
  const [fit, setFit] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => () => { if (capture) URL.revokeObjectURL(capture.url); }, [capture]);
  async function take(fullPage: boolean) {
    setError(""); setBusy(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 640; canvas.height = fullPage ? 840 : 360;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas unavailable");
      context.fillStyle = "#f4f4f2"; context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#9974f8"; context.fillRect(0, 0, 640, 220);
      context.fillStyle = "#080808"; context.font = "bold 28px Arial"; context.fillText("temoto", 32, 50);
      context.font = "bold 48px Arial"; context.fillText("Less friction.", 32, 126); context.fillText("More doing.", 32, 180);
      context.font = "20px Arial";
      for (let y = 270; y < canvas.height; y += 140) {
        context.fillStyle = "#080808"; context.fillText(y === 270 ? "A sample page, captured." : "A little more room to explore.", 32, y);
        context.fillStyle = "#c7c7c3"; context.fillRect(32, y + 25, 576, 2); context.fillRect(32, y + 44, 410, 2);
      }
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(result => result ? resolve(result) : reject(new Error("PNG unavailable")), "image/png"));
      setFit(true); setCapture({ blob, url: URL.createObjectURL(blob), width: canvas.width, height: canvas.height });
    } catch { setError("Could not create the sample image. Try again."); }
    finally { setBusy(false); }
  }
  async function copy() {
    if (!capture) return;
    setError("");
    try { await navigator.clipboard.write([new ClipboardItem({ "image/png": capture.blob })]); }
    catch { setError("Image copy unavailable. Download the PNG instead."); }
  }
  return <>
    {capture ? <>
      <div className="demo-columns"><button aria-pressed={fit} onClick={() => setFit(true)}>Fit</button><button aria-pressed={!fit} onClick={() => setFit(false)}>100%</button><button onClick={() => { setCapture(null); setError(""); }}>Close</button></div>
      <div className={`demo-capture ${fit ? "demo-capture--fit" : ""}`}><img src={capture.url} alt="Captured sample page" width={capture.width} height={capture.height} /></div>
      <p className="demo-note">{capture.width} × {capture.height} · Sample page</p>
      <div className="demo-columns"><button onClick={() => void copy()}>Copy PNG</button><a href={capture.url} download="temoto-demo.png">Download PNG</a></div>
    </> : <>
      <button className="demo-action" disabled={busy} onClick={() => void take(false)}>Visible area <span>↗</span></button>
      <button className="demo-action" disabled={busy} onClick={() => void take(true)}>Full page <span>↗</span></button>
      <p className="demo-note">Capture a sample page and try the preview.</p>
    </>}
    <Failure message={error} />
  </>;
}

export function CssDemo() {
  const [selection, setSelection] = useState<{ selector: string; css: string } | null>(null);
  const { copy, error } = useCopy();
  function inspect(element: HTMLButtonElement, selector: string) {
    const style = getComputedStyle(element);
    const properties = ["width", "height", "padding", "font-family", "font-size", "font-weight", "color", "background-color", "border-radius"];
    setSelection({ selector, css: properties.map(property => `${property}: ${style.getPropertyValue(property)};`).join("\n") });
  }
  return <>
    <p className="demo-note">Select an element below to inspect its styles.</p>
    <div className="demo-inspect">
      <button className="demo-sample-title" aria-label="Less friction. — inspect heading" aria-pressed={selection?.selector === ".demo-sample-title"} onClick={event => inspect(event.currentTarget, ".demo-sample-title")}>Less friction.</button>
      <button className="demo-sample-button" aria-label="More doing — inspect button" aria-pressed={selection?.selector === ".demo-sample-button"} onClick={event => inspect(event.currentTarget, ".demo-sample-button")}>More doing →</button>
    </div>
    {selection && <pre className="demo-code"><code>{selection.css}</code></pre>}
    <div className="demo-columns"><button disabled={!selection} onClick={() => selection && void copy(selection.css)}>Copy CSS</button><button disabled={!selection} onClick={() => selection && void copy(selection.selector)}>Copy selector</button></div>
    <Failure message={error} />
  </>;
}

export function VideoDemo({ speed, onSpeedChange, active }: { speed: number; onSpeedChange: (speed: number) => void; active: boolean }) {
  const [paused, setPaused] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const change = (value: number) => onSpeedChange(Math.round(Math.min(5, Math.max(.25, value)) * 100) / 100);
  return <div ref={panel} tabIndex={-1} onKeyDown={event => {
    if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    const key = event.key.toLowerCase();
    if (!["g", "d", "s"].includes(key)) return;
    event.preventDefault();
    change(key === "g" ? (Math.abs(speed - 1.5) < .02 ? 1 : 1.5) : speed + (key === "d" ? .25 : -.25));
  }}>
    <output className="demo-speed" aria-live="polite">{speed}×</output>
    <div className="demo-columns">{[.5, 1, 1.5, 2].map(value => <button key={value} aria-pressed={speed === value} onClick={() => change(value)}>{value}×</button>)}</div>
    <div className="demo-columns"><button onClick={() => change(speed - .05)}>−0.05</button><button onClick={() => change(speed + .05)}>+0.05</button></div>
    <button className="demo-motion" aria-label={paused ? "Play sample animation" : "Pause sample animation"} onClick={() => setPaused(!paused)} style={{ "--duration": `${3 / speed}s`, "--play-state": paused || !active ? "paused" : "running" } as CSSProperties}><span />{paused ? "Play" : "Pause"}</button>
    <p className="demo-note">Click a control, then try <kbd>G</kbd> <kbd>D</kbd> <kbd>S</kbd>.</p>
  </div>;
}

type Profile = { id: number; name: string; mode: "fixed" | "pac"; protocol: string; host: string; port: string; url: string };
const emptyProfile: Profile = { id: 0, name: "", mode: "fixed", protocol: "http", host: "", port: "8080", url: "" };

export function ProxyDemo() {
  const [profiles, setProfiles] = useState<Profile[]>([{ ...emptyProfile, id: 1, name: "Work", host: "proxy.example.com" }, { ...emptyProfile, id: 2, name: "Studio", host: "studio.example.com", port: "3128" }]);
  const [active, setActive] = useState<number | null>(null);
  const [draft, setDraft] = useState<Profile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const nextId = useRef(3);
  function edit(profile: Profile) { setDraft({ ...profile }); setDeleting(false); }
  function field(key: keyof Profile, value: string) { setDraft(previous => previous ? { ...previous, [key]: value } : null); }
  return <>
    <p className="demo-note">Demo profiles · your network stays unchanged.</p>
    {draft ? <form className="demo-form" onSubmit={event => {
      event.preventDefault();
      const saved = { ...draft, name: draft.name.trim(), host: draft.host.trim(), url: draft.url.trim(), id: draft.id || nextId.current++ };
      if (!saved.name || (saved.mode === "fixed" && !saved.host)) return;
      setProfiles(previous => draft.id ? previous.map(profile => profile.id === draft.id ? saved : profile) : [...previous, saved]);
      setDraft(null);
    }}>
      <label>Name<input required maxLength={60} value={draft.name} onChange={event => field("name", event.target.value)} /></label>
      <label>Mode<select value={draft.mode} onChange={event => field("mode", event.target.value)}><option value="fixed">Fixed server</option><option value="pac">PAC URL</option></select></label>
      {draft.mode === "fixed" ? <>
        <label>Protocol<select value={draft.protocol} onChange={event => field("protocol", event.target.value)}>{["http", "https", "socks4", "socks5"].map(protocol => <option key={protocol} value={protocol}>{protocol.toUpperCase()}</option>)}</select></label>
        <label>Host<input required pattern={"[^\\s\\/]+"} value={draft.host} placeholder="proxy.example.com" onChange={event => field("host", event.target.value)} /></label>
        <label>Port<input required type="number" min={1} max={65535} value={draft.port} onChange={event => field("port", event.target.value)} /></label>
      </> : <label>PAC URL<input required type="url" pattern="https?://.+" value={draft.url} placeholder="https://example.com/proxy.pac" onChange={event => field("url", event.target.value)} /></label>}
      <div className="demo-columns"><button type="button" onClick={() => setDraft(null)}>Cancel</button><button type="submit">{draft.id === active ? "Save & reapply" : "Save"}</button></div>
      {draft.id > 0 && (deleting ? <div className="demo-delete"><p>Delete {draft.name || "this profile"}?</p><div className="demo-columns"><button type="button" onClick={() => setDeleting(false)}>Keep profile</button><button type="button" onClick={() => { setProfiles(previous => previous.filter(profile => profile.id !== draft.id)); if (active === draft.id) setActive(null); setDraft(null); }}>Delete profile</button></div></div> : <button type="button" className="demo-action" onClick={() => setDeleting(true)}>Delete…</button>)}
    </form> : <>
      <button className="demo-action" aria-pressed={active === null} onClick={() => setActive(null)}>Off <span>{active === null ? "✓" : ""}</span></button>
      {profiles.map(profile => <div className="demo-profile" key={profile.id}><button aria-pressed={active === profile.id} onClick={() => setActive(profile.id)}>{profile.name}<span>{active === profile.id ? "✓" : ""}</span></button><button aria-label={`Edit ${profile.name}`} onClick={() => edit(profile)}>Edit</button></div>)}
      <button className="demo-action" onClick={() => edit(emptyProfile)}>Add profile <span>+</span></button>
    </>}
  </>;
}
