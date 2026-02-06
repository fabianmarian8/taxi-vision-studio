import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET;
const REVALIDATE_RATE_LIMIT = 10;
const REVALIDATE_WINDOW_MS = 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Validate secret token
    const authHeader = request.headers.get('x-revalidate-secret');
    if (!REVALIDATE_SECRET || authHeader !== REVALIDATE_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // SECURITY: Rate limiting
    const ip = getClientIp(request);
    const rateLimit = await checkRateLimit(
      `revalidate:${ip}`,
      REVALIDATE_RATE_LIMIT,
      REVALIDATE_WINDOW_MS
    );

    if (!rateLimit.success) {
      const retryAfter = Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000);
      return NextResponse.json(
        { error: 'Too many requests', retryAfter: Math.max(retryAfter, 1) },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.max(retryAfter, 1)),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': String(rateLimit.resetAt.getTime()),
          },
        }
      );
    }

    const path = request.nextUrl.searchParams.get('path');

    if (!path) {
      return NextResponse.json({ error: 'Path parameter is required' }, { status: 400 });
    }

    // Validate path format - must start with / and be a valid path
    if (!path.startsWith('/') || path.includes('..') || path.includes('\0')) {
      return NextResponse.json({ error: 'Invalid path format' }, { status: 400 });
    }

    // Revalidate the specified path
    revalidatePath(path);

    return NextResponse.json({ revalidated: true, path });
  } catch (error) {
    console.error('Revalidation error:', error);
    return NextResponse.json({ error: 'Failed to revalidate' }, { status: 500 });
  }
}
