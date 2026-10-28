import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import test from "node:test";
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

test("the 16px panel retains a dark divider, white panels and transparent corners", () => {
  const { pixels } = renderPanelIcon(16);
  const pixel = (x, y) => [...pixels.subarray((y * 16 + x) * 4, (y * 16 + x) * 4 + 4)];
  assert.equal(pixel(0, 0)[3], 0);
  assert.deepEqual(pixel(4, 8), [255, 255, 255, 255]);
  assert.deepEqual(pixel(10, 8), [255, 255, 255, 255]);
  assert.ok(pixel(7, 8)[0] < 64, "the vertical divider must remain dark at 16px");
  assert.ok(pixel(4, 5)[0] < 64, "the horizontal divider must remain dark at 16px");
});

test("toolbar icons match the outline source at every supported size and background", () => {
  for (const background of ["light", "dark"]) {
    for (const size of [16, 24, 32, 48]) {
      const path = new URL(`../public/icons/toolbar-${background}-${size}.png`, import.meta.url);
      assert.deepEqual(decoded(readFileSync(path)), decoded(createToolbarIcon(size, background)));
      const icon = renderToolbarIcon(size, background);
      assert.equal(icon.width, size);
      assert.equal(icon.height, size);
      assert.equal(icon.pixels[3], 0, "corner must remain transparent");
    }
  }
});

test("the 16px toolbar divider is crisp and preserves transparent panel spaces", () => {
  for (const [background, channel] of [["light", 75], ["dark", 199]]) {
    const { pixels } = renderToolbarIcon(16, background);
    const pixel = (x, y) => [...pixels.subarray((y * 16 + x) * 4, (y * 16 + x) * 4 + 4)];
    assert.deepEqual(pixel(7, 8), [channel, channel, channel, 255]);
    assert.deepEqual(pixel(5, 6), [channel, channel, channel, 255]);
    assert.equal(pixel(5, 8)[3], 0);
    assert.equal(pixel(10, 8)[3], 0);
    assert.equal(pixel(8, 4)[3], 0);
  }
});

test("the website mark retains the approved toolbar outline geometry", () => {
  const shapes = (url) => [...readFileSync(url, "utf8").matchAll(/<(?:rect|path)\b[^>]*>/g)].map((match) => match[0].replace(/\s+/g, " ").replace(/\s*\/>$/, "/>"));
  assert.deepEqual(shapes(new URL("../icons/toolbar.svg", import.meta.url)), shapes(new URL("../../../site/public/temoto-mark.svg", import.meta.url)));
});
