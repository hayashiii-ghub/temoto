export interface CaptureFrame {
  scrollY: number;
}

export interface PlannedCaptureFrame {
  index: number;
  outputY: number;
}

export function planFullPageFrames(
  frames: readonly CaptureFrame[],
  duplicateFlags: readonly boolean[],
): { renderFrames: PlannedCaptureFrame[] } {
  if (duplicateFlags.some((duplicate, index) => index > 0 && duplicate)) {
    throw new Error("Full-page capture could not capture every section. Please try again.");
  }

  return {
    renderFrames: frames.map((frame, index) => ({ index, outputY: frame.scrollY })),
  };
}
