((): void => {
  const temotoWindow = window as typeof window & { __temotoSelectionCleanup?: () => void };
  temotoWindow.__temotoSelectionCleanup?.();
  const root = document.createElement("div");
  const shade = document.createElement("div");
  const box = document.createElement("div");
  const hint = document.createElement("div");
  Object.assign(root.style, { position: "fixed", inset: "0", zIndex: "2147483647", cursor: "crosshair", userSelect: "none" });
  Object.assign(shade.style, { position: "absolute", inset: "0", background: "rgba(0,0,0,.34)", backdropFilter: "saturate(.65)" });
  Object.assign(box.style, { position: "absolute", display: "none", border: "1px solid #fff", boxShadow: "0 0 0 9999px rgba(0,0,0,.18)" });
  Object.assign(hint.style, { position: "absolute", top: "18px", left: "50%", transform: "translateX(-50%)", padding: "9px 12px", border: "1px solid rgba(255,255,255,.22)", borderRadius: "10px", background: "#171717", color: "#f4f4f2", font: "12px -apple-system, sans-serif", boxShadow: "0 12px 30px rgba(0,0,0,.35)" });
  hint.textContent = "Drag to select a capture area · Esc to cancel";
  root.append(shade, box, hint);
  document.documentElement.appendChild(root);

  let start: { x: number; y: number } | null = null;
  const cleanup = () => { root.remove(); window.removeEventListener("keydown", onKey, true); delete temotoWindow.__temotoSelectionCleanup; };
  const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") cleanup(); };
  temotoWindow.__temotoSelectionCleanup = cleanup;
  window.addEventListener("keydown", onKey, true);

  root.addEventListener("mousedown", (event) => {
    start = { x: event.clientX, y: event.clientY };
    box.style.display = "block";
    hint.style.display = "none";
  });
  root.addEventListener("mousemove", (event) => {
    if (!start) return;
    const x = Math.min(start.x, event.clientX);
    const y = Math.min(start.y, event.clientY);
    const width = Math.abs(event.clientX - start.x);
    const height = Math.abs(event.clientY - start.y);
    Object.assign(box.style, { left: `${x}px`, top: `${y}px`, width: `${width}px`, height: `${height}px` });
  });
  root.addEventListener("mouseup", (event) => {
    if (!start) return;
    const rect = { x: Math.min(start.x, event.clientX), y: Math.min(start.y, event.clientY), width: Math.abs(event.clientX - start.x), height: Math.abs(event.clientY - start.y) };
    if (rect.width < 8 || rect.height < 8) { start = null; box.style.display = "none"; hint.style.display = "block"; return; }
    cleanup();
    chrome.runtime.sendMessage({ type: "CAPTURE_REGION_SELECTED", rect, viewport: { width: window.innerWidth, height: window.innerHeight } });
  });
})();
