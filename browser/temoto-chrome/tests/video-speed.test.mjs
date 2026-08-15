import test from "node:test";
import assert from "node:assert/strict";

import {
  clampPlaybackSpeed,
  speedFromShortcut,
  speedToSliderPosition,
  sliderPositionToSpeed,
} from "../src/video-speed.ts";

test("playback speed is capped between 0.25x and 5x", () => {
  assert.equal(clampPlaybackSpeed(0), 0.25);
  assert.equal(clampPlaybackSpeed(0.1), 0.25);
  assert.equal(clampPlaybackSpeed(7), 5);
});

test("two thirds of the slider reaches 2x", () => {
  assert.ok(Math.abs(speedToSliderPosition(2) - (2000 / 3)) < 0.001);
  assert.equal(sliderPositionToSpeed(2000 / 3), 2);
  assert.equal(sliderPositionToSpeed(1000), 5);
});

test("video speed shortcuts use the requested increments", () => {
  assert.equal(speedFromShortcut("g", 3), 1.5);
  assert.equal(speedFromShortcut("G", 1.5), 1);
  assert.equal(speedFromShortcut("D", 1.5), 1.75);
  assert.equal(speedFromShortcut("s", 1.5), 1.25);
  assert.equal(speedFromShortcut("d", 5), 5);
  assert.equal(speedFromShortcut("x", 1.5), null);
});
