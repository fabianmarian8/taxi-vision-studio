'use client';

import { useState } from 'react';
import { CheckCircle2, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { normalizePlanType, TIER_INFO, getLockedFields, getNextTier, FIELD_DEFINITIONS, type PlanTier } from '@/lib/tier-config';

interface PlanAndUnlocksPanelProps {
  planType: string | null | undefined;
  partnerId: string;
  partnerSlug: string;
  citySlug: string;
  taxiServiceName: string;
  hasSubscription: boolean;
}

export function PlanAndUnlocksPanel({ planType, partnerId, partnerSlug, citySlug, taxiServiceName, hasSubscription }: PlanAndUnlocksPanelProps) {
  const tier = normalizePlanType(planType);
  const info = TIER_INFO[tier];
  const lockedFields = getLockedFields(tier);
  const nextTier = getNextTier(tier);
  const nextTierInfo = nextTier ? TIER_INFO[nextTier] : null;
  const totalFields = FIELD_DEFINITIONS.length;
  const unlockedCount = totalFields - lockedFields.length;
  const [loading, setLoading] = useState(false);

  const PLAN_COLORS: Record<PlanTier, string> = {
    free: 'text-green-700',
    managed: 'text-blue-700',
    partner: 'text-amber-700',
    leader: 'text-purple-700',
  };

  async function handleUpgrade() {
    if (!nextTier) return;
    setLoading(true);

    const planMap: Record<string, string> = {
      managed: 'managed',
      partner: 'newPartner',
      leader: 'leader',
    };

    try {
      const response = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: planMap[nextTier],
          citySlug,
          taxiServiceName,
          partnerId,
          cancelUrl: '/partner',
        }),
      });
      const data = await response.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col">
      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Balík</h3>

      {/* Current plan */}
      <div className="mb-4">
        <p className={`text-xl font-black ${PLAN_COLORS[tier]}`}>{info.name}</p>
        <p className="text-xs text-gray-400 mt-0.5">{info.price}</p>
      </div>

      {/* Unlocked count */}
      <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-3">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <span>{unlockedCount}/{totalFields} funkcií</span>
      </div>

      {/* Locked features from next tier */}
      {nextTierInfo && lockedFields.length > 0 && (
        <div className="flex-1">
          <p className="text-xs text-gray-400 mb-2">V {nextTierInfo.name} ({nextTierInfo.price}):</p>
          <div className="space-y-1">
            {lockedFields.slice(0, 3).map((field) => (
              <div key={field.key} className="flex items-center gap-1.5 text-xs text-gray-500">
                <Lock className="h-3 w-3 text-gray-300" />
                {field.label}
              </div>
            ))}
            {lockedFields.length > 3 && (
              <p className="text-xs text-gray-400">+{lockedFields.length - 3} ďalších</p>
            )}
          </div>
        </div>
      )}

      {/* All unlocked */}
      {lockedFields.length === 0 && (
        <div className="flex-1 flex items-center gap-1.5 text-sm text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          Všetko odomknuté
        </div>
      )}

      {/* CTA */}
      {nextTierInfo ? (
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="mt-4 inline-flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white text-sm font-bold py-2 rounded-lg transition-colors"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Upgradnúť na {nextTierInfo.name}
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      ) : hasSubscription ? (
        <a
          href="/partner"
          className="mt-4 inline-flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 rounded-lg transition-colors"
        >
          Spravovať predplatné
        </a>
      ) : null}
    </div>
  );
}
