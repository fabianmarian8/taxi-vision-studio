import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { isSuperadmin } from '@/lib/superadmin';

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

    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // SECURITY: Verify that this customerId belongs to a valid subscription
    // Superadmins can access any partner's portal (they impersonate via dashboard)
    // Regular users can only access subscriptions linked to their own partners

    const userEmail = user.email;
    const isAdmin = isSuperadmin(userEmail);

    // Step 1: Find subscription by stripe_customer_id
    const { data: subscriptions, error: subError } = await adminClient
      .from('subscriptions')
      .select('id')
      .eq('stripe_customer_id', customerId);

    if (subError) {
      console.error('Portal: subscription query error:', subError);
    }

    const subscriptionIds = subscriptions?.map(s => s.id) || [];
    let verifiedCustomerId: string | null = null;

    if (subscriptionIds.length > 0) {
      if (isAdmin) {
        // Superadmin: just verify the subscription exists and is linked to a taxi_service
        const { data: taxiService } = await adminClient
          .from('taxi_services')
          .select('id')
          .in('subscription_id', subscriptionIds)
          .limit(1)
          .maybeSingle();

        if (taxiService) {
          verifiedCustomerId = customerId;
        }
      } else {
        // Regular user: verify subscription is linked to a taxi_service in their partner's city
        const { data: partners, error: partnerError } = await supabase
          .from('partners')
          .select('city_slug')
          .eq('user_id', user.id);

        if (partnerError) {
          console.error('Portal: partners query error:', partnerError);
        }

        const citySlugs = (partners || []).map(p => p.city_slug).filter(Boolean);

        if (citySlugs.length > 0) {
          const { data: taxiService } = await adminClient
            .from('taxi_services')
            .select('id')
            .in('subscription_id', subscriptionIds)
            .in('city_slug', citySlugs)
            .limit(1)
            .maybeSingle();

          if (taxiService) {
            verifiedCustomerId = customerId;
          }
        }
      }
    }

    if (!verifiedCustomerId) {
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