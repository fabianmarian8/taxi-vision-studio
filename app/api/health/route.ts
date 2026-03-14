import { NextResponse } from 'next/server';
import { createAnonymousClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Secret token to prevent public access
const HEALTH_SECRET = process.env.HEALTH_CHECK_SECRET;

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

export async function GET(request: Request) {
  // Authenticate with secret token
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (HEALTH_SECRET && token !== HEALTH_SECRET) {
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
  ] = await Promise.all([
    timedCheck('supabase', checkSupabase),
    timedCheck('supabase_auth', checkSupabaseAuth),
    timedCheck('stripe', checkStripe),
    timedCheck('resend', checkResend),
    timedCheck('upstash_redis', checkUpstashRedis),
    timedCheck('search', checkSearch),
    timedCheck('env_vars', checkEnvVars),
    timedCheck('webhook_secret', checkStripeWebhookSecret),
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
  };

  const totalChecks = Object.values(checks).length;
  const passedChecks = Object.values(checks).filter((c) => c.ok).length;
  const failedChecks = Object.entries(checks)
    .filter(([, c]) => !c.ok)
    .map(([name]) => name);

  // Determine overall status
  const criticalServices = ['supabase', 'stripe', 'env_vars'];
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
