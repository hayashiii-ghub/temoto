"use client";

import { PosterGeometry } from "./geometry";
import { MotionControls } from "./controls";
import { useMotion } from "./use-motion";

export function HeroMotion() {
  const { root, playback, toggle } = useMotion("hero", true);
  return <div className="hero-motion" ref={root} data-scene="hero" data-playback={playback}>
    <div className="motion-stage"><PosterGeometry /></div>
    <MotionControls playback={playback} onToggle={toggle} label="hero animation" />
  </div>;
}
