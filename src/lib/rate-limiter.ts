import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Lazy-initialized rate limiter to avoid build-time errors
let _ratelimit: Ratelimit | null = null;
let _redis: Redis | null = null;

function getRedis(): Redis | null {
  if (!_redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      console.warn('Upstash Redis not configured - rate limiting disabled');
      return null;
    }

    _redis = new Redis({ url, token });
  }
  return _redis;
}

/**
 * Get rate limiter for revalidation endpoint
 * Limit: 10 requests per minute per IP
 */
export function getRevalidateRateLimiter(): Ratelimit | null {
  if (!_ratelimit) {
    const redis = getRedis();
    if (!redis) return null;

    _ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1m'),
      analytics: true,
      prefix: 'ratelimit:revalidate',
    });
  }
  return _ratelimit;
}

/**
 * Create a custom rate limiter with specific limits
 */
export function createRateLimiter(
  requests: number,
  window: `${number}${'s' | 'm' | 'h' | 'd'}`,
  prefix: string
): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    analytics: true,
    prefix: `ratelimit:${prefix}`,
  });
}

/**
 * Get IP address from request headers
 */
export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get('x-forwarded-for');
  const realIp = headers.get('x-real-ip');
  return forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';
}
