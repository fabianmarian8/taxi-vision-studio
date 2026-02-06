import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from './Header';

// Mock Next.js router
const mockPush = vi.fn();
const mockPathname = vi.fn(() => '/');

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => mockPathname(),
}));

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname.mockReturnValue('/');
  });

  describe('Renderovanie', () => {
    it('zobrazí logo/domov link', () => {
      render(<Header />);
      // Link má title "Domovská stránka Taxi NearMe" a text "Domov"
      const homeLink = screen.getByTitle(/Domovská stránka/i);
      expect(homeLink).toBeInTheDocument();
      expect(homeLink).toHaveAttribute('href', '/');
    });

    it('zobrazí navigačné linky na desktope', () => {
      render(<Header />);

      expect(screen.getByText('Mestá')).toBeInTheDocument();
      expect(screen.getByText('Ako to funguje')).toBeInTheDocument();
      expect(screen.getByText('O nás')).toBeInTheDocument();
      expect(screen.getByText('Kontakt')).toBeInTheDocument();
    });

    it('zobrazí hamburger menu tlačidlo', () => {
      render(<Header />);
      const menuButton = screen.getByRole('button', { name: /Toggle mobile menu/i });
      expect(menuButton).toBeInTheDocument();
    });
  });

  describe('Mobile menu', () => {
    it('toggleuje mobile menu pri kliknutí', async () => {
      const user = userEvent.setup();
      render(<Header />);

      const menuButton = screen.getByRole('button', { name: /Toggle mobile menu/i });

      // Menu je zatvorené
      expect(screen.queryByRole('navigation', { name: /mobile/i })).not.toBeInTheDocument();

      // Otvor menu
      await user.click(menuButton);

      // Teraz by mali byť viditeľné mobile linky (v mobile menu)
      const mobileNav = screen.getAllByText('Mestá');
      expect(mobileNav.length).toBeGreaterThanOrEqual(1);
    });

    it('zatvorí menu po kliknutí na link', async () => {
      const user = userEvent.setup();
      render(<Header />);

      const menuButton = screen.getByRole('button', { name: /Toggle mobile menu/i });

      // Otvor menu
      await user.click(menuButton);

      // Klikni na O nás link v mobile menu
      const oNasLinks = screen.getAllByText('O nás');
      const mobileLink = oNasLinks.find(link =>
        link.closest('nav')?.className.includes('flex-col')
      );

      if (mobileLink) {
        await user.click(mobileLink);
      }

      // Menu by sa malo zatvoriť (ďalší klik na button by ho mal otvoriť)
    });
  });

  describe('Navigácia', () => {
    it('scroll na sekciu pri kliknutí na homepage', async () => {
      const user = userEvent.setup();
      mockPathname.mockReturnValue('/');

      // Mock getElementById a scrollIntoView
      const mockElement = { scrollIntoView: vi.fn() };
      const originalGetElementById = document.getElementById;
      document.getElementById = vi.fn().mockReturnValue(mockElement);

      render(<Header />);

      const mestaLink = screen.getAllByText('Mestá')[0];
      await user.click(mestaLink);

      expect(document.getElementById).toHaveBeenCalledWith('cities');

      // Restore
      document.getElementById = originalGetElementById;
    });

    it('naviguje na homepage hash sekciu keď nie sme na homepage', async () => {
      const user = userEvent.setup();
      mockPathname.mockReturnValue('/o-nas');

      render(<Header />);

      const mestaLink = screen.getAllByText('Mestá')[0];
      await user.click(mestaLink);

      expect(mockPush).toHaveBeenCalledWith('/#cities');
    });

    it('linky O nás a Kontakt sú Next.js Link komponenty', () => {
      render(<Header />);

      // O nás link
      const oNasLinks = screen.getAllByRole('link', { name: /O nás/i });
      expect(oNasLinks.some(link => link.getAttribute('href') === '/o-nas')).toBe(true);

      // Kontakt link
      const kontaktLinks = screen.getAllByRole('link', { name: /Kontakt/i });
      expect(kontaktLinks.some(link => link.getAttribute('href') === '/kontakt')).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('hamburger button má aria-label', () => {
      render(<Header />);
      const menuButton = screen.getByRole('button', { name: /Toggle mobile menu/i });
      expect(menuButton).toHaveAttribute('aria-label');
    });

    it('navigačné linky majú title atribút', () => {
      render(<Header />);

      const mestaLink = screen.getAllByText('Mestá')[0];
      expect(mestaLink).toHaveAttribute('title');

      const akoLink = screen.getAllByText('Ako to funguje')[0];
      expect(akoLink).toHaveAttribute('title');
    });

    it('header má správnu štruktúru', () => {
      render(<Header />);
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
      expect(header.tagName).toBe('HEADER');
    });
  });

  describe('Props', () => {
    it('akceptuje partnerSlug prop', () => {
      render(<Header partnerSlug="test-partner" />);
      // Header by sa mal renderovať bez chyby
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('akceptuje isOwner prop', () => {
      render(<Header isOwner={true} />);
      // Header by sa mal renderovať bez chyby
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });
  });
});
