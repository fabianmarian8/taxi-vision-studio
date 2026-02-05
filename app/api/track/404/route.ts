import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

// Validate payload structure
interface TrackingPayload {
  proxy: {
    statusCode: number;
    path: string;
    timestamp: string;
    host: string;
    userAgent: string;
    referer: string;
  };
}

function isValidPayload(body: unknown): body is TrackingPayload {
  if (!body || typeof body !== 'object') return false;
  const payload = body as Record<string, unknown>;

  if (!payload.proxy || typeof payload.proxy !== 'object') return false;
  const proxy = payload.proxy as Record<string, unknown>;

  return (
    typeof proxy.statusCode === 'number' &&
    typeof proxy.path === 'string' &&
    typeof proxy.timestamp === 'string' &&
    typeof proxy.host === 'string' &&
    typeof proxy.userAgent === 'string' &&
    typeof proxy.referer === 'string' &&
    proxy.path.length < 2000 && // Prevent oversized paths
    proxy.host.length < 255 &&
    proxy.userAgent.length < 1000
  );
}

// Strip sensitive data from path (tokens, keys, etc.)
function sanitizePath(path: string): string {
  // Remove common token patterns from query strings
  return path
    .replace(/([?&])(token|key|secret|password|auth|api_key|apikey)=[^&]*/gi, '$1$2=[REDACTED]')
    .substring(0, 500); // Limit path length
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting (uses Upstash Redis with in-memory fallback)
    const ip = getClientIp(request);
    const rateLimit = await checkRateLimit(`404-track:${ip}`, 10, 60 * 1000);

    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Check webhook URL is configured
    const webhookUrl = process.env.N8N_404_WEBHOOK_URL;
    if (!webhookUrl) {
      console.error('[404-track] N8N_404_WEBHOOK_URL not configured');
      return NextResponse.json(
        { success: false, error: 'Webhook not configured' },
        { status: 500 }
      );
    }

    // Parse and validate body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON' },
        { status: 400 }
      );
    }

    if (!isValidPayload(body)) {
      return NextResponse.json(
        { success: false, error: 'Invalid payload structure' },
        { status: 400 }
      );
    }

    // Sanitize sensitive data
    const sanitizedPayload = {
      proxy: {
        ...body.proxy,
        path: sanitizePath(body.proxy.path),
        referer: body.proxy.referer ? sanitizePath(body.proxy.referer) : '',
      },
    };

    // Forward to n8n webhook with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitizedPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check if n8n responded successfully
      if (!response.ok) {
        console.error(`[404-track] n8n webhook failed: ${response.status} ${response.statusText}`);
        return NextResponse.json(
          { success: false, error: 'Webhook failed' },
          { status: 502 }
        );
      }

      return NextResponse.json({ success: true });
    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('[404-track] n8n webhook timeout');
        return NextResponse.json(
          { success: false, error: 'Webhook timeout' },
          { status: 504 }
        );
      }

      throw fetchError;
    }
  } catch (error) {
    console.error('[404-track] Unexpected error:', error);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}
