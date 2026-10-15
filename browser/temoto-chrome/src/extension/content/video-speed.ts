((): void => {
  const temotoWindow = window as typeof window & { __temotoVideoSpeedShortcutCleanup?: () => void };
  temotoWindow.__temotoVideoSpeedShortcutCleanup?.();

  type TrackedVideo = {
    badge: HTMLDivElement;
    onRateChange: () => void;
    onMediaChange: (event: Event) => void;
  };

  const mediaChangeEvents = ["loadstart", "emptied", "loadedmetadata", "play"] as const;
  const trackedVideos = new Map<HTMLVideoElement, TrackedVideo>();
  let positionFrame: number | null = null;
  let notificationScheduled = false;
  let mediaRevision = 0;
  let notifiedRevision = 0;
  let notifiedVideos: HTMLVideoElement[] = [];
  let notifiedRates: number[] = [];
  let notifiedSources: string[] = [];
  let stopped = false;
  let fontRequested = false;
  let badgeFont: FontFace | null = null;
  const badgeFontFamily = "temoto Geist Sans";
  const lightScheme = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-color-scheme: light)") : null;

  const isActive = (): boolean => {
    if (stopped) return false;
    try {
      if (chrome.runtime.id) return true;
    } catch {
      // Reloaded extensions leave their old content scripts in open pages.
    }
    cleanup();
    return false;
  };
  const onNotificationError = (error: unknown): void => {
    if (error && typeof error === "object" && "message" in error
      && error.message === "Extension context invalidated.") {
      cleanup();
    } else {
      isActive();
    }
  };
  const styleBadge = (badge: HTMLDivElement) => {
    Object.assign(badge.style, lightScheme?.matches ? {
      border: "1px solid rgba(8,8,8,.12)",
      background: "rgba(244,244,242,.88)",
      color: "rgba(8,8,8,.78)",
      textShadow: "none",
    } : {
      border: "1px solid rgba(255,255,255,.09)",
      background: "rgba(8,8,8,.38)",
      color: "rgba(255,255,255,.72)",
      textShadow: "0 1px 2px rgba(0,0,0,.45)",
    });
  };
  const syncBadgeTheme = () => {
    if (!isActive()) return;
    trackedVideos.forEach(({ badge }) => styleBadge(badge));
  };
  const loadBadgeFont = async (): Promise<void> => {
    if (fontRequested || !isActive()) return;
    if (typeof FontFace !== "function" || !document.fonts?.add || !document.fonts?.delete) return;
    fontRequested = true;
    try {
      const response = await chrome.runtime.sendMessage({ type: "GET_VIDEO_BADGE_FONT" }) as
        { ok?: boolean; bytes?: unknown } | undefined;
      if (!isActive()) return;
      if (!response?.ok || !Array.isArray(response.bytes) || !response.bytes.length
        || !response.bytes.every((byte) => Number.isInteger(byte) && byte >= 0 && byte <= 255)) return;
      // Fetching in the worker keeps page connection policies out of local font loading.
      const bytes = new Uint8Array(response.bytes).buffer;
      const face = new FontFace(badgeFontFamily, bytes, { weight: "100 900", style: "normal", display: "swap" });
      await face.load();
      if (!isActive()) return;
      document.fonts.add(face);
      badgeFont = face;
    } catch (error) {
      onNotificationError(error);
    }
  };

  const videos = (): HTMLVideoElement[] => Array.from(document.querySelectorAll("video"));
  const clamp = (value: unknown): number => {
    const numericValue = Number(value);
    const speed = Number.isFinite(numericValue) ? numericValue : 1;
    return Math.round(Math.min(5, Math.max(0.25, speed)) * 100) / 100;
  };
  const actualSpeed = (value: unknown): number => {
    const speed = Number(value);
    return Number.isFinite(speed) && speed > 0 ? speed : 1;
  };
  const formatSpeed = (speed: unknown): string => `${Number(actualSpeed(speed).toPrecision(6))}×`;
  const scheduleNotification = () => {
    if (!isActive() || notificationScheduled) return;
    notificationScheduled = true;
    queueMicrotask(() => {
      notificationScheduled = false;
      if (!isActive()) return;
      const pageVideos = videos();
      const rates = pageVideos.map((video) => actualSpeed(video.playbackRate));
      const sources = pageVideos.map((video) => video.currentSrc || video.src || "");
      if (mediaRevision === notifiedRevision
        && pageVideos.length === notifiedVideos.length
        && pageVideos.every((video, index) => video === notifiedVideos[index]
          && rates[index] === notifiedRates[index] && sources[index] === notifiedSources[index])) return;
      notifiedRevision = mediaRevision;
      notifiedVideos = pageVideos;
      notifiedRates = rates;
      notifiedSources = sources;
      try {
        chrome.runtime.sendMessage({
          type: "VIDEO_STATE_CHANGED",
          videoCount: pageVideos.length,
          playbackRate: rates[0] || 1,
        }).catch(onNotificationError);
      } catch (error) {
        onNotificationError(error);
      }
    });
  };
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
    if (!isActive()) return;
    trackedVideos.forEach(({ badge }, video) => positionBadge(video, badge));
  };
  const schedulePosition = () => {
    if (!isActive()) return;
    if (positionFrame !== null) return;
    positionFrame = window.requestAnimationFrame(() => {
      positionFrame = null;
      positionBadges();
    });
  };
  const syncBadge = (video: HTMLVideoElement) => {
    const tracked = trackedVideos.get(video);
    if (tracked) tracked.badge.textContent = formatSpeed(video.playbackRate);
  };
  const syncVideo = (video: HTMLVideoElement, mediaChanged = false) => {
    if (!isActive()) return;
    if (mediaChanged) mediaRevision++;
    syncBadge(video);
    schedulePosition();
    scheduleNotification();
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
      borderRadius: "4px",
      font: `600 12px/1.2 "${badgeFontFamily}", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
      fontVariantNumeric: "tabular-nums",
      letterSpacing: "-.01em",
      textAlign: "center",
      backdropFilter: "blur(5px)",
      WebkitBackdropFilter: "blur(5px)",
    });
    styleBadge(badge);
    badge.textContent = formatSpeed(video.playbackRate);

    const onRateChange = () => syncVideo(video);
    const onMediaChange = (event: Event) => syncVideo(video, event.type !== "play");
    video.addEventListener("ratechange", onRateChange);
    mediaChangeEvents.forEach((eventName) => video.addEventListener(eventName, onMediaChange));
    (document.body || document.documentElement).append(badge);
    trackedVideos.set(video, { badge, onRateChange, onMediaChange });
    positionBadge(video, badge);
    void loadBadgeFont();
  };
  const removeVideo = (video: HTMLVideoElement) => {
    const tracked = trackedVideos.get(video);
    if (!tracked) return;
    video.removeEventListener("ratechange", tracked.onRateChange);
    mediaChangeEvents.forEach((eventName) => video.removeEventListener(eventName, tracked.onMediaChange));
    tracked.badge.remove();
    trackedVideos.delete(video);
  };
  const syncVideos = () => {
    if (!isActive()) return;
    const pageVideos = new Set(videos());
    trackedVideos.forEach((_, video) => {
      if (!pageVideos.has(video)) removeVideo(video);
    });
    pageVideos.forEach((video) => {
      if (!trackedVideos.has(video)) addVideo(video);
    });
    positionBadges();
    scheduleNotification();
  };
  const applySpeed = (rawSpeed: unknown): number => {
    const nextSpeed = clamp(Number(rawSpeed) || 1);
    const pageVideos = videos();
    pageVideos.forEach((video) => {
      video.playbackRate = nextSpeed;
      syncBadge(video);
    });
    scheduleNotification();
    return pageVideos.length;
  };
  const isEditable = (event: Event): boolean => event.composedPath().some((node) => (
    node instanceof HTMLElement
    && (node.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(node.tagName))
  ));

  const onMessage = (
    message: { type?: string; speed?: unknown },
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: { changed: number }) => void,
  ) => {
    if (!isActive()) return;
    if (message?.type === "APPLY_VIDEO_SPEED") {
      sendResponse({ changed: applySpeed(message.speed) });
    }
  };
  const onKeyDown = (event?: KeyboardEvent) => {
    if (!isActive()) return;
    if (!event || typeof event.key !== "string") return;
    const key = event.key.toLowerCase();
    if (!['g', 'd', 's'].includes(key) || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || isEditable(event)) return;

    const pageVideos = videos();
    if (!pageVideos.length) return;
    const currentSpeed = pageVideos[0].playbackRate || 1;
    const nextSpeed = key === "g"
      ? (clamp(currentSpeed) === 1.5 ? 1 : 1.5)
      : clamp(currentSpeed + (key === "d" ? 0.25 : -0.25));

    event.preventDefault();
    event.stopPropagation();
    applySpeed(nextSpeed);
    try {
      // Context invalidation can throw before sendMessage returns a Promise.
      chrome.runtime.sendMessage({ type: "VIDEO_SPEED_SHORTCUT", speed: nextSpeed }).catch(onNotificationError);
    } catch (error) {
      onNotificationError(error);
    }
  };

  const observer = new MutationObserver(syncVideos);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  chrome.runtime.onMessage.addListener(onMessage);
  window.addEventListener("keydown", onKeyDown, true);
  window.addEventListener("scroll", schedulePosition, true);
  window.addEventListener("resize", schedulePosition);
  document.addEventListener("fullscreenchange", schedulePosition);
  lightScheme?.addEventListener("change", syncBadgeTheme);
  function cleanup(): void {
    if (stopped) return;
    stopped = true;
    lightScheme?.removeEventListener("change", syncBadgeTheme);
    if (badgeFont) {
      try {
        document.fonts.delete(badgeFont);
      } catch {
        // Font teardown must not retain stale video listeners or badges.
      }
      badgeFont = null;
    }
    observer.disconnect();
    if (positionFrame !== null) window.cancelAnimationFrame(positionFrame);
    positionFrame = null;
    trackedVideos.forEach((_, video) => removeVideo(video));
    window.removeEventListener("keydown", onKeyDown, true);
    window.removeEventListener("scroll", schedulePosition, true);
    window.removeEventListener("resize", schedulePosition);
    document.removeEventListener("fullscreenchange", schedulePosition);
    delete temotoWindow.__temotoVideoSpeedShortcutCleanup;
    try {
      chrome.runtime.onMessage.removeListener(onMessage);
    } catch {
      // The runtime API itself may already be unavailable during cleanup.
    }
  }
  temotoWindow.__temotoVideoSpeedShortcutCleanup = cleanup;
  syncVideos();
})();
