export type ColorFormat = "hex" | "rgb" | "hsl";

export const COLOR_HISTORY_LIMIT = 8;

export function normalizeHexColor(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = /^#?([\da-f]{3}|[\da-f]{6})$/i.exec(value.trim());
  if (!match) return null;
  const hex = match[1].length === 3
    ? [...match[1]].map((digit) => digit.repeat(2)).join("")
    : match[1];
  return `#${hex.toUpperCase()}`;
}

export function formatColor(value: unknown, format: ColorFormat = "hex"): string {
  const hex = normalizeHexColor(value);
  if (!hex) return "";
  if (format === "hex") return hex;
  const channels = [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16));
  if (format === "rgb") return `rgb(${channels.join(", ")})`;
  const [red, green, blue] = channels.map((channel) => channel / 255);
  const maximum = Math.max(red, green, blue);
  const minimum = Math.min(red, green, blue);
  const difference = maximum - minimum;
  const lightness = (maximum + minimum) / 2;
  const saturation = difference === 0 ? 0 : difference / (1 - Math.abs(2 * lightness - 1));
  const hue = difference === 0 ? 0 : maximum === red
    ? ((green - blue) / difference + 6) % 6
    : maximum === green ? (blue - red) / difference + 2 : (red - green) / difference + 4;
  const round = (number: number) => Math.round(number * 10) / 10;
  return `hsl(${round(hue * 60) % 360}, ${round(saturation * 100)}%, ${round(lightness * 100)}%)`;
}

export function normalizeColorHistory(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const result: string[] = [];
  for (const candidate of value) {
    const color = normalizeHexColor(candidate);
    if (color && !result.includes(color)) result.push(color);
    if (result.length === COLOR_HISTORY_LIMIT) break;
  }
  return result;
}

export function addColorToHistory(history: unknown, color: unknown): string[] {
  const normalized = normalizeHexColor(color);
  return normalizeColorHistory(normalized ? [normalized, ...normalizeColorHistory(history)] : history);
}
