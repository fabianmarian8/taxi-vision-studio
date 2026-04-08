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

    // Krok 4: Pošli welcome email — vždy keď máme email
    if (ownerEmail) {
      try {
        const resend = new (await import('resend')).Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: process.env.FROM_EMAIL || 'info@taxinearme.sk',
          to: ownerEmail,
          subject: `${taxiServiceName} — profil na TaxiNearMe.sk prevzatý`,
          html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background: #f3f4f6; padding: 24px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">

<!-- HEADER -->
<tr><td style="background: linear-gradient(135deg, #f5a623, #e09000); padding: 32px 24px; text-align: center; border-radius: 12px 12px 0 0;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr>
    <td style="text-align: center;">
      <div style="font-size: 32px; margin-bottom: 8px;">&#128662;</div>
      <h1 style="color: #000; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">TaxiNearMe.sk</h1>
      <p style="color: rgba(0,0,0,0.6); margin: 4px 0 0; font-size: 13px;">Najvaecsi katalog taxisluzieb na Slovensku</p>
    </td>
  </tr></table>
</td></tr>

<!-- BODY -->
<tr><td style="background: #fff; padding: 32px 28px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">

  <!-- Success badge -->
  <table width="100%" cellpadding="0" cellspacing="0"><tr>
    <td style="background: #f0fdf4; border: 2px solid #86efac; border-radius: 10px; padding: 16px 20px; text-align: center;">
      <div style="font-size: 28px; margin-bottom: 4px;">&#9989;</div>
      <p style="margin: 0; font-size: 18px; font-weight: 700; color: #166534;">Profil uspesne prevzaty!</p>
      <p style="margin: 4px 0 0; color: #15803d; font-size: 14px;"><strong>${taxiServiceName}</strong> je teraz overena taxisluzba</p>
    </td>
  </tr></table>

  ${isNewUser ? `
  <!-- Login credentials -->
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 20px;"><tr>
    <td style="background: #1e293b; border-radius: 10px; padding: 20px 24px;">
      <p style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px;">Prihlasovacie udaje</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="color: #94a3b8; font-size: 13px; padding: 4px 0;">Email:</td>
          <td style="color: #fff; font-size: 14px; font-weight: 600; padding: 4px 0; text-align: right;">${email}</td>
        </tr>
        <tr>
          <td style="color: #94a3b8; font-size: 13px; padding: 4px 0;">Heslo:</td>
          <td style="color: #fbbf24; font-size: 14px; font-weight: 700; font-family: monospace; padding: 4px 0; text-align: right;">${password}</td>
        </tr>
      </table>
      <p style="color: #64748b; font-size: 11px; margin: 12px 0 0;">&#128274; Heslo si zmente po prvom prihlaseni</p>
    </td>
  </tr></table>
  ` : ''}

  <!-- CTA Button -->
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px;"><tr>
    <td align="center">
      <a href="https://www.taxinearme.sk/partner/login" style="display: inline-block; background: #f5a623; color: #000; padding: 14px 36px; border-radius: 10px; text-decoration: none; font-weight: 800; font-size: 16px; letter-spacing: -0.3px;">&#128073; Prihlasit sa do Partner portalu</a>
    </td>
  </tr></table>

  <!-- Free features -->
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 28px;"><tr>
    <td style="border-top: 1px solid #e5e7eb; padding-top: 24px;">
      <p style="font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px;">&#127381; Vas bezplatny profil obsahuje:</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding: 6px 0; font-size: 14px; color: #374151;">&#9989; Uprava nazvu, telefonu, webu a popisu</td></tr>
        <tr><td style="padding: 6px 0; font-size: 14px; color: #374151;">&#9989; Badge "Overena taxisluzba" na profile</td></tr>
        <tr><td style="padding: 6px 0; font-size: 14px; color: #374151;">&#9989; Pristup do Partner portalu</td></tr>
      </table>
    </td>
  </tr></table>

  <!-- Upgrade section -->
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 28px;"><tr>
    <td style="border-top: 1px solid #e5e7eb; padding-top: 24px;">
      <p style="font-size: 16px; font-weight: 700; color: #111; margin: 0 0 4px;">&#128640; Chcete viac zakaznikov?</p>
      <p style="font-size: 13px; color: #6b7280; margin: 0 0 16px;">Odomknite funkcie, ktore privadzaju nove hovory:</p>
    </td>
  </tr></table>

  <!-- Tier cards -->
  <table width="100%" cellpadding="0" cellspacing="0">
    <!-- Managed -->
    <tr><td style="padding-bottom: 10px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border: 2px solid #bfdbfe; border-radius: 10px; overflow: hidden;">
        <tr>
          <td style="background: #2563eb; padding: 10px 16px; color: #fff; font-weight: 700; font-size: 14px;">
            &#128310; Spravovany profil
            <span style="float: right; font-size: 16px; font-weight: 800;">5,99 &#8364;/mes</span>
          </td>
        </tr>
        <tr>
          <td style="background: #eff6ff; padding: 12px 16px;">
            <table cellpadding="0" cellspacing="0">
              <tr><td style="font-size: 13px; color: #1e40af; padding: 3px 0;">&#10003; Hero obrazok a branding</td></tr>
              <tr><td style="font-size: 13px; color: #1e40af; padding: 3px 0;">&#10003; Sluzby, tagy a popis sluzieb</td></tr>
              <tr><td style="font-size: 13px; color: #1e40af; padding: 3px 0;">&#10003; WhatsApp, Facebook, Instagram</td></tr>
              <tr><td style="font-size: 13px; color: #1e40af; padding: 3px 0;">&#10003; Zvyraznenie v zozname</td></tr>
            </table>
          </td>
        </tr>
      </table>
    </td></tr>

    <!-- Partner -->
    <tr><td style="padding-bottom: 10px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border: 2px solid #fbbf24; border-radius: 10px; overflow: hidden;">
        <tr>
          <td style="background: #f59e0b; padding: 10px 16px; color: #000; font-weight: 700; font-size: 14px;">
            &#11088; Partner
            <span style="float: right; font-size: 16px; font-weight: 800;">14,99 &#8364;/mes</span>
          </td>
        </tr>
        <tr>
          <td style="background: #fffbeb; padding: 12px 16px;">
            <table cellpadding="0" cellspacing="0">
              <tr><td style="font-size: 13px; color: #92400e; padding: 3px 0;">&#10003; Vlastna personalizovana stranka</td></tr>
              <tr><td style="font-size: 13px; color: #92400e; padding: 3px 0;">&#10003; Fotogaleria vozidiel</td></tr>
              <tr><td style="font-size: 13px; color: #92400e; padding: 3px 0;">&#10003; Google recenzie na profile</td></tr>
              <tr><td style="font-size: 13px; color: #92400e; padding: 3px 0;">&#10003; Prioritne umiestnenie v meste</td></tr>
            </table>
          </td>
        </tr>
      </table>
    </td></tr>

    <!-- Leader -->
    <tr><td style="padding-bottom: 10px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border: 2px solid #a78bfa; border-radius: 10px; overflow: hidden;">
        <tr>
          <td style="background: #7c3aed; padding: 10px 16px; color: #fff; font-weight: 700; font-size: 14px;">
            &#128081; Leader mesta
            <span style="float: right; font-size: 16px; font-weight: 800;">24,99 &#8364;/mes</span>
          </td>
        </tr>
        <tr>
          <td style="background: #f5f3ff; padding: 12px 16px;">
            <table cellpadding="0" cellspacing="0">
              <tr><td style="font-size: 13px; color: #5b21b6; padding: 3px 0;">&#10003; Exkluzivna pozicia #1 v meste</td></tr>
              <tr><td style="font-size: 13px; color: #5b21b6; padding: 3px 0;">&#10003; Statistiky hladani a kliknuti</td></tr>
              <tr><td style="font-size: 13px; color: #5b21b6; padding: 3px 0;">&#10003; Zvyraznenie na trasach do inych miest</td></tr>
              <tr><td style="font-size: 13px; color: #5b21b6; padding: 3px 0;">&#10003; Prioritna podpora</td></tr>
            </table>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>

  <!-- CTA pricing -->
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 8px;"><tr>
    <td align="center">
      <a href="https://www.taxinearme.sk/pre-taxiky#pricing" style="display: inline-block; background: #111827; color: #fbbf24; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px;">Porovnat baliky a upgradnut &#8594;</a>
    </td>
  </tr></table>

</td></tr>

<!-- FOOTER -->
<tr><td style="background: #1e293b; padding: 20px 28px; border-radius: 0 0 12px 12px; text-align: center;">
  <p style="color: #94a3b8; font-size: 12px; margin: 0;">TaxiNearMe.sk &mdash; Najvacsi katalog taxisluzieb na Slovensku</p>
  <p style="color: #64748b; font-size: 11px; margin: 8px 0 0;">Tento email bol odoslany po prevzati profilu. Ak ste si profil neprevzali vy, kontaktujte nas na <a href="mailto:info@taxinearme.sk" style="color: #fbbf24;">info@taxinearme.sk</a></p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>
          `,
        });
        log.info('Welcome email sent', { to: ownerEmail });
      } catch (emailError) {
        log.error('Failed to send welcome email', { error: String(emailError) });
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
