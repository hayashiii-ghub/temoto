((): void => {
  const temotoWindow = window as typeof window & { __temotoMeasureCleanup?: () => void };
  temotoWindow.__temotoMeasureCleanup?.();
  const words = {
    title: "CSS inspector",
    status: "Inspecting CSS",
    instruction: "Click an element to inspect",
    exit: "Exit",
    another: "Select another",
    css: "Copy CSS",
    selector: "Copy selector",
    size: "Size",
    margin: "Margin",
    padding: "Padding",
    font: "Font",
    text: "Text",
    color: "Color",
    background: "Background",
    layout: "Layout",
    border: "Border",
    values: "Current CSS values",
    scope: "Computed values for this element; parent styles and pseudo-elements are not included.",
    noSelector: "No document selector available",
    removed: "This element was removed. Select another.",
    copied: "CSS copied",
    failed: "Copy failed. Select the CSS below and press Ctrl+C / ⌘C.",
  };
  const host = document.createElement("div");
  host.dataset.temotoInspect = "";
  for (const [property, value] of Object.entries({ all: "initial", position: "fixed", inset: "0", "z-index": "2147483647", "pointer-events": "none", display: "block", transform: "none" })) {
    host.style.setProperty(property, value, "important");
  }
  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = `
    *, *::before, *::after { box-sizing: border-box; }
    [hidden] { display: none !important; }
    .outline { position: fixed; pointer-events: none; border: 1px solid #9974f8; background: #9974f810; }
    .guide, .panel, .tooltip { color-scheme: dark; color: #f4f4f2; background: #080808; border: 1px solid #484848; font: 12px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    .guide { position: fixed; top: 12px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 12px; max-width: calc(100vw - 24px); padding-left: 12px; pointer-events: auto; }
    .guide span { padding: 10px 0; }
    .guide strong { color: #bba4fb; white-space: nowrap; }
    .tooltip { position: fixed; padding: 6px 9px; font-family: ui-monospace, monospace; pointer-events: none; max-width: calc(100vw - 16px); }
    .panel { position: fixed; top: 12px; right: 12px; width: min(360px, calc(100vw - 24px)); max-height: calc(100vh - 24px); overflow: auto; pointer-events: auto; overscroll-behavior: contain; }
    header { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #484848; }
    h2 { font: 500 13px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; padding: 12px; }
    button { appearance: none; border: 0; border-radius: 0; background: transparent; color: inherit; font: inherit; padding: 11px 12px; cursor: pointer; min-height: 40px; }
    button:hover { background: #202020; }
    button:focus-visible { outline: 2px solid #bba4fb; outline-offset: -3px; }
    button:disabled { color: #777; cursor: default; }
    .close { border-left: 1px solid #484848; }
    .element { margin: 0; padding: 10px 12px; border-bottom: 1px solid #484848; color: #bba4fb; overflow-wrap: anywhere; font: 11px/1.5 ui-monospace, monospace; }
    dl { margin: 0; }
    .row { display: grid; grid-template-columns: 82px minmax(0, 1fr); border-bottom: 1px solid #303030; }
    dt, dd { margin: 0; padding: 8px 12px; }
    dt { color: #aaa; border-right: 1px solid #303030; }
    dd { overflow-wrap: anywhere; font: 11px/1.5 ui-monospace, monospace; }
    .swatch { display: inline-block; width: 10px; height: 10px; margin-right: 7px; border: 1px solid #777; vertical-align: -1px; }
    .actions { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid #484848; }
    .actions button + button { border-left: 1px solid #484848; }
    .primary { color: #c5b2fb; }
    .another { width: 100%; text-align: left; border-bottom: 1px solid #484848; }
    .feedback { padding: 8px 12px; margin: 0; min-height: 34px; overflow-wrap: anywhere; }
    details { border-top: 1px solid #303030; }
    summary { padding: 10px 12px; cursor: pointer; }
    summary:focus-visible { outline: 2px solid #bba4fb; outline-offset: -3px; }
    pre { margin: 0; padding: 0 12px 12px; white-space: pre-wrap; overflow-wrap: anywhere; user-select: text; color: #d8d8d5; font: 10px/1.6 ui-monospace, monospace; }
    .hint { margin: 0; padding: 9px 12px; border-top: 1px solid #303030; color: #aaa; font-size: 11px; }
    @media (prefers-color-scheme: light) {
      .guide, .panel, .tooltip { color-scheme: light; color: #161616; background: #f4f4f2; border-color: #c7c7c3; }
      header, .close, .element, .row, dt, .actions, .actions button + button, .another, details, .hint { border-color: #c7c7c3; }
      .guide strong, .element, .primary { color: #6540b8; }
      button:hover { background: #e8e8e5; }
      button:focus-visible, summary:focus-visible { outline-color: #6540b8; }
      button:disabled, dt, .hint { color: #62625e; }
      .swatch { border-color: #62625e; }
      pre { color: #161616; }
    }
    @media (forced-colors: active) { .outline { border: 2px solid Highlight; } button:focus-visible { outline-color: Highlight; } }
  `;
  const create = <K extends keyof HTMLElementTagNameMap>(tag: K, className = "", text = ""): HTMLElementTagNameMap[K] => {
    const node = document.createElement(tag);
    node.className = className;
    node.textContent = text;
    return node;
  };
  const outline = create("div", "outline");
  const tooltip = create("div", "tooltip");
  const guide = create("div", "guide");
  guide.setAttribute("role", "status");
  const guideExit = create("button", "close", `${words.exit} · Esc`);
  guideExit.type = "button";
  guide.append(create("strong", "", words.status), create("span", "", words.instruction), guideExit);
  const panel = create("section", "panel");
  panel.setAttribute("aria-label", words.title);
  panel.setAttribute("role", "region");
  const header = create("header");
  const close = create("button", "close", `${words.exit} · Esc`);
  close.type = "button";
  header.append(create("h2", "", `temoto · ${words.title}`), close);
  const elementLabel = create("p", "element");
  const readout = create("dl");
  const values = new Map<string, HTMLElement>();
  for (const [key, label] of Object.entries({ size: words.size, margin: words.margin, padding: words.padding, font: words.font, text: words.text, color: words.color, background: words.background, layout: words.layout, border: words.border })) {
    const row = create("div", "row");
    const value = create("dd");
    values.set(key, value);
    row.append(create("dt", "", label), value);
    readout.append(row);
  }
  const actions = create("div", "actions");
  const copyCss = create("button", "primary", words.css);
  const copySelector = create("button", "", words.selector);
  copyCss.type = copySelector.type = "button";
  actions.append(copyCss, copySelector);
  const another = create("button", "another", words.another);
  another.type = "button";
  const feedback = create("p", "feedback");
  feedback.setAttribute("role", "status");
  feedback.setAttribute("aria-live", "polite");
  const details = create("details");
  details.open = true;
  const code = create("pre");
  details.append(create("summary", "", words.values), code);
  panel.append(header, elementLabel, readout, actions, another, feedback, details, create("p", "hint", words.scope));
  outline.hidden = tooltip.hidden = panel.hidden = true;
  shadow.append(style, outline, tooltip, guide, panel);
  document.documentElement.append(host);
  const cursorStyle = create("style");
  cursorStyle.textContent = "html, html * { cursor: crosshair !important; }";
  document.documentElement.append(cursorStyle);
  const previousFocus = document.activeElement;

  const selectorFor = (element: Element): string | null => {
    if (element.getRootNode() !== document) return null;
    const unique = (selector: string): boolean => {
      try {
        const matches = document.querySelectorAll(selector);
        return matches.length === 1 && matches[0] === element;
      } catch { return false; }
    };
    const parts: string[] = [];
    for (let node: Element | null = element; node; node = node.parentElement) {
      if (node.id) {
        const candidate = [`#${CSS.escape(node.id)}`, ...parts].join(" > ");
        if (unique(candidate)) return candidate;
      }
      let part = CSS.escape(node.localName);
      const classes = Array.from(node.classList).slice(0, 2);
      if (classes.length) part += `.${classes.map((name) => CSS.escape(name)).join(".")}`;
      const simple = [part, ...parts].join(" > ");
      if (unique(simple)) return simple;
      const siblings = node.parentElement ? Array.from(node.parentElement.children).filter((child) => child.localName === node!.localName) : [];
      if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(node) + 1})`;
      parts.unshift(part);
      const candidate = parts.join(" > ");
      if (unique(candidate)) return candidate;
    }
    return null;
  };
  const shorthand = (s: CSSStyleDeclaration, prefix: string): string => {
    const [top, right, bottom, left] = ["top", "right", "bottom", "left"].map((side) => s.getPropertyValue(`${prefix}-${side}`) || "0px");
    if (top === right && top === bottom && top === left) return top;
    if (top === bottom && right === left) return `${top} ${right}`;
    if (right === left) return `${top} ${right} ${bottom}`;
    return `${top} ${right} ${bottom} ${left}`;
  };
  const cssFor = (s: CSSStyleDeclaration, selector: string | null): string => {
    const group = (properties: string[], skip: Record<string, string[]> = {}): string[] => properties.flatMap((property) => {
      const value = s.getPropertyValue(property);
      return value && !skip[property]?.includes(value) ? [`  ${property}: ${value};`] : [];
    });
    const layout = group(["display", "position", "box-sizing", "width", "height", "max-width", "max-height", "min-width", "min-height"], { position: ["static"], "box-sizing": ["content-box"], "max-width": ["none"], "max-height": ["none"], "min-width": ["0px", "auto"], "min-height": ["0px", "auto"] });
    if (s.position !== "static") layout.push(...group(["top", "right", "bottom", "left", "z-index"], Object.fromEntries(["top", "right", "bottom", "left", "z-index"].map((property) => [property, ["auto"]]))));
    layout.push(...group(["flex-grow", "flex-shrink", "flex-basis", "align-self", "order"], { "flex-grow": ["0"], "flex-shrink": ["1"], "flex-basis": ["auto"], "align-self": ["auto"], order: ["0"] }));
    if (/flex|grid/.test(s.display)) {
      layout.push(...group([...(s.display.includes("flex") ? ["flex-direction", "flex-wrap"] : ["grid-template-columns", "grid-template-rows"]), "gap", "align-items", "justify-content"], { "flex-direction": ["row"], "flex-wrap": ["nowrap"], "grid-template-columns": ["none"], "grid-template-rows": ["none"], gap: ["normal", "0px", "0px 0px"], "align-items": ["normal"], "justify-content": ["normal"] }));
    }
    const spacing = [`  margin: ${shorthand(s, "margin")};`, `  padding: ${shorthand(s, "padding")};`];
    const type = group(["font-family", "font-size", "font-weight", "font-style", "line-height", "letter-spacing", "text-align", "text-transform", "text-decoration-line"], { "font-style": ["normal"], "letter-spacing": ["normal", "0px"], "text-align": ["start"], "text-transform": ["none"], "text-decoration-line": ["none"] });
    const surface = group(["color", "background-color", "background-image", "border-radius", "box-shadow", "opacity", "overflow"], { "background-image": ["none"], "border-radius": ["0px"], "box-shadow": ["none"], opacity: ["1"], overflow: ["visible"] });
    const borders = ["top", "right", "bottom", "left"].map((side) => s.getPropertyValue(`border-${side}`));
    const visibleBorder = (value: string): boolean => Boolean(value) && !/^(0px\b|.*\bnone\b)/.test(value);
    if (borders.every((value) => value === borders[0])) {
      if (visibleBorder(borders[0])) surface.push(`  border: ${borders[0]};`);
    } else {
      borders.forEach((value, index) => { if (visibleBorder(value)) surface.push(`  border-${["top", "right", "bottom", "left"][index]}: ${value};`); });
    }
    return `${selector || ".selected-element"} {\n${[layout, spacing, type, surface].filter((section) => section.length).map((section) => section.join("\n")).join("\n\n")}\n}`;
  };
  let selected: Element | null = null;
  let hovered: Element | null = null;
  let selecting = true;
  let ended = false;
  let copying = false;
  let frame = 0;
  const isOwnEvent = (event: Event): boolean => event.composedPath().includes(host);
  const eventElement = (event: Event): Element | null => {
    const target = event.composedPath().find((entry) => entry instanceof Element);
    return target instanceof Element ? target : null;
  };
  const number = (value: number): string => String(Math.round(value * 10) / 10);
  const highlight = (target: Element): DOMRect => {
    const rect = target.getBoundingClientRect();
    Object.assign(outline.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
    outline.hidden = false;
    return rect;
  };
  const showColor = (key: string, color: string) => {
    const value = values.get(key)!;
    const swatch = create("i", "swatch");
    swatch.style.backgroundColor = color;
    swatch.setAttribute("aria-hidden", "true");
    value.replaceChildren(swatch, document.createTextNode(color));
  };
  const refresh = () => {
    if (frame) { window.cancelAnimationFrame(frame); frame = 0; }
    const target = selecting ? hovered : selected;
    if (!target?.isConnected) {
      outline.hidden = tooltip.hidden = true;
      if (selected) { copyCss.disabled = copySelector.disabled = true; feedback.textContent = words.removed; }
      return;
    }
    const rect = highlight(target);
    if (selecting) {
      tooltip.textContent = `${target.localName} · ${number(rect.width)} × ${number(rect.height)}`;
      Object.assign(tooltip.style, { left: `${Math.max(8, Math.min(rect.left, window.innerWidth - 220))}px`, top: `${Math.max(8, Math.min(rect.bottom + 8, window.innerHeight - 40))}px` });
      tooltip.hidden = false;
      return;
    }
    const s = getComputedStyle(target);
    const selector = selectorFor(target);
    elementLabel.textContent = selector || `${target.localName} · ${words.noSelector}`;
    values.get("size")!.textContent = `${number(rect.width)} × ${number(rect.height)} px`;
    values.get("margin")!.textContent = shorthand(s, "margin");
    values.get("padding")!.textContent = shorthand(s, "padding");
    values.get("font")!.textContent = s.fontFamily;
    values.get("text")!.textContent = `${s.fontSize} / ${s.lineHeight} · ${s.fontWeight}`;
    showColor("color", s.color);
    showColor("background", s.backgroundColor);
    const layout = [s.display, ...(s.position !== "static" ? [s.position] : []), ...(s.display.includes("flex") ? [s.flexDirection] : []), ...(s.display.includes("grid") ? [s.gridTemplateColumns] : []), ...(/flex|grid/.test(s.display) ? [`gap ${s.gap}`, s.alignItems, s.justifyContent] : [])];
    values.get("layout")!.textContent = layout.filter(Boolean).join(" · ");
    const borders = ["top", "right", "bottom", "left"].map((side) => s.getPropertyValue(`border-${side}`));
    const border = borders.every((value) => value === borders[0]) ? borders[0] : borders.map((value, index) => `${["T", "R", "B", "L"][index]} ${value}`).join(" · ");
    values.get("border")!.textContent = [border || "0px", ...(s.borderRadius !== "0px" ? [`radius ${s.borderRadius}`] : [])].filter(Boolean).join(" · ");
    code.textContent = cssFor(s, selector);
    copyCss.disabled = false;
    copySelector.disabled = !selector;
  };
  const scheduleRefresh = () => { if (!frame && !ended) frame = window.requestAnimationFrame(refresh); };
  const move = (event: MouseEvent) => {
    if (!selecting || isOwnEvent(event)) return;
    hovered = eventElement(event);
    scheduleRefresh();
  };
  const click = (event: MouseEvent) => {
    if (!selecting || isOwnEvent(event)) return;
    const target = eventElement(event);
    if (!target) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    selected = target;
    selecting = false;
    guide.hidden = tooltip.hidden = true;
    panel.hidden = false;
    cursorStyle.remove();
    feedback.textContent = "";
    refresh();
    copyCss.focus({ preventScroll: true });
  };
  const writeClipboard = async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); return true; }
    } catch { /* Some pages block clipboard access; selected text remains available. */ }
    if (ended) return false;
    const focus = shadow.activeElement || document.activeElement;
    const textarea = create("textarea");
    textarea.value = text;
    textarea.readOnly = true;
    Object.assign(textarea.style, { position: "fixed", top: "0", left: "0", opacity: "0", pointerEvents: "none" });
    shadow.append(textarea);
    try {
      textarea.select();
      return document.execCommand("copy");
    } catch { return false; } finally {
      textarea.remove();
      if (focus instanceof HTMLElement && focus.isConnected) focus.focus({ preventScroll: true });
    }
  };
  const copy = async (kind: "css" | "selector") => {
    if (copying || !selected || ended) return;
    refresh();
    if (!selected.isConnected) return;
    const selector = selectorFor(selected);
    const text = kind === "css" ? code.textContent : selector;
    if (!text) { feedback.textContent = words.noSelector; return; }
    copying = true;
    try {
      const copied = await writeClipboard(text);
      if (ended) return;
      feedback.textContent = copied ? (kind === "css" ? words.copied : `Copied ${selector}`) : words.failed;
      if (!copied) details.open = true;
    } finally { copying = false; }
  };
  const selectAnother = () => {
    selecting = true;
    selected = hovered = null;
    panel.hidden = outline.hidden = tooltip.hidden = true;
    guide.hidden = false;
    document.documentElement.append(cursorStyle);
  };
  const key = (event: KeyboardEvent) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    event.stopImmediatePropagation();
    cleanup();
  };
  const cleanup = () => {
    if (ended) return;
    ended = true;
    document.removeEventListener("mousemove", move, true);
    document.removeEventListener("click", click, true);
    window.removeEventListener("keydown", key, true);
    window.removeEventListener("scroll", scheduleRefresh, true);
    window.removeEventListener("resize", scheduleRefresh);
    if (frame) window.cancelAnimationFrame(frame);
    const restoreFocus = document.activeElement === host;
    cursorStyle.remove();
    host.remove();
    if (restoreFocus && previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
    if (temotoWindow.__temotoMeasureCleanup === cleanup) delete temotoWindow.__temotoMeasureCleanup;
  };
  close.addEventListener("click", cleanup);
  guideExit.addEventListener("click", cleanup);
  another.addEventListener("click", selectAnother);
  copyCss.addEventListener("click", () => { void copy("css"); });
  copySelector.addEventListener("click", () => { void copy("selector"); });
  temotoWindow.__temotoMeasureCleanup = cleanup;
  document.addEventListener("mousemove", move, true);
  document.addEventListener("click", click, true);
  window.addEventListener("keydown", key, true);
  window.addEventListener("scroll", scheduleRefresh, true);
  window.addEventListener("resize", scheduleRefresh);
})();
