import test from "node:test";
import assert from "node:assert/strict";
import { planFullPageFrames } from "../src/capture-plan.ts";

test("a persistent duplicate viewport fails instead of dropping page content", () => {
  const frames = [
    { scrollY: 0 },
    { scrollY: 1320 },
    { scrollY: 2640 },
  ];

  assert.throws(
    () => planFullPageFrames(frames, [false, true, false]),
    /could not capture every section/i,
  );
});

test("unique viewport frames keep their document positions", () => {
  const frames = [
    { scrollY: 0 },
    { scrollY: 1320 },
    { scrollY: 2640 },
  ];
  const result = planFullPageFrames(frames, [false, false, false]);

  assert.deepEqual(result.renderFrames, [
    { index: 0, outputY: 0 },
    { index: 1, outputY: 1320 },
    { index: 2, outputY: 2640 },
  ]);
});
