(() => {
  const cleanupKey = "__temotoVideoSpeedShortcutCleanup";
  window[cleanupKey]?.();

  const videos = () => Array.from(document.querySelectorAll("video"));
  const clamp = (value) => Math.round(Math.min(5, Math.max(0.25, value)) * 100) / 100;
  const isEditable = (event) => event.composedPath().some((node) => (
    node instanceof HTMLElement
    && (node.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(node.tagName))
  ));

  const onKeyDown = (event) => {
    const key = event.key.toLowerCase();
    if (!['g', 'd', 's'].includes(key) || event.metaKey || event.ctrlKey || event.altKey || isEditable(event)) return;

    const pageVideos = videos();
    if (!pageVideos.length) return;
    const currentSpeed = pageVideos[0].playbackRate || 1;
    const nextSpeed = key === "g" ? 1.5 : clamp(currentSpeed + (key === "d" ? 0.25 : -0.25));

    event.preventDefault();
    event.stopPropagation();
    pageVideos.forEach((video) => { video.playbackRate = nextSpeed; });
    chrome.runtime.sendMessage({ type: "VIDEO_SPEED_SHORTCUT", speed: nextSpeed }).catch(() => {});
  };

  window.addEventListener("keydown", onKeyDown, true);
  window[cleanupKey] = () => {
    window.removeEventListener("keydown", onKeyDown, true);
    delete window[cleanupKey];
  };
})();
