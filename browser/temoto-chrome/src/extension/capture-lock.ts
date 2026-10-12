export const CAPTURE_LOCK_KEY = "temotoCaptureJob";
export const CAPTURE_LOCK_TIMEOUT_MS = 120000;

interface CaptureLock {
  id: string;
  expiresAt: number;
}

export async function withCaptureLock<T>(capture: () => Promise<T>): Promise<T> {
  return navigator.locks.request("temoto-capture", { ifAvailable: true }, async (lock) => {
    if (!lock) throw new Error("A screenshot is already being captured. Please wait.");
    const stored = (await chrome.storage.session.get(CAPTURE_LOCK_KEY))[CAPTURE_LOCK_KEY] as CaptureLock | undefined;
    if (stored && stored.expiresAt > Date.now()) {
      throw new Error("A screenshot is already being captured. Please wait.");
    }

    // The session expiry recovers an interrupted worker; Web Locks makes acquisition atomic.
    const current = { id: crypto.randomUUID(), expiresAt: Date.now() + CAPTURE_LOCK_TIMEOUT_MS };
    await chrome.storage.session.set({ [CAPTURE_LOCK_KEY]: current });
    try {
      return await capture();
    } finally {
      try {
        const latest = (await chrome.storage.session.get(CAPTURE_LOCK_KEY))[CAPTURE_LOCK_KEY] as CaptureLock | undefined;
        if (latest?.id === current.id) await chrome.storage.session.remove(CAPTURE_LOCK_KEY);
      } catch {
        // The stored expiry releases the lock if the worker loses storage access during cleanup.
      }
    }
  });
}
