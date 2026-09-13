import { readFileSync } from "node:fs";
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

// Canonical Joint geometry is shared by both independently built extensions.
const mark = readFileSync(new URL("./temoto-mark.svg", import.meta.url), "utf8");
function polygon(path) {
  const tokens = path.match(/[MHVLZ]|-?\d+(?:\.\d+)?/g);
  const points = [];
  let x = 0, y = 0;
  for (let i = 0; i < tokens.length;) {
    const command = tokens[i++];
    if (command === "Z") break;
    if (command === "M" || command === "L") { x = Number(tokens[i++]); y = Number(tokens[i++]); }
    else if (command === "H") x = Number(tokens[i++]);
    else if (command === "V") y = Number(tokens[i++]);
    else throw new Error("Joint mark requires absolute straight-line SVG paths");
    points.push([x, y]);
  }
  return points;
}
const outlines = [...mark.matchAll(/<path d="([^"]+)"/g)].map((match) => polygon(match[1]));
if (outlines.length !== 2) throw new Error("Joint mark must have exactly two paths");

function inside(x, y, points) {
  let hit = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [ax, ay] = points[i], [bx, by] = points[j];
    if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) hit = !hit;
  }
  return hit;
}

// Intersect inward-offset edges to preserve the SVG's square/miter joins.
function inset(points, distance) {
  const edges = points.map(([x, y], i) => {
    const [nx, ny] = points[(i + 1) % points.length];
    const dx = nx - x, dy = ny - y, length = Math.hypot(dx, dy);
    return { x: x - dy / length * distance, y: y + dx / length * distance, dx, dy };
  });
  return edges.map((edge, i) => {
    const prev = edges[(i + edges.length - 1) % edges.length];
    const t = ((edge.x - prev.x) * edge.dy - (edge.y - prev.y) * edge.dx)
      / (prev.dx * edge.dy - prev.dy * edge.dx);
    return [prev.x + t * prev.dx, prev.y + t * prev.dy];
  });
}

export function createTemotoIcon(size, { hollow = false } = {}) {
  if (![16, 32, 48, 128].includes(size)) throw new Error("Unsupported extension icon size");
  const scale = 8;
  const rgba = Buffer.alloc(size * size * 4);
  // The B mark already fills y=8..152; never apply the old bars' 108% zoom.
  // At 16px, a 1px inner stroke keeps the hollow companion legible.
  const inner = hollow ? outlines.map((points) => inset(points, size === 16 ? 10 : 6)) : [];
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let coverage = 0;
      for (let sy = 0; sy < scale; sy += 1) {
        for (let sx = 0; sx < scale; sx += 1) {
          const px = (x + (sx + .5) / scale) * 160 / size;
          const py = (y + (sy + .5) / scale) * 160 / size;
          if (outlines.some((points, i) => inside(px, py, points) && (!hollow || !inside(px, py, inner[i])))) coverage++;
        }
      }
      const offset = (y * size + x) * 4;
      rgba[offset] = 153;
      rgba[offset + 1] = 116;
      rgba[offset + 2] = 248;
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
