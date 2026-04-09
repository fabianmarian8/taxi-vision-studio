'use client';

import Link from 'next/link';
import { ExternalLink, Pencil, Clock } from 'lucide-react';
import { normalizePlanType, TIER_INFO, type PlanTier } from '@/lib/tier-config';

interface ServiceIdentityStripProps {
  serviceName: string;
  citySlug: string;
  cityName: string;
  partnerSlug: string;
  planType: string | null | undefined;
  draftStatus: string | null;
  lastUpdated: string | null;
  profileHealth: {
    completedFields: number;
    totalFields: number;
  };
}

const PLAN_COLORS: Record<PlanTier, { badge: string; accent: string }> = {
  free: { badge: 'bg-green-100 text-green-700', accent: 'border-green-200' },
  managed: { badge: 'bg-blue-100 text-blue-700', accent: 'border-blue-200' },
  partner: { badge: 'bg-amber-100 text-amber-700', accent: 'border-amber-200' },
  leader: { badge: 'bg-purple-100 text-purple-700', accent: 'border-purple-200' },
};

export function ServiceIdentityStrip({
  serviceName, citySlug, cityName, partnerSlug, planType,
  draftStatus, lastUpdated, profileHealth,
}: ServiceIdentityStripProps) {
  const tier = normalizePlanType(planType);
  const tierInfo = TIER_INFO[tier];
  const colors = PLAN_COLORS[tier];
  const completeness = profileHealth.totalFields > 0
    ? Math.round((profileHealth.completedFields / profileHealth.totalFields) * 100)
    : 0;

  const isLive = draftStatus === 'approved';
  const hasDraft = draftStatus === 'draft';

  return (
    <div className={`bg-white rounded-xl border ${colors.accent} shadow-sm p-5 md:p-6 mb-6`}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Identita */}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl md:text-2xl font-black text-gray-900 truncate">
            {serviceName}
          </h2>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-sm text-gray-500">{cityName}</span>
            <span className="text-gray-300">&bull;</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors.badge}`}>
              {tierInfo.name}
            </span>
            <span className="text-gray-300">&bull;</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              isLive ? 'bg-green-100 text-green-700' :
              hasDraft ? 'bg-amber-100 text-amber-700' :
              'bg-gray-100 text-gray-500'
            }`}>
              {isLive ? 'Live' : hasDraft ? 'Rozpracované' : 'Draft'}
            </span>
          </div>
          {lastUpdated && (
            <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
              <Clock className="h-3 w-3" />
              Posledná zmena: {new Date(lastUpdated).toLocaleDateString('sk-SK', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>

        {/* Health + CTA */}
        <div className="flex flex-col items-start md:items-end gap-3">
          <div className="md:text-right">
            <div className="text-sm font-semibold text-gray-700">
              Profil {completeness}%
            </div>
            <div className="w-32 h-1.5 bg-gray-100 rounded-full mt-1">
              <div
                className={`h-full rounded-full transition-all ${completeness === 100 ? 'bg-green-500' : 'bg-purple-500'}`}
                style={{ width: `${completeness}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/partner/edit/${partnerSlug}`}
              className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
              Upravit profil
            </Link>
            <Link
              href={`/taxi/${citySlug}/${partnerSlug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-3 py-2 rounded-lg transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Live
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
