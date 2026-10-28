import { readFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";

const source = readFileSync(new URL("../icons/toolbar.svg", import.meta.url), "utf8");
const colors = { light: "#4b4b4b", dark: "#c7c7c7" };
const box = '<rect x="3.25" y="3.25" width="17.5" height="17.5" rx="2.5"/>';
const divider = '<path d="M3.5 9h17M12 9v11.5"/>';

export function renderToolbarIcon(size, background) {
  if (![16, 24, 32, 48].includes(size)) throw new Error("Unsupported toolbar icon size");
  if (!Object.hasOwn(colors, background)) throw new Error("Unsupported toolbar background");
  if (!source.includes(box) || !source.includes(divider) || !source.includes('stroke="#4b4b4b"') || !source.includes('stroke-width="1.6"')) {
    throw new Error("Toolbar icon source geometry is not recognized");
  }
  let svg = source.replace('stroke="#4b4b4b"', `stroke="${colors[background]}"`);
  if (size === 16) {
    // Align 1px strokes to pixel centers so the small divider remains crisp.
    svg = svg.replace('stroke-width="1.6"', 'stroke-width="1.5"')
      .replace(box, '<rect x="3.75" y="3.75" width="16.5" height="16.5" rx="3"/>')
      .replace(divider, '<path d="M3.75 9.75h16.5M11.25 9.75v10.5"/>');
  }
  return new Resvg(svg, { fitTo: { mode: "width", value: size } }).render();
}

export function createToolbarIcon(size, background) {
  return renderToolbarIcon(size, background).asPng();
}
