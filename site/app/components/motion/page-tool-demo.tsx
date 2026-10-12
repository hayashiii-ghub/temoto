"use client";

import { WorkbenchGeometry } from "./geometry";
import { MotionControls } from "./controls";
import { useMotion } from "./use-motion";

const demos = [
  { id: "pick", label: "Pick a color", copy: "Pick a color and copy HEX, RGB, or HSL.", readout: "HEX / #9974F8" },
  { id: "capture", label: "Capture the visible area", copy: "Capture the visible area or the full page, with no setup needed.", readout: "Visible area / PNG" },
  { id: "inspect", label: "Inspect CSS", copy: "Read size, spacing, fonts, and colors. Copy grouped CSS.", readout: "120 × 120 / padding: 24px / font-size: 16px / color: #9974F8" },
] as const;

export function PageToolDemo() {
  const { root, scene, playback, select, toggle } = useMotion("pick");
  const selected = demos.find((demo) => demo.id === scene) ?? demos[0];
  return <div className="page-demo" ref={root} data-scene={scene} data-playback={playback}>
    <div className="section-overline"><p className="eyebrow"><span>01 /</span> temoto</p><div className="demo-utilities"><span className="demo-disclaimer">Illustrative demo</span><MotionControls playback={playback} onToggle={toggle} label="page tools demo" /></div></div>
    <h2 id="chrome-title">Check the page you&apos;re on.</h2>
    <p className="demo-description" id="demo-description">{selected.copy}</p>
    <div className="motion-stage tool-stage"><WorkbenchGeometry /></div>
    <p className="demo-readout">{selected.readout}</p>
    {playback !== "static" ? <div className="demo-selector" role="group" aria-label="Page tool demonstrations">
      {demos.map((demo) => <button type="button" key={demo.id} aria-pressed={scene === demo.id} aria-describedby="demo-description" onClick={() => select(demo.id)}><span className="selection-dot" aria-hidden="true" />{demo.label}</button>)}
    </div> : <p className="static-demo-note">Color Picker · Screenshot · CSS</p>}
    <noscript><div className="static-scenes">
      <figure data-scene="capture"><WorkbenchGeometry /><figcaption>Capture the visible area — Capture the visible area or the full page, with no setup needed.</figcaption></figure>
      <figure data-scene="inspect"><WorkbenchGeometry /><figcaption>Inspect CSS — 120 × 120. padding: 24px; font-size: 16px; color: #9974F8. Copy grouped CSS.</figcaption></figure>
    </div></noscript>
    <span className="sr-only" aria-live="polite">{selected.label}{playback === "complete" ? ": demonstration complete." : playback === "paused" ? ": paused." : ""}</span>
  </div>;
}
