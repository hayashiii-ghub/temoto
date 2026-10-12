import test from "node:test";
import assert from "node:assert/strict";
import { planFullPageFrames } from "../src/capture-plan.ts";

test("repeated imagery retains every correctly advanced section", () => {
  const frames = [
    { scrollY: 0, dataUrl: "same blank section" },
    { scrollY: 1320, dataUrl: "same blank section" },
    { scrollY: 2640, dataUrl: "same blank section" },
  ];

  assert.deepEqual(planFullPageFrames(frames).renderFrames.map((frame) => frame.outputY), [0, 1320, 2640]);
});

test("unique viewport frames keep their document positions", () => {
  const frames = [
    { scrollY: 0 },
    { scrollY: 1320 },
    { scrollY: 2640 },
  ];
  const result = planFullPageFrames(frames);

  assert.deepEqual(result.renderFrames, [
    { index: 0, outputY: 0 },
    { index: 1, outputY: 1320 },
    { index: 2, outputY: 2640 },
  ]);
});

test("missing, repeated and invalid page positions fail rather than exporting incomplete images", () => {
  for (const frames of [
    [{ scrollY: 800 }],
    [{ scrollY: 0 }, { scrollY: 0 }],
    [{ scrollY: 0 }, { scrollY: 800 }, { scrollY: 700 }],
    [{ scrollY: -1 }],
    [{ scrollY: NaN }],
  ]) {
    assert.throws(() => planFullPageFrames(frames), /could not capture every section/i);
  }
});
