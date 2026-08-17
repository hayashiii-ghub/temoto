import assert from "node:assert/strict";
import test from "node:test";
import { inflateSync } from "node:zlib";

import { createTemotoIcon } from "../scripts/icon-utils.mjs";

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

function alphaWeightedMeanY(image, fromX, toX) {
  let weightedY = 0;
  let totalAlpha = 0;
  for (let y = 0; y < image.height; y += 1) {
    for (let x = fromX; x < toX; x += 1) {
      const alpha = image.pixels[(y * image.width + x) * 4 + 3];
      weightedY += y * alpha;
      totalAlpha += alpha;
    }
  }
  return weightedY / totalAlpha;
}

test("proxy icons keep the temoto optical bounds", () => {
  const expectedBounds = new Map([
    [16, { x: 2, y: 0, width: 12, height: 15 }],
    [32, { x: 4, y: 1, width: 24, height: 29 }],
    [48, { x: 5, y: 1, width: 38, height: 46 }],
    [128, { x: 15, y: 4, width: 98, height: 120 }],
  ]);

  for (const [size, bounds] of expectedBounds) {
    assert.deepEqual(visibleBounds(decodeGeneratedPng(createTemotoIcon(size))), bounds);
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

test("proxy bars are hollow", () => {
  const image = decodeGeneratedPng(createTemotoIcon(128));
  const alphaAt = (x, y) => image.pixels[(y * image.width + x) * 4 + 3];

  assert.equal(alphaAt(64, 38), 0, "the center of the upper bar should be transparent");
  assert.equal(alphaAt(64, 89), 0, "the center of the lower bar should be transparent");
});

test("proxy bars descend from left to right like the temoto mark", () => {
  const image = decodeGeneratedPng(createTemotoIcon(128));
  const leftMeanY = alphaWeightedMeanY(image, 0, image.width / 2);
  const rightMeanY = alphaWeightedMeanY(image, image.width / 2, image.width);
  assert.ok(leftMeanY < rightMeanY, `expected left ${leftMeanY} to be above right ${rightMeanY}`);
});
