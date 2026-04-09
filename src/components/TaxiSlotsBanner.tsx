'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Star, ChevronDown, ChevronUp, Crown, Shield } from 'lucide-react';

interface TaxiSlotsBannerProps {
  cityName: string;
  locationText: string; // "v meste" alebo "v obci"
  leaderCount: number; // aktuálny počet leaderov (0-1)
  partnerCount: number; // aktuálny počet partnerov (0-2)
}

const MAX_LEADER_SLOTS = 1;
const MAX_PARTNER_SLOTS = 2;

export function TaxiSlotsBanner({ cityName, locationText, leaderCount, partnerCount }: TaxiSlotsBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const leaderAvailable = leaderCount < MAX_LEADER_SLOTS;
  const partnerAvailable = partnerCount < MAX_PARTNER_SLOTS;
  const leaderSlotsLeft = MAX_LEADER_SLOTS - leaderCount;
  const partnerSlotsLeft = MAX_PARTNER_SLOTS - partnerCount;

  const allSlotsTaken = !leaderAvailable && !partnerAvailable;

  const getStatusConfig = () => {
    if (leaderAvailable) {
      return {
        bgColor: 'bg-purple-50 border-purple-200',
        textColor: 'text-purple-800',
        icon: <Crown className="h-5 w-5 text-purple-600" />,
        title: `Staňte sa Leader taxislužbou ${locationText} ${cityName}!`,
        subtitle: `Exkluzívna pozícia #1 je voľná${partnerAvailable ? ` + ${partnerSlotsLeft}× Partner slot${partnerSlotsLeft > 1 ? 'y' : ''}` : ''}`,
        badge: 'Leader voľný',
        badgeStyle: 'bg-purple-100 text-purple-700',
        ctaText: 'Získať pozíciu #1',
        ctaHref: '/pre-taxiky#pricing',
        ctaStyle: 'bg-purple-600 hover:bg-purple-700 text-white',
      };
    }

    if (partnerAvailable) {
      return {
        bgColor: 'bg-emerald-50 border-emerald-200',
        textColor: 'text-emerald-800',
        icon: <Shield className="h-5 w-5 text-emerald-600" />,
        title: `Staňte sa Partnerom ${locationText} ${cityName}!`,
        subtitle: `Zostáva ${partnerSlotsLeft} Partner slot${partnerSlotsLeft > 1 ? 'y' : ''}`,
        badge: `${partnerSlotsLeft} Partner voľn${partnerSlotsLeft > 1 ? 'é' : 'ý'}`,
        badgeStyle: 'bg-emerald-100 text-emerald-700',
        ctaText: 'Aktivovať teraz',
        ctaHref: '/pre-taxiky#pricing',
        ctaStyle: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      };
    }

    return {
      bgColor: 'bg-gray-50 border-gray-200',
      textColor: 'text-gray-700',
      icon: <Shield className="h-5 w-5 text-gray-500" />,
      title: `Exkluzívne pozície ${locationText} ${cityName} sú obsadené`,
      subtitle: `Leader: ${leaderCount}/${MAX_LEADER_SLOTS} \u2022 Partner: ${partnerCount}/${MAX_PARTNER_SLOTS}`,
      badge: null,
      badgeStyle: '',
      ctaText: 'Kontaktujte nás',
      ctaHref: '/kontakt',
      ctaStyle: 'bg-gray-800 hover:bg-gray-900 text-white',
    };
  };

  const config = getStatusConfig();

  const CollapsedHeader = () => (
    <button
      onClick={() => setIsExpanded(!isExpanded)}
      className={`w-full border rounded-xl p-2 md:p-4 shadow-sm hover:shadow-md transition-all flex items-center justify-between group ${config.bgColor}`}
    >
      <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
        <span className="hidden md:block">{config.icon}</span>
        <span className={`font-bold text-sm md:text-base truncate ${config.textColor}`}>
          Ste taxislužba {locationText} {cityName}?
        </span>
        {config.badge && (
          <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${config.badgeStyle}`}>
            {config.badge}
          </span>
        )}
      </div>
      <span className="flex items-center gap-1 md:gap-2 text-gray-500 group-hover:text-gray-700 ml-2 flex-shrink-0">
        <span className="text-sm hidden md:inline">{isExpanded ? 'Zavrieť' : 'Zobraziť viac'}</span>
        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </span>
    </button>
  );

  const ExpandedContent = () => (
    <div className={`border rounded-2xl p-6 shadow-lg ${config.bgColor}`}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white rounded-xl shadow-sm">
            {config.icon}
          </div>
          <div>
            <h3 className={`font-bold text-lg ${config.textColor}`}>
              {config.title}
            </h3>
            <p className={`text-sm mt-1 ${config.textColor} opacity-80`}>
              {config.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={config.ctaHref}
            className={`inline-flex items-center gap-2 font-bold px-5 py-2.5 rounded-xl transition-colors text-sm shadow-md ${config.ctaStyle}`}
          >
            <Star className="h-4 w-4" />
            {config.ctaText}
          </Link>
          {!allSlotsTaken && (
            <a
              href="/images/taxi-partner-preview.png"
              target="_blank"
              rel="noopener noreferrer"
              className="relative block w-14 h-14 rounded-lg overflow-hidden border-2 border-purple-400 hover:border-purple-600 transition-all shadow-md hover:shadow-lg hover:scale-110 transform rotate-2 hover:rotate-0"
            >
              <img
                src="/images/taxi-partner-preview.png"
                alt="Ukážka partnerskej stránky"
                className="w-full h-full object-cover"
              />
            </a>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <section className="py-2 md:py-4 px-4 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto max-w-4xl">
        <CollapsedHeader />

        {isExpanded && (
          <div className="mt-4 animate-in slide-in-from-top-2 duration-200">
            <ExpandedContent />
          </div>
        )}
      </div>
    </section>
  );
}
