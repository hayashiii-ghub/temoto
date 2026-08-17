import { deflateSync } from "node:zlib";

const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

function crc32(buffer) {
  let value = 0xffffffff;
  for (const byte of buffer) value = CRC_TABLE[(value ^ byte) & 0xff] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, checksum]);
}

function insideRotatedBar(x, y, centerX, centerY, width, height, angle) {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  const dx = x - centerX;
  const dy = y - centerY;
  const localX = dx * cosine + dy * sine;
  const localY = -dx * sine + dy * cosine;
  return Math.abs(localX) <= width / 2 && Math.abs(localY) <= height / 2;
}

export function createTemotoIcon(size) {
  const scale = 4;
  const highSize = size * scale;
  const rgba = Buffer.alloc(size * size * 4);
  const angle = Math.PI / 6;
  const purple = [153, 116, 248];
  // Match temoto-chrome/assets/temoto-mark.svg and its larger 48/128px optical treatment.
  const markScale = 1.68;
  const opticalScale = size >= 48 ? 1.08 : 1;
  const downwardOffset = size >= 48 ? 0.02 : 0;
  // Preserve the outer antialiased row produced by the canonical SVG rasterization.
  const rasterSeparation = size >= 32 ? 0.125 / size : 0;
  const barWidth = (420 / 1024) * markScale * opticalScale;
  const barHeight = (130 / 1024) * markScale * opticalScale;
  const outlineWidth = barHeight * 0.22;
  const innerBarWidth = barWidth - outlineWidth * 2;
  const innerBarHeight = barHeight - outlineWidth * 2;
  const centerY = (sourceY) => (
    0.5
    + (sourceY / 1024 - 0.5) * markScale * opticalScale
    + downwardOffset
    + (sourceY < 512 ? -rasterSeparation : rasterSeparation)
  );
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let coverage = 0;
      for (let sy = 0; sy < scale; sy += 1) {
        for (let sx = 0; sx < scale; sx += 1) {
          const px = (x * scale + sx + 0.5) / highSize;
          const py = (y * scale + sy + 0.5) / highSize;
          const topOuter = insideRotatedBar(px, py, 0.5, centerY(400), barWidth, barHeight, angle);
          const topInner = insideRotatedBar(px, py, 0.5, centerY(400), innerBarWidth, innerBarHeight, angle);
          const bottomOuter = insideRotatedBar(px, py, 0.5, centerY(600), barWidth, barHeight, angle);
          const bottomInner = insideRotatedBar(px, py, 0.5, centerY(600), innerBarWidth, innerBarHeight, angle);
          if ((topOuter && !topInner) || (bottomOuter && !bottomInner)) coverage += 1;
        }
      }
      const offset = (y * size + x) * 4;
      rgba[offset] = purple[0];
      rgba[offset + 1] = purple[1];
      rgba[offset + 2] = purple[2];
      rgba[offset + 3] = Math.round(255 * coverage / (scale * scale));
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y += 1) {
    const row = y * (size * 4 + 1);
    raw[row] = 0;
    rgba.copy(raw, row + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
