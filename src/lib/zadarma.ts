import crypto from 'crypto';

/**
 * Zadarma SMS API wrapper
 * Docs: https://zadarma.com/en/support/api/
 * Endpoint: POST /v1/sms/send/
 * Auth: HMAC-SHA1 signature
 */

const ZADARMA_API_URL = 'https://api.zadarma.com';

function getCredentials() {
  const key = process.env.ZADARMA_API_KEY;
  const secret = process.env.ZADARMA_API_SECRET;
  if (!key || !secret) throw new Error('ZADARMA credentials not configured');
  return { key, secret };
}

/**
 * Generuj HMAC-SHA1 podpis pre Zadarma API
 * https://zadarma.com/en/support/api/#auth
 * Referencia: github.com/zadarma/user-api-typescript (oficialny SDK)
 *
 * Algoritmus:
 * 1. Zoraď parametre podľa kľúča
 * 2. Vytvor query string cez URLSearchParams (ekvivalent PHP http_build_query RFC1738)
 * 3. signStr = apiPath + queryString + md5(queryString)
 * 4. signature = base64( hex( hmac-sha1(signStr, secret) ) )
 *
 * POZOR: base64 sa aplikuje na HEX STRING hmac výstupu, nie na raw binary!
 */
function generateSignature(
  apiPath: string,
  params: Record<string, string>,
  secret: string
): string {
  // 1. Zoradenie parametrov podľa kľúča + URL encoding (URLSearchParams = PHP http_build_query RFC1738)
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((obj, key) => { obj[key] = params[key]; return obj; }, {} as Record<string, string>);
  const paramString = new URLSearchParams(sortedParams).toString().replace(/%20/g, '+');

  // 2. MD5 hash query stringu
  const md5Hash = crypto.createHash('md5').update(paramString).digest('hex');

  // 3. String na podpis: apiPath + paramString + md5(paramString)
  const signStr = `${apiPath}${paramString}${md5Hash}`;

  // 4. HMAC-SHA1 -> hex string -> base64 (PHP ekvivalent: base64_encode(hash_hmac('sha1', ...)))
  const hmacHex = crypto
    .createHmac('sha1', secret)
    .update(signStr)
    .digest('hex');
  return Buffer.from(hmacHex).toString('base64');
}

/**
 * Pošli SMS cez Zadarma API
 */
export async function sendSMS(
  to: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { key, secret } = getCredentials();
    const apiPath = '/v1/sms/send/';

    const params: Record<string, string> = {
      number: to,
      message,
    };
    // caller_id je volitelny — posielaj len ak je nastaveny (prazdna hodnota moze sposobit chybu)
    const callerId = process.env.ZADARMA_PHONE_NUMBER;
    if (callerId) {
      params.caller_id = callerId;
    }

    const signature = generateSignature(apiPath, params, secret);

    const response = await fetch(`${ZADARMA_API_URL}${apiPath}`, {
      method: 'POST',
      headers: {
        'Authorization': `${key}:${signature}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(params).toString(),
    });

    const data = await response.json();

    if (data.status === 'success') {
      return { success: true };
    }

    return { success: false, error: `Zadarma: ${JSON.stringify(data)}` };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'SMS sending failed';
    console.error('Zadarma SMS error:', message);
    return { success: false, error: message };
  }
}

/**
 * Generuj 6-miestny OTP kód
 */
export function generateOTPCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Normalizuj SK telefónne číslo na E.164 formát
 * +421901234567, 0901234567, 421901234567 -> +421901234567
 */
export function normalizePhoneNumber(phone: string): string | null {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');

  // Už v E.164 formáte
  if (/^\+421\d{9}$/.test(cleaned)) return cleaned;

  // Bez + prefix
  if (/^421\d{9}$/.test(cleaned)) return `+${cleaned}`;

  // Slovenský formát s 0
  if (/^0\d{9}$/.test(cleaned)) return `+421${cleaned.substring(1)}`;

  // 9-miestne číslo (bez prefix)
  if (/^9\d{8}$/.test(cleaned)) return `+421${cleaned}`;

  return null; // Nevalidné číslo
}

/**
 * Porovnaj telefónne čísla (normalizované)
 * Vráti true ak obe čísla sú rovnaké po normalizácii
 */
export function phoneNumbersMatch(phone1: string, phone2: string): boolean {
  const n1 = normalizePhoneNumber(phone1);
  const n2 = normalizePhoneNumber(phone2);
  if (!n1 || !n2) return false;
  return n1 === n2;
}
