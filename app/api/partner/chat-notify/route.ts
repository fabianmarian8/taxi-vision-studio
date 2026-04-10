import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function POST(request: NextRequest) {
  try {
    // Auth check (defense-in-depth, middleware should also guard /api/partner/*)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, attachmentUrl, attachmentType } = await request.json();

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.error('Telegram credentials not configured');
      return NextResponse.json({ error: 'Telegram not configured' }, { status: 500 });
    }

    // Fetch verified partner identity from DB — never trust request body for identity
    const { data: partner } = await supabase
      .from('partners')
      .select('id, name, email')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 403 });
    }

    const partnerName = partner.name || 'Unknown';
    const partnerEmail = partner.email || user.email || '';
    const partnerId = partner.id;

    // Sanitize attachment URL — only allow Supabase storage URLs
    let safeAttachmentUrl = '';
    if (attachmentUrl && typeof attachmentUrl === 'string') {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      if (attachmentUrl.startsWith(supabaseUrl) || attachmentUrl.startsWith('/')) {
        safeAttachmentUrl = attachmentUrl;
      }
    }

    const attachmentInfo = safeAttachmentUrl
      ? `\n📎 *Príloha:* [${attachmentType === 'image' ? 'Obrázok' : 'PDF'}](${safeAttachmentUrl})`
      : '';

    const messageText = message || (safeAttachmentUrl ? '(len príloha)' : '');

    const telegramMessage = `🚕 *Nova sprava od partnera*

👤 *Partner:* ${partnerName}
📧 *Email:* ${partnerEmail}

💬 *Sprava:*
${messageText}${attachmentInfo}

➡️ *Pre odpoved odpiste na tuto spravu*
🆔 \`${partnerId}\``;

    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: telegramMessage,
          parse_mode: 'Markdown',
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Telegram API error:', error);
      return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Chat notify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
