import { NextRequest, NextResponse } from 'next/server';
import { sendTelegramMessage, formatOwnerClaimMessage } from '@/lib/telegram';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
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
