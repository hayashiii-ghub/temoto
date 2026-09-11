"use client";

import { MotionControls } from "./controls";
import { useMotion } from "./use-motion";

export function ProxyRouteDemo() {
  const { root, playback, toggle } = useMotion("proxy");
  return <div className="proxy-demo" ref={root} data-scene="proxy" data-playback={playback}>
    <div className="demo-utilities"><span className="demo-disclaimer">Illustrative demo</span><MotionControls playback={playback} onToggle={toggle} label="proxy route demo" /></div>
    <div className="motion-stage proxy-stage" aria-hidden="true">
      <svg className="proxy-svg" viewBox="0 0 960 260">
        <path d="M100 130h760" className="route-base" />
        <path data-part="proxy-route" d="M145 130H470V80h320v50h40" pathLength="1" className="route-active" />
        <circle cx="108" cy="130" r="35" className="route-node" /><rect x="85" y="114" width="46" height="30" rx="2" className="shape-outline" /><path d="M97 151h23" className="shape-outline" />
        <g data-part="proxy-profile"><rect x="428" y="86" width="90" height="90" className="profile-node" /><path d="M451 116h44m-8-8 8 8-8 8M495 145h-44m8-8-8 8 8 8" className="shape-outline" /></g>
        <circle cx="850" cy="130" r="28" className="route-node" /><circle cx="850" cy="130" r="9" fill="var(--ink)" />
        <text x="68" y="213" className="route-label">Chrome</text><text x="406" y="213" className="route-label">Demo profile</text><text x="816" y="213" className="route-label">Website</text>
        <g data-part="proxy-active" className="scene-overlay"><text x="455" y="57" className="svg-label">Active</text></g>
        <g data-part="proxy-result" className="scene-overlay"><rect x="652" y="15" width="263" height="36" className="readout-box" /><text x="666" y="39" className="svg-label">Demo result: connection OK</text></g>
        <g data-part="proxy-cleared" className="proxy-cleared"><text x="22" y="39" className="svg-label">temoto override cleared</text></g>
      </svg>
    </div>
    <div className="proxy-mobile-readout" aria-hidden="true"><span data-part="proxy-active" className="scene-overlay">Demo profile active</span><span data-part="proxy-result" className="scene-overlay">Demo result: connection OK</span><span data-part="proxy-cleared">temoto override cleared</span></div>
    <p className="proxy-caption">Choose a profile. Check the connection. Clear temoto&apos;s override.</p>
    <span className="sr-only" aria-live="polite">{playback === "complete" || playback === "reduced" ? "Example complete: temoto override cleared. No browser settings were changed." : playback === "paused" ? "Proxy demonstration paused." : ""}</span>
  </div>;
}
