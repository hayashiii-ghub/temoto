import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import test from "node:test";
import { Resvg } from "@resvg/resvg-js";
import { createPanelIcon, renderPanelIcon } from "../scripts/panel-icon.mjs";
import { createToolbarIcon, renderToolbarIcon } from "../scripts/toolbar-icon.mjs";

// zlib compression can differ across supported Node versions; compare pixels.
function decoded(buffer) {
  const data = [];
  let header;
  for (let offset = 8; offset < buffer.length;) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const chunk = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") header = chunk;
    if (type === "IDAT") data.push(chunk);
    offset += length + 12;
  }
  return { header, pixels: inflateSync(Buffer.concat(data)) };
}

test("checked-in Chrome icons match the panel source", () => {
  for (const size of [16, 32, 48, 128]) {
    assert.deepEqual(decoded(readFileSync(new URL(`../public/icons/icon-${size}.png`, import.meta.url))), decoded(createPanelIcon(size)));
  }
});

test("large panel icons keep the white fill inside the opaque surface-colored border", () => {
  for (const size of [48, 128]) {
    const { pixels } = renderPanelIcon(size);
    for (let offset = 0; offset < pixels.length; offset += 4) {
      const [r, g, b, alpha] = pixels.subarray(offset, offset + 4);
      if (alpha > 0 && alpha < 255) {
        assert.ok([r, g, b].every((value, channel) => value <= [32, 33, 36][channel]), `${size}px outer edge must not contain a pale fringe`);
      }
    }
  }
});

test("the 16px panel retains a dark divider, white panels and transparent corners", () => {
  const { pixels } = renderPanelIcon(16);
  const pixel = (x, y) => [...pixels.subarray((y * 16 + x) * 4, (y * 16 + x) * 4 + 4)];
  assert.equal(pixel(0, 0)[3], 0);
  assert.deepEqual(pixel(4, 8), [255, 255, 255, 255]);
  assert.deepEqual(pixel(10, 8), [255, 255, 255, 255]);
  assert.ok(pixel(7, 8)[0] < 64, "the vertical divider must remain dark at 16px");
  assert.ok(pixel(4, 5)[0] < 64, "the horizontal divider must remain dark at 16px");
});

test("toolbar icons match the outline source at every supported size", () => {
  for (const size of [16, 24, 32, 48]) {
    const path = new URL(`../public/icons/toolbar-${size}.png`, import.meta.url);
    assert.deepEqual(decoded(readFileSync(path)), decoded(createToolbarIcon(size)));
    const icon = renderToolbarIcon(size);
    assert.equal(icon.width, size);
    assert.equal(icon.height, size);
    assert.equal(icon.pixels[3], 0, "corner must remain transparent");
  }
});

test("the 16px toolbar divider is crisp with white panels and transparent corners", () => {
  const { pixels } = renderToolbarIcon(16);
  const stroke = [32, 33, 36, 255];
  const pixel = (x, y) => [...pixels.subarray((y * 16 + x) * 4, (y * 16 + x) * 4 + 4)];
  assert.deepEqual(pixel(7, 8), stroke);
  assert.deepEqual(pixel(5, 6), stroke);
  assert.deepEqual(pixel(5, 8), [255, 255, 255, 255]);
  assert.deepEqual(pixel(10, 8), [255, 255, 255, 255]);
  assert.deepEqual(pixel(8, 4), [255, 255, 255, 255]);
  assert.equal(pixel(0, 0)[3], 0);
});

test("toolbar strokes retain contrast against their opaque panel at every size", () => {
  const luminance = (rgb) => rgb.map((value) => value / 255)
    .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
    .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
  for (const size of [16, 24, 32, 48]) {
    const { pixels } = renderToolbarIcon(size);
    const colors = [];
    for (let offset = 0; offset < pixels.length; offset += 4) {
      if (pixels[offset + 3] === 255) colors.push([...pixels.subarray(offset, offset + 3)]);
    }
    assert.ok(colors.some((rgb) => rgb.every((value) => value === 255)), "panel must stay opaque white");
    const stroke = Math.min(...colors.map(luminance));
    assert.ok(1.05 / (stroke + 0.05) >= 7, "dark stroke must contrast against the white panel");
  }
});

test("the website mark keeps the panel geometry with surface-colored strokes", () => {
  const panel = readFileSync(new URL("../icons/panel.svg", import.meta.url), "utf8");
  const mark = readFileSync(new URL("../../../site/public/temoto-mark.svg", import.meta.url), "utf8");
  assert.equal(mark, panel);
  const favicon = new Resvg(mark, { fitTo: { mode: "width", value: 32 } }).render().asPng();
  assert.deepEqual(decoded(readFileSync(new URL("../../../site/public/favicon-32.png", import.meta.url))), decoded(favicon));
});
