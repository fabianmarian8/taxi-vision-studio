import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_PRICES } from '@/lib/stripe';
import { logger } from '@/lib/logger';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

// Lazy-initialized Supabase client
let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('Supabase credentials not configured');
    }
    _supabase = createClient(url, key);
  }
  return _supabase;
}

// Generate idempotency key from city_slug + taxi_service_name + current hour
// Same inputs within the same hour produce the same key (prevents duplicate checkouts)
// After 1 hour, a new checkout can be created for the same service
function generateIdempotencyKey(citySlug: string, taxiServiceName: string): string {
  const hourBucket = Math.floor(Date.now() / 3600000);
  const data = `checkout:${citySlug}:${taxiServiceName}:${hourBucket}`;
  return createHash('sha256').update(data).digest('hex').substring(0, 32);
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const log = logger.with({ endpoint: 'checkout/create-session' });

  try {
    const body = await request.json();
    const { plan, citySlug, taxiServiceName } = body;

    // Validácia
    if (!plan || !['mini', 'premium', 'partner'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be "mini", "premium" or "partner".' },
        { status: 400 }
      );
    }

    if (!citySlug || typeof citySlug !== 'string' || citySlug.trim().length === 0) {
      return NextResponse.json(
        { error: 'citySlug is required' },
        { status: 400 }
      );
    }

    if (!taxiServiceName || typeof taxiServiceName !== 'string' || taxiServiceName.trim().length === 0) {
      return NextResponse.json(
        { error: 'taxiServiceName is required' },
        { status: 400 }
      );
    }

    // Normalizované hodnoty pre porovnanie
    const normalizedCitySlug = citySlug.trim().toLowerCase();
    const normalizedTaxiName = taxiServiceName.trim();

    // OCHRANA: Kontrola existujúcej aktívnej subscription pre túto taxislužbu
    const { data: existingSubscription } = await getSupabase()
      .from('subscriptions')
      .select('id, status, stripe_subscription_id, plan_type')
      .eq('city_slug', normalizedCitySlug)
      .ilike('taxi_service_name', normalizedTaxiName)
      .in('status', ['active', 'trialing', 'past_due'])
      .maybeSingle();

    if (existingSubscription) {
      log.warn('Duplicate checkout attempt blocked', {
        citySlug: normalizedCitySlug,
        taxiServiceName: normalizedTaxiName,
        existingSubscriptionId: existingSubscription.stripe_subscription_id,
        existingPlan: existingSubscription.plan_type,
      });
      await logger.flush();
      return NextResponse.json(
        {
          error: 'Táto taxislužba už má aktívne predplatné',
          existingPlan: existingSubscription.plan_type,
        },
        { status: 409 }
      );
    }

    // Získať Price ID
    const priceId = plan === 'partner'
      ? STRIPE_PRICES.partner
      : plan === 'premium'
        ? STRIPE_PRICES.premium
        : STRIPE_PRICES.mini;

    if (!priceId) {
      console.error(`Missing Stripe price ID for plan: ${plan}`);
      return NextResponse.json(
        { error: 'Stripe price not configured' },
        { status: 500 }
      );
    }

    // Generovanie idempotency key pre ochranu proti duplicitným requestom
    const idempotencyKey = generateIdempotencyKey(normalizedCitySlug, normalizedTaxiName);

    // Vytvorenie Checkout Session s metadata na subscription
    const session = await stripe.checkout.sessions.create(
      {
        mode: 'subscription',
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        // Metadata sa automaticky prenesú na subscription objekt
        subscription_data: {
          metadata: {
            city_slug: normalizedCitySlug,
            taxi_service_name: normalizedTaxiName,
          },
        },
        // URLs
        success_url: `${getBaseUrl(request)}/dakujeme?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${getBaseUrl(request)}/pre-taxiky`,
        // Automatické vyplnenie
        billing_address_collection: 'required',
        // Povolenie promo kódov
        allow_promotion_codes: true,
      },
      {
        idempotencyKey,
      }
    );

    log.info('Checkout session created', {
      sessionId: session.id,
      plan,
      citySlug,
      taxiServiceName,
      duration: Date.now() - startTime,
    });
    await logger.flush();

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    log.error('Checkout session creation failed', {
      error: error instanceof Error ? error.message : 'Unknown',
      duration: Date.now() - startTime,
    });
    await logger.flush();
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

function getBaseUrl(request: NextRequest): string {
  // Použiť NEXT_PUBLIC_SITE_URL ak je nastavený
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  // Fallback na request headers
  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${host}`;
}
