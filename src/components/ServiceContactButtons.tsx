'use client';

import { Phone, Globe } from 'lucide-react';

interface ServiceContactButtonsProps {
  phone?: string;
  website?: string;
  serviceName: string;
  cityName: string;
  variant?: 'hero' | 'cta';
}

export function ServiceContactButtons({
  phone,
  website,
  serviceName,
  cityName,
  variant = 'hero'
}: ServiceContactButtonsProps) {
  const handlePhoneClick = () => {
    // GA4 Click-to-Call tracking
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'click_to_call', {
        event_category: 'engagement',
        event_label: `${serviceName} - ${cityName}`,
        phone_number: phone || '',
        service_name: serviceName,
        city_name: cityName
      });
    }
  };

  if (variant === 'cta') {
    return phone ? (
      <a
        href={`tel:${phone}`}
        onClick={handlePhoneClick}
        className="inline-flex items-center gap-3 bg-purple-900 text-white font-black text-2xl px-8 py-4 rounded-xl hover:bg-purple-800 transition-all"
      >
        <Phone className="h-7 w-7" />
        {phone}
      </a>
    ) : null;
  }

  return (
    <div className="flex flex-wrap justify-center gap-4">
      {phone && (
        <a
          href={`tel:${phone}`}
          onClick={handlePhoneClick}
          className="inline-flex items-center gap-3 bg-yellow-400 hover:bg-yellow-300 text-purple-900 font-black text-xl md:text-2xl px-8 py-4 rounded-xl transition-colors"
        >
          <Phone className="h-6 w-6" />
          {phone}
        </a>
      )}
      {website && (
        <a
          href={website.startsWith('http') ? website : `https://${website}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-bold px-6 py-4 rounded-xl transition-all"
        >
          <Globe className="h-5 w-5" />
          Navštíviť web
        </a>
      )}
    </div>
  );
}
