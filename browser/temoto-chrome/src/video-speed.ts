export const MIN_PLAYBACK_SPEED = 0.25;
export const MAX_PLAYBACK_SPEED = 5;
export const SPEED_PRESETS = [0.5, 1, 1.5, 2] as const;

const SLIDER_BREAKPOINT = 2 / 3;
const SLIDER_MAX = 1000;

export function clampPlaybackSpeed(value: unknown): number {
  const numericValue = Number(value);
  const clamped = Math.min(
    MAX_PLAYBACK_SPEED,
    Math.max(MIN_PLAYBACK_SPEED, Number.isFinite(numericValue) ? numericValue : 1),
  );
  return Math.round(clamped * 20) / 20;
}

export function speedToSliderPosition(speed: unknown): number {
  const value = clampPlaybackSpeed(speed);
  if (value <= 2) {
    return ((value - MIN_PLAYBACK_SPEED) / (2 - MIN_PLAYBACK_SPEED)) * SLIDER_BREAKPOINT * SLIDER_MAX;
  }
  return (SLIDER_BREAKPOINT + ((value - 2) / (MAX_PLAYBACK_SPEED - 2)) * (1 - SLIDER_BREAKPOINT)) * SLIDER_MAX;
}

export function sliderPositionToSpeed(position: unknown): number {
  const ratio = Math.min(1, Math.max(0, Number(position) / SLIDER_MAX));
  const speed = ratio <= SLIDER_BREAKPOINT
    ? MIN_PLAYBACK_SPEED + (ratio / SLIDER_BREAKPOINT) * (2 - MIN_PLAYBACK_SPEED)
    : 2 + ((ratio - SLIDER_BREAKPOINT) / (1 - SLIDER_BREAKPOINT)) * (MAX_PLAYBACK_SPEED - 2);
  return clampPlaybackSpeed(speed);
}

export function speedFromShortcut(key: unknown, currentSpeed: unknown): number | null {
  switch (String(key).toLowerCase()) {
    case "g": return clampPlaybackSpeed(currentSpeed) === 1.5 ? 1 : 1.5;
    case "d": return clampPlaybackSpeed(Number(currentSpeed) + 0.25);
    case "s": return clampPlaybackSpeed(Number(currentSpeed) - 0.25);
    default: return null;
  }
}
