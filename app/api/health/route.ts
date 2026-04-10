import { NextResponse } from 'next/server';
import { createAnonymousClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { STRIPE_PRICES, stripe } from '@/lib/stripe';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Secret token to prevent public access
const HEALTH_SECRET = process.env.HEALTH_CHECK_SECRET;

// Service role client for smoke tests that need write access
function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

interface CheckResult {
  ok: boolean;
  ms: number;
  error?: string;
  details?: Record<string, unknown>;
}

async function timedCheck(name: string, fn: () => Promise<Partial<CheckResult>>): Promise<CheckResult> {
  const start = Date.now();
  try {
    const result = await Promise.race([
      fn(),
      new Promise<Partial<CheckResult>>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 10000)
      ),
    ]);
    return { ok: true, ms: Date.now() - start, ...result };
  } catch (error) {
    return {
      ok: false,
      ms: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// --- Individual checks ---

async function checkSupabase(): Promise<Partial<CheckResult>> {
  const supabase = createAnonymousClient();
  const { count, error } = await supabase
    .from('taxi_services')
    .select('*', { count: 'exact', head: true });
  if (error) throw new Error(error.message);
  return { details: { rows: count } };
}

async function checkSupabaseAuth(): Promise<Partial<CheckResult>> {
  const supabase = createAnonymousClient();
  // Test that auth endpoint is reachable
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  return { details: { reachable: true } };
}

async function checkStripe(): Promise<Partial<CheckResult>> {
  const prices = await stripe.prices.list({ limit: 1 });
  return { details: { prices: prices.data.length } };
}

async function checkResend(): Promise<Partial<CheckResult>> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY not configured');
  const res = await fetch('https://api.resend.com/domains', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) throw new Error(`Resend API: ${res.status} ${res.statusText}`);
  return {};
}

async function checkUpstashRedis(): Promise<Partial<CheckResult>> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error('Upstash not configured');
  const res = await fetch(`${url}/ping`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Redis: ${res.status}`);
  const data = await res.json();
  if (data.result !== 'PONG') throw new Error(`Redis ping: ${data.result}`);
  return {};
}

async function checkSearch(): Promise<Partial<CheckResult>> {
  // Test Supabase search directly instead of self-calling the API
  const supabase = createAnonymousClient();
  const { data, error } = await supabase
    .from('taxi_services')
    .select('id, name')
    .ilike('city_slug', '%bratislava%')
    .limit(3);
  if (error) throw new Error(error.message);
  return { details: { results: data?.length ?? 0 } };
}

async function checkEnvVars(): Promise<Partial<CheckResult>> {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'RESEND_API_KEY',
    'SESSION_SECRET',
  ];
  const missing = required.filter((v) => !process.env[v]);
  if (missing.length > 0) throw new Error(`Missing: ${missing.join(', ')}`);
  return {};
}

async function checkStripeWebhookSecret(): Promise<Partial<CheckResult>> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET not configured');
  if (!secret.startsWith('whsec_')) throw new Error('Invalid webhook secret format');
  return {};
}

// --- Smoke tests for business operations ---

async function checkPartnerDraftSave(): Promise<Partial<CheckResult>> {
  const sb = getServiceClient();
  // Find any partner to test with
  const { data: partner, error: findErr } = await sb
    .from('partners')
    .select('id')
    .limit(1)
    .single();
  if (findErr || !partner) throw new Error(`No partner found: ${findErr?.message}`);

  // Try to insert a test draft and immediately delete it
  const { data: draft, error: insertErr } = await sb
    .from('partner_drafts')
    .insert({
      partner_id: partner.id,
      status: 'draft',
      company_name: '__HEALTH_CHECK_TEST__',
    })
    .select('id')
    .single();
  if (insertErr) throw new Error(`Draft insert failed: ${insertErr.message}`);

  // Clean up immediately
  const { error: deleteErr } = await sb
    .from('partner_drafts')
    .delete()
    .eq('id', draft.id);
  if (deleteErr) throw new Error(`Draft cleanup failed: ${deleteErr.message}`);

  return { details: { partner_id: partner.id } };
}

async function checkClickTracking(): Promise<Partial<CheckResult>> {
  const sb = getServiceClient();
  // Insert a test click event and delete it
  const { data: click, error: insertErr } = await sb
    .from('click_events')
    .insert({
      event_type: 'phone_click',
      city_slug: '__health_check__',
      service_name: '__HEALTH_CHECK_TEST__',
      user_agent: 'SiteGuard-Health/1.0',
    })
    .select('id')
    .single();
  if (insertErr) throw new Error(`Click insert failed: ${insertErr.message}`);

  // Clean up
  const { error: deleteErr } = await sb
    .from('click_events')
    .delete()
    .eq('id', click.id);
  if (deleteErr) throw new Error(`Click cleanup failed: ${deleteErr.message}`);

  return {};
}

async function checkSubscriptionsTable(): Promise<Partial<CheckResult>> {
  const sb = getServiceClient();
  const { count, error } = await sb
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');
  if (error) throw new Error(`Subscriptions query failed: ${error.message}`);
  return { details: { active: count } };
}

async function checkStripeCheckoutDryRun(): Promise<Partial<CheckResult>> {
  const requiredPlans = ['managed', 'newPartner', 'leader'] as const;
  const optionalPlans = ['mini', 'premium', 'partner'] as const;

  const missingRequired = requiredPlans.filter((plan) => !STRIPE_PRICES[plan]);
  if (missingRequired.length > 0) {
    throw new Error(`Missing required price IDs: ${missingRequired.join(', ')}`);
  }

  const plansToValidate = [
    ...requiredPlans,
    ...optionalPlans.filter((plan) => Boolean(STRIPE_PRICES[plan])),
  ];

  const prices = await Promise.all(
    plansToValidate.map(async (plan) => {
      const price = await stripe.prices.retrieve(STRIPE_PRICES[plan]);
      return {
        plan,
        id: price.id,
        active: price.active,
        currency: price.currency,
        unit_amount: price.unit_amount,
      };
    })
  );

  const inactivePlans = prices.filter((price) => !price.active).map((price) => price.plan);
  if (inactivePlans.length > 0) {
    throw new Error(`Inactive Stripe prices: ${inactivePlans.join(', ')}`);
  }

  return {
    details: {
      validated_plans: prices.map((price) => price.plan),
      prices,
    },
  };
}

export async function GET(request: Request) {
  // Authenticate with secret token
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!HEALTH_SECRET || token !== HEALTH_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const log = logger.with({ endpoint: 'health' });
  const startTime = Date.now();

  // Run all checks in parallel
  const [
    supabase,
    supabaseAuth,
    stripeCheck,
    resend,
    redis,
    search,
    envVars,
    webhookSecret,
    partnerDraft,
    clickTracking,
    subscriptions,
    checkoutDryRun,
  ] = await Promise.all([
    timedCheck('supabase', checkSupabase),
    timedCheck('supabase_auth', checkSupabaseAuth),
    timedCheck('stripe', checkStripe),
    timedCheck('resend', checkResend),
    timedCheck('upstash_redis', checkUpstashRedis),
    timedCheck('search', checkSearch),
    timedCheck('env_vars', checkEnvVars),
    timedCheck('webhook_secret', checkStripeWebhookSecret),
    timedCheck('partner_draft_save', checkPartnerDraftSave),
    timedCheck('click_tracking', checkClickTracking),
    timedCheck('subscriptions', checkSubscriptionsTable),
    timedCheck('checkout_dry_run', checkStripeCheckoutDryRun),
  ]);

  const checks = {
    supabase,
    supabase_auth: supabaseAuth,
    stripe: stripeCheck,
    resend,
    upstash_redis: redis,
    search,
    env_vars: envVars,
    webhook_secret: webhookSecret,
    partner_draft_save: partnerDraft,
    click_tracking: clickTracking,
    subscriptions,
    checkout_dry_run: checkoutDryRun,
  };

  const totalChecks = Object.values(checks).length;
  const passedChecks = Object.values(checks).filter((c) => c.ok).length;
  const failedChecks = Object.entries(checks)
    .filter(([, c]) => !c.ok)
    .map(([name]) => name);

  // Determine overall status
  const criticalServices = ['supabase', 'stripe', 'env_vars', 'partner_draft_save', 'checkout_dry_run'];
  const hasCriticalFailure = failedChecks.some((f) => criticalServices.includes(f));

  let status: 'healthy' | 'degraded' | 'critical';
  if (failedChecks.length === 0) {
    status = 'healthy';
  } else if (hasCriticalFailure) {
    status = 'critical';
  } else {
    status = 'degraded';
  }

  const score = Math.round((passedChecks / totalChecks) * 100);

  const result = {
    status,
    score,
    passed: passedChecks,
    total: totalChecks,
    failed: failedChecks,
    checks,
    duration_ms: Date.now() - startTime,
    timestamp: new Date().toISOString(),
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local',
  };

  // Log health check result
  if (status !== 'healthy') {
    log.warn('Health check degraded', {
      status,
      score,
      failed: failedChecks,
      duration: result.duration_ms,
    });
  }
  await logger.flush();

  const httpStatus = status === 'critical' ? 503 : status === 'degraded' ? 200 : 200;

  return NextResponse.json(result, {
    status: httpStatus,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
