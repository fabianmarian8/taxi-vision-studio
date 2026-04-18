'use client';

import { useState, useEffect } from 'react';
import { Phone, MousePointerClick, Search, Lock } from 'lucide-react';
import { normalizePlanType } from '@/lib/tier-config';
import { DashPanel } from './ui';

interface PerformancePanelProps {
  citySlug: string;
  serviceName: string;
  planType: string | null | undefined;
}

interface AnalyticsData {
  phoneClicks: number;
  totalServiceClicks: number;
  totalCityClicks: number;
}

export function PerformancePanel({ citySlug, serviceName, planType }: PerformancePanelProps) {
  const tier = normalizePlanType(planType);
  const isLeader = tier === 'leader';
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLeader) return;
    setLoading(true);
    fetch(`/api/partner/analytics?city_slug=${encodeURIComponent(citySlug)}&service_name=${encodeURIComponent(serviceName)}`)
      .then(r => r.json())
      .then(d => { if (d.phoneClicks !== undefined) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [citySlug, serviceName, isLeader]);

  const rightBadge = isLeader ? (
    <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
      Leader
    </span>
  ) : null;

  return (
    <DashPanel
      title="Výkon"
      right={rightBadge}
      accentDot
      footer={isLeader && data ? <span>Posledných 30 dní</span> : undefined}
    >
      {!isLeader ? (
        <div className="flex flex-col items-center justify-center text-center py-4">
          <Lock className="h-8 w-8 text-gray-200 mb-3" />
          <p className="text-sm font-semibold text-gray-500 mb-1">Analytika výkonu</p>
          <p className="text-xs text-gray-400 mb-3">Dostupné v Leader balíku</p>
          <a
            href="/pre-taxiky#pricing"
            className="text-xs text-purple-600 hover:text-purple-700 font-semibold"
          >
            Odomknúť za 24,99 €/mes
          </a>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin h-5 w-5 border-2 border-purple-600 border-t-transparent rounded-full" />
        </div>
      ) : data ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="h-4 w-4 text-green-600" />
              Kliknutia na číslo
            </div>
            <span className="text-lg font-bold text-gray-900 tabular-nums">{data.phoneClicks}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MousePointerClick className="h-4 w-4 text-blue-600" />
              Interakcie s profilom
            </div>
            <span className="text-lg font-bold text-gray-900 tabular-nums">{data.totalServiceClicks}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Search className="h-4 w-4 text-amber-600" />
              Hľadaní v meste
            </div>
            <span className="text-lg font-bold text-gray-900 tabular-nums">{data.totalCityClicks}</span>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center py-4">
          <p className="text-sm text-gray-400">Zatiaľ nemáme dáta</p>
        </div>
      )}
    </DashPanel>
  );
}
