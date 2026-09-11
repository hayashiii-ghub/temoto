import type { Playback } from "./timelines";

export function MotionControls({ playback, onToggle, label }: { playback: Playback; onToggle(): void; label: string }) {
  const text = playback === "playing" ? "Pause" : playback === "paused" ? "Resume" : playback === "ready" ? "Play demo" : "Replay";
  return <div className="motion-controls">
    {playback === "static" ? null : playback === "reduced" ? <span className="motion-reduced">Motion reduced</span> :
      <button className="motion-button" onClick={onToggle} type="button" aria-label={`${text} ${label}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          {playback === "playing" ? <path d="M8 5v14M16 5v14" /> : playback === "paused" || playback === "ready" ? <path d="m8 5 11 7-11 7Z" /> : <><path d="M20 8a9 9 0 1 0 1 7M20 3v6h-6" /></>}
        </svg>{text}
      </button>}
  </div>;
}
