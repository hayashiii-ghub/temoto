import test from "node:test";
import assert from "node:assert/strict";
import { addColorToHistory, formatColor, normalizeColorHistory, normalizeHexColor } from "../src/color-utils.ts";

test("HEX values normalize to one six-digit uppercase form", () => {
  assert.equal(normalizeHexColor(" #9aF "), "#99AAFF");
  assert.equal(normalizeHexColor("9974f8"), "#9974F8");
  for (const value of [undefined, null, 123, "", "#abcd", "#12345678", "#12345g", "rgb(1, 2, 3)"]) {
    assert.equal(normalizeHexColor(value), null);
  }
});

test("color formats produce CSS color values including achromatic endpoints", () => {
  assert.equal(formatColor("#9974f8"), "#9974F8");
  assert.equal(formatColor("#9974f8", "rgb"), "rgb(153, 116, 248)");
  assert.equal(formatColor("#9974f8", "hsl"), "hsl(256.8, 90.4%, 71.4%)");
  assert.equal(formatColor("#ff0000", "hsl"), "hsl(0, 100%, 50%)");
  assert.equal(formatColor("#00ff00", "hsl"), "hsl(120, 100%, 50%)");
  assert.equal(formatColor("#0000ff", "hsl"), "hsl(240, 100%, 50%)");
  assert.equal(formatColor("#000", "hsl"), "hsl(0, 0%, 0%)");
  assert.equal(formatColor("#fff", "hsl"), "hsl(0, 0%, 100%)");
  assert.equal(formatColor("#808080", "hsl"), "hsl(0, 0%, 50.2%)");
  assert.equal(formatColor("invalid", "rgb"), "");
});

test("history excludes invalid and duplicate values and keeps only eight picks", () => {
  const history = ["#abc", "#AABBCC", "invalid", null, "#123456", ...Array.from({ length: 10 }, (_, index) => `#${index.toString(16).padStart(6, "0")}`)];
  assert.deepEqual(normalizeColorHistory(history), ["#AABBCC", "#123456", "#000000", "#000001", "#000002", "#000003", "#000004", "#000005"]);
  assert.deepEqual(normalizeColorHistory(undefined), []);
  assert.deepEqual(normalizeColorHistory("#9974F8"), []);
  assert.deepEqual(addColorToHistory(undefined, undefined), []);
});

test("picking a previous color moves it to the front without growing history", () => {
  const history = ["#AABBCC", "#9974F8", "#FFFFFF"];
  assert.deepEqual(addColorToHistory(history, " #9974f8 "), ["#9974F8", "#AABBCC", "#FFFFFF"]);
  assert.deepEqual(addColorToHistory(history, "invalid"), history);
  assert.deepEqual(history, ["#AABBCC", "#9974F8", "#FFFFFF"]);
});
