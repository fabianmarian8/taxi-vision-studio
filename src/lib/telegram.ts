/**
 * Telegram notification utility
 *
 * Centralized Telegram message sending for all notification types.
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

interface TelegramResult {
  success: boolean;
  error?: string;
}

/**
 * Send a message to Telegram chat
 */
export async function sendTelegramMessage(message: string): Promise<TelegramResult> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error('Telegram credentials not configured');
    return { success: false, error: 'Telegram not configured' };
  }

  const response = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Telegram API error:', error);
    return { success: false, error: 'Failed to send notification' };
  }

  return { success: true };
}

/**
 * Format owner claim notification
 */
export function formatOwnerClaimMessage(data: {
  serviceName: string;
  servicePhone?: string;
  cityName: string;
  citySlug: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail?: string;
  message?: string;
}): string {
  const timestamp = new Date().toLocaleString('sk-SK', { timeZone: 'Europe/Bratislava' });

  return `\u{1F695} *MAJITEL TAXISLUZBY - Ziadost o upravu*

\u{1F4CD} *Taxisluzba:* ${data.serviceName}
\u{1F4DE} *Tel. v databaze:* ${data.servicePhone || 'neuvedene'}
\u{1F3D9}\u{FE0F} *Mesto:* ${data.cityName}
\u{1F517} *URL:* taxinearme.sk/taxi/${data.citySlug}

\u{1F464} *Kontaktna osoba:*
\u{2022} Meno: ${data.ownerName}
\u{2022} Telefon: ${data.ownerPhone}
\u{2022} Email: ${data.ownerEmail || 'neuvedeny'}

\u{1F4AC} *Sprava:*
${data.message || '(bez spravy)'}

\u{23F0} *Cas:* ${timestamp}`;
}

/**
 * Format phone report notification
 */
export function formatPhoneReportMessage(data: {
  serviceName: string;
  servicePhone: string;
  cityName: string;
  reason: string;
  comment?: string;
  pageUrl?: string;
}): string {
  const reasonLabels: Record<string, string> = {
    'not_answering': '\u{1F4F5} Neberie telefon',
    'wrong_number': '\u{274C} Zle cislo',
    'not_exists': '\u{1F6AB} Taxisluzba neexistuje',
  };

  const reasonText = reasonLabels[data.reason] || data.reason;
  const commentText = data.comment ? `\n\u{1F4AC} *Komentar:* ${data.comment}` : '';
  const urlText = data.pageUrl ? `\n\u{1F517} *Stranka:* ${data.pageUrl}` : '';

  return `\u{1F6A8} *NAHLASENIE NEFUNKCNEHO CISLA*

\u{1F695} *Taxisluzba:* ${data.serviceName}
\u{1F4DE} *Telefon:* \`${data.servicePhone}\`
\u{1F4CD} *Mesto:* ${data.cityName}

\u{26A0}\u{FE0F} *Dovod:* ${reasonText}${commentText}${urlText}

\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}\u{2501}
_Nahlasene cez TaxiNearMe.sk_`;
}
