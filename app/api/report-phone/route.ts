import { NextRequest, NextResponse } from 'next/server';
import { sendTelegramMessage, formatPhoneReportMessage } from '@/lib/telegram';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

// Rate limit: 3 reports per hour per IP
const REPORT_RATE_LIMIT = 3;
const REPORT_WINDOW_MS = 60 * 60 * 1000;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = await checkRateLimit(`report-phone:${clientIp}`, REPORT_RATE_LIMIT, REPORT_WINDOW_MS);

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Príliš veľa nahlásení. Skúste neskôr.' },
        { status: 429 }
      );
    }

    const data = await request.json();

    if (!data.serviceName || !data.servicePhone || !data.reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const message = formatPhoneReportMessage(data);
    const result = await sendTelegramMessage(message);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Report phone error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
