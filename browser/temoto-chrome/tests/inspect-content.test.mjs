import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const source = await readFile(new URL("../dist/client/content/measure.js", import.meta.url), "utf8");

function loadInspector({ language = "en", documentLanguage = "", preview = false, unlocalizedChrome = false, clipboardFails = false, fallbackSucceeds = false } = {}) {
  const documentListeners = new Map();
  const windowListeners = new Map();
  const frames = new Map();
  const clipboard = [];
  let nextFrame = 1;
  let fallbackCalls = 0;
  const styles = new WeakMap();
  const listen = (map, type, listener) => {
    if (!map.has(type)) map.set(type, new Set());
    map.get(type).add(listener);
  };
  class Node {
    constructor() { this.children = []; this.parentNode = null; this._text = ""; }
    append(...nodes) { for (const node of nodes) { node.remove(); node.parentNode = this; this.children.push(node); } }
    remove() { if (this.parentNode) this.parentNode.children = this.parentNode.children.filter((child) => child !== this); this.parentNode = null; }
    replaceChildren(...nodes) { for (const child of [...this.children]) child.remove(); this._text = ""; this.append(...nodes); }
    get textContent() { return this._text + this.children.map((child) => child.textContent).join(""); }
    set textContent(value) { this.replaceChildren(); this._text = value; }
    getRootNode() { let node = this; while (node.parentNode) node = node.parentNode; return node; }
    get isConnected() { const root = this.getRootNode(); return root === document || root instanceof ShadowRoot && root.host.isConnected; }
  }
  class ShadowRoot extends Node {
    constructor(host) { super(); this.host = host; this.activeElement = null; }
  }
  class Element extends Node {
    constructor(tagName = "div") {
      super(); this.localName = tagName; this.nodeType = 1; this.id = ""; this.dataset = {}; this.attributes = {};
      this.className = ""; this.hidden = false; this.disabled = false; this.listeners = new Map();
      this.style = { setProperty(property, value, priority) { this[property] = value; this[`${property}Priority`] = priority; } };
      this.rect = { left: 20, top: 100, width: 200, height: 80, bottom: 180 };
    }
    get parentElement() { return this.parentNode instanceof Element ? this.parentNode : null; }
    get classList() { return this.className.split(/\s+/).filter(Boolean); }
    setAttribute(name, value) { this.attributes[name] = value; }
    attachShadow() { this.shadowRoot = new ShadowRoot(this); return this.shadowRoot; }
    addEventListener(type, listener) { listen(this.listeners, type, listener); }
    getBoundingClientRect() { return this.rect; }
    focus() { const root = this.getRootNode(); if (root instanceof ShadowRoot) { root.activeElement = this; document.activeElement = root.host; } else document.activeElement = this; }
    select() { document.selectedText = this.value; this.focus(); }
  }
  const document = new Node();
  document.documentElement = new Element("html");
  document.documentElement.lang = documentLanguage;
  document.body = new Element("body");
  document.append(document.documentElement);
  document.documentElement.append(document.body);
  document.activeElement = document.body;
  document.createElement = (tagName) => new Element(tagName);
  document.createTextNode = (text) => { const node = new Node(); node.textContent = text; return node; };
  document.addEventListener = (type, listener) => listen(documentListeners, type, listener);
  document.removeEventListener = (type, listener) => documentListeners.get(type)?.delete(listener);
  document.execCommand = (command) => { assert.equal(command, "copy"); fallbackCalls++; if (fallbackSucceeds) clipboard.push(document.selectedText); return fallbackSucceeds; };
  const descendants = (node) => node.children.flatMap((child) => [child, ...descendants(child)]);
  const matchesPart = (element, part) => {
    const nth = part.match(/:nth-of-type\((\d+)\)$/);
    if (nth) {
      const siblings = element.parentElement?.children.filter((node) => node.localName === element.localName) || [];
      if (siblings.indexOf(element) + 1 !== Number(nth[1])) return false;
      part = part.slice(0, nth.index);
    }
    const id = part.startsWith("#") ? part.slice(1).replace(/\\(.)/g, "$1") : null;
    if (id !== null) return element.id === id;
    const [tag, ...classes] = part.split(".");
    return element.localName === tag && classes.every((name) => element.classList.includes(name));
  };
  document.querySelectorAll = (selector) => descendants(document).filter((candidate) => {
    if (!(candidate instanceof Element)) return false;
    let node = candidate;
    const parts = selector.split(" > ");
    for (let index = parts.length - 1; index >= 0; index--) {
      if (!node || !matchesPart(node, parts[index])) return false;
      node = node.parentElement;
    }
    return true;
  });
  const window = {
    innerWidth: 1024, innerHeight: 768,
    addEventListener(type, listener) { listen(windowListeners, type, listener); },
    removeEventListener(type, listener) { windowListeners.get(type)?.delete(listener); },
    requestAnimationFrame(callback) { const id = nextFrame++; frames.set(id, callback); return id; },
    cancelAnimationFrame(id) { frames.delete(id); },
  };
  const defaultStyles = {
    display: "block", position: "static", "box-sizing": "border-box", width: "200px", height: "80px",
    "min-width": "0px", "min-height": "0px", "max-width": "none", "max-height": "none",
    "font-family": '"Test Sans", sans-serif', "font-size": "16px", "font-weight": "400", "line-height": "24px",
    "letter-spacing": "normal", "text-align": "start", "text-decoration-line": "none", color: "rgb(245, 245, 245)",
    "background-color": "rgb(8, 8, 8)", "background-image": "none", "border-radius": "0px", "box-shadow": "none", opacity: "1", overflow: "visible",
    "flex-direction": "row", "flex-wrap": "nowrap", gap: "normal", "align-items": "normal", "justify-content": "normal",
    border: "0px none rgb(245, 245, 245)",
    ...Object.fromEntries(["top", "right", "bottom", "left"].flatMap((side) => [[`margin-${side}`, "0px"], [`padding-${side}`, "0px"], [`border-${side}`, "0px none rgb(245, 245, 245)"]])),
  };
  const context = vm.createContext({
    document, window, Element, HTMLElement: Element,
    navigator: { language, clipboard: { async writeText(value) { if (clipboardFails) throw new Error("blocked"); clipboard.push(value); } } },
    CSS: { escape: (value) => value.replace(/([^\w-])/g, "\\$1") },
    getComputedStyle(element) {
      const values = { ...defaultStyles, ...styles.get(element) };
      return new Proxy({ getPropertyValue: (property) => values[property] || "" }, {
        get(target, property) { return property in target ? target[property] : values[property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)] || ""; },
      });
    },
    ...(unlocalizedChrome ? { chrome: {} } : !preview ? { chrome: { i18n: { getUILanguage: () => language, getMessage: () => "" } } } : {}),
  });
  const start = () => vm.runInContext(source, context);
  start();
  const host = () => document.documentElement.children.find((node) => Object.hasOwn(node.dataset || {}, "temotoInspect"));
  const shadowNodes = () => descendants(host().shadowRoot);
  const byClass = (className) => shadowNodes().find((node) => node.className === className);
  const byText = (text) => shadowNodes().find((node) => node.localName === "button" && node.textContent === text);
  const event = (target, extra = {}) => {
    const path = [];
    let node = target;
    while (node) { path.push(node); node = node instanceof ShadowRoot ? node.host : node.parentNode; }
    return { target, composedPath: () => path, prevented: false, stopped: false, preventDefault() { this.prevented = true; }, stopImmediatePropagation() { this.stopped = true; }, ...extra };
  };
  const dispatch = (map, type, data) => { for (const listener of map.get(type) || []) { listener(data); if (data.stopped) break; } };
  const documentEvent = (type, target, extra) => { const data = event(target, extra); dispatch(documentListeners, type, data); return data; };
  return {
    start, document, clipboard, host, byClass, byText,
    make(tag = "div", id = "", parent = document.body, computed = {}) { const node = new Element(tag); node.id = id; parent.append(node); styles.set(node, computed); return node; },
    hover(target) { documentEvent("mousemove", target); },
    click(target) { return documentEvent("click", target); },
    async pressButton(text) { const button = byText(text); assert.ok(button, `missing button ${text}`); const data = documentEvent("click", button); if (!data.stopped && !button.disabled) dispatch(button.listeners, "click", data); await new Promise((resolve) => setImmediate(resolve)); return data; },
    escape() { const data = event(document.activeElement, { key: "Escape" }); dispatch(windowListeners, "keydown", data); return data; },
    resize() { dispatch(windowListeners, "resize", event(document.body)); },
    flushFrames() { for (const [id, callback] of [...frames]) { frames.delete(id); callback(); } },
    rows() { return Object.fromEntries(byClass("panel").children.find((node) => node.localName === "dl").children.map((row) => row.children.map((node) => node.textContent))); },
    css() { return shadowNodes().find((node) => node.localName === "pre").textContent; },
    setStyle(node, values) { styles.set(node, { ...styles.get(node), ...values }); },
    fallbackCalls: () => fallbackCalls,
    resources() { return { documentListeners: [...documentListeners.values()].reduce((sum, set) => sum + set.size, 0), windowListeners: [...windowListeners.values()].reduce((sum, set) => sum + set.size, 0), frames: frames.size, hosts: document.documentElement.children.filter((node) => Object.hasOwn(node.dataset || {}, "temotoInspect")).length, cursors: document.documentElement.children.filter((node) => node.localName === "style").length }; },
  };
}

test("click locks the actual clicked element even after hovering another, and own buttons remain usable", async () => {
  const app = loadInspector();
  const hovered = app.make("button", "hovered");
  const clicked = app.make("button", "clicked");
  app.hover(hovered);
  app.flushFrames();
  assert.match(app.byClass("tooltip").textContent, /button/);
  const click = app.click(clicked);
  assert.equal(click.prevented, true);
  assert.equal(click.stopped, true);
  assert.equal(app.byClass("element").textContent, "#clicked");
  assert.equal(app.byClass("panel").hidden, false);
  assert.equal(app.resources().cursors, 0);
  app.hover(hovered);
  app.flushFrames();
  assert.equal(app.byClass("element").textContent, "#clicked");
  const ownClick = await app.pressButton("Copy CSS");
  assert.equal(ownClick.prevented, false);
  assert.match(app.clipboard[0], /^#clicked \{/);
  assert.equal(app.byClass("feedback").textContent, "CSS copied");
});

test("CSS output groups current layout, spacing, type and surface values while omitting irrelevant defaults", async () => {
  const app = loadInspector();
  const target = app.make("article", "card", app.document.body, {
    display: "flex", gap: "12px", "align-items": "center", "justify-content": "space-between",
    "padding-top": "8px", "padding-right": "16px", "padding-bottom": "8px", "padding-left": "16px",
    "margin-top": "10px", "margin-right": "0px", "margin-bottom": "12px", "margin-left": "0px",
    "font-weight": "600", "border-radius": "4px", "box-shadow": "rgb(0, 0, 0) 0px 1px 4px",
    ...Object.fromEntries(["top", "right", "bottom", "left"].map((side) => [`border-${side}`, "1px solid rgb(70, 70, 70)"])),
  });
  app.click(target);
  await app.pressButton("Copy CSS");
  const css = app.clipboard[0];
  for (const expected of ["display: flex;", "gap: 12px;", "align-items: center;", "margin: 10px 0px 12px;", "padding: 8px 16px;", 'font-family: "Test Sans", sans-serif;', "font-size: 16px;", "font-weight: 600;", "line-height: 24px;", "color: rgb(245, 245, 245);", "background-color: rgb(8, 8, 8);", "border: 1px solid rgb(70, 70, 70);"]) assert.ok(css.includes(expected), expected);
  assert.match(css, /\n\n  margin:/);
  assert.doesNotMatch(css, /max-width: none|position: static|opacity: 1|letter-spacing: normal|background-image: none/);
  assert.ok(css.split("\n").length < 35);
  assert.equal(app.rows().Padding, "8px 16px");
  assert.equal(app.rows().Font, '"Test Sans", sans-serif');
});

test("clipboard and fallback failures are reported without false success or dismissing the readout", async () => {
  const app = loadInspector({ clipboardFails: true, fallbackSucceeds: false });
  app.click(app.make("div", "target"));
  await app.pressButton("Copy CSS");
  assert.equal(app.fallbackCalls(), 1);
  assert.deepEqual(app.clipboard, []);
  assert.match(app.byClass("feedback").textContent, /^Copy failed/);
  assert.equal(app.byClass("panel").hidden, false);
  assert.equal(app.host().shadowRoot.children.some((node) => node.localName === "textarea"), false);
  app.escape();
  assert.deepEqual(app.resources(), { documentListeners: 0, windowListeners: 0, frames: 0, hosts: 0, cursors: 0 });
});

test("a successful fallback copies the selected CSS and restores the copy button's focus", async () => {
  const app = loadInspector({ clipboardFails: true, fallbackSucceeds: true });
  app.click(app.make("div", "target"));
  await app.pressButton("Copy CSS");
  assert.equal(app.fallbackCalls(), 1);
  assert.match(app.clipboard[0], /^#target \{/);
  assert.equal(app.byClass("feedback").textContent, "CSS copied");
  assert.equal(app.host().shadowRoot.activeElement, app.byText("Copy CSS"));
});

test("selector copy verifies uniqueness across duplicate IDs and deeply repeated structures", async () => {
  const app = loadInspector();
  let target;
  for (const id of ["left", "right"]) {
    let parent = app.make("section", id);
    for (let depth = 0; depth < 5; depth++) parent = app.make("div", "", parent);
    const child = app.make("button", "duplicate", parent);
    if (id === "right") target = child;
  }
  app.click(target);
  await app.pressButton("Copy selector");
  const selector = app.clipboard[0];
  assert.notEqual(selector, "#duplicate");
  assert.deepEqual(app.document.querySelectorAll(selector), [target]);
  assert.match(selector, /^#right > /);
});

test("open-shadow elements can be inspected and copied without pretending they have a document selector", async () => {
  const app = loadInspector();
  const pageHost = app.make("custom-card", "page-host");
  const shadow = pageHost.attachShadow({ mode: "open" });
  const inner = app.make("button", "inner", shadow);
  app.click(inner);
  assert.equal(app.byText("Copy selector").disabled, true);
  assert.match(app.byClass("element").textContent, /No document selector/);
  await app.pressButton("Copy CSS");
  assert.match(app.clipboard[0], /^\.selected-element \{/);
});

test("resize refreshes a locked readout, selecting another restores the cursor, and close cleans resources and focus", async () => {
  const app = loadInspector();
  const originalFocus = app.document.activeElement;
  const target = app.make("div", "target");
  app.click(target);
  target.rect.width = 320.25;
  app.setStyle(target, { width: "320px", "font-size": "18px" });
  app.resize();
  app.flushFrames();
  assert.equal(app.rows().Size, "320.3 × 80 px");
  assert.match(app.css(), /font-size: 18px/);
  await app.pressButton("Select another");
  assert.equal(app.resources().cursors, 1);
  const another = app.make("span", "another");
  app.click(another);
  assert.equal(app.byClass("element").textContent, "#another");
  await app.pressButton("Exit · Esc");
  assert.deepEqual(app.resources(), { documentListeners: 0, windowListeners: 0, frames: 0, hosts: 0, cursors: 0 });
  assert.equal(app.document.activeElement, originalFocus);
});

test("starting again removes the previous instance and Esc cancels queued work", () => {
  const app = loadInspector();
  app.hover(app.make("div", "target"));
  assert.equal(app.resources().frames, 1);
  app.start();
  assert.deepEqual(app.resources(), { documentListeners: 2, windowListeners: 3, frames: 0, hosts: 1, cursors: 1 });
  app.hover(app.make("div", "next"));
  const event = app.escape();
  assert.equal(event.prevented, true);
  assert.equal(event.stopped, true);
  assert.deepEqual(app.resources(), { documentListeners: 0, windowListeners: 0, frames: 0, hosts: 0, cursors: 0 });
});

test("selecting before the hover frame runs cancels that frame and reports a removed selection on copy", async () => {
  const app = loadInspector();
  const target = app.make("div", "target");
  app.hover(target);
  assert.equal(app.resources().frames, 1);
  app.click(target);
  assert.equal(app.resources().frames, 0);
  target.remove();
  await app.pressButton("Copy CSS");
  assert.deepEqual(app.clipboard, []);
  assert.match(app.byClass("feedback").textContent, /element was removed/);
  app.escape();
  assert.deepEqual(app.resources(), { documentListeners: 0, windowListeners: 0, frames: 0, hosts: 0, cursors: 0 });
});

test("preview stays English in a Japanese browser without the chrome global", async () => {
  const app = loadInspector({ preview: true, language: "ja-JP" });
  assert.match(app.byClass("guide").textContent, /Click an element to inspect/);
  app.click(app.make("div", "target"));
  assert.ok(app.byText("Copy CSS"));
  await app.pressButton("Copy CSS");
  assert.equal(app.byClass("feedback").textContent, "CSS copied");
});

test("Japanese document and Chrome UI languages cannot change the inspector's English controls", () => {
  const preview = loadInspector({ language: "ja-JP", documentLanguage: "ja", unlocalizedChrome: true });
  assert.match(preview.byClass("guide").textContent, /Click an element to inspect/);
  const extension = loadInspector({ language: "ja-JP", documentLanguage: "ja" });
  assert.match(extension.byClass("guide").textContent, /Click an element to inspect/);
});
