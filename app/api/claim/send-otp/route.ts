import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { sendSMS, generateOTPCode, normalizePhoneNumber, phoneNumbersMatch } from '@/lib/zadarma';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const sendOTPSchema = z.object({
  phone: z.string().min(9),
  profilePhone: z.string().min(9),
  citySlug: z.string().min(1),
  taxiServiceName: z.string().min(1),
});

// Lazy Supabase service role klient
let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _supabase;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const clientIp = getClientIp(request);

    // Rate limit: 20 za hodinu v dev, 3 v produkcii
    const isDev = process.env.NODE_ENV === 'development';
    const rateLimit = await checkRateLimit(`claim-otp:${clientIp}`, isDev ? 20 : 3, 60 * 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Príliš veľa pokusov. Skúste neskôr.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = sendOTPSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Neplatné údaje' }, { status: 400 });
    }

    const { phone, profilePhone, citySlug, taxiServiceName } = parsed.data;

    // Normalizuj obidve čísla
    const normalizedPhone = normalizePhoneNumber(phone);
    if (!normalizedPhone) {
      return NextResponse.json({ error: 'Neplatné telefónne číslo' }, { status: 400 });
    }

    // Overenie: zadané číslo musí zodpovedať číslu v profile
    if (!phoneNumbersMatch(phone, profilePhone)) {
      return NextResponse.json(
        { error: 'Zadané číslo nezodpovedá číslu v profile taxislužby.' },
        { status: 400 }
      );
    }

    // Generuj OTP
    const code = generateOTPCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minút

    // Ulož do DB (tabuľka nie je v generated types, použijeme type assertion)
    const supabase = getSupabase();
    const { error: dbError } = await (supabase
      .from('claim_verifications' as never) as ReturnType<typeof supabase.from>)
      .insert({
        phone: normalizedPhone,
        code,
        city_slug: citySlug,
        taxi_service_name: taxiServiceName,
        expires_at: expiresAt.toISOString(),
      } as never);

    if (dbError) {
      console.error('DB error:', dbError);
      return NextResponse.json({ error: 'Interná chyba' }, { status: 500 });
    }

    // Pošli SMS cez Zadarma
    const smsResult = await sendSMS(
      normalizedPhone,
      `Vas overovaci kod pre TaxiNearMe: ${code}. Platny 10 minut.`
    );

    if (!smsResult.success) {
      return NextResponse.json(
        { error: smsResult.error || 'Nepodarilo sa odoslať SMS.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      phoneLast4: normalizedPhone.slice(-4),
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Interná chyba', debug: msg }, { status: 500 });
  }
}
