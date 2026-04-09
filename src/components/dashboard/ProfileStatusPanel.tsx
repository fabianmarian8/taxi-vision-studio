'use client';

import Link from 'next/link';
import { CheckCircle2, XCircle, Pencil } from 'lucide-react';

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

export function ProfileStatusPanel({ partnerSlug, draftStatus, lastUpdated, checks, completeness }: ProfileStatusPanelProps) {
  const isLive = draftStatus === 'approved';
  const hasDraft = draftStatus === 'draft';
  const isRejected = draftStatus === 'rejected';

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col">
      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Profil</h3>

      {/* Status */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2 h-2 rounded-full ${
          isLive ? 'bg-green-500' : isRejected ? 'bg-red-500' : 'bg-amber-500'
        }`} />
        <span className="text-sm font-semibold text-gray-900">
          {isLive ? 'Profil je živý' : hasDraft ? 'Rozpracované zmeny' : isRejected ? 'Zamietnuté' : 'Draft'}
        </span>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Kompletnosť</span>
          <span className="font-semibold">{completeness}%</span>
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full">
          <div
            className={`h-full rounded-full transition-all ${completeness === 100 ? 'bg-green-500' : 'bg-purple-500'}`}
            style={{ width: `${completeness}%` }}
          />
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-1.5 flex-1">
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

      {/* CTA */}
      <Link
        href={`/partner/edit/${partnerSlug}`}
        className="mt-4 inline-flex items-center justify-center gap-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-sm font-semibold py-2 rounded-lg transition-colors"
      >
        <Pencil className="h-3.5 w-3.5" />
        Otvoriť editor
      </Link>
    </div>
  );
}
