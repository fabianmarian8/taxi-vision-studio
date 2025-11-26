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
import { MapPin, Phone, Globe, Crown, ArrowLeft, Star, BadgeCheck, CheckCircle2, ArrowRight, Clock, Award, Car } from 'lucide-react';
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
import { GoogleReviewsSection } from '@/components/GoogleReviewsSection';
import { fetchGoogleReviews } from '@/lib/google-reviews';

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

// Helper to fetch ratings for partner services
async function getPartnerRatings(services: TaxiService[]): Promise<Map<string, { rating: number; count: number }>> {
  const ratings = new Map<string, { rating: number; count: number }>();

  const partnerServices = services.filter(s => s.isPartner && s.partnerData?.googlePlaceId);

  await Promise.all(
    partnerServices.map(async (service) => {
      const placeId = service.partnerData?.googlePlaceId;
      if (placeId) {
        const result = await fetchGoogleReviews(placeId);
        if (result.success && result.data) {
          ratings.set(service.name, {
            rating: result.data.rating,
            count: result.data.user_ratings_total
          });
        }
      }
    })
  );

  return ratings;
}

async function CityPage({ city }: { city: CityData }) {
  const regionSlug = createRegionSlug(city.region);

  // Fetch ratings for partner services
  const partnerRatings = await getPartnerRatings(city.taxiServices);

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

      <section className="py-8 md:py-10 lg:py-14 px-4 md:px-8 relative bg-white">
        <div className="container mx-auto max-w-4xl relative z-10">
          {city.taxiServices.length > 0 ? (
            <div className="grid gap-3">
              {[...city.taxiServices]
                .sort((a, b) => {
                  // Partner first, then Premium, then alphabetically
                  if (a.isPartner && !b.isPartner) return -1;
                  if (!a.isPartner && b.isPartner) return 1;
                  if (a.isPremium && !b.isPremium) return -1;
                  if (!a.isPremium && b.isPremium) return 1;
                  return a.name.localeCompare(b.name, 'sk');
                })
                .map((service, index) => {
                  const serviceSlug = createServiceSlug(service.name);
                  const isPartner = service.isPartner;
                  const isPremium = service.isPremium;

                  // Partner card - fialová, väčšia, s badges
                  if (isPartner) {
                    const ratingData = partnerRatings.get(service.name);
                    return (
                      <Card key={index} className="perspective-1000 ring-2 ring-purple-500 shadow-xl">
                        <Link href={`/taxi/${city.slug}/${serviceSlug}`} title={`${service.name} - Partner taxislužba`}>
                          <div
                            className="card-3d shadow-3d-md hover:shadow-3d-lg transition-all cursor-pointer relative overflow-hidden"
                            style={{
                              background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%)'
                            }}
                          >
                            {/* Decorative elements */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

                            {/* Badges */}
                            <div className="absolute top-3 right-3 flex gap-2">
                              <div className="bg-green-500 text-white text-[10px] md:text-xs font-black px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                                <BadgeCheck className="h-3 w-3" />
                                OVERENÉ
                              </div>
                              <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-purple-900 text-[10px] md:text-xs font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg">
                                <Star className="h-3 w-3" />
                                PARTNER
                              </div>
                            </div>

                            <Crown className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 md:h-10 md:w-10 text-yellow-400/30" />
                            <Crown className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 md:h-10 md:w-10 text-yellow-400/30" />

                            <CardHeader className="pb-2 pt-5 md:pt-6 px-4 md:px-5 relative z-10">
                              <CardTitle className="text-lg md:text-xl font-black flex items-center gap-2 text-white">
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-yellow-400 flex items-center justify-center flex-shrink-0">
                                  <MapPin className="h-4 w-4 md:h-5 md:w-5 text-purple-900" />
                                </div>
                                {/* Google Rating Badge - inline */}
                                {ratingData && (
                                  <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm text-foreground px-1.5 py-0.5 rounded-full shadow-sm mr-1">
                                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                    <span className="font-bold text-xs">{ratingData.rating.toFixed(1)}</span>
                                  </div>
                                )}
                                {service.name}
                              </CardTitle>
                              {service.partnerData?.shortDescription && (
                                <p className="text-white/80 text-sm mt-2 ml-10 md:ml-12">
                                  {service.partnerData.shortDescription}
                                </p>
                              )}
                            </CardHeader>
                            <CardContent className="pt-0 pb-5 md:pb-6 px-4 md:px-5 relative z-10">
                              <div className="flex flex-wrap gap-3 text-sm">
                                {service.phone && (
                                  <div className="flex items-center gap-2 bg-yellow-400 text-purple-900 font-bold rounded-lg px-3 py-2">
                                    <Phone className="h-4 w-4" />
                                    {service.phone}
                                  </div>
                                )}
                                {service.website && (
                                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white font-medium rounded-lg px-3 py-2">
                                    <Globe className="h-4 w-4 text-yellow-300" />
                                    {truncateUrl(service.website)}
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </div>
                        </Link>
                      </Card>
                    );
                  }

                  // Premium card - zlatá
                  if (isPremium) {
                    return (
                      <Card key={index} className="perspective-1000 ring-2 ring-yellow-500 shadow-lg">
                        <Link href={`/taxi/${city.slug}/${serviceSlug}`} title={`${service.name} - Premium taxislužba`}>
                          <div
                            className="card-3d shadow-3d-sm hover:shadow-3d-md transition-all cursor-pointer relative overflow-hidden"
                            style={{
                              background: 'linear-gradient(135deg, #b8860b 0%, #daa520 30%, #ffd700 50%, #daa520 70%, #b8860b 100%)'
                            }}
                          >
                            <div className="absolute top-2 right-2 flex gap-1.5">
                              <div className="bg-green-500 text-white text-[10px] md:text-xs font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                                <BadgeCheck className="h-3 w-3" />
                                OVERENÉ
                              </div>
                              <div className="bg-amber-900 text-yellow-300 text-[10px] md:text-xs font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                                <Crown className="h-3 w-3" />
                                PREMIUM
                              </div>
                            </div>
                            <Crown className="absolute left-1 top-1/2 -translate-y-1/2 h-5 w-5 md:h-6 md:w-6 text-amber-900/40" />
                            <Crown className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 md:h-6 md:w-6 text-amber-900/40" />
                            <CardHeader className="pb-1 pt-3 md:pt-3.5 px-3 md:px-4">
                              <CardTitle className="text-sm md:text-base font-bold flex items-center gap-1.5 md:gap-2 text-black">
                                <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0 text-black" />
                                {service.name}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0 pb-3 md:pb-3.5 px-3 md:px-4">
                              <div className="flex flex-col gap-1 md:gap-1.5 text-xs md:text-sm">
                                {service.phone && (
                                  <div className="flex items-center gap-1.5 md:gap-2 font-bold text-black">
                                    <Phone className="h-3 w-3 md:h-3.5 md:w-3.5 flex-shrink-0 text-black" />
                                    {service.phone}
                                  </div>
                                )}
                                {service.website && (
                                  <div className="flex items-center gap-1.5 md:gap-2 font-medium text-black/80">
                                    <Globe className="h-3 w-3 md:h-3.5 md:w-3.5 flex-shrink-0 text-black" />
                                    <span>{truncateUrl(service.website)}</span>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </div>
                        </Link>
                      </Card>
                    );
                  }

                  // Standard card
                  return (
                    <Card key={index} className="perspective-1000">
                      <Link href={`/taxi/${city.slug}/${serviceSlug}`} title={`${service.name} - Detailné informácie a kontakt`}>
                        <div
                          className="card-3d shadow-3d-sm hover:shadow-3d-md transition-all cursor-pointer"
                          style={{
                            background: 'linear-gradient(135deg, hsl(41, 65%, 95%) 0%, hsl(41, 60%, 97%) 100%)'
                          }}
                        >
                          <CardHeader className="pb-1 pt-3 md:pt-3.5 px-3 md:px-4">
                            <CardTitle className="text-sm md:text-base font-semibold flex items-center gap-1.5 md:gap-2">
                              <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0 text-success" />
                              {service.name}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0 pb-3 md:pb-3.5 px-3 md:px-4">
                            <div className="flex flex-col gap-1 md:gap-1.5 text-xs md:text-sm">
                              {service.phone && (
                                <div className="flex items-center gap-1.5 md:gap-2 font-medium text-foreground">
                                  <Phone className="h-3 w-3 md:h-3.5 md:w-3.5 flex-shrink-0 text-primary-yellow" />
                                  {service.phone}
                                </div>
                              )}
                              {service.website && (
                                <div className="flex items-center gap-1.5 md:gap-2 font-medium text-foreground">
                                  <Globe className="h-3 w-3 md:h-3.5 md:w-3.5 flex-shrink-0 text-info" />
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

          {/* Partner & Premium info banner */}
          <div className="mt-12 py-10 px-6 rounded-2xl bg-gradient-to-br from-purple-50 via-white to-yellow-50 border border-foreground/10">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-full mb-4">
                <Crown className="h-5 w-5" />
                <span className="font-bold text-sm">Pre profesionálne taxislužby</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-foreground mb-2">
                Ste taxislužba v meste {city.name}?
              </h3>
              <p className="text-base md:text-lg text-foreground/70 font-medium">
                Získajte viac zákazníkov s TaxiNearMe
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Premium Card */}
              <Card className="relative overflow-hidden border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-white hover:border-yellow-500 transition-colors">
                <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-400 to-yellow-500 text-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                  OBĽÚBENÉ
                </div>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                      <Crown className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-black text-foreground">PREMIUM</CardTitle>
                      <p className="text-sm text-foreground/60">Zvýraznenie v zozname</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg text-foreground/40 line-through">5,99€</span>
                      <span className="text-4xl font-black text-foreground">3,99€</span>
                      <span className="text-foreground/60 font-medium"> / mesiac</span>
                    </div>
                    <p className="text-xs text-yellow-600 font-medium mt-1">Pre prvých 100 taxislužieb</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground/80">
                        <strong>Pozícia na vrchu</strong> - vaša taxislužba sa zobrazí pred nezvýraznenými
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground/80">
                        <strong>Zlaté zvýraznenie</strong> - exkluzívny dizajn ktorý púta pozornosť
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground/80">
                        <strong>Badge "OVERENÉ"</strong> - zvýšená dôveryhodnosť u zákazníkov
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground/80">
                        <strong>Väčšie telefónne číslo</strong> - jednoduchšie kontaktovanie
                      </span>
                    </li>
                  </ul>
                  <a
                    href="https://buy.stripe.com/8x26oH7CK8SU5G94NX7Re00"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-foreground font-bold px-6 py-3 rounded-lg transition-all"
                  >
                    Mám záujem o PREMIUM
                    <ArrowRight className="h-5 w-5" />
                  </a>
                  <Link href="/pre-taxiky" className="block text-center text-sm text-yellow-600 hover:text-yellow-700 mt-3 underline underline-offset-2">
                    Viac informácií tu
                  </Link>
                </CardContent>
              </Card>

              {/* Partner Card */}
              <Card className="relative overflow-hidden border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white hover:border-purple-400 transition-colors">
                <div className="absolute top-0 right-0 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  NAJLEPŠIA HODNOTA
                </div>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                      <Star className="h-6 w-6 text-yellow-400" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-black text-foreground">PARTNER</CardTitle>
                      <p className="text-sm text-foreground/60">Personalizovaná stránka + všetko z PREMIUM</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg text-foreground/40 line-through">12,99€</span>
                      <span className="text-4xl font-black text-foreground">8,99€</span>
                      <span className="text-foreground/60 font-medium"> / mesiac</span>
                    </div>
                    <p className="text-xs text-purple-600 font-medium mt-1">Pre prvých 100 taxislužieb</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground/80">
                        <strong>Všetko z PREMIUM</strong> - zvýraznenie, pozícia na vrchu, badge
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground/80">
                        <strong>Personalizovaná stránka</strong> - profesionálna prezentácia
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground/80">
                        <strong>Galéria a cenník</strong> - ukážte vozidlá a služby
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground/80">
                        <strong>Recenzie zákazníkov</strong> - zobrazenie recenzií z vášho GBP
                      </span>
                    </li>
                  </ul>
                  <a
                    href="https://buy.stripe.com/7sYeVd0ai9WYc4x94d7Re01"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-3 rounded-lg transition-all"
                  >
                    Mám záujem o PARTNER
                    <ArrowRight className="h-5 w-5" />
                  </a>
                  <Link href="/pre-taxiky" className="block text-center text-sm text-purple-600 hover:text-purple-700 mt-3 underline underline-offset-2">
                    Viac informácií tu
                  </Link>
                </CardContent>
              </Card>
            </div>

            <p className="text-center text-sm text-foreground/50 mt-6">
              Transparentné ceny, žiadne skryté poplatky. PREMIUM aktivácia do 24 hodín, PARTNER do 48 hodín od dodania podkladov.
            </p>
          </div>
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
  // Check if this municipality is actually a city with taxi services
  const cityWithTaxi = getCityBySlug(municipality.slug);
  const hasTaxiServices = cityWithTaxi && cityWithTaxi.taxiServices.length > 0;

  const nearestCities = hasTaxiServices ? [] : findNearestCitiesWithTaxis(municipality, 3);
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

      {!hasTaxiServices && nearestCities.length > 0 && nearestCities[0].city.latitude && nearestCities[0].city.longitude && (
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

      {!hasTaxiServices && nearestCities.length > 0 && (
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
              {nearestCities.map(({ city, roadDistance, duration }) => (
                <Card key={city.slug} className="perspective-1000">
                  <div className="card-3d shadow-3d-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-xl md:text-2xl font-black flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-success" />
                        {city.name} ({roadDistance} km)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm md:text-base text-foreground/70 mb-4">
                        Vzdialenosť: <strong>{roadDistance} km</strong> ({duration} min) | Orientačná cena: <strong>cca {Math.ceil(2 + roadDistance * 0.85)}€ - {Math.ceil(2 + roadDistance * 1.15)}€</strong>
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
      )}

      {hasTaxiServices && cityWithTaxi && (
        <section className="py-12 md:py-16 lg:py-20 px-4 md:px-8 relative bg-white">
          <div className="container mx-auto max-w-4xl relative z-10">
            <div className="mb-8 text-center">
              <h2 className="text-2xl md:text-3xl font-black mb-4 text-foreground">
                Taxislužby v meste {municipality.name}
              </h2>
            </div>

            <div className="grid gap-2">
              {cityWithTaxi.taxiServices.map((service, index) => (
                <Card key={index} className="perspective-1000">
                  <div className="card-3d shadow-3d-sm hover:shadow-3d-md transition-all">
                    <CardHeader className="pb-1 pt-3 md:pt-3.5 px-3 md:px-4">
                      <CardTitle className="text-sm md:text-base font-semibold flex items-center gap-1.5 md:gap-2">
                        <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0 text-success" />
                        {service.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 pb-3 md:pb-3.5 px-3 md:px-4">
                      <div className="flex flex-col gap-1 md:gap-1.5 text-xs md:text-sm">
                        {service.phone && (
                          <div className="flex items-center gap-1.5 md:gap-2 font-medium text-foreground">
                            <Phone className="h-3 w-3 md:h-3.5 md:w-3.5 flex-shrink-0 text-primary-yellow" />
                            {service.phone}
                          </div>
                        )}
                        {service.website && (
                          <div className="flex items-center gap-1.5 md:gap-2 font-medium text-foreground">
                            <Globe className="h-3 w-3 md:h-3.5 md:w-3.5 flex-shrink-0 text-info" />
                            <span>{truncateUrl(service.website)}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

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

async function ServicePage({ city, service, serviceSlug }: { city: CityData; service: TaxiService; serviceSlug: string }) {
  const regionSlug = createRegionSlug(city.region);
  const content = generateUniqueServiceContent({
    serviceName: service.name,
    cityName: city.name,
    regionName: city.region,
    phone: service.phone,
  });

  const isPartner = service.isPartner;
  const isPremium = service.isPremium;

  // Partner page - full branded page
  if (isPartner) {
    const partnerData = service.partnerData;
    const heroImage = partnerData?.heroImage;

    return (
      <div className="min-h-screen bg-white">
        <TaxiServiceSchema
          service={service}
          city={city}
          citySlug={city.slug}
          serviceSlug={serviceSlug}
        />
        <Header />

        {/* Hero Section - Partner */}
        <section className="pt-0 pb-12 md:pb-16 px-4 md:px-8 relative overflow-hidden min-h-[500px] md:min-h-[600px]">
          {/* Background - Image or Gradient */}
          {heroImage ? (
            <>
              <div
                className="absolute inset-0 bg-no-repeat"
                style={{
                  backgroundImage: `url(${heroImage})`,
                  backgroundPosition: 'center',
                  backgroundSize: 'cover'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800" />
              <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
            </>
          )}
          <Crown className="absolute left-8 top-32 h-16 w-16 text-yellow-400/20 hidden md:block" />
          <Crown className="absolute right-8 bottom-32 h-16 w-16 text-yellow-400/20 hidden md:block" />

          {/* Breadcrumbs inside hero */}
          <div className="relative z-10">
            <SEOBreadcrumbs
              items={[
                { label: city.region, href: `/kraj/${regionSlug}` },
                { label: city.name, href: `/taxi/${city.slug}` },
                { label: service.name },
              ]}
              variant="light"
            />
          </div>

          <div className="container mx-auto max-w-4xl relative z-10">
            <Link
              href={`/taxi/${city.slug}`}
              className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors font-bold mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Späť na zoznam taxislužieb
            </Link>

            <div className="text-center py-8 md:py-12">
              {/* Badges */}
              <div className="flex justify-center gap-2 mb-6">
                <div className="bg-green-500 text-white text-sm font-black px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                  <BadgeCheck className="h-4 w-4" />
                  OVERENÉ
                </div>
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-purple-900 text-sm font-black px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                  <Star className="h-4 w-4" />
                  PARTNER
                </div>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 drop-shadow-lg">
                {service.name}
              </h1>
              <p className="text-xl text-white/90 mb-8">
                Profesionálna taxislužba v meste {city.name}
              </p>

              {/* Contact buttons */}
              <div className="flex flex-wrap justify-center gap-4">
                {service.phone && (
                  <a
                    href={`tel:${service.phone}`}
                    className="inline-flex items-center gap-3 bg-yellow-400 hover:bg-yellow-300 text-purple-900 font-black text-xl md:text-2xl px-8 py-4 rounded-xl transition-all shadow-lg hover:scale-105"
                  >
                    <Phone className="h-6 w-6" />
                    {service.phone}
                  </a>
                )}
                {service.website && (
                  <a
                    href={service.website.startsWith('http') ? service.website : `https://${service.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-bold px-6 py-4 rounded-xl transition-all"
                  >
                    <Globe className="h-5 w-5" />
                    Navštíviť web
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 md:py-16 px-4 md:px-8 bg-white">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl md:text-3xl font-black text-foreground mb-8 text-center">
              Prečo si vybrať {service.name}?
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-purple-50 rounded-xl">
                <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center mx-auto mb-4">
                  <BadgeCheck className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-lg text-foreground mb-2">Overená taxislužba</h3>
                <p className="text-foreground/70">Partner program zaručuje kvalitu a spoľahlivosť služieb.</p>
              </div>
              <div className="text-center p-6 bg-purple-50 rounded-xl">
                <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center mx-auto mb-4">
                  <Phone className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-lg text-foreground mb-2">Rýchly kontakt</h3>
                <p className="text-foreground/70">Jednoduché objednanie taxi telefonicky alebo cez web.</p>
              </div>
              <div className="text-center p-6 bg-purple-50 rounded-xl">
                <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center mx-auto mb-4">
                  <Star className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-lg text-foreground mb-2">Profesionálny prístup</h3>
                <p className="text-foreground/70">Skúsení vodiči a kvalitné vozidlá pre váš komfort.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Google Reviews Section - Dynamic */}
        {partnerData?.googlePlaceId && (
          <GoogleReviewsSection
            placeId={partnerData.googlePlaceId}
            serviceName={service.name}
            googleMapsUrl={partnerData.googleMapsUrl}
          />
        )}

        {/* CTA Section */}
        <section className="py-12 md:py-16 px-4 md:px-8 bg-gradient-to-r from-yellow-400 to-yellow-500">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-2xl md:text-3xl font-black text-purple-900 mb-4">
              Potrebujete taxi v meste {city.name}?
            </h2>
            <p className="text-purple-900/70 mb-6 text-lg">
              Zavolajte nám a odvezieme vás kam potrebujete.
            </p>
            {service.phone && (
              <a
                href={`tel:${service.phone}`}
                className="inline-flex items-center gap-3 bg-purple-900 text-white font-black text-2xl px-8 py-4 rounded-xl hover:bg-purple-800 transition-all shadow-lg"
              >
                <Phone className="h-7 w-7" />
                {service.phone}
              </a>
            )}
          </div>
        </section>

        {/* Other services */}
        {city.taxiServices.length > 1 && (
          <section className="py-12 md:py-16 px-4 md:px-8 bg-foreground/5">
            <div className="container mx-auto max-w-4xl">
              <h2 className="text-2xl font-black mb-6 text-foreground text-center">
                Ďalšie taxislužby v meste {city.name}
              </h2>
              <div className="grid gap-3">
                {[...city.taxiServices]
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
          </section>
        )}

        <Footer />
      </div>
    );
  }

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

          <div className={`text-center mb-8 md:mb-12 rounded-xl md:rounded-2xl overflow-hidden relative p-6 md:p-10 lg:p-12 ${isPremium ? 'ring-4 ring-yellow-500' : ''}`}>
            <div
              className="absolute inset-0"
              style={{
                background: isPremium
                  ? 'linear-gradient(135deg, #b8860b 0%, #daa520 30%, #ffd700 50%, #daa520 70%, #b8860b 100%)'
                  : undefined
              }}
            />
            {!isPremium && <div className="absolute inset-0 hero-3d-bg" />}

            {isPremium && (
              <>
                <div className="absolute top-4 right-4 flex gap-2 z-20">
                  <div className="bg-green-500 text-white text-xs md:text-sm font-black px-3 py-1 rounded-full flex items-center gap-1">
                    <BadgeCheck className="h-4 w-4" />
                    OVERENÉ
                  </div>
                  <div className="bg-amber-900 text-yellow-300 text-xs md:text-sm font-black px-3 py-1 rounded-full flex items-center gap-1">
                    <Crown className="h-4 w-4" />
                    PREMIUM
                  </div>
                </div>
                <Crown className="absolute left-4 top-1/2 -translate-y-1/2 h-8 w-8 md:h-12 md:w-12 text-amber-900/40 z-10" />
                <Crown className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 md:h-12 md:w-12 text-amber-900/40 z-10" />
              </>
            )}

            <div className="relative z-10">
              <h1 className={`text-4xl md:text-5xl font-extrabold mb-4 drop-shadow-none md:drop-shadow-md ${isPremium ? 'text-black' : 'text-foreground'}`}>
                {service.name}
              </h1>
              <p className={`text-xl font-semibold ${isPremium ? 'text-black/80' : 'text-foreground/90'}`}>
                Taxislužba v meste {city.name}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 px-4 md:px-8 relative bg-white">
        <div className="container mx-auto max-w-4xl relative z-10">
          <Card className={`perspective-1000 mb-8 ${isPremium ? 'ring-2 ring-yellow-500' : ''}`}>
            <div
              className="card-3d shadow-3d-lg relative"
              style={{
                background: isPremium
                  ? 'linear-gradient(135deg, #b8860b 0%, #daa520 30%, #ffd700 50%, #daa520 70%, #b8860b 100%)'
                  : undefined
              }}
            >
              {isPremium && (
                <>
                  <Crown className="absolute left-2 top-1/2 -translate-y-1/2 h-6 w-6 text-amber-900/40" />
                  <Crown className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 text-amber-900/40" />
                </>
              )}
              <CardHeader>
                <CardTitle className={`text-2xl font-bold flex items-center gap-3 ${isPremium ? 'text-black' : ''}`}>
                  <MapPin className={`h-6 w-6 ${isPremium ? 'text-black' : 'text-success'}`} />
                  Kontaktné informácie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  {service.phone && (
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${isPremium ? 'bg-amber-900' : 'bg-primary-yellow-light'}`}>
                        <Phone className={`h-5 w-5 mt-0 ${isPremium ? 'text-yellow-300' : 'text-primary-yellow-dark'}`} />
                      </div>
                      <div>
                        <p className={`text-sm font-medium mb-1 ${isPremium ? 'text-black/70' : 'text-neutral-text'}`}>
                          Telefónne číslo
                        </p>
                        <a
                          href={`tel:${service.phone}`}
                          className={`text-lg transition-colors font-bold ${isPremium ? 'text-black hover:text-black/80' : 'text-foreground hover:text-foreground/70'}`}
                          title={`Zavolať ${service.name}`}
                        >
                          {service.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  {service.website && (
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${isPremium ? 'bg-amber-900' : 'bg-info-light'}`}>
                        <Globe className={`h-5 w-5 mt-0 ${isPremium ? 'text-yellow-300' : 'text-info'}`} />
                      </div>
                      <div>
                        <p className={`text-sm font-medium mb-1 ${isPremium ? 'text-black/70' : 'text-neutral-text'}`}>
                          Webová stránka
                        </p>
                        <a
                          href={service.website.startsWith('http') ? service.website : `https://${service.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`text-lg transition-colors font-bold ${isPremium ? 'text-black hover:text-black/80' : 'text-foreground hover:text-foreground/70'}`}
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

            {/* Promo banner for non-Premium/Partner services */}
            {!isPremium && !isPartner && (
              <div className="my-6 p-4 bg-gradient-to-r from-purple-50 to-yellow-50 rounded-xl border border-foreground/10">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-yellow-500 flex items-center justify-center flex-shrink-0">
                      <Star className="h-4 w-4 text-white" />
                    </div>
                    <p className="font-bold text-foreground text-sm">Ste majiteľom? <span className="font-normal text-foreground/70">Získajte lepšiu pozíciu</span></p>
                  </div>
                  <Link
                    href="/pre-taxiky"
                    className="inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all"
                  >
                    Zistiť viac
                    <ArrowLeft className="h-3 w-3 rotate-180" />
                  </Link>
                </div>
              </div>
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
