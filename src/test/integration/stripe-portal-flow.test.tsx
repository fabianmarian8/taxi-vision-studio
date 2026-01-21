import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CustomerPortalButton } from '@/components/stripe/CustomerPortalButton';

// Mock fetch for API calls
global.fetch = vi.fn();

describe('Stripe Portal Integration Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'location', {
      value: { href: 'https://example.com/partner', assign: vi.fn() },
      writable: true,
    });
  });

  it('completes full portal flow: component → API → redirect', async () => {
    const customerId = 'cus_test123';
    const portalUrl = 'https://billing.stripe.com/portal/session_abc123';

    // Mock successful API response
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ url: portalUrl }),
    } as Response);

    // Render component
    render(<CustomerPortalButton customerId={customerId} />);

    // Verify initial state
    const button = screen.getByRole('button', { name: 'Spravovať predplatné' });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();

    // Click button
    fireEvent.click(button);

    // Verify loading state
    expect(screen.getByText('Načítavam...')).toBeInTheDocument();
    expect(button).toBeDisabled();

    // Verify API call was made correctly
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          returnUrl: 'https://example.com/partner'
        }),
      });
    });

    // Verify redirect happens
    await waitFor(() => {
      expect(window.location.assign).toHaveBeenCalledWith(portalUrl);
    });
  });

  it('handles API validation errors correctly', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock validation error response
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'Customer ID required' }),
    } as Response);

    render(<CustomerPortalButton customerId="" />);

    const button = screen.getByRole('button');

    // Button should be disabled for empty customer ID
    expect(button).toBeDisabled();

    consoleSpy.mockRestore();
  });

  it('handles network errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock network error
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

    render(<CustomerPortalButton customerId="cus_test123" />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Wait for error handling
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Portal error:', expect.any(Error));
    });

    // Button should return to normal state
    await waitFor(() => {
      expect(screen.getByText('Spravovať predplatné')).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });

    consoleSpy.mockRestore();
  });

  it('handles missing portal URL in response', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock response without URL
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ error: 'No session created' }),
    } as Response);

    render(<CustomerPortalButton customerId="cus_test123" />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Portal error:', expect.any(Error));
    });

    // Verify no redirect attempt
    expect(window.location.assign).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});