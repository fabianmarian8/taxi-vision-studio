'use client';

import { useState } from 'react';
import { Crown, Star, CheckCircle2, Loader2, Lock, Mail, ArrowRight } from 'lucide-react';
import { type PlanTier, TIER_INFO, normalizePlanType, tierLevel } from '@/lib/tier-config';

interface UpgradePlanCardProps {
  currentPlanType: string | null | undefined;
  partnerId: string;
  partnerSlug: string;
  citySlug: string;
  taxiServiceName: string;
}

const PLANS: {
  tier: PlanTier;
  stripePlan: string; // plan name pre create-session API
  icon: typeof Star;
  color: { card: string; btn: string; check: string; badge: string };
}[] = [
  {
    tier: 'managed',
    stripePlan: 'managed', // nová cena 5.99€
    icon: Crown,
    color: {
      card: 'border-blue-200 bg-blue-50/50',
      btn: 'bg-blue-600 hover:bg-blue-700 text-white',
      check: 'text-blue-500',
      badge: 'bg-blue-100 text-blue-700',
    },
  },
  {
    tier: 'partner',
    stripePlan: 'newPartner', // nová cena 14.99€
    icon: Star,
    color: {
      card: 'border-amber-300 bg-amber-50/50 ring-2 ring-amber-200',
      btn: 'bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-black shadow-md shadow-yellow-200',
      check: 'text-amber-500',
      badge: 'bg-amber-100 text-amber-700',
    },
  },
  {
    tier: 'leader',
    stripePlan: 'leader', // 24.99€
    icon: Crown,
    color: {
      card: 'border-purple-200 bg-purple-50/50',
      btn: 'bg-purple-600 hover:bg-purple-700 text-white',
      check: 'text-purple-500',
      badge: 'bg-purple-100 text-purple-700',
    },
  },
];

export function UpgradePlanCard({
  currentPlanType,
  partnerId,
  partnerSlug,
  citySlug,
  taxiServiceName,
}: UpgradePlanCardProps) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState('');
  const currentTier = normalizePlanType(currentPlanType);

  async function handleUpgrade(stripePlan: string) {
    setError('');
    setLoadingPlan(stripePlan);

    try {
      const response = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: stripePlan,
          citySlug,
          taxiServiceName,
          partnerId,
          cancelUrl: `/partner`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Nepodarilo sa vytvoriť platbu');
        setLoadingPlan(null);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Niečo sa pokazilo');
      setLoadingPlan(null);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
      <h3 className="text-lg font-bold text-gray-900 mb-1">Vyberte si balík</h3>
      <p className="text-sm text-gray-500 mb-4">
        Upgradnite profil <strong>{taxiServiceName}</strong> a odomknite viac funkcií
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const info = TIER_INFO[plan.tier];
          const isCurrentOrLower = tierLevel(plan.tier) <= tierLevel(currentTier);
          const isCurrent = plan.tier === currentTier;
          const isLeader = plan.tier === 'leader';
          const isLoading = loadingPlan === plan.stripePlan;

          return (
            <div
              key={plan.tier}
              className={`relative rounded-xl border p-4 transition-all ${plan.color.card} ${isCurrentOrLower && !isCurrent ? 'opacity-50' : ''}`}
            >
              {/* Current badge */}
              {isCurrent && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  <span className={`text-[10px] font-bold px-3 py-0.5 rounded-full ${plan.color.badge}`}>
                    Aktuálny balík
                  </span>
                </div>
              )}

              {/* Header */}
              <div className="flex items-center gap-2 mb-2">
                <plan.icon className={`h-5 w-5 ${plan.color.check}`} />
                <span className="font-bold text-gray-900">{info.name}</span>
              </div>

              {/* Price */}
              <div className="mb-3">
                <span className="text-2xl font-black text-gray-900">{info.price}</span>
              </div>

              {/* Features */}
              <ul className="space-y-1.5 mb-4">
                {info.features.map((feat, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                    <CheckCircle2 className={`h-3.5 w-3.5 flex-shrink-0 mt-0.5 ${plan.color.check}`} />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {isCurrent ? (
                <button
                  disabled
                  className="w-full px-4 py-2.5 rounded-lg text-sm font-bold bg-gray-100 text-gray-400 cursor-default"
                >
                  Aktuálny balík
                </button>
              ) : isCurrentOrLower ? (
                <button
                  disabled
                  className="w-full px-4 py-2.5 rounded-lg text-sm font-bold bg-gray-100 text-gray-300 cursor-default"
                >
                  <Lock className="h-3.5 w-3.5 inline mr-1" />
                  Zahrnuté vo vašom balíku
                </button>
              ) : (
                <button
                  onClick={() => handleUpgrade(plan.stripePlan)}
                  disabled={loadingPlan !== null}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${plan.color.btn} ${loadingPlan !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Upgradnúť
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mt-3 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      <p className="text-center text-gray-400 text-[11px] mt-4">
        Bez viazanosti • Zrušíte kedykoľvek • Bezpečná platba cez Stripe
      </p>
    </div>
  );
}
