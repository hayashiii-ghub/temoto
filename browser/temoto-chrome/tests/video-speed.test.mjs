import test from "node:test";
import assert from "node:assert/strict";

import {
  clampPlaybackSpeed,
  speedFromShortcut,
} from "../src/video-speed.ts";

test("playback speed is capped between 0.25x and 5x", () => {
  assert.equal(clampPlaybackSpeed(0), 0.25);
  assert.equal(clampPlaybackSpeed(0.1), 0.25);
  assert.equal(clampPlaybackSpeed(7), 5);
  assert.equal(clampPlaybackSpeed(NaN), 1);
  assert.equal(clampPlaybackSpeed(Infinity), 1);
});

test("speed controls preserve hundredths when applying a 0.05 step", () => {
  assert.equal(clampPlaybackSpeed(1.33), 1.33);
  assert.equal(clampPlaybackSpeed(1.33 + 0.05), 1.38);
  assert.equal(clampPlaybackSpeed(1.33 - 0.05), 1.28);
  assert.equal(clampPlaybackSpeed(1.333), 1.33);
});

test("video speed shortcuts use the requested increments", () => {
  assert.equal(speedFromShortcut("g", 3), 1.5);
  assert.equal(speedFromShortcut("G", 1.5), 1);
  assert.equal(speedFromShortcut("D", 1.5), 1.75);
  assert.equal(speedFromShortcut("s", 1.5), 1.25);
  assert.equal(speedFromShortcut("D", 1.33), 1.58);
  assert.equal(speedFromShortcut("s", 1.33), 1.08);
  assert.equal(speedFromShortcut("g", 1.49), 1.5);
  assert.equal(speedFromShortcut("d", 5), 5);
  assert.equal(speedFromShortcut("x", 1.5), null);
});
