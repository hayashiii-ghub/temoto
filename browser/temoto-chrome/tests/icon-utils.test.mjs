import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import test from "node:test";
import { createTemotoIcon } from "../../shared/icon-utils.mjs";

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

test("checked-in Chrome icons match the shared solid Joint generator", () => {
  for (const size of [16, 32, 48, 128]) {
    assert.deepEqual(decoded(readFileSync(new URL(`../public/icons/icon-${size}.png`, import.meta.url))), decoded(createTemotoIcon(size)));
  }
});

test("the extension Joint paths match the approved website mark", () => {
  const paths = (url) => [...readFileSync(url, "utf8").matchAll(/<path d="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(paths(new URL("../../shared/temoto-mark.svg", import.meta.url)), paths(new URL("../../../site/public/temoto-mark.svg", import.meta.url)));
});
