import { NextRequest, NextResponse } from 'next/server';
import { createSession, verifyCredentials } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

// Rate limit: 5 attempts per 15 minutes per IP
const LOGIN_RATE_LIMIT = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const clientIp = getClientIp(request);
  const log = logger.with({ endpoint: 'admin/login', clientIp });

  try {
    // Check rate limit first
    const rateLimitKey = `login:${clientIp}`;
    const rateLimit = await checkRateLimit(rateLimitKey, LOGIN_RATE_LIMIT, LOGIN_WINDOW_MS);

    if (!rateLimit.success) {
      const retryAfter = Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000);
      log.warn('Rate limit exceeded', { retryAfter, remaining: rateLimit.remaining });
      await logger.flush();
      return NextResponse.json(
        {
          error: 'Príliš veľa pokusov. Skúste neskôr.',
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
          },
        }
      );
    }

    let username: string;
    let password: string;
    try {
      const body = await request.json();
      username = body.username;
      password = body.password;
    } catch {
      log.warn('Invalid JSON in request body');
      await logger.flush();
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    if (!username || !password) {
      log.warn('Missing credentials', { hasUsername: !!username, hasPassword: !!password });
      await logger.flush();
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const isValid = await verifyCredentials(username, password);

    if (!isValid) {
      log.warn('Invalid credentials attempt', { username });
      await logger.flush();
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    await createSession(username);

    const duration = Date.now() - startTime;
    log.info('Admin login successful', { username, duration });
    await logger.flush();

    return NextResponse.json({ success: true });
  } catch (error) {
    const duration = Date.now() - startTime;
    log.error('Login error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration,
    });
    await logger.flush();
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
