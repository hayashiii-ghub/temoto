import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import test from "node:test";
import { createPanelIcon, renderPanelIcon } from "../scripts/panel-icon.mjs";

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

test("the retained shared Joint paths match the website mark", () => {
  const paths = (url) => [...readFileSync(url, "utf8").matchAll(/<path d="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(paths(new URL("../../shared/temoto-mark.svg", import.meta.url)), paths(new URL("../../../site/public/temoto-mark.svg", import.meta.url)));
});
