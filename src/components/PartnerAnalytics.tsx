'use client';

import { useState, useEffect } from 'react';
import { Phone, MousePointerClick, Search, TrendingUp, Lock } from 'lucide-react';
import { type PlanTier, normalizePlanType } from '@/lib/tier-config';

interface PartnerAnalyticsProps {
  citySlug: string;
  serviceName: string;
  planType: string | null | undefined;
}

interface AnalyticsData {
  phoneClicks: number;
  totalServiceClicks: number;
  totalCityClicks: number;
  dailyBreakdown: { date: string; clicks: number }[];
}

export function PartnerAnalytics({ citySlug, serviceName, planType }: PartnerAnalyticsProps) {
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

  // Zamknutý stav pre non-leader
  if (!isLeader) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 flex items-center justify-center">
          <a href="/pre-taxiky#pricing" className="flex items-center gap-2 bg-purple-600 text-white font-bold text-sm px-5 py-2.5 rounded-full shadow-lg hover:bg-purple-700 transition-colors">
            <Lock className="h-4 w-4" />
            Odomknúť analytiku — Leader mesta (24,99 €/mes)
          </a>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Analytika výkonu</h3>
        <div className="grid grid-cols-3 gap-4 opacity-30">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-gray-400">--</p>
            <p className="text-xs text-gray-400">Kliknutia na číslo</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-gray-400">--</p>
            <p className="text-xs text-gray-400">Zobrazenia profilu</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-gray-400">--</p>
            <p className="text-xs text-gray-400">Hľadaní v meste</p>
          </div>
        </div>
      </div>
    );
  }

  // Leader — plná analytika
  return (
    <div className="bg-white rounded-xl border border-purple-200 shadow-sm p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-purple-600" />
        <h3 className="text-lg font-bold text-gray-900">Analytika výkonu</h3>
        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">Leader</span>
        <span className="text-xs text-gray-400 ml-auto">Posledných 30 dní</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin h-6 w-6 border-2 border-purple-600 border-t-transparent rounded-full" />
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-3 gap-4 mb-5">
            <div className="bg-green-50 rounded-lg p-4 text-center border border-green-100">
              <Phone className="h-5 w-5 text-green-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-green-700">{data.phoneClicks}</p>
              <p className="text-xs text-green-600 font-medium">Kliknutia na číslo</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-100">
              <MousePointerClick className="h-5 w-5 text-blue-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-blue-700">{data.totalServiceClicks}</p>
              <p className="text-xs text-blue-600 font-medium">Interakcie s profilom</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-4 text-center border border-amber-100">
              <Search className="h-5 w-5 text-amber-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-amber-700">{data.totalCityClicks}</p>
              <p className="text-xs text-amber-600 font-medium">Hľadaní taxi v meste</p>
            </div>
          </div>

          {/* Mini bar chart — posledných 7 dní */}
          <div>
            <p className="text-xs text-gray-500 mb-2 font-medium">Posledných 7 dní — kliknutia na váš profil</p>
            <div className="flex items-end gap-1.5 h-16">
              {data.dailyBreakdown.map((day) => {
                const max = Math.max(...data.dailyBreakdown.map(d => d.clicks), 1);
                const height = Math.max((day.clicks / max) * 100, 4);
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-0.5">
                    <span className="text-[9px] text-gray-400">{day.clicks || ''}</span>
                    <div
                      className="w-full bg-purple-200 rounded-t"
                      style={{ height: `${height}%`, minHeight: '2px' }}
                    />
                    <span className="text-[8px] text-gray-400">{new Date(day.date).toLocaleDateString('sk', { weekday: 'short' })}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <p className="text-sm text-gray-500 text-center py-4">Zatiaľ nemáme dostatok dát</p>
      )}
    </div>
  );
}
