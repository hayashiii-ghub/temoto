"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MotionController, Scene, Playback } from "./timelines";

export function useMotion(initialScene: Scene, autoplay = false) {
  const root = useRef<HTMLDivElement>(null);
  const attachRoot = useCallback((node: HTMLDivElement | null) => { root.current = node; }, []);
  const controller = useRef<MotionController | null>(null);
  const requestedPlay = useRef(autoplay);
  const currentScene = useRef(initialScene);
  const [scene, setScene] = useState(initialScene);
  const [playback, setPlayback] = useState<Playback>("static");

  useEffect(() => {
    let disposed = false;
    let mounted: MotionController | undefined;
    // The page and completed diagrams are useful before the motion bundle loads.
    import("./timelines").then(({ mountMotion }) => {
      if (disposed || !root.current) return;
      const play = requestedPlay.current;
      requestedPlay.current = false;
      mounted = mountMotion(root.current, scene, setPlayback, play);
      controller.current = mounted;
    }).catch(() => {
      if (!disposed) setPlayback("static");
    });
    return () => {
      disposed = true;
      mounted?.dispose();
      controller.current = null;
    };
  }, [scene]);

  function select(next: Scene) {
    if (currentScene.current === next) return;
    currentScene.current = next;
    requestedPlay.current = true;
    controller.current?.pause();
    setScene(next);
  }

  function toggle() {
    if (playback === "playing") controller.current?.pause();
    else if (playback === "paused") controller.current?.resume();
    else controller.current?.replay();
  }

  return { root: attachRoot, scene, playback, select, toggle };
}
