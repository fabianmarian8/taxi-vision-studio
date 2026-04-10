import 'dotenv/config';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

type PlanTier = 'free' | 'managed' | 'partner' | 'leader';

function normalizePlanType(planType: string | null | undefined): PlanTier {
  switch (planType) {
    case 'premium':
    case 'managed':
      return 'managed';
    case 'partner':
    case 'newPartner':
      return 'partner';
    case 'leader':
      return 'leader';
    default:
      return 'free';
  }
}

function printHelp() {
  console.log(`Usage: npx tsx scripts/billing-audit.ts

Checks:
- Stripe active subscriptions missing in DB
- DB active subscriptions missing in Stripe
- active subscriptions not linked to taxi_services
- taxi_services flags inconsistent with subscription tier
- partners missing taxi_service_id link
`);
}

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  printHelp();
  process.exit(0);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey || !stripeSecretKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY or STRIPE_SECRET_KEY');
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-12-15.clover',
  typescript: true,
});

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
});

async function getActiveStripeSubscriptions() {
  const subscriptions: Stripe.Subscription[] = [];
  for await (const subscription of stripe.subscriptions.list({ status: 'active', limit: 100 })) {
    subscriptions.push(subscription);
  }
  return subscriptions;
}

async function main() {
  const [stripeSubscriptions, dbSubscriptionsResult, taxiServicesResult, partnersResult] = await Promise.all([
    getActiveStripeSubscriptions(),
    supabase
      .from('subscriptions')
      .select('id, stripe_subscription_id, plan_type, status, amount_cents, current_period_end, taxi_service_name, city_slug')
      .eq('status', 'active'),
    supabase
      .from('taxi_services')
      .select('id, name, city_slug, subscription_id, is_verified, is_premium, is_partner, premium_expires_at'),
    supabase
      .from('partners')
      .select('id, name, city_slug, plan_type, taxi_service_id'),
  ]);

  if (dbSubscriptionsResult.error) throw dbSubscriptionsResult.error;
  if (taxiServicesResult.error) throw taxiServicesResult.error;
  if (partnersResult.error) throw partnersResult.error;

  const dbSubscriptions = dbSubscriptionsResult.data || [];
  const taxiServices = taxiServicesResult.data || [];
  const partners = partnersResult.data || [];

  const stripeById = new Map(stripeSubscriptions.map((subscription) => [subscription.id, subscription]));
  const dbByStripeId = new Map(dbSubscriptions.map((subscription) => [subscription.stripe_subscription_id, subscription]));
  const servicesBySubscriptionId = new Map<string, typeof taxiServices>();

  for (const service of taxiServices) {
    if (!service.subscription_id) continue;
    const bucket = servicesBySubscriptionId.get(service.subscription_id) || [];
    bucket.push(service);
    servicesBySubscriptionId.set(service.subscription_id, bucket);
  }

  const issues: string[] = [];

  for (const stripeSubscription of stripeSubscriptions) {
    const dbSubscription = dbByStripeId.get(stripeSubscription.id);
    if (!dbSubscription) {
      issues.push(`Stripe active subscription missing in DB: ${stripeSubscription.id}`);
      continue;
    }

    const stripeAmount = stripeSubscription.items.data[0]?.price?.unit_amount || 0;
    if ((dbSubscription.amount_cents || 0) !== stripeAmount) {
      issues.push(
        `Amount mismatch for ${stripeSubscription.id}: Stripe=${stripeAmount} DB=${dbSubscription.amount_cents || 0}`
      );
    }
  }

  for (const dbSubscription of dbSubscriptions) {
    if (!stripeById.has(dbSubscription.stripe_subscription_id)) {
      issues.push(`DB active subscription missing in Stripe: ${dbSubscription.stripe_subscription_id}`);
    }

    const linkedServices = servicesBySubscriptionId.get(dbSubscription.id) || [];
    if (linkedServices.length === 0) {
      issues.push(`Active subscription not linked to taxi service: ${dbSubscription.stripe_subscription_id}`);
      continue;
    }

    if (linkedServices.length > 1) {
      issues.push(`Subscription linked to multiple taxi services: ${dbSubscription.stripe_subscription_id}`);
    }

    const normalizedTier = normalizePlanType(dbSubscription.plan_type);
    const expectedVerified = true;
    const expectedPremium = normalizedTier === 'managed' || normalizedTier === 'partner' || normalizedTier === 'leader';
    const expectedPartner = normalizedTier === 'partner' || normalizedTier === 'leader';

    for (const service of linkedServices) {
      if (service.is_verified !== expectedVerified) {
        issues.push(`is_verified mismatch for ${service.city_slug}/${service.name}`);
      }
      if (service.is_premium !== expectedPremium) {
        issues.push(`is_premium mismatch for ${service.city_slug}/${service.name}`);
      }
      if (service.is_partner !== expectedPartner) {
        issues.push(`is_partner mismatch for ${service.city_slug}/${service.name}`);
      }
      if (!service.premium_expires_at) {
        issues.push(`premium_expires_at missing for linked service ${service.city_slug}/${service.name}`);
      }
    }
  }

  const taxiServiceIds = new Set(taxiServices.map((service) => service.id));
  for (const partner of partners) {
    const tier = normalizePlanType(partner.plan_type);
    if (tier !== 'free' && !partner.taxi_service_id) {
      issues.push(`Paid partner missing taxi_service_id: ${partner.name} (${partner.id})`);
      continue;
    }
    if (partner.taxi_service_id && !taxiServiceIds.has(partner.taxi_service_id)) {
      issues.push(`Partner points to missing taxi_service_id: ${partner.name} (${partner.taxi_service_id})`);
    }
  }

  console.log(`Stripe active subscriptions: ${stripeSubscriptions.length}`);
  console.log(`DB active subscriptions: ${dbSubscriptions.length}`);
  console.log(`Taxi services with subscription_id: ${taxiServices.filter((service) => service.subscription_id).length}`);
  console.log(`Partners: ${partners.length}`);

  if (issues.length === 0) {
    console.log('Billing audit passed: no inconsistencies found');
    return;
  }

  console.error(`Billing audit found ${issues.length} issue(s):`);
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }

  process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
