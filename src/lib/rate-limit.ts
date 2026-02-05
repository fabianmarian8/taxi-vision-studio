import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Lazy initialization
let _redis: Redis | null = null;
const limiters = new Map<string, Ratelimit>();

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: Date;
}

function getRedis(): Redis | null {
  if (!_redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (url && token) {
      _redis = new Redis({ url, token });
    }
  }
  return _redis;
}

function msToWindow(ms: number): `${number}${'s' | 'm' | 'h'}` {
  if (ms >= 3600000) return `${Math.round(ms / 3600000)}h`;
  if (ms >= 60000) return `${Math.round(ms / 60000)}m`;
  return `${Math.round(ms / 1000)}s`;
}

function getLimiter(limit: number, windowMs: number): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;

  const key = `${limit}:${windowMs}`;
  let limiter = limiters.get(key);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, msToWindow(windowMs)),
      analytics: true,
      prefix: `rl:${key}`,
    });
    limiters.set(key, limiter);
  }
  return limiter;
}

/**
 * Check rate limit for a given identifier (usually IP address)
 * Falls back to in-memory implementation if Upstash is not configured
 * @param identifier - Unique identifier (IP, user ID, etc.)
 * @param limit - Maximum requests allowed
 * @param windowMs - Time window in milliseconds
 */
export async function checkRateLimit(
  identifier: string,
  limit: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): Promise<RateLimitResult> {
  const limiter = getLimiter(limit, windowMs);

  if (limiter) {
    // Use Upstash Redis rate limiting with correct limits
    const result = await limiter.limit(identifier);
    return {
      success: result.success,
      remaining: result.remaining,
      resetAt: new Date(result.reset),
    };
  }

  // Fallback to in-memory implementation
  return checkRateLimitInMemory(identifier, limit, windowMs);
}

// Fallback in-memory implementation
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically (every 100 calls)
let callCount = 0;
function cleanupOldEntries() {
  callCount++;
  if (callCount % 100 === 0) {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt < now) {
        store.delete(key);
      }
    }
  }
}

function checkRateLimitInMemory(
  identifier: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  cleanupOldEntries();

  const now = Date.now();
  const entry = store.get(identifier);

  // No previous entry or window expired
  if (!entry || entry.resetAt < now) {
    store.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      success: true,
      remaining: limit - 1,
      resetAt: new Date(now + windowMs),
    };
  }

  // Within window, increment count
  entry.count++;

  if (entry.count > limit) {
    return {
      success: false,
      remaining: 0,
      resetAt: new Date(entry.resetAt),
    };
  }

  return {
    success: true,
    remaining: limit - entry.count,
    resetAt: new Date(entry.resetAt),
  };
}

/**
 * Get client IP from request headers
 * Works with Vercel, Cloudflare, and direct connections
 */
export function getClientIp(request: Request): string {
  // Vercel
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  // Cloudflare
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Real IP header
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback
  return 'unknown';
}
