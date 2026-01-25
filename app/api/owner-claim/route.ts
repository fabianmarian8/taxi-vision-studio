import { NextRequest, NextResponse } from 'next/server';
import { sendTelegramMessage, formatOwnerClaimMessage } from '@/lib/telegram';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

// Rate limit: 3 claims per hour per IP
const CLAIM_RATE_LIMIT = 3;
const CLAIM_WINDOW_MS = 60 * 60 * 1000;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const clientIp = getClientIp(request);

    // Rate limit check
    const rateLimitKey = `claim:${clientIp}`;
    const rateLimit = await checkRateLimit(rateLimitKey, CLAIM_RATE_LIMIT, CLAIM_WINDOW_MS);

    if (!rateLimit.success) {
      const retryAfter = Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000);
      return NextResponse.json(
        { error: 'Príliš veľa požiadaviek. Skúste neskôr.' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      );
    }

    const data = await request.json();

    if (!data.serviceName || !data.ownerName || !data.ownerPhone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const message = formatOwnerClaimMessage(data);
    const result = await sendTelegramMessage(message);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Owner claim error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
