export interface CaptureFrame {
  scrollY: number;
}

export interface PlannedCaptureFrame {
  index: number;
  outputY: number;
}

export function planFullPageFrames(
  frames: readonly CaptureFrame[],
): { renderFrames: PlannedCaptureFrame[] } {
  if (!frames.length || frames.some((frame, index) => (
    !Number.isFinite(frame.scrollY)
    || frame.scrollY < 0
    || (index === 0 ? frame.scrollY > 1 : frame.scrollY <= frames[index - 1].scrollY)
  ))) {
    throw new Error("Full-page capture could not capture every section. Please try again.");
  }

  return {
    renderFrames: frames.map((frame, index) => ({ index, outputY: frame.scrollY })),
  };
}
