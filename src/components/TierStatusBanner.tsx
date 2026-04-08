'use client';

import Link from 'next/link';
import { Lock, CheckCircle2, ArrowRight, MapPin } from 'lucide-react';
import {
  type PlanTier,
  type FieldDefinition,
  normalizePlanType,
  TIER_INFO,
  getLockedFields,
  getNextTier,
  FIELD_DEFINITIONS,
} from '@/lib/tier-config';

interface RoutePreview {
  slug: string;
  origin: string;
  destination: string;
  distance_km: number;
}

interface TierStatusBannerProps {
  planType: string | null | undefined;
  cityName?: string;
  routePreviews?: RoutePreview[];
}

export function TierStatusBanner({ planType, cityName, routePreviews }: TierStatusBannerProps) {
  const tier = normalizePlanType(planType);
  const info = TIER_INFO[tier];
  const lockedFields = getLockedFields(tier);
  const nextTier = getNextTier(tier);
  const nextTierInfo = nextTier ? TIER_INFO[nextTier] : null;
  const totalFields = FIELD_DEFINITIONS.length;
  const unlockedCount = totalFields - lockedFields.length;

  const colorMap: Record<PlanTier, { bg: string; border: string; text: string; badge: string }> = {
    free: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-800' },
    managed: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800' },
    partner: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800' },
    leader: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-800' },
  };

  const colors = colorMap[tier];

  return (
    <div className={`${colors.bg} ${colors.border} border rounded-xl p-4 md:p-5 mb-6`}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className={`${colors.badge} text-xs font-bold px-2.5 py-1 rounded-full`}>
            {info.name}
          </span>
          <span className="text-sm text-gray-600">
            {unlockedCount}/{totalFields} funkcií odomknutých
          </span>
        </div>

        {/* Upsell link odstránený — upgrade je cez UpgradePlanCard vyššie */}
      </div>

      {/* Zamknuté funkcie zoskupené podľa tieru */}
      {lockedFields.length > 0 && (() => {
        // Zoskup zamknuté polia podľa requiredTier
        const grouped = lockedFields.reduce((acc, field) => {
          const t = field.requiredTier;
          if (!acc[t]) acc[t] = [];
          acc[t].push(field);
          return acc;
        }, {} as Record<PlanTier, FieldDefinition[]>);

        const tierOrder: PlanTier[] = ['managed', 'partner', 'leader'];
        const tierColorMap: Record<PlanTier, string> = {
          free: 'bg-green-100 text-green-600',
          managed: 'bg-blue-100 text-blue-600',
          partner: 'bg-amber-100 text-amber-700',
          leader: 'bg-purple-100 text-purple-600',
        };

        return (
          <div className="mt-3 pt-3 border-t border-gray-200/50 space-y-3">
            {tierOrder.map((t) => {
              const fields = grouped[t];
              if (!fields || fields.length === 0) return null;
              const tierInfo = TIER_INFO[t];
              return (
                <div key={t}>
                  <p className="text-xs font-semibold text-gray-600 mb-1.5">
                    Odomkne sa v <span className={`${tierColorMap[t]} px-1.5 py-0.5 rounded text-xs font-bold`}>{tierInfo.name} ({tierInfo.price})</span>:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {fields.map((field) => (
                      <span
                        key={field.key}
                        className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded"
                      >
                        <Lock className="h-2.5 w-2.5" />
                        {field.label}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Personalizovaná ukážka trás pre Leader tier */}
      {routePreviews && routePreviews.length > 0 && tier !== 'leader' && (
        <div className="mt-3 pt-3 border-t border-gray-200/50">
          <p className="text-xs font-semibold text-purple-700 mb-2">
            <MapPin className="h-3 w-3 inline mr-1" />
            S Leader balíkom by vaše číslo bolo zvýraznené napríklad na týchto trasách:
          </p>
          <div className="flex flex-wrap gap-2">
            {routePreviews.map((route) => (
              <Link
                key={route.slug}
                href={`/trasa/${route.slug}`}
                className="inline-flex items-center gap-1.5 text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                <span className="font-semibold">{route.origin} → {route.destination}</span>
                <span className="text-purple-400">{route.distance_km} km</span>
                <ArrowRight className="h-3 w-3 text-purple-400" />
              </Link>
            ))}
          </div>
          <p className="text-[10px] text-purple-400 mt-1.5">
            Kliknite pre ukážku — s Leader balíkom by ste boli hlavná taxislužba na všetkých trasách z {cityName || 'vášho mesta'} a okolia
          </p>
        </div>
      )}

      {lockedFields.length === 0 && (
        <div className="mt-2 flex items-center gap-1.5 text-sm text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          Všetky funkcie odomknuté
        </div>
      )}
    </div>
  );
}
