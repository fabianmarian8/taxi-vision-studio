'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Check, ArrowLeft } from 'lucide-react';

const PRESET_AMOUNTS = [5, 10, 15, 20, 25, 30, 40, 50];
const BASE_URL = 'https://www.taxinearme.sk';

export default function TaxiPlatbaAdminPage() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [poznamka, setPoznamka] = useState('');
  const [copied, setCopied] = useState(false);

  const activeAmount = selectedAmount || (customAmount ? parseFloat(customAmount.replace(',', '.')) : null);

  const generateLink = () => {
    if (!activeAmount || isNaN(activeAmount)) return '';

    let url = `${BASE_URL}/taxi-platba?suma=${activeAmount}`;
    if (poznamka.trim()) {
      url += `&poznamka=${encodeURIComponent(poznamka.trim())}`;
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
              Vyber sumu alebo zadaj vlastnú a vygeneruj link pre zákazníka
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
            <p>1. Vyber predvolenú sumu alebo zadaj vlastnú</p>
            <p>2. Voliteľne pridaj poznámku (uvidíš ju v Stripe)</p>
            <p>3. Skopíruj link a pošli zákazníkovi cez SMS/WhatsApp</p>
            <p>4. Zákazník klikne, zaplatí kartou, hotovo</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
