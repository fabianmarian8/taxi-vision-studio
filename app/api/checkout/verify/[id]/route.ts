import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_PRICES } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const log = logger.with({ endpoint: 'checkout/verify' });
  const { id: taxiServiceId } = await params;

  try {
    // Validácia UUID formátu
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(taxiServiceId)) {
      return NextResponse.json(
        { error: 'Invalid taxi service ID' },
        { status: 400 }
      );
    }

    // Nájsť taxislužbu v databáze
    const supabase = await createClient();
    const { data: taxiService, error: dbError } = await supabase
      .from('taxi_services')
      .select('id, name, city_slug, is_verified')
      .eq('id', taxiServiceId)
      .single();

    if (dbError || !taxiService) {
      log.warn('Taxi service not found', { taxiServiceId });
      return NextResponse.json(
        { error: 'Taxi service not found' },
        { status: 404 }
      );
    }

    // Ak je už overená, presmeruj na stránku taxislužby
    if (taxiService.is_verified) {
      const redirectUrl = `${getBaseUrl(request)}/taxi/${taxiService.city_slug}`;
      return NextResponse.redirect(redirectUrl);
    }

    // Mini plán pre verifikáciu
    const priceId = STRIPE_PRICES.mini;

    if (!priceId) {
      log.error('Missing Stripe mini price ID');
      return NextResponse.json(
        { error: 'Stripe price not configured' },
        { status: 500 }
      );
    }

    // Vytvorenie Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          taxi_service_id: taxiServiceId,
          city_slug: taxiService.city_slug,
          taxi_service_name: taxiService.name,
          plan: 'mini',
        },
      },
      success_url: `${getBaseUrl(request)}/dakujeme?session_id={CHECKOUT_SESSION_ID}&verified=true`,
      cancel_url: `${getBaseUrl(request)}/taxi/${taxiService.city_slug}`,
      billing_address_collection: 'required',
      allow_promotion_codes: true,
    });

    log.info('Verification checkout created', {
      sessionId: session.id,
      taxiServiceId,
      taxiServiceName: taxiService.name,
      duration: Date.now() - startTime,
    });
    await logger.flush();

    // Priame presmerovanie na Stripe Checkout
    return NextResponse.redirect(session.url!);
  } catch (error) {
    log.error('Verification checkout failed', {
      error: error instanceof Error ? error.message : 'Unknown',
      taxiServiceId,
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
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${host}`;
}
