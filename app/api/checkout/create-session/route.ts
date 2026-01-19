import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_PRICES } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plan, citySlug, taxiServiceName } = body;

    // Validácia
    if (!plan || !['premium', 'partner'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be "premium" or "partner".' },
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

    // Získať Price ID
    const priceId = plan === 'partner' ? STRIPE_PRICES.partner : STRIPE_PRICES.premium;

    if (!priceId) {
      console.error(`Missing Stripe price ID for plan: ${plan}`);
      return NextResponse.json(
        { error: 'Stripe price not configured' },
        { status: 500 }
      );
    }

    // Vytvorenie Checkout Session s metadata na subscription
    const session = await stripe.checkout.sessions.create({
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
          city_slug: citySlug.trim().toLowerCase(),
          taxi_service_name: taxiServiceName.trim(),
        },
      },
      // URLs
      success_url: `${getBaseUrl(request)}/dakujeme?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getBaseUrl(request)}/pre-taxiky`,
      // Automatické vyplnenie
      billing_address_collection: 'required',
      // Povolenie promo kódov
      allow_promotion_codes: true,
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('[checkout/create-session] Error:', error);
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
