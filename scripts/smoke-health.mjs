const baseUrl = process.env.SMOKE_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL;
const token = process.env.HEALTH_CHECK_SECRET;

if (!baseUrl) {
  console.error('Missing SMOKE_BASE_URL or NEXT_PUBLIC_SITE_URL');
  process.exit(1);
}

if (!token) {
  console.error('Missing HEALTH_CHECK_SECRET');
  process.exit(1);
}

const checks = [
  { name: 'heartbeat', path: '/api/healthz' },
  { name: 'deep-health', path: '/api/health' },
];

let hasFailure = false;

for (const check of checks) {
  const url = new URL(check.path, baseUrl);
  url.searchParams.set('token', token);

  try {
    const response = await fetch(url, {
      headers: {
        'user-agent': 'taxi-vision-smoke/1.0',
      },
    });

    const payload = await response.json().catch(() => ({}));
    const status = payload?.status || 'unknown';

    if (!response.ok || status !== 'healthy') {
      hasFailure = true;
      console.error(`[FAIL] ${check.name}: ${response.status} ${status}`);
      continue;
    }

    console.log(`[OK] ${check.name}: ${response.status} ${status}`);
  } catch (error) {
    hasFailure = true;
    console.error(
      `[FAIL] ${check.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

if (hasFailure) {
  process.exit(1);
}

console.log('Smoke health checks passed');
