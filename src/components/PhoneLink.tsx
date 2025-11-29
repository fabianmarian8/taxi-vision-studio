'use client';

import { ReactNode } from 'react';

interface PhoneLinkProps {
  phone: string;
  serviceName: string;
  cityName: string;
  className?: string;
  title?: string;
  children?: ReactNode;
}

export function PhoneLink({
  phone,
  serviceName,
  cityName,
  className = '',
  title,
  children
}: PhoneLinkProps) {
  const handleClick = () => {
    // GA4 Click-to-Call tracking
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'click_to_call', {
        event_category: 'engagement',
        event_label: `${serviceName} - ${cityName}`,
        phone_number: phone,
        service_name: serviceName,
        city_name: cityName
      });
    }
  };

  return (
    <a
      href={`tel:${phone}`}
      className={className}
      title={title}
      onClick={handleClick}
    >
      {children || phone}
    </a>
  );
}
