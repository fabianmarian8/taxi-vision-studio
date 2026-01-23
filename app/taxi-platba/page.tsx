'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function TaxiPlatbaPage() {
  const searchParams = useSearchParams();

  const [suma, setSuma] = useState('');
  const [poznamka, setPoznamka] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const urlSuma = searchParams.get('suma');
    const urlPoznamka = searchParams.get('poznamka');

    if (urlSuma) {
      setSuma(urlSuma);
    }
    if (urlPoznamka) {
      setPoznamka(urlPoznamka);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const sumaNumber = parseFloat(suma.replace(',', '.'));

    if (isNaN(sumaNumber) || sumaNumber < 1) {
      setError('Zadajte platnú sumu (min. 1 EUR)');
      return;
    }

    if (sumaNumber > 500) {
      setError('Maximálna suma je 500 EUR');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/taxi-platba', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          suma: sumaNumber,
          poznamka: poznamka.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Nepodarilo sa vytvoriť platbu');
      }

      // Presmerovanie na Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Niečo sa pokazilo');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">taxinearme.sk</h1>
        </div>

        {/* Nadpis */}
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">Platba za taxi</h2>
        </div>

        {/* Formulár */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Suma */}
          <div className="space-y-2">
            <label htmlFor="suma" className="text-sm font-medium text-foreground">
              Suma
            </label>
            <div className="relative">
              <Input
                id="suma"
                type="text"
                inputMode="decimal"
                value={suma}
                onChange={(e) => setSuma(e.target.value)}
                className="text-2xl h-14 pr-12 text-center font-semibold"
                autoFocus
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl text-muted-foreground">
                EUR
              </span>
            </div>
          </div>

          {/* Poznámka */}
          <div className="space-y-2">
            <label htmlFor="poznamka" className="text-sm font-medium text-foreground">
              Poznámka (voliteľné)
            </label>
            <Input
              id="poznamka"
              type="text"
              value={poznamka}
              onChange={(e) => setPoznamka(e.target.value)}
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          {/* Submit */}
          <Button
            type="submit"
            variant="success"
            size="lg"
            className="w-full text-lg"
            disabled={loading || !suma}
          >
            {loading ? 'Načítavam...' : 'Zaplatiť kartou'}
          </Button>
        </form>
      </div>
    </div>
  );
}
