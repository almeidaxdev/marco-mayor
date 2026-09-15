import "server-only";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const attempts = new Map<string, { count: number; resetAt: number }>();

/**
 * Best-effort, per-instance limiter. On serverless each instance keeps its own map,
 * so this slows down brute force but is not a global guarantee.
 */
export function checkLoginRate(key: string): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt <= now) {
    return { allowed: true, retryAfterSeconds: 0 };
  }
  return {
    allowed: entry.count < MAX_ATTEMPTS,
    retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000),
  };
}

export function registerFailedLogin(key: string) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    entry.count += 1;
  }
  if (attempts.size > 5000) {
    for (const [k, v] of attempts) if (v.resetAt <= now) attempts.delete(k);
  }
}

export function clearLoginRate(key: string) {
  attempts.delete(key);
}
