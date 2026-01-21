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