import { NextResponse } from 'next/server';
import { createAnonymousClient } from '@/lib/supabase/server';
import { STRIPE_PRICES } from '@/lib/stripe';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const HEALTH_SECRET = process.env.HEALTH_CHECK_SECRET;

interface CheckResult {
  ok: boolean;
  ms: number;
  error?: string;
  details?: Record<string, unknown>;
}

async function timedCheck(fn: () => Promise<Partial<CheckResult>>): Promise<CheckResult> {
  const start = Date.now();
  try {
    const result = await Promise.race([
      fn(),
      new Promise<Partial<CheckResult>>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 3000)
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

async function checkCoreEnv(): Promise<Partial<CheckResult>> {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'HEALTH_CHECK_SECRET',
  ];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Missing: ${missing.join(', ')}`);
  }
  return {};
}

async function checkStripeConfig(): Promise<Partial<CheckResult>> {
  const requiredPlans = ['managed', 'newPartner', 'leader'] as const;
  const missing = requiredPlans.filter((plan) => !STRIPE_PRICES[plan]);
  if (missing.length > 0) {
    throw new Error(`Missing price IDs: ${missing.join(', ')}`);
  }
  return {
    details: {
      plans: requiredPlans,
    },
  };
}

async function checkSupabaseRead(): Promise<Partial<CheckResult>> {
  const supabase = createAnonymousClient();
  const { data, error } = await supabase
    .from('taxi_services')
    .select('id')
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  return {
    details: {
      sample_rows: data?.length ?? 0,
    },
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!HEALTH_SECRET || token !== HEALTH_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const log = logger.with({ endpoint: 'healthz' });

  const [coreEnv, stripeConfig, supabaseRead] = await Promise.all([
    timedCheck(checkCoreEnv),
    timedCheck(checkStripeConfig),
    timedCheck(checkSupabaseRead),
  ]);

  const checks = {
    core_env: coreEnv,
    stripe_config: stripeConfig,
    supabase_read: supabaseRead,
  };

  const failed = Object.entries(checks)
    .filter(([, check]) => !check.ok)
    .map(([name]) => name);

  const status = failed.length === 0 ? 'healthy' : 'critical';
  const result = {
    status,
    checks,
    failed,
    duration_ms: Date.now() - startTime,
    timestamp: new Date().toISOString(),
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local',
  };

  if (failed.length > 0) {
    log.error('Heartbeat check failed', {
      failed,
      duration: result.duration_ms,
    });
    await logger.flush();
  }

  return NextResponse.json(result, {
    status: failed.length === 0 ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
