export const CAPTURE_INTERVAL_MS = 550;
export const CAPTURE_SCROLL_SETTLE_MS = 180;
export const CAPTURE_PRELOAD_SCROLL_STEP = 400;
export const CAPTURE_PRELOAD_SCROLL_INTERVAL_MS = 120;
export const CAPTURE_PRELOAD_SETTLE_MS = 600;
export const CAPTURE_RESOURCE_WAIT_MS = 5000;
export const MAX_FULL_PAGE_HEIGHT = 32000;
export const CAPTURE_SCROLL_TOLERANCE = 1;
export const SCREENSHOT_DELAY_OPTIONS = [0, 1000, 3000, 5000];

export function normalizeScreenshotOptions(options = {}) {
  const delayMs = Number(options.delayMs);
  return {
    delayMs: SCREENSHOT_DELAY_OPTIONS.includes(delayMs) ? delayMs : 0,
    forceReveal: options.forceReveal === true,
  };
}

export function normalizeCaptureMetrics(documentHeight, viewportHeight, outputScale = 1) {
  const pageHeight = Math.max(1, Math.ceil(Number(documentHeight) || 0));
  const frameHeight = Math.max(1, Math.ceil(Number(viewportHeight) || 0));
  const scale = Math.max(1, Number(outputScale) || 1);
  if (pageHeight * scale > MAX_FULL_PAGE_HEIGHT) {
    throw new RangeError(`The captured image would exceed the ${MAX_FULL_PAGE_HEIGHT.toLocaleString()}px height limit`);
  }
  return { pageHeight, frameHeight };
}

export function nextFullPageCaptureY(currentY, documentHeight, viewportHeight, outputScale = 1) {
  const { pageHeight, frameHeight } = normalizeCaptureMetrics(documentHeight, viewportHeight, outputScale);
  const maxScrollY = Math.max(0, pageHeight - frameHeight);
  const currentPosition = Math.max(0, Number(currentY) || 0);
  if (maxScrollY - currentPosition <= CAPTURE_SCROLL_TOLERANCE) return null;
  return Math.min(currentPosition + frameHeight, maxScrollY);
}

export function didFullPageCaptureAdvance(previousY, currentY) {
  if (previousY === null || previousY === undefined) return true;
  return Number(currentY) > Number(previousY) + CAPTURE_SCROLL_TOLERANCE;
}
