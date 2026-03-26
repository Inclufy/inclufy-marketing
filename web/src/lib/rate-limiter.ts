interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimiterOptions {
  maxRequests: number;
  windowMs: number;
}

const DEFAULT_OPTIONS: RateLimiterOptions = {
  maxRequests: 30,
  windowMs: 60_000, // 1 minute
};

export function createRateLimiter(options: Partial<RateLimiterOptions> = {}) {
  const { maxRequests, windowMs } = { ...DEFAULT_OPTIONS, ...options };
  const store = new Map<string, RateLimitEntry>();

  return {
    /**
     * Check if a request is allowed. Returns true if within limits.
     */
    check(key: string): boolean {
      const now = Date.now();
      const entry = store.get(key);

      if (!entry || now > entry.resetAt) {
        if (maxRequests <= 0) return false;
        store.set(key, { count: 1, resetAt: now + windowMs });
        return true;
      }

      if (entry.count >= maxRequests) {
        return false;
      }

      entry.count++;
      return true;
    },

    /**
     * Get remaining requests for a key.
     */
    remaining(key: string): number {
      const now = Date.now();
      const entry = store.get(key);

      if (!entry || now > entry.resetAt) {
        return maxRequests;
      }

      return Math.max(0, maxRequests - entry.count);
    },

    /**
     * Reset the limiter for a key.
     */
    reset(key: string): void {
      store.delete(key);
    },
  };
}

// Pre-configured limiters for common use cases
export const apiLimiter = createRateLimiter({ maxRequests: 30, windowMs: 60_000 });
export const authLimiter = createRateLimiter({ maxRequests: 5, windowMs: 60_000 });
export const aiLimiter = createRateLimiter({ maxRequests: 10, windowMs: 60_000 });

/**
 * Wrapper for Supabase calls with rate limiting.
 * Throws an error if rate limit is exceeded.
 */
export async function withRateLimit<T>(
  key: string,
  limiter: ReturnType<typeof createRateLimiter>,
  fn: () => Promise<T>
): Promise<T> {
  if (!limiter.check(key)) {
    throw new Error(
      `Rate limit exceeded for "${key}". Try again in a moment.`
    );
  }
  return fn();
}
