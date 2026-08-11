export function planFullPageFrames(frames, duplicateFlags) {
  let removedHeight = 0;
  const renderFrames = [];

  frames.forEach((frame, index) => {
    const previousFrame = frames[index - 1];
    if (index > 0 && duplicateFlags[index]) {
      removedHeight += Math.max(0, frame.scrollY - previousFrame.scrollY);
      return;
    }
    renderFrames.push({ index, outputY: frame.scrollY - removedHeight });
  });

  return { renderFrames, removedHeight };
}
