/**
 * Catch-all Taxi Route - Handles all /taxi/* URLs
 *
 * URL Patterns:
 * - /taxi/[citySlug]                           → City/Municipality page
 * - /taxi/[citySlug]/[serviceSlug]             → Taxi service detail page
 * - /taxi/[regionSlug]/[districtSlug]          → District page (NEW - hierarchical)
 * - /taxi/[regionSlug]/[districtSlug]/[munSlug] → Hierarchical municipality page (NEW)
 *
 * The catch-all route eliminates Next.js route conflicts by handling all patterns
 * in a single route with intelligent pattern matching.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Header } from '@/components/Header';
import { HowItWorks } from '@/components/HowItWorks';
import { GeometricLines } from '@/components/GeometricLines';
import { CityFAQ } from '@/components/CityFAQ';
import { CityContent } from '@/components/CityContent';
import { SEOBreadcrumbs } from '@/components/SEOBreadcrumbs';
import { LocalBusinessSchema } from '@/components/schema/LocalBusinessSchema';
import { TaxiServiceSchema } from '@/components/schema/TaxiServiceSchema';
import { MapPin, Phone, Globe, Crown, ArrowLeft } from 'lucide-react';
import { getCityBySlug, createRegionSlug, slovakCities, getRegionBySlug, type CityData, type TaxiService } from '@/data/cities';
import { getMunicipalityBySlug, findNearestCitiesWithTaxis, allMunicipalities, type Municipality } from '@/data/municipalities';
import {
  getDistrictBySlugAndRegion,
  getDistrictsByRegionSlug,
  getMunicipalitiesByDistrictSlug,
  getDistrictForMunicipality,
  createDistrictSlug,
  isValidRegionSlug,
  isValidDistrictSlug,
  getAllDistricts,
  type District
} from '@/data/districts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { truncateUrl } from '@/utils/urlUtils';
import { SEO_CONSTANTS } from '@/lib/seo-constants';
import { RouteMapWrapper } from '@/components/RouteMapWrapper';
import { generateUniqueServiceContent, generateUniqueMetaDescription } from '@/utils/contentVariations';

// ISR: Revalidate once per week
export const revalidate = 604800;

// Enable dynamic params for all patterns
export const dynamicParams = true;

// ============================================================================
// ROUTE PATTERN DETECTION
// ============================================================================

type RouteType =
  | { type: 'city'; city: CityData }
  | { type: 'municipality'; municipality: Municipality }
  | { type: 'service'; city: CityData; service: TaxiService; serviceSlug: string }
  | { type: 'district'; district: District; regionSlug: string }
  | { type: 'hierarchical'; municipality: Municipality; district: District; regionSlug: string }
  | { type: 'redirect'; to: string }
  | { type: 'notFound' };

function createServiceSlug(serviceName: string): string {
  return serviceName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function detectRouteType(slugArray: string[]): RouteType {
  if (slugArray.length === 1) {
    // Pattern: /taxi/[slug]
    const slug = slugArray[0];

    // Check if it's a main city with taxi services
    const city = getCityBySlug(slug);
    if (city) {
      return { type: 'city', city };
    }

    // Check if it's a municipality (village without taxi)
    const municipality = getMunicipalityBySlug(slug);
    if (municipality) {
      // For backward compatibility, redirect to hierarchical URL
      const district = getDistrictForMunicipality(municipality);
      if (district) {
        return {
          type: 'redirect',
          to: `/taxi/${district.regionSlug}/${district.slug}/${slug}`
        };
      }
      // Fallback: show municipality page at old URL
      return { type: 'municipality', municipality };
    }

    return { type: 'notFound' };
  }

  if (slugArray.length === 2) {
    // Pattern: /taxi/[first]/[second]
    // Could be: /taxi/citySlug/serviceSlug OR /taxi/regionSlug/districtSlug
    const [first, second] = slugArray;

    // First, check if it's a city + service pattern
    const city = getCityBySlug(first);
    if (city) {
      const service = city.taxiServices.find(s => createServiceSlug(s.name) === second);
      if (service) {
        return { type: 'service', city, service, serviceSlug: second };
      }
    }

    // Then, check if it's a region + district pattern (hierarchical)
    if (isValidRegionSlug(first)) {
      const district = getDistrictBySlugAndRegion(second, first);
      if (district) {
        return { type: 'district', district, regionSlug: first };
      }
    }

    return { type: 'notFound' };
  }

  if (slugArray.length === 3) {
    // Pattern: /taxi/[regionSlug]/[districtSlug]/[municipalitySlug]
    const [regionSlug, districtSlug, munSlug] = slugArray;

    // Validate region and district
    const district = getDistrictBySlugAndRegion(districtSlug, regionSlug);
    if (!district) {
      return { type: 'notFound' };
    }

    // Find municipality - first try by slug
    const municipality = getMunicipalityBySlug(munSlug);
    if (municipality) {
      return { type: 'hierarchical', municipality, district, regionSlug };
    }

    // Also check if it's a main city at this hierarchical URL
    const city = getCityBySlug(munSlug);
    if (city) {
      return { type: 'city', city };
    }

    return { type: 'notFound' };
  }

  return { type: 'notFound' };
}

// ============================================================================
// STATIC PARAMS GENERATION
// ============================================================================

export function generateStaticParams() {
  const params: { slug: string[] }[] = [];

  // 1. Main cities: /taxi/[citySlug]
  slovakCities.forEach(city => {
    params.push({ slug: [city.slug] });

    // 2. Taxi services: /taxi/[citySlug]/[serviceSlug]
    city.taxiServices.forEach(service => {
      params.push({ slug: [city.slug, createServiceSlug(service.name)] });
    });
  });

  // 3. Districts: /taxi/[regionSlug]/[districtSlug]
  const districts = getAllDistricts();
  districts.forEach(district => {
    params.push({ slug: [district.regionSlug, district.slug] });
  });

  // Note: We don't pre-generate all 2897 municipalities - they use ISR

  return params;
}

// ============================================================================
// METADATA GENERATION
// ============================================================================

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const routeType = detectRouteType(slug);
  const baseUrl = 'https://www.taxinearme.sk';
  const siteName = 'Taxi NearMe';

  switch (routeType.type) {
    case 'city': {
      const { city } = routeType;
      const currentUrl = `${baseUrl}/taxi/${city.slug}`;
      const taxiServicesList = city.taxiServices.slice(0, 3).map(s => s.name).join(', ');
      const description = city.metaDescription ||
        `Taxi v meste ${city.name} - Kontakty na taxislužby. ${taxiServicesList ? `${taxiServicesList} a ďalšie.` : ''} Nájdite spoľahlivé taxi.`;

      return {
        title: `Taxi ${city.name} - Taxislužby a Kontakty | ${siteName}`,
        description,
        keywords: city.keywords || [`taxi ${city.name}`, `taxislužby ${city.name}`, `taxi ${city.region}`, 'objednať taxi'],
        openGraph: {
          title: `Taxi ${city.name} - Spoľahlivé taxislužby`,
          description,
          type: 'website',
          locale: 'sk_SK',
          url: currentUrl,
          siteName,
        },
        alternates: { canonical: currentUrl },
      };
    }

    case 'municipality': {
      const { municipality } = routeType;
      const nearestCities = findNearestCitiesWithTaxis(municipality, 1);
      const nearestCity = nearestCities[0];
      const currentUrl = `${baseUrl}/taxi/${municipality.slug}`;
      const description = `Taxi v obci ${municipality.name} - Najbližšie taxislužby sú v meste ${nearestCity?.city.name} (${nearestCity?.distance} km). Nájdite spoľahlivé taxi služby v okolí.`;

      return {
        title: `Taxi ${municipality.name} - Taxislužby v okolí | ${siteName}`,
        description,
        keywords: [`taxi ${municipality.name}`, `taxislužby ${municipality.name}`, `taxi ${municipality.district}`, `taxi ${municipality.region}`],
        openGraph: {
          title: `Taxi ${municipality.name} - Taxislužby v okolí`,
          description,
          type: 'website',
          locale: 'sk_SK',
          url: currentUrl,
          siteName,
        },
        alternates: { canonical: currentUrl },
      };
    }

    case 'service': {
      const { city, service, serviceSlug } = routeType;
      const currentUrl = `${baseUrl}/taxi/${city.slug}/${serviceSlug}`;
      const description = generateUniqueMetaDescription(service.name, city.name, service.phone || '');

      return {
        title: `${service.name} - Taxi ${city.name} | ${siteName}`,
        description,
        keywords: [service.name, `taxi ${city.name}`, `taxislužba ${city.name}`, `${service.name} ${city.name}`],
        openGraph: {
          title: `${service.name} - Taxi ${city.name}`,
          description,
          type: 'website',
          locale: 'sk_SK',
          url: currentUrl,
          siteName,
        },
        alternates: { canonical: currentUrl },
      };
    }

    case 'district': {
      const { district, regionSlug } = routeType;
      const currentUrl = `${baseUrl}/taxi/${regionSlug}/${district.slug}`;
      const description = `Taxi v okrese ${district.name} - Kompletný zoznam ${district.municipalitiesCount} obcí a miest. Nájdite taxislužby v okolí.`;

      return {
        title: `Taxi okres ${district.name} - Všetky obce a mestá | ${siteName}`,
        description,
        keywords: [`taxi ${district.name}`, `taxislužby okres ${district.name}`, `taxi ${district.region}`, 'taxi obce'],
        openGraph: {
          title: `Taxi okres ${district.name} - ${district.municipalitiesCount} obcí`,
          description,
          type: 'website',
          locale: 'sk_SK',
          url: currentUrl,
          siteName,
        },
        alternates: { canonical: currentUrl },
      };
    }

    case 'hierarchical': {
      const { municipality, district, regionSlug } = routeType;
      const nearestCities = findNearestCitiesWithTaxis(municipality, 1);
      const nearestCity = nearestCities[0];
      const currentUrl = `${baseUrl}/taxi/${regionSlug}/${district.slug}/${municipality.slug}`;
      const description = `Taxi v obci ${municipality.name}, okres ${district.name} - Najbližšie taxislužby sú v meste ${nearestCity?.city.name} (${nearestCity?.distance} km).`;

      return {
        title: `Taxi ${municipality.name} - okres ${district.name} | ${siteName}`,
        description,
        keywords: [`taxi ${municipality.name}`, `taxi okres ${district.name}`, `taxislužby ${municipality.name}`, `taxi ${district.region}`],
        openGraph: {
          title: `Taxi ${municipality.name} - okres ${district.name}`,
          description,
          type: 'website',
          locale: 'sk_SK',
          url: currentUrl,
          siteName,
        },
        alternates: { canonical: currentUrl },
      };
    }

    default:
      return {
        title: 'Stránka nenájdená',
        description: 'Požadovaná stránka nebola nájdená',
      };
  }
}

// ============================================================================
// PAGE COMPONENTS
// ============================================================================

function CityPage({ city }: { city: CityData }) {
  const regionSlug = createRegionSlug(city.region);

  return (
    <div className="min-h-screen bg-white">
      <LocalBusinessSchema city={city} />
      <Header />

      <SEOBreadcrumbs
        items={[
          { label: city.region, href: `/kraj/${regionSlug}` },
          { label: city.name },
        ]}
      />

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
            {city.heroImage && (
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
            )}
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

      <section className="py-12 md:py-16 lg:py-20 px-4 md:px-8 relative bg-white">
        <div className="container mx-auto max-w-4xl relative z-10">
          {city.taxiServices.length > 0 ? (
            <div className="grid gap-2">
              {[...city.taxiServices]
                .sort((a, b) => {
                  if (a.isPremium && !b.isPremium) return -1;
                  if (!a.isPremium && b.isPremium) return 1;
                  return a.name.localeCompare(b.name, 'sk');
                })
                .map((service, index) => {
                  const serviceSlug = createServiceSlug(service.name);
                  return (
                    <Card key={index} className={`perspective-1000 ${service.isPremium ? 'ring-2 ring-yellow-400' : ''}`}>
                      <Link href={`/taxi/${city.slug}/${serviceSlug}`} title={`${service.name} - Detailné informácie a kontakt`}>
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
                              <div className="absolute top-2 right-2 bg-yellow-400 text-purple-900 text-[10px] md:text-xs font-black px-2 py-0.5 rounded-full">
                                PREMIUM
                              </div>
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

      <CityContent citySlug={city.slug} cityName={city.name} />
      <CityFAQ cityName={city.name} citySlug={city.slug} />
      <HowItWorks />
      <Footer />
    </div>
  );
}

function MunicipalityPage({ municipality, isHierarchical = false, district }: {
  municipality: Municipality;
  isHierarchical?: boolean;
  district?: District;
}) {
  const nearestCities = findNearestCitiesWithTaxis(municipality, 3);
  const regionSlug = createRegionSlug(municipality.region);
  const actualDistrict = district || getDistrictForMunicipality(municipality);

  const breadcrumbItems = isHierarchical && actualDistrict
    ? [
        { label: municipality.region, href: `/kraj/${regionSlug}` },
        { label: `Okres ${actualDistrict.name}`, href: `/taxi/${regionSlug}/${actualDistrict.slug}` },
        { label: municipality.name },
      ]
    : [
        { label: municipality.region, href: `/kraj/${regionSlug}` },
        { label: municipality.name },
      ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <SEOBreadcrumbs items={breadcrumbItems} />

      <section className="pt-4 md:pt-6 pb-8 md:pb-12 px-4 md:px-8 relative bg-white">
        <GeometricLines variant="subtle" count={6} />
        <div className="container mx-auto max-w-4xl relative z-10">
          <div className="text-center mb-8 md:mb-12 rounded-xl md:rounded-2xl overflow-hidden relative p-6 md:p-10 lg:p-12">
            <div className="absolute inset-0 hero-3d-bg" />
            <div className="relative z-10">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold mb-3 md:mb-6 drop-shadow-lg text-foreground">
                Taxi {municipality.name}
              </h1>
              <p className="text-base md:text-xl font-semibold px-4 text-foreground/90">
                {isHierarchical && actualDistrict
                  ? `Taxislužby v okolí obce ${municipality.name}, okres ${actualDistrict.name}`
                  : `Taxislužby v okolí obce ${municipality.name}`
                }
              </p>
            </div>
          </div>
        </div>
      </section>

      {nearestCities.length > 0 && nearestCities[0].city.latitude && nearestCities[0].city.longitude && (
        <section className="py-8 md:py-12 px-4 md:px-8 bg-gradient-to-b from-white to-foreground/5">
          <div className="container mx-auto max-w-4xl">
            <div className="mb-6 text-center">
              <h2 className="text-2xl md:text-3xl font-black mb-3 text-foreground">
                Trasa do najbližšieho mesta
              </h2>
              <p className="text-sm md:text-base text-foreground/70 font-semibold">
                {municipality.name} → {nearestCities[0].city.name}
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

          <div className="space-y-6">
            {nearestCities.map(({ city, distance }) => (
              <Card key={city.slug} className="perspective-1000">
                <div className="card-3d shadow-3d-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl md:text-2xl font-black flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-success" />
                      {city.name} (~{Math.round(distance * 1.6)} km)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm md:text-base text-foreground/70 mb-4">
                      Vzdialenosť: <strong>~{Math.round(distance * 1.6)} km</strong> | Orientačná cena: <strong>cca {Math.ceil(2 + distance * 1.6 * 0.85)}€ - {Math.ceil(2 + distance * 1.6 * 1.15)}€</strong>
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

      <HowItWorks />
      <Footer />
    </div>
  );
}

function DistrictPage({ district, regionSlug }: { district: District; regionSlug: string }) {
  const municipalities = getMunicipalitiesByDistrictSlug(district.slug);
  const regionName = getRegionBySlug(regionSlug);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <SEOBreadcrumbs
        items={[
          { label: district.region, href: `/kraj/${regionSlug}` },
          { label: `Okres ${district.name}` },
        ]}
      />

      <section className="pt-4 md:pt-6 py-8 md:py-12 lg:py-16 px-4 md:px-8 relative">
        <GeometricLines variant="hero" count={8} />
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-8 md:mb-12 rounded-xl md:rounded-2xl overflow-hidden relative p-6 md:p-10 lg:p-12">
            <div className="absolute inset-0 hero-3d-bg" />
            <div className="relative z-10">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold mb-3 md:mb-6 drop-shadow-lg text-foreground">
                Taxi okres {district.name}
              </h1>
              <p className="text-base md:text-xl font-semibold px-4 text-foreground/90">
                {district.municipalitiesCount} obcí a miest v okrese {district.name}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 md:py-12 px-4 md:px-8">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-2xl md:text-3xl font-black mb-6 text-foreground text-center">
            Všetky obce v okrese {district.name}
          </h2>
          <p className="text-center text-foreground/70 mb-8">
            Kliknite na obec pre zobrazenie najbližších taxislužieb
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3">
            {municipalities.map((municipality) => (
              <Link
                key={municipality.slug}
                href={`/taxi/${regionSlug}/${district.slug}/${municipality.slug}`}
                className="perspective-1000 group"
              >
                <div className="card-3d shadow-3d-sm hover:shadow-3d-md transition-all bg-card rounded-lg p-3 md:p-4 h-full">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0 text-foreground/40 group-hover:text-success transition-colors" />
                    <span className="font-semibold text-sm md:text-base text-foreground truncate">
                      {municipality.name}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 md:py-12 px-4 md:px-8 bg-foreground/5">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-xl md:text-2xl font-black mb-4 text-foreground">
            Hľadáte taxi v okrese {district.name}?
          </h2>
          <p className="text-foreground/80 mb-6">
            Vyberte si obec zo zoznamu vyššie a nájdite najbližšie taxislužby vo vašom okolí.
            Všetky obce v okrese {district.name} sú prepojené s najbližšími mestami, kde nájdete dostupné taxislužby.
          </p>
          <Link
            href={`/kraj/${regionSlug}`}
            className="inline-block bg-primary-yellow text-foreground font-bold px-6 py-3 rounded-lg hover:bg-primary-yellow/90 transition-colors"
          >
            Zobraziť všetky okresy v kraji {district.region}
          </Link>
        </div>
      </section>

      <HowItWorks />
      <Footer />
    </div>
  );
}

function ServicePage({ city, service, serviceSlug }: { city: CityData; service: TaxiService; serviceSlug: string }) {
  const regionSlug = createRegionSlug(city.region);
  const content = generateUniqueServiceContent({
    serviceName: service.name,
    cityName: city.name,
    regionName: city.region,
    phone: service.phone,
  });

  return (
    <div className="min-h-screen bg-white">
      <TaxiServiceSchema
        service={service}
        city={city}
        citySlug={city.slug}
        serviceSlug={serviceSlug}
      />
      <Header />

      <SEOBreadcrumbs
        items={[
          { label: city.region, href: `/kraj/${regionSlug}` },
          { label: city.name, href: `/taxi/${city.slug}` },
          { label: service.name },
        ]}
      />

      <section className="pt-4 md:pt-6 pb-8 md:pb-12 px-4 md:px-8 relative bg-white">
        <GeometricLines variant="subtle" count={6} />
        <div className="container mx-auto max-w-4xl relative z-10">
          <Link
            href={`/taxi/${city.slug}`}
            className="inline-flex items-center gap-2 text-foreground hover:text-foreground/70 transition-colors font-bold mb-6"
            title={`Späť na zoznam taxislužieb v meste ${city.name}`}
          >
            <ArrowLeft className="h-4 w-4" />
            Späť na zoznam taxislužieb v meste {city.name}
          </Link>

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
                <div className="absolute top-4 right-4 bg-yellow-400 text-purple-900 text-xs md:text-sm font-black px-3 py-1 rounded-full z-20">
                  PREMIUM
                </div>
                <Crown className="absolute left-4 top-1/2 -translate-y-1/2 h-8 w-8 md:h-12 md:w-12 text-yellow-400 opacity-80 z-10" />
                <Crown className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 md:h-12 md:w-12 text-yellow-400 opacity-80 z-10" />
              </>
            )}

            <div className="relative z-10">
              <h1 className={`text-4xl md:text-5xl font-extrabold mb-4 drop-shadow-none md:drop-shadow-md ${service.isPremium ? 'text-white' : 'text-foreground'}`}>
                {service.name}
              </h1>
              <p className={`text-xl font-semibold ${service.isPremium ? 'text-white/95' : 'text-foreground/90'}`}>
                Taxislužba v meste {city.name}
              </p>
            </div>
          </div>
        </div>
      </section>

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
                          href={service.website.startsWith('http') ? service.website : `https://${service.website}`}
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

          <div className="mt-8 prose prose-sm md:prose-base max-w-none">
            <h2 className="text-2xl md:text-3xl font-black mb-4 text-foreground">
              O taxislužbe {service.name} v meste {city.name}
            </h2>
            <p className="text-foreground/80 mb-4 leading-relaxed">{content.intro}</p>
            <p className="text-foreground/80 mb-4 leading-relaxed">{content.disclaimer}</p>

            <h3 className="text-xl md:text-2xl font-black mb-3 text-foreground mt-6">
              Prečo môže byť {service.name} vhodnou voľbou?
            </h3>
            <p className="text-foreground/80 mb-4 leading-relaxed">{content.benefits}</p>

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
                        <a href={`tel:${service.phone}`} className="font-bold text-foreground hover:text-foreground/70 transition-colors underline">
                          {service.phone}
                        </a>
                      </span>
                    );
                  })}
                </p>
              </>
            )}

            <p className="text-foreground/80 mb-4 leading-relaxed">{content.conclusion}</p>
          </div>

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
                    const otherSlug = createServiceSlug(otherService.name);
                    return (
                      <Card key={index} className="perspective-1000">
                        <Link href={`/taxi/${city.slug}/${otherSlug}`}>
                          <div className="card-3d shadow-3d-sm hover:shadow-3d-md transition-all p-4">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-foreground flex-shrink-0" />
                              <span className="font-bold text-foreground">{otherService.name}</span>
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

      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t-4 border-foreground py-8 md:py-12 px-4 md:px-8 relative">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-foreground/20 to-transparent"></div>
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
          <div className="text-xs md:text-sm text-foreground font-bold text-center md:text-left">
            © 2024 Taxi NearMe. Všetky práva vyhradené.
          </div>
          <div className="flex flex-wrap justify-center gap-4 md:gap-8">
            <Link href="/ochrana-sukromia" className="text-xs md:text-sm text-foreground font-bold hover:text-foreground/70 transition-colors hover:scale-105 transform duration-200">
              Ochrana súkromia
            </Link>
            <Link href="/podmienky-pouzivania" className="text-xs md:text-sm text-foreground font-bold hover:text-foreground/70 transition-colors hover:scale-105 transform duration-200">
              Podmienky používania
            </Link>
            <Link href="/" className="text-xs md:text-sm text-foreground font-bold hover:text-foreground/70 transition-colors hover:scale-105 transform duration-200">
              Kontakt
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default async function TaxiCatchAllPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const routeType = detectRouteType(slug);

  switch (routeType.type) {
    case 'city':
      return <CityPage city={routeType.city} />;

    case 'municipality':
      return <MunicipalityPage municipality={routeType.municipality} />;

    case 'service':
      return <ServicePage city={routeType.city} service={routeType.service} serviceSlug={routeType.serviceSlug} />;

    case 'district':
      return <DistrictPage district={routeType.district} regionSlug={routeType.regionSlug} />;

    case 'hierarchical':
      return <MunicipalityPage
        municipality={routeType.municipality}
        isHierarchical={true}
        district={routeType.district}
      />;

    case 'redirect':
      redirect(routeType.to);
      // redirect() throws, but we need return for ESLint no-fallthrough rule
      return null;

    case 'notFound':
    default:
      notFound();
  }
}
