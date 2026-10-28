import { useRef, useState } from "react";
import { ColorDemo, ScreenshotDemo, CssDemo, VideoDemo, ProxyDemo } from "./tool-demos";

const tools = [
  { label: "Color Picker", icon: "eyedropper" },
  { label: "Screenshot", icon: "scan" },
  { label: "CSS", icon: "brackets-curly" },
  { label: "Video Speed", icon: "gauge", detail: "1.5×" },
  { label: "Proxy", icon: "arrows-left-right" },
] as const;

export function LauncherPreview({ brandMarkUrl }: { brandMarkUrl: string }) {
  const [active, setActive] = useState<number | null>(null);
  const [speed, setSpeed] = useState(1.5);
  const launcherButtons = useRef<(HTMLButtonElement | null)[]>([]);
  const backButton = useRef<HTMLButtonElement>(null);
  function close() {
    const previous = active;
    setActive(null);
    requestAnimationFrame(() => previous !== null && launcherButtons.current[previous]?.focus());
  }
  return (
    <div className="launcher-preview" role="group" aria-label="temoto’s five tools" aria-describedby="demo-note" onKeyDown={(event) => {
      if (event.key === "Escape" && active !== null) { event.preventDefault(); close(); }
    }}>
      <div className="launcher-preview__surface">
        {active === null ? <p className="launcher-preview__brand"><img src={brandMarkUrl} alt="" width={20} height={20} />temoto</p> : <div className="launcher-preview__header">
          <button ref={backButton} onClick={close} aria-label="Back to tools">←</button>
          <img className="launcher-preview__icon" src={`/tools/${tools[active].icon}.svg`} alt="" width={20} height={20} />
          <h2>{tools[active].label}</h2>
          <span>Demo</span>
        </div>}
        <ul className="launcher-preview__tools" hidden={active !== null}>
          {tools.map((tool, index) => (
            <li className="launcher-preview__row" key={tool.label}>
              <button ref={(element) => { launcherButtons.current[index] = element; }} onClick={() => {
                setActive(index);
                requestAnimationFrame(() => backButton.current?.focus());
              }}>
              <img
                className="launcher-preview__icon"
                src={`/tools/${tool.icon}.svg`}
                alt=""
                width={22}
                height={22}
              />
              <span className="launcher-preview__label">{tool.label}</span>
              {"detail" in tool ? (
                <span className="launcher-preview__detail">{`${speed}×`}</span>
              ) : null}
              </button>
            </li>
          ))}
        </ul>
        <section className="tool-demo" aria-label="Color Picker demo" hidden={active !== 0}><ColorDemo /></section>
        <section className="tool-demo" aria-label="Screenshot demo" hidden={active !== 1}><ScreenshotDemo /></section>
        <section className="tool-demo" aria-label="CSS demo" hidden={active !== 2}><CssDemo /></section>
        <section className="tool-demo" aria-label="Video Speed demo" hidden={active !== 3}><VideoDemo speed={speed} onSpeedChange={setSpeed} active={active === 3} /></section>
        <section className="tool-demo" aria-label="Proxy demo" hidden={active !== 4}><ProxyDemo /></section>
      </div>
    </div>
  );
}
