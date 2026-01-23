import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { constructWebhookEvent, getPlanTypeFromAmount, stripe } from '@/lib/stripe';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

// Lazy-initialized Supabase client to avoid build-time errors
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

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    logger.warn('Stripe webhook missing signature');
    await logger.flush();
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = constructWebhookEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err) {
    logger.error('Stripe webhook signature verification failed', {
      error: err instanceof Error ? err.message : 'Unknown',
    });
    await logger.flush();
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const log = logger.with({ endpoint: 'stripe-webhook', eventType: event.type, eventId: event.id });
  log.info('Stripe webhook received');

  // Idempotency check - skip if we've already processed this event
  const { data: existingEvent } = await getSupabase()
    .from('subscription_events')
    .select('id')
    .eq('stripe_event_id', event.id)
    .maybeSingle();

  if (existingEvent) {
    console.log(`⏭️ Skipping duplicate event: ${event.id}`);
    return NextResponse.json({ received: true, skipped: true });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription, event.id);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, event.id);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, event.id);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice, event.id);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice, event.id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    log.error('Webhook processing failed', {
      error: error instanceof Error ? error.message : 'Unknown',
      duration: Date.now() - startTime,
    });
    await logger.flush();
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }

  log.info('Webhook processed successfully', { duration: Date.now() - startTime });
  await logger.flush();
  return NextResponse.json({ received: true });
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription, stripeEventId: string) {
  const subscriptionItem = subscription.items.data[0];
  const amountCents = subscriptionItem?.price?.unit_amount || 0;
  // Period fields are on subscription items in current Stripe SDK
  const periodStart = subscriptionItem?.current_period_start;
  const periodEnd = subscriptionItem?.current_period_end;

  if (!periodStart || !periodEnd) {
    console.error(`Missing period data for subscription ${subscription.id}`);
    throw new Error('Missing period data');
  }

  // Get customer email from Stripe API (not from DB - new customers won't have DB record yet)
  let customerEmail = '';
  let customerName = '';
  try {
    const customerId = subscription.customer as string;
    const customer = await stripe.customers.retrieve(customerId);
    if (customer && !customer.deleted) {
      customerEmail = customer.email || '';
      customerName = customer.name || '';
    }
  } catch (err) {
    console.warn('Could not retrieve customer from Stripe:', err);
  }

  // Extract metadata (may be missing from Payment Links)
  const citySlug = (subscription.metadata?.city_slug as string) || 'unknown';
  const taxiServiceName = (subscription.metadata?.taxi_service_name as string) || 'Unknown Service';
  const taxiServiceId = subscription.metadata?.taxi_service_id as string | undefined;

  // Log warning if metadata is missing (but taxi_service_id is enough)
  if (!taxiServiceId && (citySlug === 'unknown' || taxiServiceName === 'Unknown Service')) {
    console.warn(`⚠️ Subscription ${subscription.id} missing metadata:`, {
      city_slug: citySlug,
      taxi_service_name: taxiServiceName,
      taxi_service_id: taxiServiceId,
      customer_email: customerEmail,
      metadata: subscription.metadata,
    });
  }

  // Insert new subscription
  const { error } = await getSupabase().from('subscriptions').upsert({
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer as string,
    stripe_price_id: subscriptionItem?.price?.id || '',
    plan_type: getPlanTypeFromAmount(amountCents),
    status: subscription.status,
    amount_cents: amountCents,
    currency: subscription.currency,
    current_period_start: new Date(periodStart * 1000).toISOString(),
    current_period_end: new Date(periodEnd * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    customer_email: customerEmail,
    customer_name: customerName,
    city_slug: citySlug,
    taxi_service_name: taxiServiceName,
    metadata: subscription.metadata || {},
  }, {
    onConflict: 'stripe_subscription_id',
  });

  if (error) {
    console.error('Error inserting subscription:', error);
    throw error;
  }

  console.log(`✅ Subscription created: ${subscription.id}`, {
    customer_email: customerEmail,
    customer_name: customerName,
    city_slug: citySlug,
    taxi_service_name: taxiServiceName,
    plan_type: getPlanTypeFromAmount(amountCents),
  });

  // Link subscription to taxi service (auto-enables verified/premium)
  await linkSubscriptionToTaxiService(subscription.id, citySlug, taxiServiceName, taxiServiceId);

  // Log event with Stripe event ID for idempotency
  await logSubscriptionEvent(subscription.id, 'created', amountCents, null, subscription.status, stripeEventId);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription, stripeEventId: string) {
  const subscriptionItem = subscription.items.data[0];
  const amountCents = subscriptionItem?.price?.unit_amount || 0;
  // Period fields are on subscription items in current Stripe SDK
  const periodStart = subscriptionItem?.current_period_start;
  const periodEnd = subscriptionItem?.current_period_end;

  if (!periodStart || !periodEnd) {
    console.error(`Missing period data for subscription ${subscription.id}`);
    throw new Error('Missing period data');
  }

  // Get previous status
  const { data: existing } = await getSupabase()
    .from('subscriptions')
    .select('status')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  const previousStatus = existing?.status || null;

  // Update subscription
  const { error } = await getSupabase()
    .from('subscriptions')
    .update({
      status: subscription.status,
      amount_cents: amountCents,
      current_period_start: new Date(periodStart * 1000).toISOString(),
      current_period_end: new Date(periodEnd * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }

  // Log event if status changed
  if (previousStatus !== subscription.status) {
    await logSubscriptionEvent(
      subscription.id,
      'updated',
      amountCents,
      previousStatus,
      subscription.status,
      stripeEventId
    );
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription, stripeEventId: string) {
  // Get previous status
  const { data: existing } = await getSupabase()
    .from('subscriptions')
    .select('status')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  const previousStatus = existing?.status || null;

  // Update subscription status to canceled
  const { error } = await getSupabase()
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }

  // Log cancellation event
  await logSubscriptionEvent(
    subscription.id,
    'canceled',
    null,
    previousStatus,
    'canceled',
    stripeEventId
  );
}

async function handleInvoicePaid(invoice: Stripe.Invoice, stripeEventId: string) {
  // Get subscription ID from invoice (handle both old and new API structure)
  const subscriptionId = (invoice as unknown as { subscription?: string | null }).subscription;
  if (!subscriptionId) return;

  // Log renewal event
  await logSubscriptionEvent(
    subscriptionId,
    'renewed',
    invoice.amount_paid,
    null,
    null,
    stripeEventId
  );
}

async function handlePaymentFailed(invoice: Stripe.Invoice, stripeEventId: string) {
  // Get subscription ID from invoice (handle both old and new API structure)
  const subscriptionId = (invoice as unknown as { subscription?: string | null }).subscription;
  if (!subscriptionId) return;

  // Update subscription status
  await getSupabase()
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscriptionId);

  // Log event
  await logSubscriptionEvent(
    subscriptionId,
    'payment_failed',
    invoice.amount_due,
    null,
    'past_due',
    stripeEventId
  );
}

/**
 * Link Stripe subscription to taxi service for auto verified/premium/partner enable/disable
 */
async function linkSubscriptionToTaxiService(
  stripeSubscriptionId: string,
  citySlug: string | undefined,
  taxiServiceName: string | undefined,
  taxiServiceId: string | undefined
) {
  // Get our subscription ID with plan_type
  const { data: subscription } = await getSupabase()
    .from('subscriptions')
    .select('id, status, plan_type, current_period_end')
    .eq('stripe_subscription_id', stripeSubscriptionId)
    .single();

  if (!subscription) {
    console.warn(`Subscription not found: ${stripeSubscriptionId}`);
    return;
  }

  const isActive = subscription.status === 'active';
  const isPremiumPlan = subscription.plan_type === 'premium' || subscription.plan_type === 'partner';
  const isPartnerPlan = subscription.plan_type === 'partner';

  // Update data - all plans get verified, only premium+ get is_premium
  const updateData = {
    subscription_id: subscription.id,
    is_verified: isActive, // All plans get verified badge
    is_premium: isActive && isPremiumPlan, // Only premium/partner get highlighted
    is_partner: isActive && isPartnerPlan, // Only partner gets partner features
    premium_expires_at: isActive ? subscription.current_period_end : null,
    updated_at: new Date().toISOString(),
  };

  let error;
  let count;

  // If we have taxi_service_id, use it directly (most secure)
  if (taxiServiceId) {
    const result = await getSupabase()
      .from('taxi_services')
      .update(updateData, { count: 'exact' })
      .eq('id', taxiServiceId);

    error = result.error;
    count = result.count;

    if (!error && count === 1) {
      console.log(`✅ Linked subscription ${stripeSubscriptionId} to taxi service ID ${taxiServiceId} (plan: ${subscription.plan_type})`);
    }
  }
  // Fallback to city_slug + name matching
  else if (citySlug && taxiServiceName) {
    // SECURITY: Escape LIKE pattern characters to prevent pattern injection
    const escapedName = taxiServiceName
      .replace(/\\/g, '\\\\')
      .replace(/%/g, '\\%')
      .replace(/_/g, '\\_');

    const result = await getSupabase()
      .from('taxi_services')
      .update(updateData, { count: 'exact' })
      .eq('city_slug', citySlug)
      .ilike('name', escapedName);

    error = result.error;
    count = result.count;

    if (!error && count === 1) {
      console.log(`✅ Linked subscription ${stripeSubscriptionId} to ${taxiServiceName} in ${citySlug} (plan: ${subscription.plan_type})`);
    }
  } else {
    console.warn('Missing taxi_service_id and city_slug/taxi_service_name in subscription metadata');
    return;
  }

  if (error) {
    console.error('Error linking subscription to taxi service:', error);
  } else if (count === 0) {
    console.warn(`⚠️ No taxi service found for ID ${taxiServiceId || `${taxiServiceName} in ${citySlug}`}`);
  } else if (count && count > 1) {
    console.error(`🚨 SECURITY: Multiple (${count}) taxi services updated!`);
  }
}

async function logSubscriptionEvent(
  stripeSubscriptionId: string,
  eventType: string,
  amountCents: number | null,
  previousStatus: string | null,
  newStatus: string | null,
  stripeEventId: string
) {
  // Get subscription ID from our database
  const { data: subscription } = await getSupabase()
    .from('subscriptions')
    .select('id')
    .eq('stripe_subscription_id', stripeSubscriptionId)
    .single();

  if (!subscription) {
    console.warn(`Subscription not found for ${stripeSubscriptionId}`);
    return;
  }

  // Insert with stripe_event_id for idempotency (UNIQUE constraint handles duplicates)
  const { error } = await getSupabase().from('subscription_events').insert({
    subscription_id: subscription.id,
    stripe_event_id: stripeEventId,
    event_type: eventType,
    amount_cents: amountCents,
    previous_status: previousStatus,
    new_status: newStatus,
  });

  // Throw on non-duplicate errors so Stripe retries
  if (error && !error.message?.includes('duplicate')) {
    console.error('Error logging subscription event:', error);
    throw error;
  }
}
