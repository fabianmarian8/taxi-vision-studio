import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Verify user is authenticated
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { customerId, returnUrl } = body;

    // SECURITY: Verify that this customerId belongs to a subscription
    // associated with a partner owned by the current user
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get user's partners
    const { data: partners, error: partnerError } = await supabase
      .from('partners')
      .select('id, name, city_slug')
      .eq('user_id', user.id);

    if (partnerError || !partners || partners.length === 0) {
      return NextResponse.json(
        { error: 'No partners found for this user' },
        { status: 404 }
      );
    }

    // Check if any of user's partners has a subscription with this customerId
    let verifiedCustomerId: string | null = null;

    for (const partner of partners) {
      const { data: taxiService } = await adminClient
        .from('taxi_services')
        .select(`
          subscription_id,
          subscriptions (
            stripe_customer_id
          )
        `)
        .eq('city_slug', partner.city_slug)
        .ilike('name', partner.name)
        .not('subscription_id', 'is', null)
        .single();

      if (taxiService?.subscriptions) {
        const sub = taxiService.subscriptions as unknown as { stripe_customer_id: string };
        if (sub.stripe_customer_id === customerId) {
          verifiedCustomerId = customerId;
          break;
        }
      }
    }

    if (!verifiedCustomerId) {
      console.error('Portal access denied: customerId not found for user partners', {
        userId: user.id,
        requestedCustomerId: customerId,
      });
      return NextResponse.json(
        { error: 'No billing account found' },
        { status: 404 }
      );
    }

    // Create portal session using verified customer ID
    const session = await stripe.billingPortal.sessions.create({
      customer: verifiedCustomerId,
      return_url: returnUrl || `${getBaseUrl(request)}/partner`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Portal session error:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}

function getBaseUrl(request: NextRequest): string {
  // Use NEXT_PUBLIC_SITE_URL if set
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  // Fallback to request headers
  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${host}`;
}