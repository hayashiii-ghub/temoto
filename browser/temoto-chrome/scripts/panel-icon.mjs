import { readFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";

const panel = readFileSync(new URL("../icons/panel.svg", import.meta.url), "utf8");
const divider = /(<path d=")([^"]+)(" data-icon-16-d=")([^"]+)(")/;

export function renderPanelIcon(size) {
  if (![16, 32, 48, 128].includes(size)) throw new Error("Unsupported extension icon size");
  if (!divider.test(panel)) throw new Error("Panel icon is missing its 16px divider alignment");
  // At 16px, align the thin divider to the pixel grid rather than splitting it
  // across two gray pixels. Larger icons use the selected source geometry.
  const svg = size === 16 ? panel.replace(divider, "$1$4$3$4$5") : panel;
  return new Resvg(svg, { fitTo: { mode: "width", value: size } }).render();
}

export function createPanelIcon(size) {
  return renderPanelIcon(size).asPng();
}
