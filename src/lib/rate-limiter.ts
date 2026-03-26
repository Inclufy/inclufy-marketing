/**
 * Simple in-memory rate limiter for client-side request throttling.
 * Prevents excessive API and auth calls per sliding window.
 */

interface RateLimiterOptions {
  maxRequests: number;
  windowMs: number;
}

interface RateLimiter {
  check: (key?: string) => boolean;
  reset: (key?: string) => void;
}

export function createRateLimiter(options: RateLimiterOptions): RateLimiter {
  const { maxRequests, windowMs } = options;
  const timestamps = new Map<string, number[]>();

  function check(key = 'default'): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    const calls = (timestamps.get(key) ?? []).filter((t) => t > windowStart);
    if (calls.length >= maxRequests) {
      return false;
    }
    calls.push(now);
    timestamps.set(key, calls);
    return true;
  }

  function reset(key = 'default'): void {
    timestamps.delete(key);
  }

  return { check, reset };
}

/** General API calls: 30 requests per minute */
export const apiLimiter = createRateLimiter({ maxRequests: 30, windowMs: 60_000 });

/** Auth calls (login, signup, password reset): 5 requests per minute */
export const authLimiter = createRateLimiter({ maxRequests: 5, windowMs: 60_000 });
