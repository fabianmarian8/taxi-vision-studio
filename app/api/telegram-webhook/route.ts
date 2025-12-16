import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Webhook secret for verification (optional but recommended)
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

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
    // Optional: Verify webhook secret from header
    const secretHeader = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
    if (WEBHOOK_SECRET && secretHeader !== WEBHOOK_SECRET) {
      console.error('Invalid webhook secret');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const update: TelegramUpdate = await request.json();

    // Only process messages from our admin chat
    if (!update.message || String(update.message.chat.id) !== TELEGRAM_CHAT_ID) {
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
      // Look for partner ID in the format: 🆔 `uuid`
      const idMatch = originalText.match(/🆔\s*`?([a-f0-9-]{36})`?/i);
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
        if (/^[a-f0-9-]{36}$/i.test(potentialId)) {
          partnerId = potentialId;
          replyText = parts.slice(1).join(' ');
        }
      }
    }

    // If we have a valid reply, save it to Supabase
    if (partnerId && replyText) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

      // Verify partner exists
      const { data: partner } = await supabase
        .from('partners')
        .select('id, name')
        .eq('id', partnerId)
        .single();

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
        console.error('Error saving reply:', error);
        await sendTelegramMessage(`❌ Chyba pri ukladaní odpovede: ${error.message}`);
      } else {
        await sendTelegramMessage(`✅ Odpoveď odoslaná partnerovi ${partner.name}`);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
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
