import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRequest, createMockSupabaseClient, expectError, expectJsonResponse } from '../api-helpers';

// Mock Supabase server client
const mockSupabaseClient = createMockSupabaseClient();
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
}));

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

// Import after mocks - use relative path for app routes
import { POST } from '../../../app/api/stripe/portal/route';
import { stripe } from '@/lib/stripe';

describe('POST /api/stripe/portal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when user is not authenticated', async () => {
    // Mock no authenticated user
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'No session' },
    });

    const request = createMockRequest({
      method: 'POST',
      body: { returnUrl: 'https://example.com' },
    });

    const response = await POST(request as never);

    await expectError(response, 401, 'Unauthorized');
  });

  it('should return 404 when no billing account found', async () => {
    // Mock authenticated user
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user_123', email: 'test@example.com' } },
      error: null,
    });

    // Mock no partner/stripe_customer_id found
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    mockSupabaseClient.from.mockReturnValue(mockQuery);

    const request = createMockRequest({
      method: 'POST',
      body: { returnUrl: 'https://example.com' },
    });

    const response = await POST(request as never);

    await expectError(response, 404, 'No billing account found');
  });

  it('should create portal session successfully', async () => {
    const mockSession = { url: 'https://billing.stripe.com/session123' };
    vi.mocked(stripe.billingPortal.sessions.create).mockResolvedValue(mockSession as never);

    // Mock authenticated user
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user_123', email: 'test@example.com' } },
      error: null,
    });

    // Mock partner with stripe_customer_id
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { stripe_customer_id: 'cus_test123' },
        error: null,
      }),
    };
    mockSupabaseClient.from.mockReturnValue(mockQuery);

    const request = createMockRequest({
      method: 'POST',
      body: { returnUrl: 'https://example.com/partner' },
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

    // Mock authenticated user
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user_123', email: 'test@example.com' } },
      error: null,
    });

    // Mock partner with stripe_customer_id
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { stripe_customer_id: 'cus_invalid' },
        error: null,
      }),
    };
    mockSupabaseClient.from.mockReturnValue(mockQuery);

    const request = createMockRequest({
      method: 'POST',
      body: {},
    });

    const response = await POST(request as never);

    await expectError(response, 500, 'Failed to create portal session');
  });
});
