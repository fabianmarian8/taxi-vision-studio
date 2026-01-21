# Stripe Customer Portal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement Stripe Customer Portal for partners to manage their subscriptions independently

**Architecture:** Add portal endpoint to create Stripe billing portal sessions, create React component to trigger portal, integrate with existing subscription flow

**Tech Stack:** Stripe Billing Portal API, Next.js App Router, React, TypeScript

---

## Task 1: Create Portal API Endpoint

**Files:**
- Create: `app/api/stripe/portal/route.ts`

**Step 1: Write portal API endpoint test**

Create test file first to validate our API:

```typescript
// Create: src/test/api/stripe-portal.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRequest, expectError, expectJsonResponse } from '../api-helpers';

// Mock Stripe
vi.mock('@/lib/stripe', () => ({
  stripe: {
    billingPortal: {
      sessions: {
        create: vi.fn(),
      },
    },
  },
}));

// Import after mocks
import { POST } from '@app/api/stripe/portal/route';
import { stripe } from '@/lib/stripe';

describe('POST /api/stripe/portal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 when customerId is missing', async () => {
    const request = createMockRequest({
      method: 'POST',
      body: { returnUrl: 'https://example.com' },
    });

    const response = await POST(request as never);

    await expectError(response, 400, 'Customer ID required');
  });

  it('should create portal session successfully', async () => {
    const mockSession = { url: 'https://billing.stripe.com/session123' };
    vi.mocked(stripe.billingPortal.sessions.create).mockResolvedValue(mockSession as never);

    const request = createMockRequest({
      method: 'POST',
      body: { customerId: 'cus_test123', returnUrl: 'https://example.com/partner' },
    });

    const response = await POST(request as never);
    const json = await expectJsonResponse(response, 200);

    expect(json).toEqual({ url: 'https://billing.stripe.com/session123' });
    expect(stripe.billingPortal.sessions.create).toHaveBeenCalledWith({
      customer: 'cus_test123',
      return_url: 'https://example.com/partner',
    });
  });

  it('should handle Stripe errors', async () => {
    vi.mocked(stripe.billingPortal.sessions.create).mockRejectedValue(
      new Error('Customer not found')
    );

    const request = createMockRequest({
      method: 'POST',
      body: { customerId: 'cus_invalid' },
    });

    const response = await POST(request as never);

    await expectError(response, 500, 'Failed to create portal session');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test src/test/api/stripe-portal.test.ts`
Expected: FAIL with "Cannot find module"

**Step 3: Create portal API endpoint**

```typescript
// Create: app/api/stripe/portal/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, returnUrl } = body;

    // Validation
    if (!customerId || typeof customerId !== 'string') {
      return NextResponse.json(
        { error: 'Customer ID required' },
        { status: 400 }
      );
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
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
```

**Step 4: Run test to verify it passes**

Run: `npm run test src/test/api/stripe-portal.test.ts`
Expected: PASS

**Step 5: Commit portal endpoint**

```bash
git add app/api/stripe/portal/route.ts src/test/api/stripe-portal.test.ts
git commit -m "feat: add Stripe Customer Portal API endpoint

- Create portal session endpoint with validation
- Add comprehensive tests for portal functionality
- Include error handling for Stripe API failures"
```

---

## Task 2: Create CustomerPortalButton Component

**Files:**
- Create: `src/components/stripe/CustomerPortalButton.tsx`

**Step 1: Write component test**

```typescript
// Create: src/test/components/CustomerPortalButton.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CustomerPortalButton } from '@/components/stripe/CustomerPortalButton';

// Mock fetch
global.fetch = vi.fn();

describe('CustomerPortalButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: { href: 'https://example.com/current-page' },
      writable: true,
    });
  });

  it('renders portal button with correct text', () => {
    render(<CustomerPortalButton customerId="cus_test123" />);

    expect(screen.getByRole('button', { name: 'Spravovať predplatné' })).toBeInTheDocument();
  });

  it('shows loading state when clicked', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ url: 'https://billing.stripe.com/session' }),
    } as Response);

    render(<CustomerPortalButton customerId="cus_test123" />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByText('Načítavam...')).toBeInTheDocument();
  });

  it('redirects to portal URL on successful response', async () => {
    const mockAssign = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { href: 'https://example.com/current-page', assign: mockAssign },
      writable: true,
    });

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ url: 'https://billing.stripe.com/session123' }),
    } as Response);

    render(<CustomerPortalButton customerId="cus_test123" />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockAssign).toHaveBeenCalledWith('https://billing.stripe.com/session123');
    });
  });

  it('handles API errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Customer not found' }),
    } as Response);

    render(<CustomerPortalButton customerId="cus_invalid" />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Portal error:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test src/test/components/CustomerPortalButton.test.tsx`
Expected: FAIL with "Cannot find module"

**Step 3: Create CustomerPortalButton component**

```typescript
// Create: src/components/stripe/CustomerPortalButton.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface CustomerPortalButtonProps {
  customerId: string;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export function CustomerPortalButton({
  customerId,
  className,
  variant = 'outline'
}: CustomerPortalButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          returnUrl: window.location.href
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.url) {
        window.location.assign(data.url);
      } else {
        throw new Error('No portal URL received');
      }
    } catch (error) {
      console.error('Portal error:', error);
      // In a real app, you might want to show a toast notification here
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={loading || !customerId}
      variant={variant}
      className={className}
    >
      {loading ? 'Načítavam...' : 'Spravovať predplatné'}
    </Button>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test src/test/components/CustomerPortalButton.test.tsx`
Expected: PASS

**Step 5: Create barrel export for stripe components**

```typescript
// Create: src/components/stripe/index.ts
export { CustomerPortalButton } from './CustomerPortalButton';
```

**Step 6: Commit CustomerPortalButton component**

```bash
git add src/components/stripe/ src/test/components/CustomerPortalButton.test.tsx
git commit -m "feat: add CustomerPortalButton component

- Create reusable portal button with loading states
- Add comprehensive tests with mocked fetch
- Handle errors gracefully with console logging
- Support customizable button variants"
```

---

## Task 3: Environment Variable Configuration

**Files:**
- Modify: `.env.example`

**Step 1: Add Stripe portal configuration to .env.example**

```bash
# Add to .env.example after existing Stripe configuration
# ============================================
# STRIPE CUSTOMER PORTAL
# ============================================
# Stripe Customer Portal pre spravovanie predplatných
# Konfigurovať v Stripe Dashboard: Settings > Customer Portal
# Povolené operácie: cancel_subscription, update_payment_method, invoice_history
```

**Step 2: Verify environment variables documentation**

Check that existing Stripe variables are documented properly in .env.example:
- STRIPE_SECRET_KEY
- STRIPE_PREMIUM_PRICE_ID
- STRIPE_PARTNER_PRICE_ID
- STRIPE_WEBHOOK_SECRET

**Step 3: Commit environment variable updates**

```bash
git add .env.example
git commit -m "docs: add Stripe Customer Portal env documentation

- Document Customer Portal configuration requirements
- Reference Stripe Dashboard settings for portal setup"
```

---

## Task 4: Integration Testing

**Files:**
- Create: `src/test/integration/stripe-portal.integration.test.ts`

**Step 1: Create integration test**

```typescript
// Create: src/test/integration/stripe-portal.integration.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock environment variables
vi.mock('process', () => ({
  env: {
    STRIPE_SECRET_KEY: 'sk_test_mock',
    NEXT_PUBLIC_SITE_URL: 'https://taxinearme.sk',
  },
}));

// Mock Stripe
const mockPortalSession = {
  url: 'https://billing.stripe.com/p/session_test_123',
  id: 'bps_test_123',
};

vi.mock('@/lib/stripe', () => ({
  stripe: {
    billingPortal: {
      sessions: {
        create: vi.fn().mockResolvedValue(mockPortalSession),
      },
    },
  },
}));

import { CustomerPortalButton } from '@/components/stripe/CustomerPortalButton';
import { POST } from '@app/api/stripe/portal/route';
import { stripe } from '@/lib/stripe';
import { createMockRequest } from '../api-helpers';

describe('Stripe Portal Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create portal session with correct customer ID', async () => {
    const request = createMockRequest({
      method: 'POST',
      body: {
        customerId: 'cus_test_customer',
        returnUrl: 'https://taxinearme.sk/partner/dashboard'
      },
    });

    const response = await POST(request as never);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.url).toBe('https://billing.stripe.com/p/session_test_123');
    expect(stripe.billingPortal.sessions.create).toHaveBeenCalledWith({
      customer: 'cus_test_customer',
      return_url: 'https://taxinearme.sk/partner/dashboard',
    });
  });

  it('should use default return URL when not provided', async () => {
    const request = createMockRequest({
      method: 'POST',
      body: { customerId: 'cus_test_customer' },
      headers: { host: 'taxinearme.sk' },
    });

    await POST(request as never);

    expect(stripe.billingPortal.sessions.create).toHaveBeenCalledWith({
      customer: 'cus_test_customer',
      return_url: 'https://taxinearme.sk/partner',
    });
  });
});
```

**Step 2: Run integration test**

Run: `npm run test src/test/integration/stripe-portal.integration.test.ts`
Expected: PASS

**Step 3: Commit integration tests**

```bash
git add src/test/integration/stripe-portal.integration.test.ts
git commit -m "test: add Stripe portal integration tests

- Test full flow from API to component
- Verify customer ID handling and return URLs
- Ensure proper Stripe API integration"
```

---

## Task 5: Build Verification and Error Handling

**Files:**
- Verify build process

**Step 1: Run full test suite**

Run: `npm run test`
Expected: All tests PASS (including new portal tests)

**Step 2: Run TypeScript compilation check**

Run: `npm run build`
Expected: Build succeeds without TypeScript errors

**Step 3: Test error scenarios manually (optional)**

Create temporary test script to verify error handling:

```typescript
// Temporary: test-portal-errors.ts (do not commit)
// Test cases:
// 1. Invalid customer ID
// 2. Network timeout
// 3. Stripe API error response
// 4. Missing environment variables
```

**Step 4: Verify component renders correctly**

Test that CustomerPortalButton component:
- Renders with correct initial text
- Shows loading state when clicked
- Handles disabled state properly
- Supports different button variants

**Step 5: Final verification**

Run: `npm run build && npm run test`
Expected: Both commands succeed

---

## Usage Examples

After implementation, the CustomerPortalButton can be used in partner dashboard:

```typescript
// In partner dashboard component
import { CustomerPortalButton } from '@/components/stripe';

export function PartnerSubscription({ customerId }: { customerId: string }) {
  return (
    <div className="p-4 border rounded">
      <h3>Spravovanie predplatného</h3>
      <p>Upravte platobné údaje, zrušte predplatné alebo si stiahnite faktúry.</p>
      <CustomerPortalButton
        customerId={customerId}
        className="mt-4"
      />
    </div>
  );
}
```

API endpoint can also be called directly:

```typescript
// Direct API call
const response = await fetch('/api/stripe/portal', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customerId: 'cus_customer123',
    returnUrl: '/partner/billing'
  }),
});
const { url } = await response.json();
window.location.href = url;
```

## Deployment Notes

1. **Stripe Dashboard Configuration**: Before going live, configure Customer Portal settings in Stripe Dashboard:
   - Go to Settings > Customer Portal
   - Enable desired features (cancel subscription, update payment method, invoice history)
   - Set business information and branding

2. **Environment Variables**: Ensure all Stripe environment variables are set in production:
   - STRIPE_SECRET_KEY (live key for production)
   - STRIPE_PREMIUM_PRICE_ID
   - STRIPE_PARTNER_PRICE_ID
   - STRIPE_WEBHOOK_SECRET

3. **Testing**: Test portal flow in Stripe test mode before deploying to production

4. **Error Monitoring**: Consider adding Sentry error tracking to portal API endpoint for production monitoring