export const MIN_PLAYBACK_SPEED = 0.25;
export const MAX_PLAYBACK_SPEED = 5;
export const SPEED_PRESETS = [0.5, 1, 1.5, 2] as const;

export function clampPlaybackSpeed(value: unknown): number {
  const numericValue = Number(value);
  const clamped = Math.min(
    MAX_PLAYBACK_SPEED,
    Math.max(MIN_PLAYBACK_SPEED, Number.isFinite(numericValue) ? numericValue : 1),
  );
  return Math.round(clamped * 20) / 20;
}

export function speedFromShortcut(key: unknown, currentSpeed: unknown): number | null {
  switch (String(key).toLowerCase()) {
    case "g": return clampPlaybackSpeed(currentSpeed) === 1.5 ? 1 : 1.5;
    case "d": return clampPlaybackSpeed(Number(currentSpeed) + 0.25);
    case "s": return clampPlaybackSpeed(Number(currentSpeed) - 0.25);
    default: return null;
  }
}
