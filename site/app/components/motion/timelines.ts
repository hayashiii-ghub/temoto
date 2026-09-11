import { gsap } from "gsap";

export type Scene = "hero" | "pick" | "capture" | "inspect" | "proxy";
export type Playback = "static" | "ready" | "playing" | "paused" | "complete" | "reduced";
export type MotionController = { pause(): void; resume(): void; replay(): void; dispose(): void };

// One owner across the three independent client islands, not a per-frame React store.
let pauseActive: (() => void) | null = null;

function buildTimeline(root: HTMLElement, scene: Scene, small: boolean) {
  const q = (part: string) => root.querySelectorAll(`[data-part="${part}"]`);
  const tl = gsap.timeline({ paused: true, defaults: { ease: "power2.inOut" } });
  if (scene === "hero") {
    tl.fromTo(q("circle"), { scale: 0.9, transformOrigin: "50% 50%" }, { scale: 1, duration: 0.8 }, 0)
      .fromTo(q("triangle"), { y: -18 }, { y: 0, duration: 0.8 }, 0)
      .fromTo(q("cursor"), { opacity: 0, x: -50, y: -40 }, { opacity: 1, x: 0, y: 0, duration: 0.7 }, 0.8)
      .fromTo(q("pick"), { opacity: 0 }, { opacity: 1, duration: 0.3 }, 1.5)
      .to(q("pick"), { opacity: 0, duration: 0.3 }, 2.3)
      .fromTo(q("capture"), { opacity: 0, scale: 0.6, transformOrigin: "0% 0%" }, { opacity: 1, scale: 1, duration: 0.9 }, 2.6)
      .to(q("capture"), { opacity: 0, duration: 0.3 }, 4.5)
      .fromTo(q("inspect"), { opacity: 0 }, { opacity: 1, duration: 0.4 }, 4.8)
      .to(q("inspect"), { opacity: 0, duration: 0.5 }, 6.8)
      .to(q("cursor"), { opacity: 0, duration: 0.4 }, 6.8)
      .to({}, { duration: 0.7 }, 7.3);
    if (small) tl.timeScale(8 / 3);
  } else if (scene === "pick") {
    tl.fromTo(q("cursor"), { opacity: 0, x: -80, y: -45 }, { opacity: 1, x: 0, y: 0, duration: 0.9 }, 0)
      .fromTo(q("pick"), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.4 }, 0.9)
      .fromTo(q("circle"), { scale: 1, transformOrigin: "50% 50%" }, { scale: 1.04, duration: 0.2, yoyo: true, repeat: 1 }, 0.9)
      .to({}, { duration: 0.7 }, 1.3);
  } else if (scene === "capture") {
    tl.fromTo(q("capture"), { opacity: 0, scale: 0.1, transformOrigin: "0% 0%" }, { opacity: 1, scale: 1, duration: 1.2 }, 0)
      .fromTo(q("capture-preview"), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6 }, 1.2)
      .to({}, { duration: 0.7 }, 1.8);
  } else if (scene === "inspect") {
    tl.fromTo(q("inspect"), { opacity: 0 }, { opacity: 1, duration: 0.6 }, 0)
      .fromTo(q("selector"), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.5 }, 1.4)
      .to({}, { duration: 1.1 }, 1.9);
  } else {
    tl.fromTo(q("proxy-profile"), { opacity: 0.35 }, { opacity: 1, duration: 1 }, 0)
      .fromTo(q("proxy-route"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.5 }, 1)
      .fromTo(q("proxy-active"), { opacity: 0 }, { opacity: 1, duration: 0.25 }, 2.25)
      .fromTo(q("proxy-result"), { opacity: 0 }, { opacity: 1, duration: 0.5 }, 3)
      .to(q("proxy-result"), { opacity: 0, duration: 0.3 }, 4.3)
      .to(q("proxy-active"), { opacity: 0, duration: 0.3 }, 4.5)
      .to(q("proxy-route"), { strokeDashoffset: 1, duration: 0.8 }, 4.5)
      .fromTo(q("proxy-cleared"), { opacity: 0 }, { opacity: 1, duration: 0.4 }, 5.3)
      .to({}, { duration: 0.3 }, 5.7);
  }
  return tl;
}

export function mountMotion(root: HTMLElement, scene: Scene, notify: (status: Playback) => void, autoplay: boolean): MotionController {
  let timeline: gsap.core.Timeline | undefined;
  let playing = false;
  let reduced = false;
  let firstSetup = true;
  let disposed = false;
  const media = gsap.matchMedia();
  const stage = root.querySelector(".motion-stage") ?? root;

  function visible() {
    const rect = stage.getBoundingClientRect();
    return !document.hidden && rect.bottom > 0 && rect.top < window.innerHeight;
  }
  function pause() {
    if (!playing || !timeline) return;
    timeline.pause();
    playing = false;
    if (pauseActive === pause) pauseActive = null;
    notify("paused");
  }
  function start(restart: boolean) {
    if (reduced || !timeline || disposed) return;
    if (pauseActive && pauseActive !== pause) pauseActive();
    pauseActive = pause;
    playing = true;
    notify("playing");
    if (restart) timeline.restart();
    else timeline.play();
    if (!visible()) pause();
  }
  media.add({ small: "(max-width: 767px)", wide: "(min-width: 768px)", reduce: "(prefers-reduced-motion: reduce)" }, (context) => {
    reduced = Boolean(context.conditions?.reduce);
    timeline = buildTimeline(root, scene, Boolean(context.conditions?.small));
    timeline.eventCallback("onComplete", () => {
      playing = false;
      if (pauseActive === pause) pauseActive = null;
      if (!disposed) notify("complete");
    });
    timeline.progress(1, true).pause();
    playing = false;
    if (pauseActive === pause) pauseActive = null;
    notify(reduced ? "reduced" : scene === "proxy" ? "ready" : "complete");
    const shouldPlay = firstSetup && autoplay && !reduced && visible();
    firstSetup = false;
    if (shouldPlay) start(true);
    return () => { playing = false; timeline?.kill(); };
  }, root);

  const observer = new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) pause(); });
  observer.observe(stage);
  let lastWidth = stage.getBoundingClientRect().width;
  const resizeObserver = new ResizeObserver(() => {
    const width = stage.getBoundingClientRect().width;
    if (Math.abs(width - lastWidth) < 1) return;
    lastWidth = width;
    timeline?.progress(1, true).pause();
    playing = false;
    if (pauseActive === pause) pauseActive = null;
    if (!disposed) notify(reduced ? "reduced" : scene === "proxy" ? "ready" : "complete");
  });
  resizeObserver.observe(stage);
  const onVisibility = () => { if (document.hidden) pause(); };
  document.addEventListener("visibilitychange", onVisibility);
  return {
    pause,
    resume: () => start(false),
    replay: () => start(true),
    dispose() {
      disposed = true;
      observer.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      if (pauseActive === pause) pauseActive = null;
      media.revert();
    },
  };
}
