'use client';

import { useState } from 'react';
import { Crown, Star, ShieldCheck, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const CHECKOUT_COOLDOWN_MS = 5 * 60 * 1000;
const CHECKOUT_STORAGE_KEY = 'taxi_checkout_attempt';

type PlanType = 'mini' | 'premium' | 'partner';

interface ServiceCheckoutProps {
  citySlug: string;
  cityName: string;
  serviceName: string;
  serviceSlug: string;
  isVerified?: boolean;
  locationText: string;
}

const PLANS: {
  id: PlanType;
  name: string;
  price: string;
  features: string[];
  popular?: boolean;
  icon: typeof ShieldCheck;
  accent: {
    card: string;
    badge: string;
    btn: string;
    btnDisabled: string;
  };
}[] = [
  {
    id: 'mini',
    name: 'MINI',
    price: '0,99€',
    features: [
      'Badge "Overená taxislužba"',
      'Zvýšená dôveryhodnosť',
    ],
    icon: ShieldCheck,
    accent: {
      card: 'bg-emerald-50 border-emerald-200',
      badge: 'bg-emerald-100 text-emerald-700',
      btn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      btnDisabled: 'bg-emerald-100 text-emerald-500 cursor-default',
    },
  },
  {
    id: 'premium',
    name: 'PREMIUM',
    price: '3,99€',
    features: [
      'Prednostné zobrazenie v zozname',
      'Zlaté zvýraznenie profilu',
      'Badge + logo + väčšie tlačidlo',
    ],
    icon: Crown,
    accent: {
      card: 'bg-white border-gray-200',
      badge: 'bg-gray-100 text-gray-600',
      btn: 'bg-purple-600 hover:bg-purple-700 text-white',
      btnDisabled: 'bg-gray-100 text-gray-400 cursor-default',
    },
  },
  {
    id: 'partner',
    name: 'PARTNER',
    price: '8,99€',
    popular: true,
    features: [
      'Vlastná personalizovaná stránka',
      'Fotogaléria + cenník',
      'Partner portál na úpravy',
      'Import Google recenzií',
    ],
    icon: Star,
    accent: {
      card: 'bg-amber-50 border-amber-300 shadow-md shadow-amber-100',
      badge: 'bg-amber-100 text-amber-700',
      btn: 'bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-black shadow-md shadow-yellow-200',
      btnDisabled: 'bg-amber-100 text-amber-400 cursor-default',
    },
  },
];

export function ServiceCheckout({
  citySlug,
  cityName,
  serviceName,
  serviceSlug,
  isVerified,
  locationText,
}: ServiceCheckoutProps) {
  const [loadingPlan, setLoadingPlan] = useState<PlanType | null>(null);
  const [error, setError] = useState('');

  const handleCheckout = async (plan: PlanType) => {
    setError('');
    setLoadingPlan(plan);

    try {
      const response = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          citySlug,
          taxiServiceName: serviceName,
          cancelUrl: `/taxi/${citySlug}/${serviceSlug}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setError(`Táto taxislužba už má aktívne ${data.existingPlan?.toUpperCase() || ''} predplatné.`);
          setLoadingPlan(null);
          return;
        }
        throw new Error(data.error || 'Nepodarilo sa vytvoriť platbu');
      }

      // Uložiť pokus pred presmerovaním
      try {
        sessionStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify({
          city: cityName,
          service: serviceName,
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
      setLoadingPlan(null);
    }
  };

  // Kontrola nedávneho pokusu
  let recentAttempt: { service: string } | null = null;
  try {
    const stored = typeof window !== 'undefined' ? sessionStorage.getItem(CHECKOUT_STORAGE_KEY) : null;
    if (stored) {
      const attempt = JSON.parse(stored);
      if (Date.now() - attempt.time < CHECKOUT_COOLDOWN_MS) {
        recentAttempt = attempt;
      }
    }
  } catch {
    // Ignorovať
  }

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white rounded-2xl border border-gray-200 p-5 md:p-6">
      {/* Header */}
      <div className="text-center mb-5">
        <h3 className="text-lg md:text-xl font-bold text-gray-900">
          Zvýšte viditeľnosť vašej taxislužby
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Vyberte si balíček pre <strong>{serviceName}</strong> {locationText} {cityName}
        </p>
      </div>

      {/* Nedávny pokus */}
      {recentAttempt && recentAttempt.service === serviceName && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          Nedávno ste začali platbu. Skontrolujte si email, či ste nedostali potvrdenie.
        </div>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {PLANS.map((plan) => {
          const isActive = plan.id === 'mini' && isVerified;
          const isLoading = loadingPlan === plan.id;
          const isDisabled = isActive || loadingPlan !== null;

          return (
            <div
              key={plan.id}
              className={cn(
                'relative rounded-xl border p-4 transition-all',
                plan.accent.card,
                plan.popular && 'ring-2 ring-amber-300',
              )}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-900 text-[10px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap">
                  Najpredávanejšie
                </div>
              )}

              {/* Icon + Name */}
              <div className="flex items-center gap-2 mb-3">
                <plan.icon className={cn('h-5 w-5', plan.id === 'mini' ? 'text-emerald-600' : plan.id === 'partner' ? 'text-amber-600' : 'text-purple-600')} />
                <span className="font-bold text-gray-900">{plan.name}</span>
                {isActive && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-bold">
                    Aktívne
                  </span>
                )}
              </div>

              {/* Price */}
              <div className="mb-3">
                <span className="text-2xl font-black text-gray-900">{plan.price}</span>
                <span className="text-gray-500 text-sm"> / mesiac</span>
              </div>

              {/* Features */}
              <ul className="space-y-1.5 mb-4">
                {plan.features.map((feat, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                    <CheckCircle2 className={cn('h-3.5 w-3.5 flex-shrink-0 mt-0.5', plan.id === 'mini' ? 'text-emerald-500' : plan.id === 'partner' ? 'text-amber-500' : 'text-gray-400')} />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={() => !isDisabled && handleCheckout(plan.id)}
                disabled={isDisabled}
                className={cn(
                  'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all',
                  isActive ? plan.accent.btnDisabled : plan.accent.btn,
                  isDisabled && !isActive && 'opacity-50 cursor-not-allowed',
                )}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isActive ? (
                  'Váš aktuálny plán'
                ) : plan.id === 'mini' ? (
                  'Overiť'
                ) : plan.id === 'partner' ? (
                  'Stať sa partnerom'
                ) : (
                  'Vybrať PREMIUM'
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-3 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      {/* Note */}
      <p className="text-center text-gray-400 text-[11px] mt-4">
        Bez viazanosti • Zrušíte kedykoľvek • Bezpečná platba cez Stripe
      </p>
    </div>
  );
}
