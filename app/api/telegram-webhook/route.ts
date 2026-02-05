import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

interface TelegramMessage {
  message_id: number;
  from: {
    id: number;
    first_name: string;
  };
  chat: {
    id: number;
  };
  text?: string;
  reply_to_message?: {
    text?: string;
    message_id: number;
  };
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Validate Telegram webhook secret token (required)
    if (!TELEGRAM_WEBHOOK_SECRET) {
      console.error('[telegram-webhook] TELEGRAM_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    const secretHeader = request.headers.get('x-telegram-bot-api-secret-token');
    if (secretHeader !== TELEGRAM_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Read raw body first for better error handling
    const rawBody = await request.text();

    let update: TelegramUpdate;
    try {
      update = JSON.parse(rawBody);
    } catch {
      // Return 200 to prevent Telegram from retrying
      return NextResponse.json({ ok: true, error: 'parse_error' });
    }

    // Only process messages from our admin chat
    if (!update.message) {
      return NextResponse.json({ ok: true });
    }

    const chatId = String(update.message.chat.id);

    if (chatId !== TELEGRAM_CHAT_ID) {
      return NextResponse.json({ ok: true });
    }

    const message = update.message;
    const text = message.text;

    // Skip if no text
    if (!text) {
      return NextResponse.json({ ok: true });
    }

    // Extract partner_id from reply or from /reply command
    let partnerId: string | null = null;
    let replyText: string | null = null;

    // Method 1: Reply to message - extract partner_id from original message
    if (message.reply_to_message?.text) {
      const originalText = message.reply_to_message.text;

      // Look for partner ID - try multiple patterns
      // Pattern 1: 🆔 `uuid` or 🆔 uuid
      let idMatch = originalText.match(/🆔\s*`?([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})`?/i);

      // Pattern 2: Just UUID anywhere in text
      if (!idMatch) {
        idMatch = originalText.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
      }

      if (idMatch) {
        partnerId = idMatch[1];
        replyText = text;
      }
    }

    // Method 2: /reply command - /reply <partner_id> <message>
    if (!partnerId && text.startsWith('/reply ')) {
      const parts = text.slice(7).split(' ');
      if (parts.length >= 2) {
        const potentialId = parts[0];
        // Validate UUID format
        if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(potentialId)) {
          partnerId = potentialId;
          replyText = parts.slice(1).join(' ');
        }
      }
    }

    // If we have a valid reply, save it to Supabase
    if (partnerId && replyText) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.error('[telegram-webhook] Supabase not configured');
        return NextResponse.json({ ok: true });
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      // Verify partner exists
      const { data: partner } = await supabase
        .from('partners')
        .select('id, name')
        .eq('id', partnerId)
        .maybeSingle();

      if (!partner) {
        await sendTelegramMessage(`❌ Partner s ID ${partnerId} neexistuje.`);
        return NextResponse.json({ ok: true });
      }

      // Insert admin reply
      const { error } = await supabase.from('chat_messages').insert({
        partner_id: partnerId,
        sender_type: 'admin',
        message: replyText,
      });

      if (error) {
        console.error('[telegram-webhook] Error saving reply:', error.message);
        await sendTelegramMessage(`❌ Chyba pri ukladaní odpovede: ${error.message}`);
      } else {
        await sendTelegramMessage(`✅ Odpoveď odoslaná partnerovi ${partner.name}`);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[telegram-webhook] Error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function sendTelegramMessage(text: string) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;

  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text,
    }),
  });
}

// Handle GET for webhook verification
export async function GET() {
  return NextResponse.json({ status: 'Telegram webhook endpoint active' });
}
