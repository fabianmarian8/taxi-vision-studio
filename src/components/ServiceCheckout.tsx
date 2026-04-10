'use client';

import { useState } from 'react';
import { Crown, Star, ShieldCheck, CheckCircle2, Loader2, ChevronDown, ChevronUp, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const CHECKOUT_COOLDOWN_MS = 5 * 60 * 1000;
const CHECKOUT_STORAGE_KEY = 'taxi_checkout_attempt';

type PlanType = 'managed' | 'newPartner' | 'leader';

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
    id: 'managed',
    name: 'Spravovaný profil',
    price: '5,99€',
    features: [
      'Hero obrázok a branding',
      'Služby, tagy a popis',
      'WhatsApp a sociálne siete',
      'Zvýraznenie v zozname',
    ],
    icon: Crown,
    accent: {
      card: 'bg-blue-50 border-blue-200',
      badge: 'bg-blue-100 text-blue-700',
      btn: 'bg-blue-600 hover:bg-blue-700 text-white',
      btnDisabled: 'bg-blue-100 text-blue-400 cursor-default',
    },
  },
  {
    id: 'newPartner',
    name: 'Partner',
    price: '14,99€',
    popular: true,
    features: [
      'Vlastná personalizovaná stránka',
      'Fotogaléria + cenník',
      'Google recenzie',
      'Prioritné umiestnenie',
    ],
    icon: Star,
    accent: {
      card: 'bg-amber-50 border-amber-300 shadow-md shadow-amber-100',
      badge: 'bg-amber-100 text-amber-700',
      btn: 'bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-black shadow-md shadow-yellow-200',
      btnDisabled: 'bg-amber-100 text-amber-400 cursor-default',
    },
  },
  {
    id: 'leader',
    name: 'Leader mesta',
    price: '24,99€',
    features: [
      'Všetko z Partnera',
      'Exkluzívna pozícia #1',
      'Štatistiky hľadaní v meste',
      'Analytika kliknutí na číslo',
      'Zvýraznenie na trasách',
    ],
    icon: Crown,
    accent: {
      card: 'bg-purple-50 border-purple-200',
      badge: 'bg-purple-100 text-purple-700',
      btn: 'bg-purple-600 hover:bg-purple-700 text-white',
      btnDisabled: 'bg-purple-100 text-purple-400 cursor-default',
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
  const [isExpanded, setIsExpanded] = useState(false);
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
    <div id="checkout">
      {/* Zbalený header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full border border-amber-200 bg-amber-50 rounded-xl p-3 md:p-4 shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
      >
        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
          <Star className="h-5 w-5 text-amber-600 hidden md:block" />
          <span className="font-bold text-sm md:text-base text-amber-800 truncate">
            Spravujte svoj profil profesionálne
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap bg-blue-100 text-blue-700">
            od 5,99€/mes
          </span>
        </div>
        <span className="flex items-center gap-1 md:gap-2 text-gray-500 group-hover:text-gray-700 ml-2 flex-shrink-0">
          <span className="text-sm hidden md:inline">{isExpanded ? 'Zavrieť' : 'Zobraziť balíčky'}</span>
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </span>
      </button>

      {/* Rozbalený obsah s balíčkami */}
      {isExpanded && (
        <div className="mt-3 bg-gradient-to-b from-gray-50 to-white rounded-2xl border border-gray-200 p-5 md:p-6 animate-in slide-in-from-top-2 duration-200">
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
              const isActive = false; // Mini plan removed — no auto-active state
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
                    <plan.icon className={cn('h-5 w-5', plan.id === 'newPartner' ? 'text-amber-600' : plan.id === 'leader' ? 'text-purple-600' : 'text-blue-600')} />
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
                        <CheckCircle2 className={cn('h-3.5 w-3.5 flex-shrink-0 mt-0.5', plan.id === 'newPartner' ? 'text-amber-500' : plan.id === 'leader' ? 'text-purple-500' : 'text-blue-500')} />
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
                    ) : plan.id === 'newPartner' ? (
                      'Stať sa partnerom'
                    ) : plan.id === 'leader' ? (
                      'Vybrať Leader'
                    ) : (
                      'Vybrať Spravovaný'
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
      )}
    </div>
  );
}
