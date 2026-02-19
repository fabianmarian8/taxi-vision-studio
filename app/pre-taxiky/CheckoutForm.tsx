'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, Loader2, X, AlertTriangle, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

// Cooldown konfigurácia (5 minút)
const CHECKOUT_COOLDOWN_MS = 5 * 60 * 1000;
const CHECKOUT_STORAGE_KEY = 'taxi_checkout_attempt';

interface CheckoutFormProps {
  plan: 'mini' | 'premium' | 'partner';
  onClose?: () => void;
}

interface CityOption {
  slug: string;
  name: string;
}

interface TaxiServiceOption {
  name: string;
  hasPaidSubscription: boolean;
  isPartner: boolean;
}

export function CheckoutForm({ plan, onClose }: CheckoutFormProps) {
  const [cities, setCities] = useState<CityOption[]>([]);
  const [citySlug, setCitySlug] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [taxiServices, setTaxiServices] = useState<TaxiServiceOption[]>([]);
  const [selectedService, setSelectedService] = useState('');
  const [isLoadingCities, setIsLoadingCities] = useState(true);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [recentAttempt, setRecentAttempt] = useState<{ city: string; service: string; time: number } | null>(null);

  // Načítať zoznam miest
  useEffect(() => {
    fetch('/api/checkout/taxi-services')
      .then((res) => res.json())
      .then((data) => {
        setCities(data.cities || []);
        setIsLoadingCities(false);
      })
      .catch(() => setIsLoadingCities(false));
  }, []);

  // Kontrola nedávneho pokusu o platbu
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(CHECKOUT_STORAGE_KEY);
      if (stored) {
        const attempt = JSON.parse(stored);
        const elapsed = Date.now() - attempt.time;
        if (elapsed < CHECKOUT_COOLDOWN_MS) {
          setRecentAttempt(attempt);
        } else {
          sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);
        }
      }
    } catch {
      // Ignorovať
    }
  }, []);

  // Načítať taxislužby pre vybrané mesto
  useEffect(() => {
    if (!citySlug) {
      setTaxiServices([]);
      setSelectedService('');
      return;
    }

    setIsLoadingServices(true);
    setSelectedService('');
    setError('');

    fetch(`/api/checkout/taxi-services?city=${citySlug}`)
      .then((res) => res.json())
      .then((data) => {
        setTaxiServices(data.services || []);
        setIsLoadingServices(false);
      })
      .catch(() => {
        setTaxiServices([]);
        setIsLoadingServices(false);
      });
  }, [citySlug]);

  // Filtrované mestá podľa vyhľadávania
  const filteredCities = citySearch.trim()
    ? cities.filter((c) =>
        c.name.toLowerCase().includes(citySearch.toLowerCase())
      )
    : cities;

  // Dostupné taxislužby (vylúčiť tie s aktívnym plateným predplatným)
  const availableServices = taxiServices.filter((s) => {
    // Ak už majú platené predplatné rovnakého alebo vyššieho plánu, skryť
    if (s.hasPaidSubscription) return false;
    if (s.isPartner) return false;
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!citySlug) {
      setError('Vyberte mesto');
      return;
    }

    if (!selectedService) {
      setError('Vyberte vašu taxislužbu');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          citySlug,
          taxiServiceName: selectedService,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setError(`Táto taxislužba už má aktívne ${data.existingPlan?.toUpperCase() || ''} predplatné. Kontaktujte nás ak chcete zmeniť plán.`);
          setIsLoading(false);
          return;
        }
        throw new Error(data.error || 'Nepodarilo sa vytvoriť checkout session');
      }

      // Uložiť pokus pred presmerovaním
      try {
        const cityName = cities.find((c) => c.slug === citySlug)?.name || citySlug;
        sessionStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify({
          city: cityName,
          service: selectedService,
          time: Date.now(),
        }));
      } catch {
        // Ignorovať
      }

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
            Vyberte vašu taxislužbu a pokračujte na platbu
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
          {/* City Select with search */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Mesto pôsobenia *
            </label>
            {isLoadingCities ? (
              <div className="flex items-center gap-2 text-slate-400 py-3">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Načítavam mestá...</span>
              </div>
            ) : (
              <>
                {/* Search input for cities */}
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
                    placeholder="Hľadať mesto..."
                    className="w-full bg-slate-800 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                  />
                </div>
                <select
                  value={citySlug}
                  onChange={(e) => {
                    setCitySlug(e.target.value);
                    setCitySearch('');
                  }}
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50"
                  required
                >
                  <option value="">Vyberte mesto</option>
                  {filteredCities.map((city) => (
                    <option key={city.slug} value={city.slug}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>

          {/* Taxi Service Select */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Vaša taxislužba *
            </label>
            {!citySlug ? (
              <p className="text-slate-500 text-sm py-2">
                Najprv vyberte mesto
              </p>
            ) : isLoadingServices ? (
              <div className="flex items-center gap-2 text-slate-400 py-3">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Načítavam taxislužby...</span>
              </div>
            ) : availableServices.length === 0 ? (
              <div className="text-amber-200/70 text-sm bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3">
                {taxiServices.length === 0
                  ? 'V tomto meste zatiaľ nemáme evidované žiadne taxislužby. Kontaktujte nás na info@taxinearme.sk.'
                  : 'Všetky taxislužby v tomto meste už majú aktívne predplatné.'}
              </div>
            ) : (
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50"
                required
              >
                <option value="">Vyberte vašu taxislužbu</option>
                {availableServices.map((service) => (
                  <option key={service.name} value={service.name}>
                    {service.name}
                  </option>
                ))}
              </select>
            )}
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
            disabled={isLoading || !citySlug || !selectedService}
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
