/**
 * City Page - Next.js App Router Dynamic Route
 *
 * Migrované z: src/vite-pages/CityPage.tsx
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
import { HowItWorks } from '@/components/HowItWorks';
import { GeometricLines } from '@/components/GeometricLines';
import { CityFAQ } from '@/components/CityFAQ';
import { CityContent } from '@/components/CityContent';
import { SEOBreadcrumbs } from '@/components/SEOBreadcrumbs';
import { LocalBusinessSchema } from '@/components/schema/LocalBusinessSchema';
import { MapPin, Phone, Globe, Crown } from 'lucide-react';
import { getCityBySlug, createRegionSlug, slovakCities } from '@/data/cities';
import { getMunicipalityBySlug, findNearestCitiesWithTaxis } from '@/data/municipalities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { truncateUrl } from '@/utils/urlUtils';
import { SEO_CONSTANTS } from '@/lib/seo-constants';
import { RouteMapWrapper } from '@/components/RouteMapWrapper';

// ISR: Revalidate once per week (604800 seconds = 7 days)
export const revalidate = 604800;

// Generate static params for main cities only (SSG)
export function generateStaticParams() {
  return slovakCities.map((city) => ({
    citySlug: city.slug,
  }));
}

// Enable dynamic params for municipalities (ISR)
export const dynamicParams = true;

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ citySlug: string }>;
}): Promise<Metadata> {
  const { citySlug } = await params;
  const city = getCityBySlug(citySlug);

  // If not a main city, check if it's a municipality
  if (!city) {
    const municipality = getMunicipalityBySlug(citySlug);

    if (municipality) {
      const nearestCities = findNearestCitiesWithTaxis(municipality, 1);
      const nearestCity = nearestCities[0];

      const siteName = 'Taxi NearMe';
      const baseUrl = 'https://www.taxinearme.sk';
      const currentUrl = `${baseUrl}/taxi/${citySlug}`;

      const description = `Taxi v obci ${municipality.name} - Najbližšie taxislužby sú v meste ${nearestCity.city.name} (${nearestCity.distance} km). Nájdite spoľahlivé taxi služby v okolí.`;

      return {
        title: `Taxi ${municipality.name} - Taxislužby v okolí | ${siteName}`,
        description,
        keywords: [
          `taxi ${municipality.name}`,
          `taxislužby ${municipality.name}`,
          `taxi ${municipality.district}`,
          `taxi ${municipality.region}`,
          'objednať taxi',
        ],
        openGraph: {
          title: `Taxi ${municipality.name} - Taxislužby v okolí`,
          description,
          type: 'website',
          locale: 'sk_SK',
          url: currentUrl,
          siteName,
        },
        alternates: {
          canonical: currentUrl,
        },
      };
    }

    return {
      title: 'Mesto nenájdené',
      description: 'Stránka mesta nebola nájdená',
    };
  }

  const siteName = 'Taxi NearMe';
  const baseUrl = 'https://www.taxinearme.sk';
  const currentUrl = `${baseUrl}/taxi/${citySlug}`;

  // Vytvoriť zoznam taxislužieb pre description
  const taxiServicesList = city.taxiServices
    .slice(0, 3)
    .map((service) => service.name)
    .join(', ');

  // Skrátený popis pre SEO (max 160 znakov)
  const description =
    city.metaDescription ||
    `Taxi v meste ${city.name} - Kontakty na taxislužby. ${taxiServicesList ? `${taxiServicesList} a ďalšie.` : ''} Nájdite spoľahlivé taxi.`;

  return {
    title: `Taxi ${city.name} - Taxislužby a Kontakty | ${siteName}`,
    description,
    keywords: city.keywords || [
      `taxi ${city.name}`,
      `taxislužby ${city.name}`,
      `taxi ${city.region}`,
      'objednať taxi',
      'taxi online',
    ],
    openGraph: {
      title: `Taxi ${city.name} - Spoľahlivé taxislužby`,
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
          alt: `Taxi ${city.name} - Spoľahlivé taxislužby`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: SEO_CONSTANTS.twitterSite,
      title: `Taxi ${city.name} - Spoľahlivé taxislužby`,
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

/**
 * Render page for municipalities without taxi services
 */
function renderMunicipalityPage(municipality: { name: string; region: string; district: string; latitude: number; longitude: number; slug: string }, citySlug: string) {
  const nearestCities = findNearestCitiesWithTaxis(municipality, 3);
  const regionSlug = createRegionSlug(municipality.region);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Breadcrumbs */}
      <SEOBreadcrumbs
        items={[
          { label: municipality.region, href: `/kraj/${regionSlug}` },
          { label: municipality.name },
        ]}
      />

      {/* Hero Section */}
      <section className="pt-4 md:pt-6 pb-8 md:pb-12 px-4 md:px-8 relative bg-white">
        <GeometricLines variant="subtle" count={6} />

        <div className="container mx-auto max-w-4xl relative z-10">
          <div
            className="text-center mb-8 md:mb-12 rounded-xl md:rounded-2xl overflow-hidden relative p-6 md:p-10 lg:p-12"
          >
            <div className="absolute inset-0 hero-3d-bg" />

            <div className="relative z-10">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold mb-3 md:mb-6 drop-shadow-lg text-foreground">
                Taxi {municipality.name}
              </h1>
              <p className="text-base md:text-xl font-semibold px-4 text-foreground/90">
                Taxislužby v okolí obce {municipality.name}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Route Map Section */}
      {nearestCities.length > 0 && nearestCities[0].city.latitude && nearestCities[0].city.longitude && (
        <section className="py-8 md:py-12 px-4 md:px-8 bg-gradient-to-b from-white to-foreground/5">
          <div className="container mx-auto max-w-4xl">
            <div className="mb-6 text-center">
              <h2 className="text-2xl md:text-3xl font-black mb-3 text-foreground">
                Trasa do najbližšieho mesta
              </h2>
              <p className="text-sm md:text-base text-foreground/70 font-semibold">
                {municipality.name} → {nearestCities[0].city.name} ({nearestCities[0].distance} km)
              </p>
            </div>
            <RouteMapWrapper
              fromLat={municipality.latitude}
              fromLng={municipality.longitude}
              fromName={municipality.name}
              toLat={nearestCities[0].city.latitude}
              toLng={nearestCities[0].city.longitude}
              toName={nearestCities[0].city.name}
              distance={nearestCities[0].distance}
            />
          </div>
        </section>
      )}

      {/* Nearest Taxi Services Section */}
      <section className="py-12 md:py-16 lg:py-20 px-4 md:px-8 relative bg-white">
        <div className="container mx-auto max-w-4xl relative z-10">
          <div className="mb-8 text-center">
            <h2 className="text-2xl md:text-3xl font-black mb-4 text-foreground">
              Najbližšie taxislužby
            </h2>
            <p className="text-base md:text-lg text-foreground/80 font-semibold">
              V obci {municipality.name} momentálne neevidujeme taxislužby. Nižšie nájdete najbližšie dostupné taxi služby z okolitých miest.
            </p>
          </div>

          {/* Render nearest cities with taxis */}
          <div className="space-y-6">
            {nearestCities.map(({ city, distance }) => (
              <Card key={city.slug} className="perspective-1000">
                <div className="card-3d shadow-3d-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl md:text-2xl font-black flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-success" />
                      {city.name} ({distance} km)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm md:text-base text-foreground/70 mb-4">
                      Vzdialenosť: <strong>{distance} km</strong> | Orientačná cena: <strong>cca {Math.ceil(distance * 0.9)}€ - {Math.ceil(distance * 1.1)}€</strong>
                    </p>
                    <div className="grid gap-2">
                      {city.taxiServices.slice(0, 3).map((service, idx) => (
                        <Link key={idx} href={`/taxi/${city.slug}`} className="block">
                          <Card className="hover:shadow-md transition-shadow">
                            <CardContent className="py-2 px-3">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-sm">{service.name}</span>
                                {service.phone && (
                                  <span className="text-xs text-foreground/70">{service.phone}</span>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                    <Link
                      href={`/taxi/${city.slug}`}
                      className="mt-3 inline-block text-sm font-bold text-primary-yellow hover:underline"
                    >
                      Zobraziť všetky taxislužby v meste {city.name} →
                    </Link>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <HowItWorks />

      {/* Footer */}
      <footer className="border-t-4 border-foreground py-8 md:py-12 px-4 md:px-8 relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-foreground/20 to-transparent"></div>

        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
            <div className="text-xs md:text-sm text-foreground font-bold text-center md:text-left">
              © 2024 Taxi NearMe. Všetky práva vyhradené.
            </div>

            <div className="flex flex-wrap justify-center gap-4 md:gap-8">
              <Link
                href="/ochrana-sukromia"
                className="text-xs md:text-sm text-foreground font-bold hover:text-foreground/70 transition-colors hover:scale-105 transform duration-200"
              >
                Ochrana súkromia
              </Link>
              <Link
                href="/podmienky-pouzivania"
                className="text-xs md:text-sm text-foreground font-bold hover:text-foreground/70 transition-colors hover:scale-105 transform duration-200"
              >
                Podmienky používania
              </Link>
              <Link
                href="/"
                className="text-xs md:text-sm text-foreground font-bold hover:text-foreground/70 transition-colors hover:scale-105 transform duration-200"
              >
                Kontakt
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default async function CityPage({ params }: { params: Promise<{ citySlug: string }> }) {
  const { citySlug } = await params;
  const city = getCityBySlug(citySlug);

  // If not a main city, check if it's a municipality
  if (!city) {
    const municipality = getMunicipalityBySlug(citySlug);

    if (municipality) {
      // Render municipality page (obce without taxi services)
      return renderMunicipalityPage(municipality, citySlug);
    }

    // 404 if neither city nor municipality
    notFound();
  }

  const regionSlug = createRegionSlug(city.region);

  return (
    <div className="min-h-screen bg-white">
      {/* LocalBusiness Schema for SEO */}
      <LocalBusinessSchema city={city} />

      <Header />

      {/* Breadcrumbs */}
      <SEOBreadcrumbs
        items={[
          { label: city.region, href: `/kraj/${regionSlug}` },
          { label: city.name },
        ]}
      />

      {/* Hero Section with City Image */}
      <section className="pt-4 md:pt-6 pb-8 md:pb-12 px-4 md:px-8 relative bg-white">
        <GeometricLines variant="subtle" count={6} />

        <div className="container mx-auto max-w-4xl relative z-10">
          <div
            className="text-center mb-8 md:mb-12 rounded-xl md:rounded-2xl overflow-hidden relative p-6 md:p-10 lg:p-12"
            style={{
              backgroundImage: city.heroImage ? `url(${city.heroImage})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Overlay for better text readability */}
            {city.heroImage && (
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
            )}

            {/* Fallback gradient if no image */}
            {!city.heroImage && (
              <div className="absolute inset-0 hero-3d-bg" />
            )}

            <div className="relative z-10">
              <h1 className={`text-3xl md:text-5xl lg:text-6xl font-extrabold mb-3 md:mb-6 drop-shadow-lg ${city.heroImage ? 'text-white' : 'text-foreground'}`}>
                Taxislužby v meste {city.name}
              </h1>
              <p className={`text-base md:text-xl font-semibold px-4 ${city.heroImage ? 'text-white/95' : 'text-foreground/90'}`}>
                Kompletný zoznam dostupných taxislužieb
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Taxi Services Section */}
      <section className="py-12 md:py-16 lg:py-20 px-4 md:px-8 relative bg-white">
        <div className="container mx-auto max-w-4xl relative z-10">

          {city.taxiServices.length > 0 ? (
            <div className="grid gap-2">
              {[...city.taxiServices]
                .sort((a, b) => {
                  // Premium services first
                  if (a.isPremium && !b.isPremium) return -1;
                  if (!a.isPremium && b.isPremium) return 1;
                  // Then alphabetically
                  return a.name.localeCompare(b.name, 'sk');
                })
                .map((service, index) => {
                  // Generate slug for the taxi service
                  const serviceSlug = service.name
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)/g, '');

                  return (
                    <Card key={index} className={`perspective-1000 ${service.isPremium ? 'ring-2 ring-yellow-400' : ''}`}>
                      <Link href={`/taxi/${citySlug}/${serviceSlug}`} title={`${service.name} - Detailné informácie a kontakt`}>
                        <div
                          className="card-3d shadow-3d-sm hover:shadow-3d-md transition-all cursor-pointer relative"
                          style={{
                            background: service.isPremium
                              ? 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)'
                              : 'linear-gradient(135deg, hsl(41, 65%, 95%) 0%, hsl(41, 60%, 97%) 100%)'
                          }}
                        >
                          {service.isPremium && (
                            <>
                              {/* Premium Badge */}
                              <div className="absolute top-2 right-2 bg-yellow-400 text-purple-900 text-[10px] md:text-xs font-black px-2 py-0.5 rounded-full">
                                PREMIUM
                              </div>
                              {/* Golden Crowns */}
                              <Crown className="absolute left-1 top-1/2 -translate-y-1/2 h-5 w-5 md:h-6 md:w-6 text-yellow-400 opacity-80" />
                              <Crown className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 md:h-6 md:w-6 text-yellow-400 opacity-80" />
                            </>
                          )}
                          <CardHeader className="pb-1 pt-3 md:pt-3.5 px-3 md:px-4">
                            <CardTitle className={`text-sm md:text-base font-semibold flex items-center gap-1.5 md:gap-2 ${service.isPremium ? 'text-white' : ''}`}>
                              <MapPin className={`h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0 ${service.isPremium ? 'text-yellow-300' : 'text-success'}`} />
                              {service.name}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0 pb-3 md:pb-3.5 px-3 md:px-4">
                            <div className="flex flex-col gap-1 md:gap-1.5 text-xs md:text-sm">
                              {service.phone && (
                                <div className={`flex items-center gap-1.5 md:gap-2 font-medium ${service.isPremium ? 'text-white' : 'text-foreground'}`}>
                                  <Phone className={`h-3 w-3 md:h-3.5 md:w-3.5 flex-shrink-0 ${service.isPremium ? 'text-yellow-300' : 'text-primary-yellow'}`} />
                                  {service.phone}
                                </div>
                              )}
                              {service.website && (
                                <div className={`flex items-center gap-1.5 md:gap-2 font-medium ${service.isPremium ? 'text-white' : 'text-foreground'}`}>
                                  <Globe className={`h-3 w-3 md:h-3.5 md:w-3.5 flex-shrink-0 ${service.isPremium ? 'text-yellow-300' : 'text-info'}`} />
                                  <span>{truncateUrl(service.website)}</span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </div>
                      </Link>
                    </Card>
                  );
                })}
            </div>
          ) : (
            <Card className="perspective-1000">
              <div className="card-3d shadow-3d-lg">
                <CardContent className="py-8 md:py-12 px-4">
                  <div className="text-center space-y-3 md:space-y-4">
                    <MapPin className="h-12 w-12 md:h-16 md:w-16 text-foreground/50 mx-auto" />
                    <h3 className="text-xl md:text-2xl font-black text-foreground">
                      Zoznam taxislužieb sa pripravuje
                    </h3>
                    <p className="text-sm md:text-base text-foreground/70 font-bold px-4">
                      Čoskoro tu nájdete kompletný prehľad všetkých taxislužieb v meste {city.name}
                    </p>
                  </div>
                </CardContent>
              </div>
            </Card>
          )}
        </div>
      </section>

      {/* City Content Section */}
      <CityContent citySlug={city.slug} cityName={city.name} />

      {/* FAQ Section */}
      <CityFAQ cityName={city.name} citySlug={city.slug} />

      {/* How It Works */}
      <HowItWorks />

      {/* Footer with 3D Border */}
      <footer className="border-t-4 border-foreground py-8 md:py-12 px-4 md:px-8 relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-foreground/20 to-transparent"></div>

        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
            <div className="text-xs md:text-sm text-foreground font-bold text-center md:text-left">
              © 2024 Taxi NearMe. Všetky práva vyhradené.
            </div>

            <div className="flex flex-wrap justify-center gap-4 md:gap-8">
              <Link
                href="/ochrana-sukromia"
                className="text-xs md:text-sm text-foreground font-bold hover:text-foreground/70 transition-colors hover:scale-105 transform duration-200"
              >
                Ochrana súkromia
              </Link>
              <Link
                href="/podmienky-pouzivania"
                className="text-xs md:text-sm text-foreground font-bold hover:text-foreground/70 transition-colors hover:scale-105 transform duration-200"
              >
                Podmienky používania
              </Link>
              <Link
                href="/"
                className="text-xs md:text-sm text-foreground font-bold hover:text-foreground/70 transition-colors hover:scale-105 transform duration-200"
              >
                Kontakt
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
