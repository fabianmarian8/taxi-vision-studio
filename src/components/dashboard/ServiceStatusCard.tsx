'use client';

import Link from 'next/link';
import { ExternalLink, Pencil, CreditCard } from 'lucide-react';
import { CustomerPortalButton } from '@/components/stripe/CustomerPortalButton';
import { createServiceSlug } from '@/utils/urlUtils';

interface PartnerDraft {
  id: string;
  status: string;
  company_name?: string | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  updated_at?: string | null;
}

interface ServiceStatusCardProps {
  partner: {
    id: string;
    name: string;
    slug: string;
    city_slug: string;
    partner_drafts?: PartnerDraft[];
  };
  subscription: {
    stripe_customer_id: string;
    status: string;
    plan_type: string;
  } | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; message: string }> = {
  approved: { label: 'Live', color: 'bg-green-100 text-green-700', message: 'Profil je zivý a aktuálny' },
  draft: { label: 'Rozpracované', color: 'bg-amber-100 text-amber-700', message: 'Máte nepublikované zmeny' },
  pending: { label: 'Čaká na schválenie', color: 'bg-yellow-100 text-yellow-700', message: 'Zmeny čakajú na schválenie' },
  rejected: { label: 'Zamietnuté', color: 'bg-red-100 text-red-700', message: 'Zmeny boli zamietnuté' },
};

export function ServiceStatusCard({ partner, subscription }: ServiceStatusCardProps) {
  const sortedDrafts = [...(partner.partner_drafts || [])].sort(
    (a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()
  );
  const latestDraft = sortedDrafts[0];
  const status = latestDraft?.status || 'draft';
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-gray-900 truncate">{partner.name}</h3>
            <p className="text-sm text-gray-500">{partner.city_slug}</p>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${config.color}`}>
              {config.label}
            </span>
            {subscription && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                subscription.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {subscription.plan_type?.toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Status message */}
        <p className="text-sm text-gray-500 mb-4">{config.message}</p>

        {/* Posledná zmena */}
        {latestDraft?.updated_at && (
          <p className="text-xs text-gray-400 mb-4">
            Posledná zmena: {new Date(latestDraft.updated_at).toLocaleDateString('sk-SK', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        )}

        {/* CTA */}
        <div className="flex gap-2">
          <Link
            href={`/partner/edit/${partner.slug}`}
            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold py-2 px-3 rounded-lg transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
            Upraviť
          </Link>
          <Link
            href={`/taxi/${partner.city_slug}/${createServiceSlug(partner.name)}`}
            target="_blank"
            className="inline-flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 px-3 rounded-lg transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Subscription */}
        {subscription?.stripe_customer_id && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <CreditCard className="h-3 w-3" />
              Predplatné
            </span>
            <CustomerPortalButton
              customerId={subscription.stripe_customer_id}
              variant="outline"
              className="text-xs"
            />
          </div>
        )}
      </div>
    </div>
  );
}
