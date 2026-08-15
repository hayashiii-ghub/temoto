((): void => {
  const cleanupKey = "__temotoVideoSpeedShortcutCleanup";
  const temotoWindow = window as typeof window & { __temotoVideoSpeedShortcutCleanup?: () => void };
  temotoWindow.__temotoVideoSpeedShortcutCleanup?.();

  const trackedVideos = new Map<HTMLVideoElement, { badge: HTMLDivElement; onRateChange: () => void }>();
  let positionFrame: number | null = null;

  const videos = (): HTMLVideoElement[] => Array.from(document.querySelectorAll("video"));
  const clamp = (value: unknown): number => {
    const numericValue = Number(value);
    const speed = Number.isFinite(numericValue) ? numericValue : 1;
    return Math.round(Math.min(5, Math.max(0.25, speed)) * 100) / 100;
  };
  const formatSpeed = (speed: unknown): string => `${Number(clamp(speed).toFixed(2))}×`;
  const positionBadge = (video: HTMLVideoElement, badge: HTMLDivElement) => {
    const rect = video.getBoundingClientRect();
    const visible = rect.width >= 72
      && rect.height >= 40
      && rect.right > 0
      && rect.bottom > 0
      && rect.left < window.innerWidth
      && rect.top < window.innerHeight;

    badge.style.display = visible ? "block" : "none";
    if (!visible) return;
    badge.style.left = `${Math.round(rect.left + 8)}px`;
    badge.style.top = `${Math.round(rect.top + 8)}px`;
  };
  const positionBadges = () => {
    trackedVideos.forEach(({ badge }, video) => positionBadge(video, badge));
  };
  const schedulePosition = () => {
    if (positionFrame !== null) return;
    positionFrame = window.requestAnimationFrame(() => {
      positionFrame = null;
      positionBadges();
    });
  };
  const addVideo = (video: HTMLVideoElement) => {
    const badge = document.createElement("div");
    badge.dataset.temotoVideoSpeed = "";
    badge.setAttribute("aria-hidden", "true");
    Object.assign(badge.style, {
      position: "fixed",
      zIndex: "2147483647",
      pointerEvents: "none",
      boxSizing: "border-box",
      minWidth: "30px",
      padding: "2px 5px",
      border: "1px solid rgba(255,255,255,.09)",
      borderRadius: "4px",
      background: "rgba(8,8,8,.38)",
      color: "rgba(255,255,255,.72)",
      font: "500 10px/1.35 ui-monospace, SFMono-Regular, Menlo, Monaco, monospace",
      letterSpacing: "-.02em",
      textAlign: "center",
      textShadow: "0 1px 2px rgba(0,0,0,.45)",
      backdropFilter: "blur(5px)",
      WebkitBackdropFilter: "blur(5px)",
    });
    badge.textContent = formatSpeed(video.playbackRate);

    const onRateChange = () => {
      badge.textContent = formatSpeed(video.playbackRate);
      schedulePosition();
    };
    video.addEventListener("ratechange", onRateChange);
    (document.body || document.documentElement).append(badge);
    trackedVideos.set(video, { badge, onRateChange });
    positionBadge(video, badge);
  };
  const removeVideo = (video: HTMLVideoElement) => {
    const tracked = trackedVideos.get(video);
    if (!tracked) return;
    video.removeEventListener("ratechange", tracked.onRateChange);
    tracked.badge.remove();
    trackedVideos.delete(video);
  };
  const syncVideos = () => {
    const pageVideos = new Set(videos());
    trackedVideos.forEach((_, video) => {
      if (!pageVideos.has(video)) removeVideo(video);
    });
    pageVideos.forEach((video) => {
      if (!trackedVideos.has(video)) addVideo(video);
    });
    positionBadges();
  };
  const applySpeed = (rawSpeed: unknown): number => {
    const nextSpeed = clamp(Number(rawSpeed) || 1);
    const pageVideos = videos();
    pageVideos.forEach((video) => {
      video.playbackRate = nextSpeed;
      const tracked = trackedVideos.get(video);
      if (tracked) tracked.badge.textContent = formatSpeed(nextSpeed);
    });
    return pageVideos.length;
  };
  const isEditable = (event: Event): boolean => event.composedPath().some((node) => (
    node instanceof HTMLElement
    && (node.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(node.tagName))
  ));

  const onMessage = (message: { type?: string; speed?: unknown }) => {
    if (message?.type === "APPLY_VIDEO_SPEED") applySpeed(message.speed);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    if (!['g', 'd', 's'].includes(key) || event.metaKey || event.ctrlKey || event.altKey || isEditable(event)) return;

    const pageVideos = videos();
    if (!pageVideos.length) return;
    const currentSpeed = pageVideos[0].playbackRate || 1;
    const nextSpeed = key === "g"
      ? (clamp(currentSpeed) === 1.5 ? 1 : 1.5)
      : clamp(currentSpeed + (key === "d" ? 0.25 : -0.25));

    event.preventDefault();
    event.stopPropagation();
    applySpeed(nextSpeed);
    chrome.runtime.sendMessage({ type: "VIDEO_SPEED_SHORTCUT", speed: nextSpeed }).catch(() => {});
  };

  const observer = new MutationObserver(syncVideos);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  chrome.runtime.onMessage.addListener(onMessage);
  window.addEventListener("keydown", onKeyDown, true);
  window.addEventListener("scroll", schedulePosition, true);
  window.addEventListener("resize", schedulePosition);
  document.addEventListener("fullscreenchange", schedulePosition);
  syncVideos();

  temotoWindow.__temotoVideoSpeedShortcutCleanup = () => {
    observer.disconnect();
    if (positionFrame !== null) window.cancelAnimationFrame(positionFrame);
    trackedVideos.forEach((_, video) => removeVideo(video));
    chrome.runtime.onMessage.removeListener(onMessage);
    window.removeEventListener("keydown", onKeyDown, true);
    window.removeEventListener("scroll", schedulePosition, true);
    window.removeEventListener("resize", schedulePosition);
    document.removeEventListener("fullscreenchange", schedulePosition);
    delete temotoWindow.__temotoVideoSpeedShortcutCleanup;
  };
})();
