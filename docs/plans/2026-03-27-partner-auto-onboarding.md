# Partner Auto-Onboarding Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Automaticky vytvoriť partner profil (auth user + partner záznam + draft + welcome email) keď nová taxislužba zaplatí partner balík cez Stripe.

**Architecture:** Rozšíriť existujúci Stripe webhook handler (`handleSubscriptionCreated`) o volanie novej funkcie `handlePartnerOnboarding()` podmienené `planType === 'partner'`. Funkcia vytvorí Supabase auth usera, partner záznam, initial draft a pošle welcome email cez Resend. Sequential execution, "best effort" — webhook vždy vracia 200 OK po uložení subscription.

**Tech Stack:** Next.js 15, Supabase (auth.admin API, service role), Stripe webhooks, Resend email, Node.js crypto

---

## Kontext projektu

- **Doména:** taxinearme.sk (slovenská verzia)
- **Jazyk:** slovenčina (emaily, UI)
- **Mena:** EUR
- **Plány:** mini (€0.99), premium (€3.99), partner (€8.99)
- **FROM_EMAIL:** `noreply@taxinearme.sk`
- **Webhook handler:** `app/api/webhooks/stripe/route.ts` (681 riadkov)
- **Partners tabuľka:** `id, user_id, name, email, slug (UNIQUE), city_slug, created_at, updated_at`
- **Partner drafts tabuľka:** `id, partner_id, status, company_name, description, phone, email, website, hero_*, services, gallery, social_*, template_variant, updated_at`
- **Supabase client:** lazy-init s `SUPABASE_SERVICE_ROLE_KEY` (už v webhook handleri)

---

### Task 1: Vytvoriť `handlePartnerOnboarding` utility funkciu

**Files:**
- Create: `src/lib/partner-onboarding.ts`

**Step 1: Vytvoriť súbor s typmi a helper funkciami**

```typescript
// src/lib/partner-onboarding.ts
import { randomBytes } from 'crypto';
import { SupabaseClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { logger } from '@/lib/logger';
import { escapeHtml } from '@/lib/html-escape';

export interface PartnerOnboardingParams {
  email: string;
  name: string;
  citySlug: string;
  taxiServiceName: string;
  stripeSubscriptionId: string;
}

interface OnboardingResult {
  success: boolean;
  userId?: string;
  partnerId?: string;
  draftId?: string;
  emailSent?: boolean;
  error?: string;
}

/**
 * Generate a URL-safe slug from a name and city.
 * Removes diacritics, lowercases, replaces non-alphanum with hyphens.
 */
export function generatePartnerSlug(name: string, citySlug: string): string {
  const base = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return `${base}-${citySlug}`;
}

/**
 * Generate a cryptographically secure password.
 * 16 random bytes → 22-char base64url string.
 */
export function generateSecurePassword(): string {
  return randomBytes(16).toString('base64url');
}
```

**Step 2: Commit**

```bash
git add src/lib/partner-onboarding.ts
git commit -m "feat: add partner-onboarding utility with slug and password generation"
```

---

### Task 2: Implementovať hlavnú onboarding funkciu

**Files:**
- Modify: `src/lib/partner-onboarding.ts`

**Step 1: Pridať `handlePartnerOnboarding` funkciu**

Pridať na koniec `src/lib/partner-onboarding.ts`:

```typescript
/**
 * Auto-onboard a new partner after Stripe partner plan payment.
 *
 * Flow:
 * 1. Create or find Supabase auth user
 * 2. Create partner record with generated slug
 * 3. Create initial draft with pre-filled data
 * 4. Send welcome email with login credentials
 *
 * Each step is idempotent — safe to call multiple times.
 * Failures are logged but don't throw (best-effort).
 */
export async function handlePartnerOnboarding(
  supabase: SupabaseClient,
  params: PartnerOnboardingParams
): Promise<OnboardingResult> {
  const { email, name, citySlug, taxiServiceName, stripeSubscriptionId } = params;
  const log = logger.with({ fn: 'partnerOnboarding', email, citySlug });

  let userId: string;
  let password: string | null = null;
  let isNewUser = false;

  // ── Step 1: Create or find auth user ──
  try {
    // Check if user already exists
    const { data: listData } = await supabase.auth.admin.listUsers();
    const existingUser = listData?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
      userId = existingUser.id;
      log.info('Auth user already exists', { userId });
    } else {
      password = generateSecurePassword();
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (createError) {
        log.error('Failed to create auth user', { error: createError.message });
        return { success: false, error: `Auth user creation failed: ${createError.message}` };
      }

      userId = newUser.user.id;
      isNewUser = true;
      log.info('Auth user created', { userId });
    }
  } catch (err) {
    log.error('Auth user step failed', { error: err instanceof Error ? err.message : 'Unknown' });
    return { success: false, error: 'Auth user step failed' };
  }

  // ── Step 2: Create partner record ──
  let partnerId: string;
  try {
    // Check if partner already exists for this user
    const { data: existingPartner } = await supabase
      .from('partners')
      .select('id, slug')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingPartner) {
      partnerId = existingPartner.id;
      log.info('Partner record already exists', { partnerId, slug: existingPartner.slug });
    } else {
      // Generate unique slug
      let slug = generatePartnerSlug(taxiServiceName, citySlug);
      const { data: slugExists } = await supabase
        .from('partners')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      if (slugExists) {
        slug = `${slug}-${randomBytes(3).toString('hex')}`;
      }

      const { data: newPartner, error: partnerError } = await supabase
        .from('partners')
        .insert({
          user_id: userId,
          name: taxiServiceName,
          email,
          slug,
          city_slug: citySlug,
        })
        .select('id')
        .single();

      if (partnerError) {
        log.error('Failed to create partner record', { error: partnerError.message });
        return { success: false, userId, error: `Partner creation failed: ${partnerError.message}` };
      }

      partnerId = newPartner.id;
      log.info('Partner record created', { partnerId, slug });
    }
  } catch (err) {
    log.error('Partner record step failed', { error: err instanceof Error ? err.message : 'Unknown' });
    return { success: false, userId, error: 'Partner record step failed' };
  }

  // ── Step 3: Create initial draft ──
  let draftId: string | undefined;
  try {
    // Check if draft already exists
    const { data: existingDraft } = await supabase
      .from('partner_drafts')
      .select('id')
      .eq('partner_id', partnerId)
      .maybeSingle();

    if (existingDraft) {
      draftId = existingDraft.id;
      log.info('Draft already exists', { draftId });
    } else {
      // Get city name for hero subtitle
      const { data: city } = await supabase
        .from('cities')
        .select('name')
        .eq('slug', citySlug)
        .maybeSingle();

      const cityName = city?.name || citySlug
        .split('-')
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      const { data: newDraft, error: draftError } = await supabase
        .from('partner_drafts')
        .insert({
          partner_id: partnerId,
          status: 'draft',
          company_name: taxiServiceName,
          email,
          hero_title: taxiServiceName,
          hero_subtitle: `Profesionálna taxislužba v meste ${cityName}`,
        })
        .select('id')
        .single();

      if (draftError) {
        log.error('Failed to create initial draft', { error: draftError.message });
        // Non-critical — partner can create draft manually
      } else {
        draftId = newDraft.id;
        log.info('Initial draft created', { draftId });
      }
    }
  } catch (err) {
    log.error('Draft creation step failed', { error: err instanceof Error ? err.message : 'Unknown' });
    // Non-critical — continue to email
  }

  // ── Step 4: Send welcome email ──
  let emailSent = false;
  try {
    emailSent = await sendPartnerWelcomeEmail({
      email,
      taxiServiceName,
      citySlug,
      password,
      isNewUser,
    });
  } catch (err) {
    log.error('Welcome email step failed', { error: err instanceof Error ? err.message : 'Unknown' });
  }

  log.info('Partner onboarding completed', {
    userId,
    partnerId,
    draftId,
    emailSent,
    isNewUser,
  });

  return {
    success: true,
    userId,
    partnerId,
    draftId,
    emailSent,
  };
}
```

**Step 2: Commit**

```bash
git add src/lib/partner-onboarding.ts
git commit -m "feat: implement handlePartnerOnboarding with user, partner, draft creation"
```

---

### Task 3: Implementovať welcome email

**Files:**
- Modify: `src/lib/partner-onboarding.ts`

**Step 1: Pridať email template a send funkciu**

Pridať na koniec `src/lib/partner-onboarding.ts`:

```typescript
interface WelcomeEmailParams {
  email: string;
  taxiServiceName: string;
  citySlug: string;
  password: string | null;
  isNewUser: boolean;
}

function buildWelcomeEmailHtml(params: WelcomeEmailParams): string {
  const { email, taxiServiceName, citySlug, password, isNewUser } = params;

  const cityName = citySlug
    .split('-')
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const loginUrl = 'https://taxinearme.sk/partner/login';

  const credentialsSection = isNewUser && password
    ? `
      <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="margin: 0 0 10px 0; color: #92400e;">Vaše prihlasovacie údaje</h3>
        <p style="margin: 5px 0;"><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p style="margin: 5px 0;"><strong>Heslo:</strong> <code style="background: #fff; padding: 2px 8px; border-radius: 4px; font-size: 16px;">${escapeHtml(password)}</code></p>
        <p style="margin: 10px 0 0 0; font-size: 13px; color: #92400e;">Pre bezpečnosť odporúčame heslo po prvom prihlásení zmeniť. Prípadne sa môžete prihlasovať cez jednorázový kód zaslaný na email.</p>
      </div>
    `
    : `
      <div style="background: #dbeafe; border: 1px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="margin: 0 0 10px 0; color: #1e40af;">Prihlásenie</h3>
        <p style="margin: 5px 0;">Váš účet je prepojený s emailom <strong>${escapeHtml(email)}</strong>.</p>
        <p style="margin: 5px 0;">Prihláste sa pomocou existujúceho hesla alebo cez jednorázový kód.</p>
      </div>
    `;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">

    <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
      <h1 style="margin: 0; font-size: 24px;">Vitajte v Partner programe!</h1>
      <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 16px;">Taxi NearMe - taxinearme.sk</p>
    </div>

    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
      <p style="font-size: 16px;">Dobrý deň,</p>
      <p>ďakujeme za aktiváciu <strong>Partner balíka</strong> pre taxislužbu <strong>${escapeHtml(taxiServiceName)}</strong> v meste <strong>${escapeHtml(cityName)}</strong>!</p>

      ${credentialsSection}

      <a href="${loginUrl}" style="display: inline-block; background: #8b5cf6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; margin: 10px 0;">Prihlásiť sa do Partner portálu</a>

      <h3 style="margin: 25px 0 10px 0; color: #6366f1;">Vaše Partner výhody</h3>
      <ul style="padding-left: 20px;">
        <li>Vlastná profilová stránka s logom a galériou</li>
        <li>Zvýraznené zobrazenie na stránke mesta ${escapeHtml(cityName)}</li>
        <li>Možnosť pridať cenník, služby a kontaktné informácie</li>
        <li>Partner badge pre väčšiu dôveryhodnosť</li>
        <li>Priamy kontaktný formulár od zákazníkov</li>
      </ul>

      <h3 style="margin: 25px 0 10px 0; color: #6366f1;">Úprava vašej stránky</h3>
      <p>Svoju partnerskú stránku si môžete upraviť dvoma spôsobmi:</p>

      <div style="background: #f0fdf4; border: 1px solid #22c55e; border-radius: 8px; padding: 16px; margin: 12px 0;">
        <p style="margin: 0 0 8px 0;"><strong>1. Upravte si to sami</strong></p>
        <p style="margin: 0; font-size: 14px;">Prihláste sa do Partner portálu a jednoducho vyplňte údaje o vašej firme — text "O nás", cenník, fotky vozidiel, kontaktné údaje a čokoľvek ďalšie.</p>
      </div>

      <div style="background: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 16px; margin: 12px 0;">
        <p style="margin: 0 0 8px 0;"><strong>2. Urobíme to za vás</strong></p>
        <p style="margin: 0; font-size: 14px;">Nemáte čas? Žiadny problém! Pošlite nám vaše materiály — fotky, cenník, popis služieb, text "O nás" alebo čokoľvek iné — a my vašu stránku radi pripravíme podľa vašich želaní.</p>
        <p style="margin: 8px 0 0 0; font-size: 14px;">Stačí odpovedať na tento email alebo napísať na <a href="mailto:info@taxinearme.sk" style="color: #3b82f6;">info@taxinearme.sk</a></p>
      </div>

      <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e0e0e0;">
        <p style="margin: 0; font-size: 15px;">S pozdravom,</p>
        <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: bold; color: #6366f1;">Tím TaxiNearMe</p>
        <p style="margin: 12px 0 0 0; font-size: 12px; color: #999;">Tento email bol automaticky odoslaný z taxinearme.sk</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

async function sendPartnerWelcomeEmail(params: WelcomeEmailParams): Promise<boolean> {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    logger.warn('RESEND_API_KEY not configured, skipping welcome email');
    return false;
  }

  const fromEmail = process.env.FROM_EMAIL || 'noreply@taxinearme.sk';
  const resend = new Resend(resendApiKey);

  const { error } = await resend.emails.send({
    from: `Taxi NearMe <${fromEmail}>`,
    to: [params.email],
    subject: `Vitajte v Partner programe – ${params.taxiServiceName}`,
    html: buildWelcomeEmailHtml(params),
  });

  if (error) {
    logger.error('Failed to send welcome email', { error: error.message, email: params.email });
    return false;
  }

  logger.info('Welcome email sent', { email: params.email });
  return true;
}
```

**Step 2: Commit**

```bash
git add src/lib/partner-onboarding.ts
git commit -m "feat: add partner welcome email template with login credentials"
```

---

### Task 4: Integrovať onboarding do Stripe webhook handlera

**Files:**
- Modify: `app/api/webhooks/stripe/route.ts:105-186`

**Step 1: Pridať import na začiatok súboru**

Na riadok 7 (za existujúce importy) pridať:

```typescript
import { handlePartnerOnboarding } from '@/lib/partner-onboarding';
```

**Step 2: Pridať volanie po `linkSubscriptionToTaxiService`**

Na koniec funkcie `handleSubscriptionCreated` (po riadku 185, pred uzatváraciu `}`) pridať:

```typescript
  // Auto-onboard partner if partner plan
  const planType = getPlanTypeFromAmount(amountCents);
  if (planType === 'partner' && customerEmail) {
    try {
      const result = await handlePartnerOnboarding(getSupabase(), {
        email: customerEmail,
        name: customerName || taxiServiceName,
        citySlug,
        taxiServiceName,
        stripeSubscriptionId: subscription.id,
      });

      if (result.success) {
        logger.info('Partner auto-onboarding completed', {
          subscriptionId: subscription.id,
          partnerId: result.partnerId,
          emailSent: result.emailSent,
        });
      } else {
        logger.error('Partner auto-onboarding failed', {
          subscriptionId: subscription.id,
          error: result.error,
        });
      }
    } catch (onboardingError) {
      // Non-critical — subscription was already saved, don't fail the webhook
      logger.error('Partner auto-onboarding threw', {
        subscriptionId: subscription.id,
        error: onboardingError instanceof Error ? onboardingError.message : 'Unknown',
      });
    }
  }
```

**Step 3: Commit**

```bash
git add app/api/webhooks/stripe/route.ts
git commit -m "feat: integrate partner auto-onboarding into Stripe webhook handler"
```

---

### Task 5: Pridať admin notifikáciu o novom partnerovi

**Files:**
- Modify: `src/lib/partner-onboarding.ts`

**Step 1: Pridať admin notifikáciu na koniec `handlePartnerOnboarding`**

Pred `return { success: true, ... }` na konci funkcie pridať:

```typescript
  // ── Step 5: Notify admin about new partner ──
  try {
    const notificationEmail = process.env.PARTNER_NOTIFICATION_EMAIL || 'fabianmarian8@gmail.com';
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey && isNewUser) {
      const fromEmail = process.env.FROM_EMAIL || 'noreply@taxinearme.sk';
      const resend = new Resend(resendApiKey);
      await resend.emails.send({
        from: `Taxi NearMe <${fromEmail}>`,
        to: [notificationEmail],
        subject: `Nový partner: ${taxiServiceName}`,
        html: `
          <h2>Nový partner bol automaticky vytvorený</h2>
          <p><strong>Taxislužba:</strong> ${escapeHtml(taxiServiceName)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Mesto:</strong> ${escapeHtml(citySlug)}</p>
          <p><strong>Stripe subscription:</strong> ${escapeHtml(stripeSubscriptionId)}</p>
          <p>Partner dostal welcome email s prihlasovacími údajmi.</p>
          <p><a href="https://taxinearme.sk/admin/partner-drafts">Pozrieť v admin paneli</a></p>
        `,
      });
    }
  } catch (err) {
    log.warn('Admin notification failed', { error: err instanceof Error ? err.message : 'Unknown' });
  }
```

**Step 2: Commit**

```bash
git add src/lib/partner-onboarding.ts
git commit -m "feat: add admin notification email when new partner is auto-created"
```

---

### Task 6: Otestovať celý flow lokálne

**Step 1: Overiť TypeScript kompiláciu**

```bash
cd /Users/marianfabian/Projects/taxi-vision-studio && npx tsc --noEmit
```

Expected: Žiadne TypeScript chyby

**Step 2: Overiť build**

```bash
cd /Users/marianfabian/Projects/taxi-vision-studio && npm run build
```

Expected: Build úspešný

**Step 3: Otestovať webhook lokálne (manuálny test)**

Použiť Stripe CLI na simuláciu webhook eventu:

```bash
stripe trigger customer.subscription.created \
  --override customer:email="test-partner@example.com" \
  --override customer:name="Test Taxi" \
  --override subscription:metadata[city_slug]="bratislava" \
  --override subscription:metadata[taxi_service_name]="Test Taxi"
```

Alebo otestovať cez Stripe Dashboard → Webhooks → Send test webhook

**Step 4: Overiť v Supabase dashboarde**

1. Skontrolovať `auth.users` - nový user existuje
2. Skontrolovať `partners` tabuľku - nový záznam s `slug = "test-taxi-bratislava"`
3. Skontrolovať `partner_drafts` - draft so `status = 'draft'`
4. Skontrolovať email inbox - welcome email doručený

---

## Zhrnutie zmien

| Súbor | Akcia | Riadky |
|-------|-------|--------|
| `src/lib/partner-onboarding.ts` | CREATE | ~250 riadkov |
| `app/api/webhooks/stripe/route.ts` | MODIFY | +25 riadkov (import + volanie) |

**Žiadne nové závislosti** — `crypto`, `resend`, `@supabase/supabase-js` už sú v projekte.

**Žiadne DB migrácie** — využívame existujúce tabuľky `partners`, `partner_drafts`, `auth.users`.

---

## Edge cases (handled)

| Scenár | Správanie |
|--------|-----------|
| User s emailom už existuje | Použije existujúceho usera, nevytvára heslo, email bez credentials |
| Partner záznam už existuje | Preskočí vytvorenie, pokračuje ďalej |
| Draft už existuje | Preskočí vytvorenie |
| Slug collision | Pridá random suffix (`-a3f2b1`) |
| Resend API key chýba | Preskočí email, zaloguje warning |
| Email sa neodošle | Zaloguje error, nepreruší flow |
| Webhook retry (Stripe) | Idempotentné kontroly na každom kroku |
| Metadata chýba (city_slug/name) | Webhook handler má existujúce fallbacky (`unknown`/`Unknown Service`) |
| Non-partner plán | Onboarding sa nespustí (`planType === 'partner'` guard) |
