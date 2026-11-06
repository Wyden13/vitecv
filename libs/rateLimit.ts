import "server-only";

/**
 * A fixed-window counter held in memory.
 *
 * Best effort by design: on serverless each instance has its own map, so the
 * real ceiling is `limit` per instance. That is enough to stop a script
 * hammering the pairing endpoint or burning model quota from one token; a
 * hard guarantee would need a shared store.
 */
const windows = new Map<string, { count: number; resetsAt: number }>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const current = windows.get(key);

  if (!current || current.resetsAt <= now) {
    windows.set(key, { count: 1, resetsAt: now + windowMs });

    // Opportunistic cleanup so the map cannot grow without bound.
    if (windows.size > 5_000) {
      for (const [entry, value] of windows) {
        if (value.resetsAt <= now) windows.delete(entry);
      }
    }

    return { ok: true, retryAfterSeconds: 0 };
  }

  current.count += 1;

  return {
    ok: current.count <= limit,
    retryAfterSeconds: Math.ceil((current.resetsAt - now) / 1000),
  };
}
