'use client';

import Link from 'next/link';
import { CheckCircle2, XCircle, Pencil } from 'lucide-react';
import { DashPanel } from './ui';

interface ProfileStatusPanelProps {
  partnerSlug: string;
  draftStatus: string | null;
  lastUpdated: string | null;
  checks: {
    label: string;
    done: boolean;
  }[];
  completeness: number;
}

export function ProfileStatusPanel({ partnerSlug, draftStatus, checks, completeness }: ProfileStatusPanelProps) {
  const isLive = draftStatus === 'approved';
  const hasDraft = draftStatus === 'draft';
  const isRejected = draftStatus === 'rejected';

  const statusLabel = isLive
    ? 'Profil je živý'
    : hasDraft
    ? 'Rozpracované zmeny'
    : isRejected
    ? 'Zamietnuté'
    : 'Draft';

  const dotColor = isLive ? 'bg-green-500' : isRejected ? 'bg-red-500' : 'bg-amber-500';

  return (
    <DashPanel title="Profil" accentDot>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${dotColor}`} />
          <span className="text-sm font-semibold text-gray-900">{statusLabel}</span>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Kompletnosť</span>
            <span className="font-semibold tabular-nums">{completeness}%</span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${completeness === 100 ? 'bg-green-500' : 'bg-purple-500'}`}
              style={{ width: `${completeness}%` }}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          {checks.map((check) => (
            <div key={check.label} className="flex items-center gap-2 text-sm">
              {check.done ? (
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-gray-300 flex-shrink-0" />
              )}
              <span className={check.done ? 'text-gray-700' : 'text-gray-400'}>{check.label}</span>
            </div>
          ))}
        </div>

        <Link
          href={`/partner/edit/${partnerSlug}`}
          className="inline-flex items-center justify-center gap-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-sm font-semibold py-2 rounded-lg transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
          Otvoriť editor
        </Link>
      </div>
    </DashPanel>
  );
}
