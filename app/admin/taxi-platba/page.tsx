'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Check, ArrowLeft } from 'lucide-react';

const PRESET_AMOUNTS = [5, 10, 15, 20, 25, 30, 40, 50];
const BASE_URL = 'https://www.taxinearme.sk';

interface CityOption {
  slug: string;
  name: string;
}

export default function TaxiPlatbaAdminPage() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [poznamka, setPoznamka] = useState('');
  const [citySlug, setCitySlug] = useState('');
  const [taxiServiceName, setTaxiServiceName] = useState('');
  const [taxiServicePhone, setTaxiServicePhone] = useState('');
  const [copied, setCopied] = useState(false);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [loadingCities, setLoadingCities] = useState(true);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await fetch('/api/regions');
        if (response.ok) {
          const data = await response.json();
          const allCities: CityOption[] = [];
          if (data.regions) {
            for (const region of data.regions) {
              if (region.cities) {
                for (const city of region.cities) {
                  allCities.push({ slug: city.slug, name: city.name });
                }
              }
            }
          }
          allCities.sort((a, b) => a.name.localeCompare(b.name, 'sk'));
          setCities(allCities);
        }
      } catch (error) {
        console.error('Failed to load cities:', error);
      } finally {
        setLoadingCities(false);
      }
    };
    fetchCities();
  }, []);

  const activeAmount = selectedAmount || (customAmount ? parseFloat(customAmount.replace(',', '.')) : null);

  const generateLink = () => {
    if (!activeAmount || isNaN(activeAmount)) return '';

    let url = `${BASE_URL}/taxi-platba?suma=${activeAmount}`;
    if (poznamka.trim()) {
      url += `&poznamka=${encodeURIComponent(poznamka.trim())}`;
    }
    if (citySlug) {
      url += `&citySlug=${encodeURIComponent(citySlug)}`;
    }
    if (taxiServiceName.trim()) {
      url += `&taxiServiceName=${encodeURIComponent(taxiServiceName.trim())}`;
    }
    if (taxiServicePhone.trim()) {
      url += `&taxiServicePhone=${encodeURIComponent(taxiServicePhone.trim())}`;
    }
    return url;
  };

  const link = generateLink();

  const handlePresetClick = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
  };

  const copyToClipboard = async () => {
    if (!link) return;

    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetForm = () => {
    setSelectedAmount(null);
    setCustomAmount('');
    setPoznamka('');
    setCitySlug('');
    setTaxiServiceName('');
    setTaxiServicePhone('');
    setCopied(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Generátor platobných linkov</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Vytvoriť platobný link</CardTitle>
            <CardDescription>
              Vyber sumu, mesto a taxislužbu a vygeneruj link pre zákazníka
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Mesto */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Mesto *</label>
              <select
                value={citySlug}
                onChange={(e) => setCitySlug(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">-- Vyber mesto --</option>
                <option value="other">Iné / Neznáme</option>
                {loadingCities ? (
                  <option disabled>Načítavam...</option>
                ) : (
                  cities.map((city) => (
                    <option key={city.slug} value={city.slug}>
                      {city.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Názov taxislužby */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Názov taxislužby *</label>
              <Input
                type="text"
                value={taxiServiceName}
                onChange={(e) => setTaxiServiceName(e.target.value)}
                placeholder="napr. Goral Taxi"
              />
            </div>

            {/* Telefónne číslo */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Telefónne číslo *</label>
              <Input
                type="tel"
                value={taxiServicePhone}
                onChange={(e) => setTaxiServicePhone(e.target.value)}
                placeholder="+421 9XX XXX XXX"
              />
            </div>

            {/* Preset Amounts */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Predvolené sumy</label>
              <div className="grid grid-cols-4 gap-2">
                {PRESET_AMOUNTS.map((amount) => (
                  <Button
                    key={amount}
                    variant={selectedAmount === amount ? 'primary' : 'outline'}
                    onClick={() => handlePresetClick(amount)}
                    className="text-lg font-semibold"
                  >
                    {amount} €
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Vlastná suma (EUR)</label>
              <Input
                type="text"
                inputMode="decimal"
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                placeholder="napr. 23.50"
                className="text-lg"
              />
            </div>

            {/* Note */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Poznámka (voliteľné)</label>
              <Input
                type="text"
                value={poznamka}
                onChange={(e) => setPoznamka(e.target.value)}
              />
            </div>

            {/* Generated Link */}
            {link && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Vygenerovaný link</label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={link}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    onClick={copyToClipboard}
                    variant={copied ? 'success' : 'default'}
                    className="shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" />
                        Skopírované
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Kopírovať
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={resetForm} className="flex-1">
                Resetovať
              </Button>
              {link && (
                <Button
                  variant="link"
                  asChild
                  className="flex-1"
                >
                  <a href={link} target="_blank" rel="noopener noreferrer">
                    Otvoriť link
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Ako to funguje</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>1. Vyber mesto, zadaj názov a telefón taxislužby</p>
            <p>2. Vyber predvolenú sumu alebo zadaj vlastnú</p>
            <p>3. Voliteľne pridaj poznámku (uvidíš ju v Stripe)</p>
            <p>4. Skopíruj link a pošli zákazníkovi cez SMS/WhatsApp</p>
            <p>5. Zákazník klikne, zaplatí kartou, hotovo</p>
            <p className="text-xs mt-2 text-muted-foreground/70">Všetky údaje sa uložia do Stripe pre prehľad v admin paneli.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
