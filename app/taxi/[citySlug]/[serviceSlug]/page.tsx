/**
 * Taxi Service Page - Next.js App Router Nested Dynamic Route
 *
 * Migrované z: src/vite-pages/TaxiServicePage.tsx
 *
 * Zmeny oproti Vite verzii:
 * - useParams → params prop
 * - Navigate → notFound()
 * - SEOHead → generateMetadata
 * - Link z react-router → next/link
 * - useEffect na scroll odstránený (template.tsx)
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { GeometricLines } from '@/components/GeometricLines';
import { SEOBreadcrumbs } from '@/components/SEOBreadcrumbs';
import { TaxiServiceSchema } from '@/components/schema/TaxiServiceSchema';
import { MapPin, Phone, Globe, ArrowLeft, Crown } from 'lucide-react';
import { getCityBySlug, createRegionSlug, slovakCities, type CityData, type TaxiService } from '@/data/cities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { truncateUrl } from '@/utils/urlUtils';
import { SEO_CONSTANTS } from '@/lib/seo-constants';
import { generateUniqueServiceContent, generateUniqueMetaDescription } from '@/utils/contentVariations';

// Generate static params for all taxi services at build time
export function generateStaticParams() {
  const params: { citySlug: string; serviceSlug: string }[] = [];
  
  slovakCities.forEach((city) => {
    city.taxiServices.forEach((service) => {
      const serviceSlug = service.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      params.push({
        citySlug: city.slug,
        serviceSlug,
      });
    });
  });
  
  return params;
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ citySlug: string; serviceSlug: string }>;
}): Promise<Metadata> {
  const { citySlug, serviceSlug } = await params;
  const city = getCityBySlug(citySlug);

  // Find the taxi service by matching the slug
  const service = city?.taxiServices.find((s) => {
    const slug = s.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    return slug === serviceSlug;
  });

  if (!city || !service) {
    return {
      title: 'Taxislužba nenájdená',
      description: 'Stránka taxislužby nebola nájdená',
    };
  }

  const siteName = 'Taxi NearMe';
  const baseUrl = 'https://www.taxinearme.sk';
  const currentUrl = `${baseUrl}/taxi/${citySlug}/${serviceSlug}`;
  // Generovanie unikátnej meta description pre každú službu
  const description = generateUniqueMetaDescription(service.name, city.name, service.phone || '');

  return {
    title: `${service.name} - Taxi ${city.name} | ${siteName}`,
    description,
    keywords: [
      service.name,
      `taxi ${city.name}`,
      `taxislužba ${city.name}`,
      `${service.name} ${city.name}`,
      `taxi ${city.name} telefón`,
      `objednať taxi ${city.name}`,
    ],
    openGraph: {
      title: `${service.name} - Taxi ${city.name}`,
      description,
      type: 'website',
      locale: 'sk_SK',
      url: currentUrl,
      siteName,
      images: [
        {
          url: `${baseUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: `${service.name} - Taxi ${city.name}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: SEO_CONSTANTS.twitterSite,
      title: `${service.name} - Taxi ${city.name}`,
      description,
      images: [`${baseUrl}/og-image.png`],
    },
    alternates: {
      canonical: currentUrl,
      languages: {
        'sk': currentUrl,
        'x-default': currentUrl,
      },
    },
  };
}

export default async function TaxiServicePage({
  params,
}: {
  params: Promise<{ citySlug: string; serviceSlug: string }>;
}) {
  const { citySlug, serviceSlug } = await params;
  const city = getCityBySlug(citySlug);

  // Find the taxi service by matching the slug
  const service = city?.taxiServices.find((s) => {
    const slug = s.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    return slug === serviceSlug;
  });

  // 404 handling - Next.js way
  if (!city || !service) {
    notFound();
  }

  const regionSlug = createRegionSlug(city.region);

  // Generovanie unikátneho obsahu pre každú taxislužbu
  const content = generateUniqueServiceContent({
    serviceName: service.name,
    cityName: city.name,
    regionName: city.region,
    phone: service.phone,
  });

  return (
    <>
      <div className="min-h-screen bg-white">
        {/* TaxiService Schema for SEO */}
        <TaxiServiceSchema
          service={service}
          city={city}
          citySlug={citySlug}
          serviceSlug={serviceSlug}
        />

        <Header />

      {/* Breadcrumbs */}
      <SEOBreadcrumbs
        items={[
          { label: city.region, href: `/kraj/${regionSlug}` },
          { label: city.name, href: `/taxi/${citySlug}` },
          { label: service.name },
        ]}
      />

      {/* Taxi Service Detail Section */}
      <section className="pt-4 md:pt-6 pb-8 md:pb-12 px-4 md:px-8 relative bg-white">
        <GeometricLines variant="subtle" count={6} />

        <div className="container mx-auto max-w-4xl relative z-10">
          {/* Back Button */}
          <Link
            href={`/taxi/${citySlug}`}
            className="inline-flex items-center gap-2 text-foreground hover:text-foreground/70 transition-colors font-bold mb-6"
            title={`Späť na zoznam taxislužieb v meste ${city.name}`}
          >
            <ArrowLeft className="h-4 w-4" />
            Späť na zoznam taxislužieb v meste {city.name}
          </Link>

          {/* Hero Box with Yellow/Purple Gradient */}
          <div className={`text-center mb-8 md:mb-12 rounded-xl md:rounded-2xl overflow-hidden relative p-6 md:p-10 lg:p-12 ${service.isPremium ? 'ring-4 ring-yellow-400' : ''}`}>
            <div
              className="absolute inset-0"
              style={{
                background: service.isPremium
                  ? 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)'
                  : undefined
              }}
            />
            {!service.isPremium && <div className="absolute inset-0 hero-3d-bg" />}

            {service.isPremium && (
              <>
                {/* Premium Badge */}
                <div className="absolute top-4 right-4 bg-yellow-400 text-purple-900 text-xs md:text-sm font-black px-3 py-1 rounded-full z-20">
                  PREMIUM
                </div>
                {/* Golden Crowns */}
                <Crown className="absolute left-4 top-1/2 -translate-y-1/2 h-8 w-8 md:h-12 md:w-12 text-yellow-400 opacity-80 z-10" />
                <Crown className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 md:h-12 md:w-12 text-yellow-400 opacity-80 z-10" />
              </>
            )}

            <div className="relative z-10">
              <h1 className={`text-4xl md:text-5xl font-extrabold mb-4 drop-shadow-md ${service.isPremium ? 'text-white' : 'text-foreground'}`}>
                {service.name}
              </h1>
              <p className={`text-xl font-semibold ${service.isPremium ? 'text-white/95' : 'text-foreground/90'}`}>
                Taxislužba v meste {city.name}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Information Section */}
      <section className="py-12 md:py-16 px-4 md:px-8 relative bg-white">
        <div className="container mx-auto max-w-4xl relative z-10">

          <Card className={`perspective-1000 mb-8 ${service.isPremium ? 'ring-2 ring-yellow-400' : ''}`}>
            <div
              className="card-3d shadow-3d-lg relative"
              style={{
                background: service.isPremium
                  ? 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)'
                  : undefined
              }}
            >
              {service.isPremium && (
                <>
                  <Crown className="absolute left-2 top-1/2 -translate-y-1/2 h-6 w-6 text-yellow-400 opacity-60" />
                  <Crown className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 text-yellow-400 opacity-60" />
                </>
              )}
              <CardHeader>
                <CardTitle className={`text-2xl font-bold flex items-center gap-3 ${service.isPremium ? 'text-white' : ''}`}>
                  <MapPin className={`h-6 w-6 ${service.isPremium ? 'text-yellow-300' : 'text-success'}`} />
                  Kontaktné informácie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  {service.phone && (
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${service.isPremium ? 'bg-yellow-400' : 'bg-primary-yellow-light'}`}>
                        <Phone className={`h-5 w-5 mt-0 ${service.isPremium ? 'text-purple-900' : 'text-primary-yellow-dark'}`} />
                      </div>
                      <div>
                        <p className={`text-sm font-medium mb-1 ${service.isPremium ? 'text-white/80' : 'text-neutral-text'}`}>
                          Telefónne číslo
                        </p>
                        <a
                          href={`tel:${service.phone}`}
                          className={`text-lg transition-colors font-bold ${service.isPremium ? 'text-white hover:text-white/80' : 'text-foreground hover:text-foreground/70'}`}
                          title={`Zavolať ${service.name}`}
                        >
                          {service.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  {service.website && (
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${service.isPremium ? 'bg-yellow-400' : 'bg-info-light'}`}>
                        <Globe className={`h-5 w-5 mt-0 ${service.isPremium ? 'text-purple-900' : 'text-info'}`} />
                      </div>
                      <div>
                        <p className={`text-sm font-medium mb-1 ${service.isPremium ? 'text-white/80' : 'text-neutral-text'}`}>
                          Webová stránka
                        </p>
                        <a
                          href={
                            service.website.startsWith('http')
                              ? service.website
                              : `https://${service.website}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`text-lg transition-colors font-bold ${service.isPremium ? 'text-white hover:text-white/80' : 'text-foreground hover:text-foreground/70'}`}
                          title={`Navštíviť webovú stránku ${service.name}`}
                        >
                          {truncateUrl(service.website)}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </div>
          </Card>

          {/* SEO Content Section */}
          <div className="mt-8 prose prose-sm md:prose-base max-w-none">
            <h2 className="text-2xl md:text-3xl font-black mb-4 text-foreground">
              O taxislužbe {service.name} v meste {city.name}
            </h2>
            <p className="text-foreground/80 mb-4 leading-relaxed">
              {content.intro}
            </p>

            <p className="text-foreground/80 mb-4 leading-relaxed">
              {content.disclaimer}
            </p>

            <h3 className="text-xl md:text-2xl font-black mb-3 text-foreground mt-6">
              Prečo môže byť {service.name} vhodnou voľbou?
            </h3>
            <p className="text-foreground/80 mb-4 leading-relaxed">
              {content.benefits}
            </p>

            {service.phone && content.ordering && (
              <>
                <h3 className="text-xl md:text-2xl font-black mb-3 text-foreground mt-6">
                  Ako objednať taxi v meste {city.name}?
                </h3>
                <p className="text-foreground/80 mb-4 leading-relaxed">
                  {content.ordering.split(service.phone).map((part, index, arr) => {
                    if (index === arr.length - 1) return part;
                    return (
                      <span key={index}>
                        {part}
                        <a
                          href={`tel:${service.phone}`}
                          className="font-bold text-foreground hover:text-foreground/70 transition-colors underline"
                        >
                          {service.phone}
                        </a>
                      </span>
                    );
                  })}
                </p>
              </>
            )}

            <p className="text-foreground/80 mb-4 leading-relaxed">
              {content.conclusion}
            </p>
          </div>

          {/* Other Services in City */}
          {city.taxiServices.length > 1 && (
            <div className="mt-12">
              <h2 className="text-2xl font-black mb-6 text-foreground">
                Ďalšie taxislužby v meste {city.name}
              </h2>
              <div className="grid gap-3">
                {[...city.taxiServices]
                  .sort((a, b) => a.name.localeCompare(b.name, 'sk'))
                  .filter((s) => s.name !== service.name)
                  .slice(0, 5)
                  .map((otherService, index) => {
                    const otherSlug = otherService.name
                      .toLowerCase()
                      .normalize('NFD')
                      .replace(/[\u0300-\u036f]/g, '')
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/(^-|-$)/g, '');
                    return (
                      <Card key={index} className="perspective-1000">
                        <Link href={`/taxi/${citySlug}/${otherSlug}`}>
                          <div className="card-3d shadow-3d-sm hover:shadow-3d-md transition-all p-4">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-foreground flex-shrink-0" />
                              <span className="font-bold text-foreground">
                                {otherService.name}
                              </span>
                            </div>
                          </div>
                        </Link>
                      </Card>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer with 3D Border */}
      <footer className="border-t-4 border-foreground py-12 px-8 relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-foreground/20 to-transparent"></div>

        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-foreground font-bold">
              © 2024 Taxi NearMe. Všetky práva vyhradené.
            </div>

            <div className="flex gap-8">
              <Link
                href="/ochrana-sukromia"
                className="text-sm text-foreground font-bold hover:text-foreground/70 transition-colors hover:scale-105 transform duration-200"
              >
                Ochrana súkromia
              </Link>
              <Link
                href="/podmienky-pouzivania"
                className="text-sm text-foreground font-bold hover:text-foreground/70 transition-colors hover:scale-105 transform duration-200"
              >
                Podmienky používania
              </Link>
              <Link
                href="/"
                className="text-sm text-foreground font-bold hover:text-foreground/70 transition-colors hover:scale-105 transform duration-200"
              >
                Kontakt
              </Link>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </>
  );
}
