import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PriceCalculator } from './PriceCalculator';

// Mock data pre testy
const mockCities = [
  {
    id: 'bratislava',
    name: 'Bratislava',
    prices: {
      nastupne: 2.0,
      cenaZaKm: 1.2,
      cakanie: 0.3,
    },
  },
  {
    id: 'kosice',
    name: 'Košice',
    prices: {
      nastupne: 1.5,
      cenaZaKm: 1.0,
      cakanie: 0.25,
    },
  },
];

describe('PriceCalculator', () => {
  describe('Renderovanie', () => {
    it('zobrazí select pre výber mesta', () => {
      render(<PriceCalculator cities={mockCities} />);
      expect(screen.getByText('Vyberte mesto')).toBeInTheDocument();
    });

    it('zobrazí input pre vzdialenosť', () => {
      render(<PriceCalculator cities={mockCities} />);
      expect(screen.getByLabelText(/Vzdialenosť/i)).toBeInTheDocument();
    });

    it('zobrazí input pre čakanie', () => {
      render(<PriceCalculator cities={mockCities} />);
      expect(screen.getByLabelText(/Čakanie/i)).toBeInTheDocument();
    });

    it('zobrazí správu keď nie sú mestá', () => {
      render(<PriceCalculator cities={[]} />);
      expect(screen.getByText(/Kalkulačka nie je momentálne dostupná/i)).toBeInTheDocument();
    });

    it('tlačidlo Vypočítať je disabled bez vybraného mesta', () => {
      render(<PriceCalculator cities={mockCities} />);
      const button = screen.getByRole('button', { name: /Vypočítať cenu/i });
      expect(button).toBeDisabled();
    });
  });

  describe('Výpočet ceny', () => {
    it('správne vypočíta cenu: nástupné + km + čakanie', async () => {
      const user = userEvent.setup();
      render(<PriceCalculator cities={mockCities} />);

      // Vyber mesto Bratislava
      const selectTrigger = screen.getByRole('combobox');
      await user.click(selectTrigger);
      await user.click(screen.getByText('Bratislava'));

      // Zadaj vzdialenosť 10 km
      const distanceInput = screen.getByLabelText(/Vzdialenosť/i);
      await user.clear(distanceInput);
      await user.type(distanceInput, '10');

      // Zadaj čakanie 5 minút
      const waitInput = screen.getByLabelText(/Čakanie/i);
      await user.clear(waitInput);
      await user.type(waitInput, '5');

      // Klikni na Vypočítať
      const button = screen.getByRole('button', { name: /Vypočítať cenu/i });
      await user.click(button);

      // Očakávaná cena: 2.0 + (1.2 * 10) + (0.3 * 5) = 2 + 12 + 1.5 = 15.5 €
      expect(screen.getByText('15.50 €')).toBeInTheDocument();
    });

    it('vypočíta cenu bez čakania', async () => {
      const user = userEvent.setup();
      render(<PriceCalculator cities={mockCities} />);

      // Vyber mesto Košice
      const selectTrigger = screen.getByRole('combobox');
      await user.click(selectTrigger);
      await user.click(screen.getByText('Košice'));

      // Zadaj vzdialenosť 5 km
      const distanceInput = screen.getByLabelText(/Vzdialenosť/i);
      await user.clear(distanceInput);
      await user.type(distanceInput, '5');

      // Klikni na Vypočítať (čakanie je default 0)
      const button = screen.getByRole('button', { name: /Vypočítať cenu/i });
      await user.click(button);

      // Očakávaná cena: 1.5 + (1.0 * 5) + 0 = 6.5 €
      expect(screen.getByText('6.50 €')).toBeInTheDocument();
    });

    it('zobrazí cenník pre vybrané mesto', async () => {
      const user = userEvent.setup();
      render(<PriceCalculator cities={mockCities} />);

      const selectTrigger = screen.getByRole('combobox');
      await user.click(selectTrigger);
      await user.click(screen.getByText('Bratislava'));

      expect(screen.getByText('Cenník pre Bratislava:')).toBeInTheDocument();
      expect(screen.getByText('2.00 €')).toBeInTheDocument(); // nástupné
      expect(screen.getByText('1.20 €/km')).toBeInTheDocument(); // cena za km
    });
  });

  describe('Validácia vstupov', () => {
    it('neakceptuje záporné hodnoty vzdialenosti', async () => {
      const user = userEvent.setup();
      render(<PriceCalculator cities={mockCities} />);

      const distanceInput = screen.getByLabelText(/Vzdialenosť/i);
      await user.type(distanceInput, '-5');

      // Input by mal ostať prázdny alebo ignorovať záporné hodnoty
      expect(distanceInput).not.toHaveValue(-5);
    });

    it('povolí desatinné čísla pre vzdialenosť', async () => {
      const user = userEvent.setup();
      render(<PriceCalculator cities={mockCities} />);

      const distanceInput = screen.getByLabelText(/Vzdialenosť/i);
      await user.type(distanceInput, '5.5');

      expect(distanceInput).toHaveValue(5.5);
    });
  });

  describe('Reset funkcia', () => {
    it('reset vyčistí všetky hodnoty', async () => {
      const user = userEvent.setup();
      render(<PriceCalculator cities={mockCities} />);

      // Vyber mesto a zadaj hodnoty
      const selectTrigger = screen.getByRole('combobox');
      await user.click(selectTrigger);
      await user.click(screen.getByText('Bratislava'));

      const distanceInput = screen.getByLabelText(/Vzdialenosť/i);
      await user.type(distanceInput, '10');

      // Vypočítaj cenu
      const calculateButton = screen.getByRole('button', { name: /Vypočítať cenu/i });
      await user.click(calculateButton);

      // Overenie že cena je zobrazená (14.00 € = 2.0 + 1.2*10 + 0)
      expect(screen.getByText('Odhadovaná cena jazdy:')).toBeInTheDocument();

      // Klikni Reset
      const resetButton = screen.getByRole('button', { name: /Reset/i });
      await user.click(resetButton);

      // Overenie že hodnoty sú vyčistené
      expect(distanceInput).toHaveValue(null);
      expect(screen.queryByText('Odhadovaná cena jazdy:')).not.toBeInTheDocument();
    });
  });
});
