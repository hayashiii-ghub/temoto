import test from "node:test";
import assert from "node:assert/strict";
import { planFullPageFrames } from "../src/capture-plan.js";

test("duplicate viewport frames are removed without leaving a gap", () => {
  const frames = [
    { scrollY: 0 },
    { scrollY: 1320 },
    { scrollY: 2640 },
  ];
  const result = planFullPageFrames(frames, [false, true, false]);

  assert.equal(result.removedHeight, 1320);
  assert.deepEqual(result.renderFrames, [
    { index: 0, outputY: 0 },
    { index: 2, outputY: 1320 },
  ]);
});
