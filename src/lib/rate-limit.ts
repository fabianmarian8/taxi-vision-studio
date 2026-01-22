import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Lazy initialization
let ratelimit: Ratelimit | null = null;

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: Date;
}

function getRatelimit() {
  if (!ratelimit) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    // Only initialize if both URL and token are available
    if (url && token) {
      const redis = new Redis({ url, token });
      ratelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 requests per 15 minutes
        analytics: true,
      });
    }
    // If missing, returns null and falls back to in-memory rate limiting
  }
  return ratelimit;
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
  const limiter = getRatelimit();

  if (limiter) {
    // Use Upstash Redis rate limiting
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
