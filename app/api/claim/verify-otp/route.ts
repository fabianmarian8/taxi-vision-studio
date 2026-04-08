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
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
              <div style="background: #f5a623; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: #000; margin: 0; font-size: 22px;">TaxiNearMe.sk</h1>
              </div>
              <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
                <h2 style="color: #111; margin-top: 0;">Vitajte, ${taxiServiceName}!</h2>
                <p>Profil vašej taxislužby bol úspešne prevzatý a overený.</p>

                ${isNewUser ? `
                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 16px 0;">
                  <p style="font-weight: bold; margin-top: 0;">Prihlasovacie údaje do Partner portálu:</p>
                  <p style="margin: 4px 0;">Email: <strong>${email}</strong></p>
                  <p style="margin: 4px 0;">Heslo: <strong>${password}</strong></p>
                </div>
                ` : ''}

                <p><a href="https://www.taxinearme.sk/partner/login" style="display: inline-block; background: #f5a623; color: #000; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Prihlásiť sa do Partner portálu</a></p>

                <h3 style="margin-top: 24px;">Čo môžete robiť s bezplatným profilom:</h3>
                <ul>
                  <li>Upraviť názov, telefón, web a popis</li>
                  <li>Badge "Overená taxislužba" na vašom profile</li>
                </ul>

                <h3 style="margin-top: 20px;">Chcete viac?</h3>
                <table style="width: 100%; border-collapse: collapse; margin: 12px 0;">
                  <tr>
                    <td style="padding: 10px; background: #eff6ff; border-radius: 6px; vertical-align: top;">
                      <strong style="color: #2563eb;">Spravovaný profil — 5,99 €/mes</strong><br/>
                      <span style="font-size: 13px; color: #555;">Hero obrázok, služby, tagy, WhatsApp, sociálne siete</span>
                    </td>
                  </tr>
                  <tr><td style="padding: 4px;"></td></tr>
                  <tr>
                    <td style="padding: 10px; background: #fffbeb; border-radius: 6px; vertical-align: top;">
                      <strong style="color: #d97706;">Partner — 14,99 €/mes</strong><br/>
                      <span style="font-size: 13px; color: #555;">Vlastná stránka, fotogaléria, Google recenzie, prioritné umiestnenie</span>
                    </td>
                  </tr>
                  <tr><td style="padding: 4px;"></td></tr>
                  <tr>
                    <td style="padding: 10px; background: #f5f3ff; border-radius: 6px; vertical-align: top;">
                      <strong style="color: #7c3aed;">Leader mesta — 24,99 €/mes</strong><br/>
                      <span style="font-size: 13px; color: #555;">Exkluzívna pozícia #1, analytika, zvýraznenie na trasách</span>
                    </td>
                  </tr>
                </table>

                <p><a href="https://www.taxinearme.sk/pre-taxiky#pricing" style="color: #f5a623; font-weight: bold;">Pozrieť všetky balíky →</a></p>

                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
                <p style="font-size: 12px; color: #999;">Tento email bol odoslaný z TaxiNearMe.sk po prevzatí profilu. Ak ste si profil neprevzali vy, kontaktujte nás na info@taxinearme.sk.</p>
              </div>
            </div>
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
