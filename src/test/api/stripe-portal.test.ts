import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRequest, createMockSupabaseClient, expectError, expectJsonResponse } from '../api-helpers';

// Mock Supabase server client
const mockSupabaseClient = createMockSupabaseClient();
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
}));

// Mock Supabase admin client
const mockAdminClient = createMockSupabaseClient();
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockAdminClient),
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
      body: { customerId: 'cus_test123', returnUrl: 'https://example.com' },
    });

    const response = await POST(request as never);

    await expectError(response, 401, 'Unauthorized');
  });

  it('should return 404 when no partners found for user', async () => {
    // Mock authenticated user
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user_123', email: 'test@example.com' } },
      error: null,
    });

    // Mock no partners found
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    mockSupabaseClient.from.mockReturnValue({
      ...mockQuery,
      // Return empty array for partners query
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    });

    const request = createMockRequest({
      method: 'POST',
      body: { customerId: 'cus_test123', returnUrl: 'https://example.com' },
    });

    const response = await POST(request as never);

    await expectError(response, 404, 'No partners found for this user');
  });

  it('should return 404 when customerId not verified', async () => {
    // Mock authenticated user
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user_123', email: 'test@example.com' } },
      error: null,
    });

    // Mock partner found
    const mockPartnerQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: [{ id: 'partner_1', name: 'Test Taxi', city_slug: 'zvolen' }],
        error: null
      }),
    };
    mockSupabaseClient.from.mockReturnValue(mockPartnerQuery);

    // Mock no matching taxi_service with subscription in admin client
    const mockTaxiQuery = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      not: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
    mockAdminClient.from.mockReturnValue(mockTaxiQuery);

    const request = createMockRequest({
      method: 'POST',
      body: { customerId: 'cus_wrong', returnUrl: 'https://example.com' },
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

    // Mock partner found
    const mockPartnerQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: [{ id: 'partner_1', name: 'Test Taxi', city_slug: 'zvolen' }],
        error: null
      }),
    };
    mockSupabaseClient.from.mockReturnValue(mockPartnerQuery);

    // Mock matching taxi_service with subscription in admin client
    const mockTaxiQuery = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      not: vi.fn().mockResolvedValue({
        data: [{
          subscriptions: { stripe_customer_id: 'cus_test123' }
        }],
        error: null
      }),
    };
    mockAdminClient.from.mockReturnValue(mockTaxiQuery);

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
});
