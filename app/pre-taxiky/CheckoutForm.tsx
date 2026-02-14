'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, Loader2, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Cooldown konfigurácia (5 minút)
const CHECKOUT_COOLDOWN_MS = 5 * 60 * 1000;
const CHECKOUT_STORAGE_KEY = 'taxi_checkout_attempt';

interface CheckoutFormProps {
  plan: 'mini' | 'premium' | 'partner';
  onClose?: () => void;
}

// Zoznam slovenských miest (hlavné mestá)
const CITIES = [
  { slug: 'bratislava', name: 'Bratislava' },
  { slug: 'kosice', name: 'Košice' },
  { slug: 'presov', name: 'Prešov' },
  { slug: 'zilina', name: 'Žilina' },
  { slug: 'banska-bystrica', name: 'Banská Bystrica' },
  { slug: 'nitra', name: 'Nitra' },
  { slug: 'trnava', name: 'Trnava' },
  { slug: 'trencin', name: 'Trenčín' },
  { slug: 'martin', name: 'Martin' },
  { slug: 'poprad', name: 'Poprad' },
  { slug: 'prievidza', name: 'Prievidza' },
  { slug: 'zvolen', name: 'Zvolen' },
  { slug: 'povazska-bystrica', name: 'Považská Bystrica' },
  { slug: 'michalovce', name: 'Michalovce' },
  { slug: 'nove-zamky', name: 'Nové Zámky' },
  { slug: 'spisska-nova-ves', name: 'Spišská Nová Ves' },
  { slug: 'komarno', name: 'Komárno' },
  { slug: 'humenne', name: 'Humenné' },
  { slug: 'levice', name: 'Levice' },
  { slug: 'lucenec', name: 'Lučenec' },
  { slug: 'ruzomberok', name: 'Ružomberok' },
  { slug: 'liptovsky-mikulas', name: 'Liptovský Mikuláš' },
  { slug: 'piestany', name: 'Piešťany' },
  { slug: 'dunajska-streda', name: 'Dunajská Streda' },
  { slug: 'bardejov', name: 'Bardejov' },
  { slug: 'vranov-nad-toplou', name: 'Vranov nad Topľou' },
  { slug: 'dolny-kubin', name: 'Dolný Kubín' },
  { slug: 'cadca', name: 'Čadca' },
  { slug: 'pezinok', name: 'Pezinok' },
  { slug: 'partizanske', name: 'Partizánske' },
  { slug: 'rimavska-sobota', name: 'Rimavská Sobota' },
  { slug: 'senica', name: 'Senica' },
  { slug: 'hlohovec', name: 'Hlohovec' },
  { slug: 'galanta', name: 'Galanta' },
  { slug: 'sala', name: 'Šaľa' },
  { slug: 'malacky', name: 'Malacky' },
  { slug: 'snina', name: 'Snina' },
  { slug: 'stara-lubovna', name: 'Stará Ľubovňa' },
  { slug: 'trebisov', name: 'Trebišov' },
  { slug: 'kezmarok', name: 'Kežmarok' },
].sort((a, b) => a.name.localeCompare(b.name, 'sk'));

export function CheckoutForm({ plan, onClose }: CheckoutFormProps) {
  const [citySlug, setCitySlug] = useState('');
  const [customCity, setCustomCity] = useState('');
  const [taxiServiceName, setTaxiServiceName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [recentAttempt, setRecentAttempt] = useState<{ city: string; service: string; time: number } | null>(null);

  // Kontrola nedávneho pokusu o platbu pri načítaní
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(CHECKOUT_STORAGE_KEY);
      if (stored) {
        const attempt = JSON.parse(stored);
        const elapsed = Date.now() - attempt.time;
        if (elapsed < CHECKOUT_COOLDOWN_MS) {
          setRecentAttempt(attempt);
        } else {
          // Vypršaný pokus - vyčistiť
          sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);
        }
      }
    } catch {
      // Ignorovať chyby pri čítaní sessionStorage
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!citySlug) {
      setError('Vyberte mesto');
      return;
    }

    if (citySlug === 'other' && !customCity.trim()) {
      setError('Zadajte názov mesta');
      return;
    }

    if (!taxiServiceName.trim()) {
      setError('Zadajte názov vašej taxislužby');
      return;
    }

    const effectiveCitySlug = citySlug === 'other' ? customCity.trim() : citySlug;

    setIsLoading(true);

    try {
      const response = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          citySlug: effectiveCitySlug,
          taxiServiceName: taxiServiceName.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Špecifická chyba pre duplicitné predplatné
        if (response.status === 409) {
          setError(`Táto taxislužba už má aktívne ${data.existingPlan?.toUpperCase() || ''} predplatné. Kontaktujte nás ak chcete zmeniť plán.`);
          setIsLoading(false);
          return;
        }
        throw new Error(data.error || 'Nepodarilo sa vytvoriť checkout session');
      }

      // Uložiť pokus do sessionStorage pred presmerovaním
      try {
        const cityName = citySlug === 'other' ? customCity.trim() : (CITIES.find(c => c.slug === citySlug)?.name || citySlug);
        sessionStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify({
          city: cityName,
          service: taxiServiceName.trim(),
          time: Date.now(),
        }));
      } catch {
        // Ignorovať chyby pri zápise
      }

      // Presmerovanie na Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Niečo sa pokazilo');
      setIsLoading(false);
    }
  };

  const isPartner = plan === 'partner';
  const isMini = plan === 'mini';

  const planNames = { mini: 'MINI', premium: 'PREMIUM', partner: 'PARTNER' };
  const planColors = {
    mini: 'text-emerald-400',
    premium: 'text-white',
    partner: 'text-yellow-400'
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={cn(
        "relative w-full max-w-md rounded-2xl p-6 md:p-8",
        isPartner
          ? "bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-yellow-400/50"
          : isMini
            ? "bg-slate-900 border border-emerald-500/30"
            : "bg-slate-900 border border-white/10"
      )}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className={cn("text-2xl font-bold mb-2", planColors[plan])}>
            {planNames[plan]} balíček
          </h2>
          <p className="text-slate-400 text-sm">
            Vyplňte údaje a pokračujte na platbu
          </p>
        </div>

        {/* Warning banner pre nedávny pokus */}
        {recentAttempt && (
          <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-amber-200 font-medium">
                Nedávno ste začali platbu
              </p>
              <p className="text-amber-200/70 mt-1">
                Pre <strong>{recentAttempt.service}</strong> v meste {recentAttempt.city}.
                Skontrolujte si email, či ste nedostali potvrdenie platby.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* City Select */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Mesto pôsobenia *
            </label>
            <select
              value={citySlug}
              onChange={(e) => setCitySlug(e.target.value)}
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50"
              required
            >
              <option value="">Vyberte mesto</option>
              {CITIES.map((city) => (
                <option key={city.slug} value={city.slug}>
                  {city.name}
                </option>
              ))}
              <option value="other">Iné mesto</option>
            </select>
            {citySlug === 'other' && (
              <input
                type="text"
                value={customCity}
                onChange={(e) => setCustomCity(e.target.value)}
                placeholder="Zadajte názov mesta alebo obce"
                className="w-full mt-2 bg-slate-800 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50"
                required
              />
            )}
          </div>

          {/* Taxi Service Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Názov taxislužby *
            </label>
            <input
              type="text"
              value={taxiServiceName}
              onChange={(e) => setTaxiServiceName(e.target.value)}
              placeholder="napr. Fast Taxi Zvolen"
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50"
              required
            />
          </div>

          {/* Error */}
          {error && (
            <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              "w-full flex items-center justify-center gap-2 font-bold px-6 py-4 rounded-xl transition-all text-base disabled:opacity-50 disabled:cursor-not-allowed",
              isPartner
                ? "bg-yellow-400 hover:bg-yellow-300 text-slate-900 shadow-lg shadow-yellow-400/20 hover:shadow-yellow-400/30"
                : isMini
                  ? "bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400"
                  : "bg-white/10 hover:bg-white/20 border border-white/10 text-white"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Načítavam...
              </>
            ) : (
              <>
                Pokračovať na platbu
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>

          {/* Price info */}
          <p className="text-center text-slate-500 text-xs">
            {plan === 'mini' ? '0,99€' : plan === 'premium' ? '3,99€' : '8,99€'} / mesiac • Bez viazanosti • Zrušíte kedykoľvek
          </p>
        </form>
      </div>
    </div>
  );
}

// Wrapper komponent pre použitie na stránke
export function CheckoutButton({
  plan,
  className,
  children
}: {
  plan: 'mini' | 'premium' | 'partner';
  className?: string;
  children: React.ReactNode;
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowForm(true)}
        className={className}
      >
        {children}
      </button>
      {showForm && (
        <CheckoutForm plan={plan} onClose={() => setShowForm(false)} />
      )}
    </>
  );
}
