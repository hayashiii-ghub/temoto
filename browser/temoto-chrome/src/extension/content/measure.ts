((): void => {
  const message = (key: string, fallback: string, substitutions?: string | string[]) => chrome.i18n?.getMessage(key, substitutions) || fallback;
  const temotoWindow = window as typeof window & { __temotoMeasureCleanup?: () => void };
  temotoWindow.__temotoMeasureCleanup?.();
  const outline = document.createElement("div");
  const tooltip = document.createElement("div");
  const guide = document.createElement("div");
  const cursorStyle = document.createElement("style");
  Object.assign(outline.style, { position: "fixed", zIndex: "2147483646", pointerEvents: "none", border: "1px solid #f4f4f2", background: "rgba(244,244,242,.08)", display: "none" });
  Object.assign(tooltip.style, { position: "fixed", zIndex: "2147483647", pointerEvents: "none", maxWidth: "360px", padding: "9px 11px", border: "1px solid rgba(255,255,255,.2)", borderRadius: "10px", background: "#161616", color: "#f4f4f2", font: "11px/1.5 ui-monospace, SFMono-Regular, monospace", whiteSpace: "pre", boxShadow: "0 14px 36px rgba(0,0,0,.42)", display: "none" });
  Object.assign(guide.style, { position: "fixed", top: "16px", left: "50%", zIndex: "2147483647", pointerEvents: "none", maxWidth: "calc(100vw - 24px)", minHeight: "38px", padding: "0 11px", display: "flex", alignItems: "center", gap: "9px", transform: "translateX(-50%)", border: "1px solid rgba(255,255,255,.2)", borderRadius: "11px", background: "rgba(20,20,20,.94)", color: "#f4f4f2", font: "500 11px/1 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", whiteSpace: "nowrap", boxShadow: "0 14px 36px rgba(0,0,0,.42)", backdropFilter: "blur(16px)" });
  const status = document.createElement("span");
  const instruction = document.createElement("span");
  const keycap = document.createElement("kbd");
  const exitLabel = document.createElement("span");
  status.textContent = message("inspectStatus", "Inspecting");
  instruction.textContent = message("inspectInstruction", "Click to copy selector");
  keycap.textContent = "Esc";
  exitLabel.textContent = message("inspectExit", "Exit");
  Object.assign(status.style, { color: "#bca7d0" });
  Object.assign(instruction.style, { color: "#d0d0cd" });
  Object.assign(keycap.style, { padding: "4px 6px", border: "1px solid rgba(255,255,255,.2)", borderRadius: "6px", background: "rgba(255,255,255,.07)", color: "#f4f4f2", font: "500 9px/1 ui-monospace, SFMono-Regular, monospace", boxShadow: "inset 0 -1px 0 rgba(255,255,255,.12)" });
  Object.assign(exitLabel.style, { color: "#888885" });
  guide.setAttribute("role", "status");
  guide.append(status, instruction, keycap, exitLabel);
  cursorStyle.textContent = "html, html * { cursor: crosshair !important; }";
  document.documentElement.append(cursorStyle, outline, tooltip, guide);

  const selectorFor = (element: Element): string => {
    if (element.id) return `#${CSS.escape(element.id)}`;
    const parts: string[] = [];
    let node: Element | null = element;
    while (node && node.nodeType === 1 && parts.length < 4) {
      let part = node.localName;
      const classes = Array.from(node.classList).slice(0, 2);
      if (classes.length) part += `.${classes.map(CSS.escape).join(".")}`;
      const nodeName = node.localName;
      const siblings = node.parentElement ? Array.from(node.parentElement.children).filter((child) => child.localName === nodeName) : [];
      if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(node) + 1})`;
      parts.unshift(part);
      node = node.parentElement;
    }
    return parts.join(" > ");
  };

  let current: Element | null = null;
  const move = (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof Element) || target === outline || target === tooltip) return;
    current = target;
    const rect = target.getBoundingClientRect();
    const styles = getComputedStyle(target);
    Object.assign(outline.style, { display: "block", left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
    tooltip.textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)}\n${styles.fontSize} / ${styles.lineHeight}\n${styles.color}`;
    const left = Math.min(window.innerWidth - 220, Math.max(8, rect.left));
    const top = rect.top > 80 ? rect.top - 72 : Math.min(window.innerHeight - 72, rect.bottom + 8);
    Object.assign(tooltip.style, { display: "block", left: `${left}px`, top: `${top}px` });
  };
  const showToast = (text: string) => {
    const toast = document.createElement("div");
    toast.textContent = text;
    Object.assign(toast.style, { position: "fixed", left: "50%", bottom: "24px", zIndex: "2147483647", transform: "translateX(-50%)", padding: "10px 13px", border: "1px solid rgba(255,255,255,.2)", borderRadius: "10px", background: "#161616", color: "#f4f4f2", font: "12px -apple-system, sans-serif", boxShadow: "0 14px 36px rgba(0,0,0,.42)" });
    document.documentElement.appendChild(toast);
    setTimeout(() => toast.remove(), 1800);
  };
  const copy = async (event: MouseEvent) => {
    event.preventDefault(); event.stopPropagation();
    if (!current) return;
    const selector = selectorFor(current);
    try { await navigator.clipboard.writeText(selector); } catch {
      const area = document.createElement("textarea"); area.value = selector; document.body.appendChild(area); area.select(); document.execCommand("copy"); area.remove();
    }
    showToast(message("selectorCopied", `Copied ${selector}`, selector));
    cleanup();
  };
  const key = (event: KeyboardEvent) => { if (event.key === "Escape") cleanup(); };
  const cleanup = () => {
    document.removeEventListener("mousemove", move, true); document.removeEventListener("click", copy, true); window.removeEventListener("keydown", key, true); cursorStyle.remove(); outline.remove(); tooltip.remove(); guide.remove(); delete temotoWindow.__temotoMeasureCleanup;
  };
  temotoWindow.__temotoMeasureCleanup = cleanup;
  document.addEventListener("mousemove", move, true);
  document.addEventListener("click", copy, true);
  window.addEventListener("keydown", key, true);
})();
