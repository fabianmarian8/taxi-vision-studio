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
  const baseUrl = 'https://www.taxinearme.sk';
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
export const generateCitySEO = (cityName: string, citySlug: string, region: string, metaDescription: string, keywords: string[], taxiServices?: Array<{name: string, phone?: string, website?: string}>): SEOProps => {
  const regionSlug = region
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-');

  // Create structured data with BreadcrumbList and ItemList
  const structuredData: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@graph': [
      // BreadcrumbList
      {
        '@type': 'BreadcrumbList',
        'itemListElement': [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': 'Domov',
            'item': 'https://www.taxinearme.sk'
          },
          {
            '@type': 'ListItem',
            'position': 2,
            'name': region,
            'item': `https://www.taxinearme.sk/kraj/${regionSlug}`
          },
          {
            '@type': 'ListItem',
            'position': 3,
            'name': cityName
          }
        ]
      },
      // CollectionPage
      {
        '@type': 'CollectionPage',
        'name': `Taxislužby v meste ${cityName}`,
        'description': metaDescription,
        'url': `https://www.taxinearme.sk/taxi/${citySlug}`
      }
    ]
  };

  // Add ItemList if taxi services are provided
  if (taxiServices && taxiServices.length > 0) {
    structuredData['@graph'].push({
      '@type': 'ItemList',
      'name': `Zoznam taxislužieb v meste ${cityName}`,
      'numberOfItems': taxiServices.length,
      'itemListElement': taxiServices.map((service, index) => ({
        '@type': 'LocalBusiness',
        'position': index + 1,
        'name': service.name,
        'telephone': service.phone,
        'url': service.website,
        'address': {
          '@type': 'PostalAddress',
          'addressLocality': cityName,
          'addressRegion': region,
          'addressCountry': 'SK'
        },
        'areaServed': {
          '@type': 'City',
          'name': cityName
        },
        'serviceType': 'Taxislužba'
      }))
    });
  }

  return {
    title: `Taxi ${cityName} - Taxislužby v Meste ${cityName} | Taxi NearMe`,
    description: metaDescription,
    keywords: keywords,
    canonicalUrl: `https://www.taxinearme.sk/taxi/${citySlug}`,
    structuredData: structuredData,
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
    canonicalUrl: `https://www.taxinearme.sk/taxi/${citySlug}/${serviceSlug}`,
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
    canonicalUrl: `https://www.taxinearme.sk/kraj/${regionSlug}`,
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
    canonicalUrl: 'https://www.taxinearme.sk/',
    structuredData: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': 'https://www.taxinearme.sk/#organization',
          name: 'Taxi NearMe',
          url: 'https://www.taxinearme.sk',
          logo: {
            '@type': 'ImageObject',
            url: 'https://www.taxinearme.sk/taxi-nearme-logo.png',
            width: 600,
            height: 600
          },
          description: 'Komplexný portál pre vyhľadávanie taxislužieb na Slovensku',
          foundingDate: '2024',
          slogan: 'Taxi v každom meste - rýchlo, jednoducho a vždy nablízku',
          sameAs: [
            'https://www.facebook.com/taxinearme',
            'https://www.instagram.com/taxinearme'
          ]
        },
        {
          '@type': 'WebSite',
          '@id': 'https://www.taxinearme.sk/#website',
          name: 'Taxi NearMe',
          description: 'Nájdite spoľahlivé taxislužby v každom meste na Slovensku',
          url: 'https://www.taxinearme.sk',
          publisher: {
            '@id': 'https://www.taxinearme.sk/#organization'
          },
          potentialAction: {
            '@type': 'SearchAction',
            target: 'https://www.taxinearme.sk/?q={search_term_string}',
            'query-input': 'required name=search_term_string',
          },
        }
      ]
    },
  };
};

export const generateArticleSEO = (
  title: string,
  description: string,
  slug: string,
  datePublished: string,
  dateModified?: string,
  imageUrl?: string,
  keywords?: string[]
): SEOProps => {
  return {
    title: `${title} | Taxi NearMe`,
    description: description,
    keywords: keywords || [],
    canonicalUrl: `https://www.taxinearme.sk${slug}`,
    ogType: 'article',
    ogImage: imageUrl,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description: description,
      image: imageUrl,
      datePublished: datePublished,
      dateModified: dateModified || datePublished,
      author: {
        '@type': 'Organization',
        name: 'Taxi NearMe',
        url: 'https://www.taxinearme.sk'
      },
      publisher: {
        '@type': 'Organization',
        name: 'Taxi NearMe',
        url: 'https://www.taxinearme.sk',
        logo: {
          '@type': 'ImageObject',
          url: 'https://www.taxinearme.sk/logo.png'
        }
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `https://www.taxinearme.sk${slug}`
      }
    },
  };
};
