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

// Mock superadmin check
let mockIsSuperadmin = false;
vi.mock('@/lib/superadmin', () => ({
  isSuperadmin: vi.fn(() => mockIsSuperadmin),
}));

// Import after mocks - use relative path for app routes
import { POST } from '../../../app/api/stripe/portal/route';
import { stripe } from '@/lib/stripe';

describe('POST /api/stripe/portal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsSuperadmin = false;
  });

  it('should return 401 when user is not authenticated', async () => {
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

  it('should return 404 when subscription not found', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user_123', email: 'test@example.com' } },
      error: null,
    });

    // Admin client: no subscriptions found
    mockAdminClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    });

    // Regular user partners (called after subscription check)
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: [{ city_slug: 'zvolen' }],
        error: null,
      }),
    });

    const request = createMockRequest({
      method: 'POST',
      body: { customerId: 'cus_wrong', returnUrl: 'https://example.com' },
    });

    const response = await POST(request as never);

    await expectError(response, 404, 'No billing account found');
  });

  it('should create portal session for regular user', async () => {
    const mockSession = { url: 'https://billing.stripe.com/session123' };
    vi.mocked(stripe.billingPortal.sessions.create).mockResolvedValue(mockSession as never);

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user_123', email: 'test@example.com' } },
      error: null,
    });

    // Regular user: partners query
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: [{ city_slug: 'zvolen' }],
        error: null,
      }),
    });

    // Admin client: first call finds subscriptions, second finds taxi_service
    let adminCallCount = 0;
    mockAdminClient.from.mockImplementation(() => {
      adminCallCount++;
      if (adminCallCount === 1) {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({
            data: [{ id: 'sub_uuid_123' }],
            error: null,
          }),
        };
      } else {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: 'ts_1' },
            error: null,
          }),
        };
      }
    });

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

  it('should create portal session for superadmin (bypass partner ownership)', async () => {
    mockIsSuperadmin = true;

    const mockSession = { url: 'https://billing.stripe.com/session456' };
    vi.mocked(stripe.billingPortal.sessions.create).mockResolvedValue(mockSession as never);

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'admin_1', email: 'admin@example.com' } },
      error: null,
    });

    // Admin client: subscription found, taxi_service found
    let adminCallCount = 0;
    mockAdminClient.from.mockImplementation(() => {
      adminCallCount++;
      if (adminCallCount === 1) {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({
            data: [{ id: 'sub_uuid_789' }],
            error: null,
          }),
        };
      } else {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: 'ts_2' },
            error: null,
          }),
        };
      }
    });

    const request = createMockRequest({
      method: 'POST',
      body: { customerId: 'cus_other_partner', returnUrl: 'https://example.com/partner' },
    });

    const response = await POST(request as never);
    const json = await expectJsonResponse(response, 200);

    expect(json).toEqual({ url: 'https://billing.stripe.com/session456' });
    // Superadmin should NOT need to query partners table
    expect(mockSupabaseClient.from).not.toHaveBeenCalled();
  });
});
