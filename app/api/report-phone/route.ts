import { NextRequest, NextResponse } from 'next/server';
import { sendTelegramMessage, formatPhoneReportMessage } from '@/lib/telegram';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
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
