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