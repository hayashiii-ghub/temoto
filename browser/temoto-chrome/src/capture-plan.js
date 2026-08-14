export function planFullPageFrames(frames, duplicateFlags) {
  if (duplicateFlags.some((duplicate, index) => index > 0 && duplicate)) {
    throw new Error("Full-page capture could not capture every section. Please try again.");
  }

  return {
    renderFrames: frames.map((frame, index) => ({ index, outputY: frame.scrollY })),
  };
}
