import { useEffect } from 'react';
import { type CityData } from '@/data/cities';

interface SEOHeadProps {
  city: CityData;
  pageType?: 'city' | 'service';
  serviceName?: string;
}

export const SEOHead = ({ city, pageType = 'city', serviceName }: SEOHeadProps) => {
  useEffect(() => {
    const taxiCount = city.taxiServices?.length || 0;
    
    // Generate optimized title
    const title = pageType === 'city'
      ? `Taxi ${city.name} - ${taxiCount} Overených Taxislužieb 24/7 | Taxi NearMe`
      : `${serviceName} - Taxi ${city.name} | Taxi NearMe`;
    
    // Generate optimized description
    const description = pageType === 'city'
      ? `Nájdite spoľahlivé taxi v ${city.name}. ${taxiCount} overených taxislužieb s telefónnymi číslami a webmi. ${city.taxiServices?.slice(0, 3).map(s => s.name).join(', ')}. ☎️ Volajte teraz!`
      : `${serviceName} v ${city.name} - Telefónne číslo, web a kontaktné informácie. Objednajte si taxi rýchlo a jednoducho.`;
    
    // Set document title
    document.title = title;
    
    // Update or create meta tags
    updateMetaTag('name', 'description', description);
    updateMetaTag('name', 'keywords', city.keywords.join(', '));
    updateMetaTag('name', 'author', 'Taxi NearMe');
    
    // Open Graph tags
    updateMetaTag('property', 'og:title', title);
    updateMetaTag('property', 'og:description', description);
    updateMetaTag('property', 'og:type', 'website');
    updateMetaTag('property', 'og:url', `https://www.taxinearme.sk/taxi/${city.slug}`);
    updateMetaTag('property', 'og:locale', 'sk_SK');
    updateMetaTag('property', 'og:site_name', 'Taxi NearMe');
    
    // Twitter Card tags
    updateMetaTag('name', 'twitter:card', 'summary_large_image');
    updateMetaTag('name', 'twitter:title', title);
    updateMetaTag('name', 'twitter:description', description);
    
    // Canonical URL
    updateLinkTag('canonical', `https://www.taxinearme.sk/taxi/${city.slug}`);
    
    // Add structured data (Schema.org)
    addStructuredData(city, pageType, serviceName);
    
    // Cleanup function
    return () => {
      // Remove structured data script when component unmounts
      const existingScript = document.getElementById('structured-data');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [city, pageType, serviceName]);
  
  return null; // This component doesn't render anything
};

// Helper function to update or create meta tags
const updateMetaTag = (attribute: string, key: string, content: string) => {
  let element = document.querySelector(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
};

// Helper function to update or create link tags
const updateLinkTag = (rel: string, href: string) => {
  let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  element.href = href;
};

// Helper function to add structured data
const addStructuredData = (city: CityData, pageType: string, serviceName?: string) => {
  // Remove existing structured data
  const existingScript = document.getElementById('structured-data');
  if (existingScript) {
    existingScript.remove();
  }
  
  const structuredData: any = {
    '@context': 'https://schema.org',
    '@graph': []
  };
  
  // BreadcrumbList
  structuredData['@graph'].push({
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
        'name': `Taxi ${city.name}`,
        'item': `https://www.taxinearme.sk/taxi/${city.slug}`
      }
    ]
  });
  
  // CollectionPage for city listing
  if (pageType === 'city') {
    structuredData['@graph'].push({
      '@type': 'CollectionPage',
      'name': `Taxislužby v meste ${city.name}`,
      'description': city.description,
      'url': `https://www.taxinearme.sk/taxi/${city.slug}`,
      'inLanguage': 'sk',
      'isPartOf': {
        '@type': 'WebSite',
        'name': 'Taxi NearMe',
        'url': 'https://www.taxinearme.sk'
      }
    });
    
    // Add LocalBusiness schema for each taxi service
    city.taxiServices?.forEach((service, index) => {
      structuredData['@graph'].push({
        '@type': 'LocalBusiness',
        '@id': `https://www.taxinearme.sk/taxi/${city.slug}#service-${index}`,
        'name': service.name,
        'telephone': service.phone,
        'url': service.website || undefined,
        'address': {
          '@type': 'PostalAddress',
          'addressLocality': city.name,
          'addressCountry': 'SK'
        },
        'geo': city.latitude && city.longitude ? {
          '@type': 'GeoCoordinates',
          'latitude': city.latitude,
          'longitude': city.longitude
        } : undefined,
        'priceRange': '€€',
        'openingHours': '24/7'
      });
    });
  }
  
  // Create and append script tag
  const script = document.createElement('script');
  script.id = 'structured-data';
  script.type = 'application/ld+json';
  script.text = JSON.stringify(structuredData);
  document.head.appendChild(script);
};
