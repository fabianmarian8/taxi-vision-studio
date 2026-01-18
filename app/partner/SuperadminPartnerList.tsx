'use client';

import Link from 'next/link';
import { useState } from 'react';

interface Partner {
  id: string;
  name: string;
  slug: string;
  city_slug: string;
  email: string | null;
  user_id: string | null;
  created_at: string;
}

interface SuperadminPartnerListProps {
  partners: Partner[];
  currentImpersonating: string | null;
}

export function SuperadminPartnerList({ partners, currentImpersonating }: SuperadminPartnerListProps) {
  const [search, setSearch] = useState('');
  const [isExpanded, setIsExpanded] = useState(!!currentImpersonating);

  const filteredPartners = partners.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase()) ||
      p.city_slug.toLowerCase().includes(search.toLowerCase()) ||
      (p.email && p.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-purple-900">Superadmin Panel</h3>
            <p className="text-sm text-purple-600">
              {partners.length} partnerov celkom
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-purple-600 hover:text-purple-800 font-medium text-sm flex items-center gap-1"
        >
          {isExpanded ? 'Skryť' : 'Zobraziť partnerov'}
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {currentImpersonating && (
        <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="text-yellow-800 font-medium">
              Pozeráte sa ako: <strong>{currentImpersonating}</strong>
            </span>
          </div>
          <Link
            href="/partner"
            className="text-yellow-700 hover:text-yellow-900 text-sm font-medium underline"
          >
            Zrušiť
          </Link>
        </div>
      )}

      {isExpanded && (
        <>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Hľadať partnera (názov, slug, mesto, email)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="max-h-96 overflow-y-auto">
            <div className="grid gap-2">
              {filteredPartners.length === 0 ? (
                <p className="text-purple-600 text-center py-4">Žiadni partneri nenájdení</p>
              ) : (
                filteredPartners.map((partner) => (
                  <Link
                    key={partner.id}
                    href={`/partner?as=${partner.slug}`}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                      currentImpersonating === partner.slug
                        ? 'bg-purple-100 border-purple-400'
                        : 'bg-white border-gray-200 hover:border-purple-400 hover:bg-purple-50'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{partner.name}</span>
                        {currentImpersonating === partner.slug && (
                          <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full">
                            Aktívne
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-2 mt-0.5">
                        <span>{partner.city_slug}</span>
                        <span className="text-gray-300">|</span>
                        <span className="font-mono text-xs">{partner.slug}</span>
                        {partner.email && (
                          <>
                            <span className="text-gray-300">|</span>
                            <span className="text-xs">{partner.email}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/partner/edit/${partner.slug}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-purple-600 hover:text-purple-800 text-sm font-medium px-3 py-1 rounded-lg hover:bg-purple-100"
                      >
                        Upraviť
                      </Link>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
