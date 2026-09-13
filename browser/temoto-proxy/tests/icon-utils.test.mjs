import assert from "node:assert/strict";
import test from "node:test";
import { inflateSync } from "node:zlib";

import { createTemotoIcon } from "../scripts/icon-utils.mjs";
import { createTemotoIcon as createSolidIcon } from "../../shared/icon-utils.mjs";

function decodeGeneratedPng(buffer) {
  const signatureLength = 8;
  let offset = signatureLength;
  let width = 0;
  let height = 0;
  const imageChunks = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    offset += 12 + length;

    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      assert.equal(data[8], 8);
      assert.equal(data[9], 6);
    } else if (type === "IDAT") {
      imageChunks.push(data);
    } else if (type === "IEND") {
      break;
    }
  }

  const raw = inflateSync(Buffer.concat(imageChunks));
  const pixels = Buffer.alloc(width * height * 4);
  const rowLength = width * 4 + 1;
  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * rowLength;
    assert.equal(raw[rowOffset], 0, "generated PNG rows must use the no-filter encoding");
    raw.copy(pixels, y * width * 4, rowOffset + 1, rowOffset + rowLength);
  }
  return { width, height, pixels };
}

function visibleBounds(image) {
  let minX = image.width;
  let minY = image.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      if (image.pixels[(y * image.width + x) * 4 + 3] === 0) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

test("Joint icons preserve common bounds without the old optical zoom", () => {
  for (const size of [16, 32, 48, 128]) {
    const image = decodeGeneratedPng(createTemotoIcon(size));
    const solid = decodeGeneratedPng(createSolidIcon(size));
    assert.equal(image.width, size);
    assert.equal(image.height, size);
    assert.deepEqual(visibleBounds(image), visibleBounds(solid));
    const bounds = visibleBounds(image);
    assert.ok(bounds.x >= Math.floor(size * .1));
    assert.ok(bounds.y >= Math.floor(size * .05));
    assert.ok(bounds.x + bounds.width <= Math.ceil(size * .9));
    assert.ok(bounds.y + bounds.height <= Math.ceil(size * .95));
  }
});

test("proxy icons keep a transparent background and temoto purple", () => {
  const image = decodeGeneratedPng(createTemotoIcon(128));
  assert.equal(image.pixels[3], 0);

  for (let offset = 0; offset < image.pixels.length; offset += 4) {
    if (image.pixels[offset + 3] === 0) continue;
    assert.deepEqual([...image.pixels.subarray(offset, offset + 3)], [153, 116, 248]);
  }
});

test("Joint preserves two hollow blocks and the transparent diagonal seam", () => {
  const image = decodeGeneratedPng(createTemotoIcon(128));
  const solid = decodeGeneratedPng(createSolidIcon(128));
  const alphaAt = (target, x, y) => target.pixels[(Math.floor(y * .8) * 128 + Math.floor(x * .8)) * 4 + 3];
  for (const [x, y] of [[70, 30], [120, 136]]) {
    assert.equal(alphaAt(image, x, y), 0, "the inner region must remain hollow");
    assert.equal(alphaAt(solid, x, y), 255, "the core uses solid fills");
  }
  for (const target of [image, solid]) {
    assert.equal(alphaAt(target, 80, 88), 0, "the diagonal joint stays transparent");
    assert.equal(alphaAt(target, 55, 25), 255, "the vertical upper stem is present");
  }
});

test("small hollow icons stay distinguishable from the solid core", () => {
  for (const size of [16, 32, 48, 128]) {
    const hollow = decodeGeneratedPng(createTemotoIcon(size));
    const solid = decodeGeneratedPng(createSolidIcon(size));
    const alpha = (image) => image.pixels.reduce((sum, value, i) => sum + (i % 4 === 3 ? value : 0), 0);
    assert.ok(alpha(hollow) < alpha(solid) * .8);
    assert.ok(alpha(hollow) > alpha(solid) * .25);
  }
});
