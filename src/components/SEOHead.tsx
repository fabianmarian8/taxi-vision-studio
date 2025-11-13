import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export interface SEOProps {
  title: string;
  description: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogType?: 'website' | 'article';
  ogImage?: string;
  structuredData?: object;
  noindex?: boolean;
}

export const SEOHead = ({
  title,
  description,
  keywords = [],
  canonicalUrl,
  ogType = 'website',
  ogImage,
  structuredData,
  noindex = false,
}: SEOProps) => {
  const location = useLocation();
  const baseUrl = 'https://taxinearme.sk';
  const fullUrl = canonicalUrl || `${baseUrl}${location.pathname}`;

  useEffect(() => {
    // Nastavenie title
    document.title = title;

    // Helper funkcia na bezpečné nastavenie/aktualizáciu meta tagu
    const setMetaTag = (selector: string, attribute: string, value: string) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        if (selector.includes('property=')) {
          element.setAttribute('property', selector.match(/property="([^"]+)"/)?.[1] || '');
        } else {
          element.setAttribute('name', selector.match(/name="([^"]+)"/)?.[1] || '');
        }
        document.head.appendChild(element);
      }
      element.setAttribute(attribute, value);
    };

    // Základné meta tagy
    setMetaTag('meta[name="description"]', 'content', description);

    if (keywords.length > 0) {
      setMetaTag('meta[name="keywords"]', 'content', keywords.join(', '));
    }

    if (noindex) {
      setMetaTag('meta[name="robots"]', 'content', 'noindex, nofollow');
    } else {
      // Odstránenie noindex meta tagu ak existuje
      const robotsTag = document.querySelector('meta[name="robots"]');
      if (robotsTag) {
        robotsTag.remove();
      }
    }

    // Open Graph tagy
    setMetaTag('meta[property="og:title"]', 'content', title);
    setMetaTag('meta[property="og:description"]', 'content', description);
    setMetaTag('meta[property="og:type"]', 'content', ogType);
    setMetaTag('meta[property="og:url"]', 'content', fullUrl);
    setMetaTag('meta[property="og:locale"]', 'content', 'sk_SK');
    setMetaTag('meta[property="og:site_name"]', 'content', 'Taxi NearMe');

    if (ogImage) {
      setMetaTag('meta[property="og:image"]', 'content', ogImage);
    }

    // Twitter Card tagy
    setMetaTag('meta[name="twitter:card"]', 'content', 'summary_large_image');
    setMetaTag('meta[name="twitter:title"]', 'content', title);
    setMetaTag('meta[name="twitter:description"]', 'content', description);

    if (ogImage) {
      setMetaTag('meta[name="twitter:image"]', 'content', ogImage);
    }

    // Canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', fullUrl);

    // Structured Data (JSON-LD)
    if (structuredData) {
      let scriptElement = document.querySelector('script[type="application/ld+json"]');
      if (!scriptElement) {
        scriptElement = document.createElement('script');
        scriptElement.setAttribute('type', 'application/ld+json');
        document.head.appendChild(scriptElement);
      }
      scriptElement.textContent = JSON.stringify(structuredData);
    }

    // Cleanup - návrat na základné hodnoty pri unmount
    return () => {
      // Zachovanie základných meta tagov z index.html
      document.title = 'Taxi NearMe - Nájdite Taxi v Každom Meste na Slovensku';
    };
  }, [title, description, keywords, fullUrl, ogType, ogImage, structuredData, noindex]);

  // Tento komponent nič nevracia do DOM
  return null;
};

// Helper funkcie pre generovanie SEO dát
export const generateCitySEO = (cityName: string, citySlug: string, region: string, metaDescription: string, keywords: string[]): SEOProps => {
  return {
    title: `Taxi ${cityName} - Taxislužby v Meste ${cityName} | Taxi NearMe`,
    description: metaDescription,
    keywords: keywords,
    canonicalUrl: `https://taxinearme.sk/taxi/${citySlug}`,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: `Taxislužby ${cityName}`,
      description: metaDescription,
      address: {
        '@type': 'PostalAddress',
        addressLocality: cityName,
        addressRegion: region,
        addressCountry: 'SK',
      },
      areaServed: {
        '@type': 'City',
        name: cityName,
      },
      serviceType: 'Taxislužby',
    },
  };
};

export const generateTaxiServiceSEO = (
  serviceName: string,
  cityName: string,
  citySlug: string,
  serviceSlug: string,
  region: string,
  phone?: string,
  website?: string
): SEOProps => {
  const description = `${serviceName} - Spoľahlivá taxislužba v meste ${cityName}. ${phone ? `Telefonický kontakt: ${phone}.` : ''} Rýchla a pohodlná preprava osôb.`;

  return {
    title: `${serviceName} - Taxi ${cityName} | Taxi NearMe`,
    description: description,
    keywords: [
      serviceName,
      `taxi ${cityName}`,
      `taxislužba ${cityName}`,
      `${serviceName} ${cityName}`,
      `taxi ${cityName} telefón`,
      `objednať taxi ${cityName}`,
    ],
    canonicalUrl: `https://taxinearme.sk/taxi/${citySlug}/${serviceSlug}`,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: serviceName,
      description: description,
      address: {
        '@type': 'PostalAddress',
        addressLocality: cityName,
        addressRegion: region,
        addressCountry: 'SK',
      },
      telephone: phone,
      url: website,
      areaServed: {
        '@type': 'City',
        name: cityName,
      },
      serviceType: 'Taxislužby',
    },
  };
};

export const generateRegionSEO = (regionName: string, regionSlug: string, citiesCount: number): SEOProps => {
  const description = `Nájdite spoľahlivé taxislužby v kraji ${regionName}. Prehľad ${citiesCount} miest s dostupnými taxi službami. Rýchlo, jednoducho a vždy nablízku.`;

  return {
    title: `Taxislužby v Kraji ${regionName} | Taxi NearMe`,
    description: description,
    keywords: [
      `taxi ${regionName}`,
      `taxislužby ${regionName}`,
      `taxi služby ${regionName}`,
      `objednať taxi ${regionName}`,
    ],
    canonicalUrl: `https://taxinearme.sk/kraj/${regionSlug}`,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `Taxislužby v kraji ${regionName}`,
      description: description,
      numberOfItems: citiesCount,
    },
  };
};

export const generateHomeSEO = (): SEOProps => {
  return {
    title: 'Taxi NearMe - Nájdite Taxi v Každom Meste na Slovensku',
    description: 'Nájdite spoľahlivé taxislužby v každom meste na Slovensku. Bratislava, Košice, Prešov, Žilina a ďalších miest. Rýchlo, jednoducho a vždy nablízku.',
    keywords: [
      'taxi',
      'taxislužby',
      'taxi slovensko',
      'taxi bratislava',
      'taxi košice',
      'objednať taxi',
      'taxi online',
      'taxislužby slovensko',
      'nájsť taxi',
    ],
    canonicalUrl: 'https://taxinearme.sk/',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Taxi NearMe',
      description: 'Nájdite spoľahlivé taxislužby v každom meste na Slovensku',
      url: 'https://taxinearme.sk',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://taxinearme.sk/?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
  };
};
