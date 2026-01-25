import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TrackedPhoneButton } from './TrackedPhoneButton';

// Mock fetch
const mockFetch = vi.fn();

// Mock gtag
const mockGtag = vi.fn();

describe('TrackedPhoneButton', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock global fetch
    global.fetch = mockFetch;
    mockFetch.mockResolvedValue({ ok: true });

    // Mock window.gtag
    Object.defineProperty(window, 'gtag', {
      value: mockGtag,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Renderovanie', () => {
    it('renderuje tel: link s očisteným číslom', () => {
      render(
        <TrackedPhoneButton
          phone="+421 900 123 456"
          serviceName="Test Taxi"
          citySlug="bratislava"
        >
          Zavolať
        </TrackedPhoneButton>
      );

      const link = screen.getByRole('link', { name: /Zavolať/i });
      expect(link).toHaveAttribute('href', 'tel:+421900123456');
    });

    it('renderuje children správne', () => {
      render(
        <TrackedPhoneButton
          phone="0900123456"
          serviceName="Test Taxi"
          citySlug="kosice"
        >
          <span>Volať teraz</span>
        </TrackedPhoneButton>
      );

      expect(screen.getByText('Volať teraz')).toBeInTheDocument();
    });

    it('aplikuje custom className', () => {
      render(
        <TrackedPhoneButton
          phone="0900123456"
          serviceName="Test Taxi"
          citySlug="zilina"
          className="custom-button-class"
        >
          Zavolať
        </TrackedPhoneButton>
      );

      const link = screen.getByRole('link');
      expect(link).toHaveClass('custom-button-class');
    });

    it('nastaví title atribút', () => {
      render(
        <TrackedPhoneButton
          phone="0900123456"
          serviceName="Test Taxi"
          citySlug="nitra"
          title="Zavolať taxi službu"
        >
          Zavolať
        </TrackedPhoneButton>
      );

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('title', 'Zavolať taxi službu');
    });
  });

  describe('Tracking', () => {
    it('volá GA4 event pri kliknutí', () => {
      render(
        <TrackedPhoneButton
          phone="+421 900 111 222"
          serviceName="Premium Taxi"
          citySlug="bratislava"
        >
          Zavolať
        </TrackedPhoneButton>
      );

      const link = screen.getByRole('link');
      fireEvent.click(link);

      expect(mockGtag).toHaveBeenCalledWith('event', 'click_to_call', {
        event_category: 'engagement',
        event_label: 'Premium Taxi - bratislava',
        phone_number: '+421 900 111 222',
        service_name: 'Premium Taxi',
      });
    });

    it('posiela tracking request na API', () => {
      render(
        <TrackedPhoneButton
          phone="0900333444"
          serviceName="City Taxi"
          citySlug="kosice"
        >
          Zavolať
        </TrackedPhoneButton>
      );

      const link = screen.getByRole('link');
      fireEvent.click(link);

      expect(mockFetch).toHaveBeenCalledWith('/api/track/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'phone_click',
          city_slug: 'kosice',
          service_name: 'City Taxi',
          phone_number: '0900333444',
        }),
      });
    });

    it('neblokuje navigáciu pri chybe trackingu', async () => {
      // Simuluj zlyhanie fetch
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(
        <TrackedPhoneButton
          phone="0900555666"
          serviceName="Fast Taxi"
          citySlug="presov"
        >
          Zavolať
        </TrackedPhoneButton>
      );

      const link = screen.getByRole('link');

      // Toto by nemalo vyhodiť chybu
      expect(() => fireEvent.click(link)).not.toThrow();

      // Link by mal mať stále správny href
      expect(link).toHaveAttribute('href', 'tel:0900555666');
    });

    it('funguje aj keď gtag nie je definovaný', () => {
      // Odstráň gtag
      Object.defineProperty(window, 'gtag', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      render(
        <TrackedPhoneButton
          phone="0900777888"
          serviceName="Express Taxi"
          citySlug="trnava"
        >
          Zavolať
        </TrackedPhoneButton>
      );

      const link = screen.getByRole('link');

      // Toto by nemalo vyhodiť chybu aj bez gtag
      expect(() => fireEvent.click(link)).not.toThrow();
    });
  });

  describe('Formátovanie telefónneho čísla', () => {
    it('odstráni medzery z telefónneho čísla v href', () => {
      render(
        <TrackedPhoneButton
          phone="0900 123 456"
          serviceName="Test"
          citySlug="test"
        >
          Volať
        </TrackedPhoneButton>
      );

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'tel:0900123456');
    });

    it('zachová plus na začiatku medzinárodného formátu', () => {
      render(
        <TrackedPhoneButton
          phone="+421 2 123 456"
          serviceName="Test"
          citySlug="test"
        >
          Volať
        </TrackedPhoneButton>
      );

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'tel:+4212123456');
    });
  });
});
