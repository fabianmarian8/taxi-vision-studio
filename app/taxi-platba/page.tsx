'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function TaxiPlatbaForm() {
  const searchParams = useSearchParams();

  const [suma, setSuma] = useState('');
  const [poznamka, setPoznamka] = useState('');
  const [citySlug, setCitySlug] = useState('');
  const [taxiServiceName, setTaxiServiceName] = useState('');
  const [taxiServicePhone, setTaxiServicePhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Či sú polia predvyplnené z URL (admin link)
  const [isAdminLink, setIsAdminLink] = useState(false);

  useEffect(() => {
    const urlSuma = searchParams.get('suma');
    const urlPoznamka = searchParams.get('poznamka');
    const urlCitySlug = searchParams.get('citySlug');
    const urlTaxiServiceName = searchParams.get('taxiServiceName');
    const urlTaxiServicePhone = searchParams.get('taxiServicePhone');

    if (urlSuma) {
      setSuma(urlSuma);
    }
    if (urlPoznamka) {
      setPoznamka(urlPoznamka);
    }
    if (urlCitySlug) {
      setCitySlug(urlCitySlug);
    }
    if (urlTaxiServiceName) {
      setTaxiServiceName(urlTaxiServiceName);
    }
    if (urlTaxiServicePhone) {
      setTaxiServicePhone(urlTaxiServicePhone);
    }

    // Ak sú predvyplnené údaje z URL, je to admin link
    if (urlCitySlug && urlTaxiServiceName) {
      setIsAdminLink(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validácia povinných polí
    if (!taxiServiceName.trim()) {
      setError('Zadajte názov taxislužby');
      return;
    }

    if (!taxiServicePhone.trim()) {
      setError('Zadajte telefónne číslo taxislužby');
      return;
    }

    if (!citySlug.trim()) {
      setError('Zadajte mesto/obec');
      return;
    }

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
          citySlug: citySlug.trim(),
          taxiServiceName: taxiServiceName.trim(),
          taxiServicePhone: taxiServicePhone.trim(),
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Názov taxislužby */}
      <div className="space-y-2">
        <label htmlFor="taxiServiceName" className="text-sm font-medium text-foreground">
          Názov taxislužby *
        </label>
        <Input
          id="taxiServiceName"
          type="text"
          value={taxiServiceName}
          onChange={(e) => setTaxiServiceName(e.target.value)}
          placeholder="napr. Goral Taxi"
          disabled={isAdminLink}
          className={isAdminLink ? 'bg-muted' : ''}
        />
      </div>

      {/* Telefónne číslo */}
      <div className="space-y-2">
        <label htmlFor="taxiServicePhone" className="text-sm font-medium text-foreground">
          Telefónne číslo taxislužby *
        </label>
        <Input
          id="taxiServicePhone"
          type="tel"
          value={taxiServicePhone}
          onChange={(e) => setTaxiServicePhone(e.target.value)}
          placeholder="+421 9XX XXX XXX"
          disabled={isAdminLink}
          className={isAdminLink ? 'bg-muted' : ''}
        />
      </div>

      {/* Mesto/Obec */}
      <div className="space-y-2">
        <label htmlFor="citySlug" className="text-sm font-medium text-foreground">
          Mesto/Obec *
        </label>
        <Input
          id="citySlug"
          type="text"
          value={citySlug}
          onChange={(e) => setCitySlug(e.target.value)}
          placeholder="napr. Lendak"
          disabled={isAdminLink}
          className={isAdminLink ? 'bg-muted' : ''}
        />
      </div>

      {/* Suma */}
      <div className="space-y-2">
        <label htmlFor="suma" className="text-sm font-medium text-foreground">
          Suma *
        </label>
        <div className="relative">
          <Input
            id="suma"
            type="text"
            inputMode="decimal"
            value={suma}
            onChange={(e) => setSuma(e.target.value)}
            className="text-2xl h-14 pr-12 text-center font-semibold"
            placeholder="0.00"
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
          placeholder="napr. jazda na letisko"
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
        className="w-full text-lg mt-4"
        disabled={loading || !suma || !taxiServiceName || !taxiServicePhone || !citySlug}
      >
        {loading ? 'Načítavam...' : 'Zaplatiť kartou'}
      </Button>
    </form>
  );
}

function FormSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="space-y-2">
        <div className="h-4 w-32 bg-muted rounded" />
        <div className="h-11 bg-muted rounded" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-40 bg-muted rounded" />
        <div className="h-11 bg-muted rounded" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-24 bg-muted rounded" />
        <div className="h-11 bg-muted rounded" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-12 bg-muted rounded" />
        <div className="h-14 bg-muted rounded" />
      </div>
      <div className="h-12 bg-muted rounded" />
    </div>
  );
}

export default function TaxiPlatbaPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">taxinearme.sk</h1>
        </div>

        {/* Nadpis */}
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">Platba za taxi</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Vyplňte údaje o taxislužbe a sumu
          </p>
        </div>

        {/* Formulár */}
        <Suspense fallback={<FormSkeleton />}>
          <TaxiPlatbaForm />
        </Suspense>
      </div>
    </div>
  );
}
