import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { normalizePhoneNumber } from '@/lib/zadarma';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { generateSecurePassword, generatePartnerSlug } from '@/lib/partner-onboarding';
import { logger } from '@/lib/logger';

const verifyOTPSchema = z.object({
  phone: z.string().min(9),
  code: z.string().length(6),
  citySlug: z.string().min(1),
  taxiServiceName: z.string().min(1),
  ownerEmail: z.string().email().optional(),
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

const MAX_ATTEMPTS = 5;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const clientIp = getClientIp(request);

    // Rate limit: 10 overení za hodinu na IP
    const rateLimit = await checkRateLimit(`claim-verify:${clientIp}`, 10, 60 * 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Príliš veľa pokusov. Skúste neskôr.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = verifyOTPSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Neplatné údaje' }, { status: 400 });
    }

    const { phone, code, citySlug, taxiServiceName, ownerEmail } = parsed.data;

    const normalizedPhone = normalizePhoneNumber(phone);
    if (!normalizedPhone) {
      return NextResponse.json({ error: 'Neplatné telefónne číslo' }, { status: 400 });
    }

    const supabase = getSupabase();
    const log = logger.with({ fn: 'claim-verify', phone: normalizedPhone.slice(-4), citySlug });

    // Nájdi najnovšiu neverifikovanú verifikáciu pre toto číslo
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const claimTable = supabase.from('claim_verifications' as never) as any;

    const { data: verification, error: fetchError } = await claimTable
      .select('*')
      .eq('phone', normalizedPhone)
      .eq('city_slug', citySlug)
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !verification) {
      return NextResponse.json(
        { error: 'Overovací kód vypršal alebo neexistuje. Vyžiadajte si nový.' },
        { status: 400 }
      );
    }

    const v = verification as { id: string; code: string; attempts: number };

    // Kontrola max pokusov
    if (v.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: 'Príliš veľa nesprávnych pokusov. Vyžiadajte si nový kód.' },
        { status: 400 }
      );
    }

    // Inkrementuj attempts
    await claimTable
      .update({ attempts: v.attempts + 1 })
      .eq('id', v.id);

    // Overenie kódu
    if (v.code !== code) {
      const remaining = MAX_ATTEMPTS - v.attempts - 1;
      return NextResponse.json(
        { error: `Nesprávny kód. Zostáva ${remaining} pokusov.` },
        { status: 400 }
      );
    }

    // Kód správny — označ ako verified
    await claimTable
      .update({ verified: true })
      .eq('id', v.id);

    log.info('OTP verified, creating account');

    // --- Vytvorenie účtu ---

    // Generuj email ak nebol zadaný
    const email = ownerEmail || `${citySlug}-${taxiServiceName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 30)}@claim.taxinearme.sk`;
    const password = generateSecurePassword();

    // Krok 1: Nájdi alebo vytvor Supabase auth usera
    let userId: string;
    let isNewUser = false;

    const { data: listData } = await supabase.auth.admin.listUsers();
    const existingUser = listData?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
      userId = existingUser.id;
      log.info('Existing user found', { userId });
    } else {
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (createError || !newUser?.user) {
        log.error('Failed to create user', { error: createError?.message });
        return NextResponse.json({ error: 'Nepodarilo sa vytvoriť účet' }, { status: 500 });
      }

      userId = newUser.user.id;
      isNewUser = true;
      log.info('New user created', { userId });
    }

    // Krok 2: Vytvor partner záznam (plan_type: 'free')
    let partnerId: string;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const partnersTable = supabase.from('partners' as never) as any;
    const { data: existingPartner } = await partnersTable
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existingPartner) {
      partnerId = existingPartner.id;
    } else {
      const slug = generatePartnerSlug(taxiServiceName, citySlug);

      // Kontrola kolízie slugov
      const { data: slugConflict } = await partnersTable
        .select('id')
        .eq('slug', slug)
        .single();

      const finalSlug = slugConflict
        ? `${slug}-${Date.now().toString(36).slice(-4)}`
        : slug;

      const { data: newPartner, error: partnerError } = await partnersTable
        .insert({
          user_id: userId,
          name: taxiServiceName,
          email,
          phone: normalizedPhone,
          slug: finalSlug,
          city_slug: citySlug,
          plan_type: 'free',
        })
        .select('id')
        .single();

      if (partnerError || !newPartner) {
        log.error('Failed to create partner', { error: partnerError?.message });
        return NextResponse.json({ error: 'Nepodarilo sa vytvoriť partner záznam' }, { status: 500 });
      }

      partnerId = newPartner.id;
      log.info('Partner created', { partnerId, slug: finalSlug });
    }

    // Krok 3: Nastav is_verified na taxi_services
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('taxi_services' as never) as any)
      .update({ is_verified: true })
      .eq('city_slug', citySlug)
      .ilike('name', taxiServiceName);

    // Krok 4: Pošli welcome email (ak máme reálny email a je nový user)
    if (isNewUser && ownerEmail) {
      try {
        const resend = new (await import('resend')).Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: process.env.FROM_EMAIL || 'info@taxinearme.sk',
          to: ownerEmail,
          subject: 'Váš profil na TaxiNearMe.sk bol prevzatý',
          html: `
            <h2>Vitajte na TaxiNearMe.sk!</h2>
            <p>Úspešne ste prevzali profil taxislužby <strong>${taxiServiceName}</strong>.</p>
            <p><strong>Prihlasovacie údaje:</strong></p>
            <ul>
              <li>Email: ${email}</li>
              <li>Heslo: ${password}</li>
            </ul>
            <p><a href="https://www.taxinearme.sk/partner/login">Prihlásiť sa do partner portálu</a></p>
            <p>Po prihlásení si môžete upraviť základné údaje vášho profilu (názov, telefón, web, popis).</p>
            <p>Pre viac funkcií (fotky, galéria, vlastná stránka) si pozrite naše <a href="https://www.taxinearme.sk/pre-taxiky">platené balíky</a>.</p>
          `,
        });
        log.info('Welcome email sent', { to: ownerEmail });
      } catch (emailError) {
        log.error('Failed to send welcome email', { error: String(emailError) });
        // Neprerušuj flow — email nie je kritický
      }
    }

    return NextResponse.json({
      success: true,
      isNewUser,
      partnerId,
      email: isNewUser ? email : undefined,
      // Heslo pošleme len pri novom účte (a len raz, v response)
      // V produkcii by malo ísť len emailom
      loginInfo: isNewUser ? {
        email,
        password,
        loginUrl: 'https://www.taxinearme.sk/partner/login',
      } : undefined,
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ error: 'Interná chyba' }, { status: 500 });
  }
}
