# Free Claim Flow — Implementačný plán

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Umožniť majiteľom taxislužieb prevziať profil zadarmo cez SMS verifikáciu telefónneho čísla z profilu. Po overení dostanú login s obmedzeným prístupom k editácii (názov, telefón, web, popis). Vyššie funkcie sú zamknuté a odomknú sa až plateným balíkom.

**Architecture:** Vlastný OTP flow (nie Supabase Phone Auth) — generuje 6-miestny kód, ukladá do novej tabuľky `claim_verifications`, odosiela cez Twilio SMS, overuje kód. Po úspešnom overení vytvára Supabase auth usera cez `auth.admin.createUser()` (rovnaký pattern ako `partner-onboarding.ts`), vytvára partner záznam s `plan_type: 'free'` a posiela welcome email s loginom.

**Tech Stack:** Twilio SMS API, Supabase (nová tabuľka + auth), Resend (welcome email), Next.js API Routes, Zod validácia

---

## Prehľad komponentov

```
Nové súbory:
  src/lib/twilio.ts                           — Twilio klient + sendOTP + verifyOTP
  src/lib/claim-flow.ts                       — Orchestrácia claim procesu
  app/api/claim/send-otp/route.ts             — Endpoint: pošli SMS kód
  app/api/claim/verify-otp/route.ts           — Endpoint: over kód + vytvor účet
  src/components/ClaimProfileFlow.tsx          — UI komponent (multi-step modal)
  supabase/migrations/XXX_claim_verifications.sql — Nová tabuľka

Upravené súbory:
  src/lib/partner-onboarding.ts               — Extrakcia reusable funkcie createPartnerAccount()
  src/components/OwnerClaimButton.tsx          — Nahradený za ClaimProfileFlow (alebo wrapper)
  app/taxi/[...slug]/page.tsx                 — Použitie nového ClaimProfileFlow
  src/lib/stripe.ts                           — Pridanie plan type 'free'
  src/lib/taxi-services.ts                    — Podpora free claimed statusu
```

---

## Task 1: Supabase migrácia — tabuľka `claim_verifications`

**Files:**
- Create: `supabase/migrations/20260408_claim_verifications.sql`

**Step 1: Napíš migráciu**

```sql
-- Tabuľka pre OTP verifikáciu telefónnych čísel pri claim flow
CREATE TABLE IF NOT EXISTS claim_verifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  phone text NOT NULL,
  code text NOT NULL,
  city_slug text NOT NULL,
  taxi_service_name text NOT NULL,
  attempts integer DEFAULT 0,
  verified boolean DEFAULT false,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Index pre rýchle vyhľadávanie podľa telefónu
CREATE INDEX idx_claim_verifications_phone ON claim_verifications(phone, verified);

-- Auto-cleanup expired verifikácií (staršie ako 24h)
CREATE INDEX idx_claim_verifications_expires ON claim_verifications(expires_at);

-- RLS: len server-side prístup (service role)
ALTER TABLE claim_verifications ENABLE ROW LEVEL SECURITY;
-- Žiadne RLS policies = prístup len cez service role key
```

**Step 2: Aplikuj migráciu na Supabase**

```bash
# Lokálne (worktree)
cd /Users/marianfabian/Projects/taxi-vision-studio-claim
npx supabase db push
# Alebo manuálne cez Supabase Dashboard > SQL Editor
```

**Step 3: Commit**

```bash
git add supabase/migrations/20260408_claim_verifications.sql
git commit -m "feat: add claim_verifications table for SMS OTP flow"
```

---

## Task 2: Twilio SMS modul

**Files:**
- Create: `src/lib/twilio.ts`

**Step 1: Implementuj Twilio wrapper**

```typescript
// src/lib/twilio.ts
import twilio from 'twilio';

// Lazy initialization (rovnaký pattern ako stripe.ts)
let _client: twilio.Twilio | null = null;

function getClient(): twilio.Twilio {
  if (!_client) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token) throw new Error('TWILIO credentials not configured');
    _client = twilio(sid, token);
  }
  return _client;
}

/**
 * Generuj 6-miestny OTP kód
 */
export function generateOTPCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Pošli SMS s OTP kódom
 */
export async function sendSMS(to: string, body: string): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getClient();
    await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'SMS sending failed';
    console.error('Twilio SMS error:', message);
    return { success: false, error: message };
  }
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
```

**Step 2: Commit**

```bash
git add src/lib/twilio.ts
git commit -m "feat: add Twilio SMS module with OTP generation and phone normalization"
```

---

## Task 3: API Route — Send OTP

**Files:**
- Create: `app/api/claim/send-otp/route.ts`

**Step 1: Implementuj endpoint**

```typescript
// app/api/claim/send-otp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { sendSMS, generateOTPCode, normalizePhoneNumber } from '@/lib/twilio';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const sendOTPSchema = z.object({
  phone: z.string().min(9),
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

    // Rate limit: 3 SMS per hour per IP
    const rateLimit = await checkRateLimit(`claim-otp:${clientIp}`, 3, 60 * 60 * 1000);
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

    const { phone, citySlug, taxiServiceName } = parsed.data;

    // Normalizuj telefónne číslo
    const normalizedPhone = normalizePhoneNumber(phone);
    if (!normalizedPhone) {
      return NextResponse.json({ error: 'Neplatné telefónne číslo' }, { status: 400 });
    }

    // Generuj OTP
    const code = generateOTPCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minút

    // Ulož do DB
    const supabase = getSupabase();
    const { error: dbError } = await supabase
      .from('claim_verifications')
      .insert({
        phone: normalizedPhone,
        code,
        city_slug: citySlug,
        taxi_service_name: taxiServiceName,
        expires_at: expiresAt.toISOString(),
      });

    if (dbError) {
      console.error('DB error:', dbError);
      return NextResponse.json({ error: 'Interná chyba' }, { status: 500 });
    }

    // Pošli SMS
    const smsResult = await sendSMS(
      normalizedPhone,
      `Váš overovací kód pre TaxiNearMe.sk je: ${code}. Platný 10 minút.`
    );

    if (!smsResult.success) {
      return NextResponse.json(
        { error: 'Nepodarilo sa odoslať SMS. Skúste to znova.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      // Vráť posledné 4 cifry pre UI potvrdenie
      phoneLast4: normalizedPhone.slice(-4),
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json({ error: 'Interná chyba' }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add app/api/claim/send-otp/route.ts
git commit -m "feat: add send-otp API endpoint for claim flow"
```

---

## Task 4: API Route — Verify OTP + Create Account

**Files:**
- Create: `app/api/claim/verify-otp/route.ts`
- Create: `src/lib/claim-flow.ts`

**Step 1: Implementuj claim-flow orchestráciu**

`src/lib/claim-flow.ts` — extrahuje logiku vytvorenia účtu (reuse z partner-onboarding.ts pattern):

- Nájdi alebo vytvor Supabase auth usera (email vygenerovaný z taxiServiceName + citySlug)
- Vytvor partner záznam s `plan_type: 'free'`
- Nastav `is_verified: true` na taxi_services
- Pošli welcome email cez Resend

**Step 2: Implementuj verify-otp endpoint**

Overí kód z DB, skontroluje expiráciu a max pokusy (5), ak OK → zavolá claim-flow orchestráciu.

**Step 3: Commit**

---

## Task 5: UI komponent — ClaimProfileFlow

**Files:**
- Create: `src/components/ClaimProfileFlow.tsx`

Multi-step modal s 3 krokmi:
1. **Overenie čísla** — zobrazí zamaskované číslo z profilu, tlačidlo "Odoslať SMS kód"
2. **Zadanie kódu** — 6-miestny input, odpočet 10min, tlačidlo "Overiť"
3. **Úspech** — "Profil prevzatý! Skontrolujte email s prihlasovacími údajmi."

Feature gating: zobrazí sa len ak `NEXT_PUBLIC_CLAIM_ENABLED=true`.

---

## Task 6: Integrácia do taxi stránok

**Files:**
- Modify: `app/taxi/[...slug]/page.tsx` — nahraď OwnerClaimButton za ClaimProfileFlow
- Podmienka: zobraz len pre neclaimed/non-partner profily

---

## Task 7: Feature gating v partner editore

**Files:**
- Modify: inline editor komponenty — pridaj zamknuté stavy pre free tier
- Free tier: editovateľné = názov, telefón, web, popis
- Zamknuté (s upsell CTA): logo, fotky, galéria, služby/tagy, platobné metódy, Google recenzie, vlastná stránka

---

## Poradie implementácie

```
Task 1 (DB migrácia) → Task 2 (Twilio modul) → Task 3 (Send OTP API)
→ Task 4 (Verify OTP + účet) → Task 5 (UI komponent)
→ Task 6 (Integrácia) → Task 7 (Feature gating)
```

## Testovanie

- **Twilio trial**: SMS pôjdu len na verified čísla (pridaj svoje v Twilio > Verified Caller IDs)
- **Feature flag**: `NEXT_PUBLIC_CLAIM_ENABLED=true` len v dev/worktree
- **Produkcia nedotknutá**: všetko v novom worktree, nové API routes, nová DB tabuľka
