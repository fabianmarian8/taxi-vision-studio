'use client';

import { ReactNode } from 'react';

interface DashStatCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  loading?: boolean;
}

/**
 * Stat card used across dashboard — shows a label + value + optional hint/icon.
 * No fake deltas or growth % — only show real data we actually track.
 */
export function DashStatCard({
  label,
  value,
  hint,
  icon,
  loading = false,
}: DashStatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide truncate">
          {label}
        </span>
        {icon && <span className="text-gray-400 flex-shrink-0">{icon}</span>}
      </div>
      <div className="text-2xl md:text-3xl font-black text-gray-900 tabular-nums">
        {loading ? (
          <span className="inline-block h-7 w-16 bg-gray-100 rounded animate-pulse" />
        ) : (
          value
        )}
      </div>
      {hint && <span className="text-xs text-gray-400">{hint}</span>}
    </div>
  );
}
