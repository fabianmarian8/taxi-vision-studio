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
import { notFound, permanentRedirect } from 'next/navigation';
import { Header } from '@/components/Header';
import { HowItWorks } from '@/components/HowItWorks';
import { GeometricLines } from '@/components/GeometricLines';
import { CityFAQ } from '@/components/CityFAQ';
import { CityContent } from '@/components/CityContent';
import { SEOBreadcrumbs } from '@/components/SEOBreadcrumbs';
import { LocalBusinessSchema } from '@/components/schema/LocalBusinessSchema';
import { TaxiServiceSchema } from '@/components/schema/TaxiServiceSchema';
import { MapPin, Phone, Globe, Crown, ArrowLeft, Star, BadgeCheck, CheckCircle2, ArrowRight, Clock, Award, Car } from 'lucide-react';
import { getCityBySlug, createRegionSlug, slovakCities, getRegionBySlug, type CityData, type TaxiService, findNearbyCitiesWithTaxis } from '@/data/cities';
import { NearbyCitiesSection } from '@/components/NearbyCitiesSection';
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
import { ServiceContactButtons } from '@/components/ServiceContactButtons';
import { PhoneLink } from '@/components/PhoneLink';

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

    // IMPORTANT: Check if it's a main city with taxi services FIRST
    // If so, redirect to the primary URL to avoid duplicate content
    const cityWithTaxi = getCityBySlug(munSlug);
    if (cityWithTaxi && cityWithTaxi.taxiServices.length > 0) {
      return {
        type: 'redirect',
        to: `/taxi/${cityWithTaxi.slug}`
      };
    }

    // Find municipality (village without taxi in our DB)
    const municipality = getMunicipalityBySlug(munSlug);
    if (municipality) {
      // Also check if this municipality is actually a city with taxi services
      // (in case it exists in both lists)
      const cityCheck = getCityBySlug(municipality.slug);
      if (cityCheck && cityCheck.taxiServices.length > 0) {
        return {
          type: 'redirect',
          to: `/taxi/${cityCheck.slug}`
        };
      }
      return { type: 'hierarchical', municipality, district, regionSlug };
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
  const siteName = 'TaxiNearMe';
  const currentYear = new Date().getFullYear();

  switch (routeType.type) {
    case 'city': {
      const { city } = routeType;
      const currentUrl = `${baseUrl}/taxi/${city.slug}`;
      const taxiCount = city.taxiServices?.length || 0;
      const taxiServicesList = city.taxiServices.slice(0, 3).map(s => s.name).join(', ');
      const locationText = city.isVillage ? 'v obci' : 'v meste';
      const countText = taxiCount > 5 ? `${taxiCount}+` : taxiCount > 0 ? `${taxiCount}` : '';
      const description = countText
        ? `Taxi ${locationText} ${city.name} (${currentYear}) - ${countText} taxislužieb s telefónnymi číslami. ${taxiServicesList ? `${taxiServicesList} a ďalšie.` : ''} Objednajte taxi jednoducho.`
        : `Taxi ${locationText} ${city.name} (${currentYear}) - Kontakty na taxislužby. ${taxiServicesList ? `${taxiServicesList} a ďalšie.` : ''} Objednajte taxi jednoducho.`;

      // Title format: "Taxi Bratislava - 15+ taxislužieb (2025) | TaxiNearMe"
      const titleWithCount = countText
        ? `Taxi ${city.name} - ${countText} taxislužieb (${currentYear}) | ${siteName}`
        : `Taxi ${city.name} - Taxislužby (${currentYear}) | ${siteName}`;

      return {
        title: titleWithCount,
        description,
        keywords: city.keywords || [`taxi ${city.name}`, `taxislužby ${city.name}`, `taxi ${city.region}`, 'objednať taxi'],
        openGraph: {
          title: `Taxi ${city.name} - ${countText ? countText + ' taxislužieb' : 'Spoľahlivé taxislužby'}`,
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
      const description = `Taxi v obci ${municipality.name} (${currentYear}) - Najbližšie taxislužby v meste ${nearestCity?.city.name} (${nearestCity?.distance} km). Objednajte taxi jednoducho.`;

      return {
        title: `Taxi ${municipality.name} - Taxislužby v okolí (${currentYear}) | ${siteName}`,
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
        title: `${service.name} - Taxi ${city.name} (${currentYear}) | ${siteName}`,
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
      const description = `Taxi v okrese ${district.name} (${currentYear}) - Zoznam ${district.municipalitiesCount} obcí a miest s taxislužbami. Objednajte taxi jednoducho.`;

      return {
        title: `Taxi okres ${district.name} - ${district.municipalitiesCount} obcí (${currentYear}) | ${siteName}`,
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
      const description = `Taxi v obci ${municipality.name}, okres ${district.name} (${currentYear}) - Najbližšie taxislužby v meste ${nearestCity?.city.name} (${nearestCity?.distance} km). Objednajte taxi.`;

      return {
        title: `Taxi ${municipality.name} - okres ${district.name} (${currentYear}) | ${siteName}`,
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

// ============================================================================
// UNIVERSAL LIST VIEW - Vylepšený dizajn s úpravami od oponenta
// H1: 28-32px, Riadok: 80px, Logo: 40px s fallback, Akcia podľa typu
// Aplikované na VŠETKY mestá a obce s taxislužbami
// ============================================================================

function createServiceSlugForList(serviceName: string): string {
  return serviceName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function UniversalListView({
  city,
  regionSlug,
  locationText,
  partnerRatings
}: {
  city: CityData;
  regionSlug: string;
  locationText: string;
  partnerRatings: Map<string, { rating: number; count: number }>;
}) {
  // Separate services by tier
  const partners = city.taxiServices.filter(s => s.isPartner);
  const premiums = city.taxiServices.filter(s => s.isPremium && !s.isPartner);
  const standard = city.taxiServices.filter(s => !s.isPremium && !s.isPartner);

  // Shuffle Premium services using deterministic daily seed
  const dailySeed = new Date().toISOString().slice(0, 10);
  const shuffledPremiums = [...premiums].sort((a, b) => {
    const hashA = `${dailySeed}-${a.name}`.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hashB = `${dailySeed}-${b.name}`.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return hashA - hashB;
  });

  // Sort standard alphabetically
  const sortedStandard = [...standard].sort((a, b) => a.name.localeCompare(b.name, 'sk'));

  // Combine: Partners first, then shuffled Premium, then alphabetical standard
  const allServices = [...partners, ...shuffledPremiums, ...sortedStandard];

  // Helper: Určenie primárnej akcie podľa typu služby
  const getPrimaryAction = (service: TaxiService) => {
    // Ak má telefón, primárna akcia je volanie
    if (service.phone) {
      return { type: 'phone' as const, value: service.phone };
    }
    // Ak má len web, primárna akcia je web
    if (service.website) {
      return { type: 'web' as const, value: service.website };
    }
    // Bez kontaktu
    return null;
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <LocalBusinessSchema city={city} />
      <Header />

      <SEOBreadcrumbs
        items={[
          { label: city.region, href: `/kraj/${regionSlug}` },
          { label: city.name },
        ]}
      />

      {/* H1 header - 28-32px podľa oponenta */}
      <section className="pt-4 pb-3 px-4 bg-white border-b border-gray-100">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-[28px] md:text-[32px] font-black text-foreground leading-tight">
            Taxi {city.name}
          </h1>
          <p className="text-sm text-foreground/60 mt-1">
            {city.taxiServices.length} taxislužieb • {city.region}
          </p>
        </div>
      </section>

      {/* Kompaktný List View - 80px riadky podľa oponenta */}
      <section className="py-2 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="divide-y divide-gray-100">
            {allServices.map((service, index) => {
              const serviceSlug = createServiceSlug(service.name);
              const isPartner = service.isPartner;
              const isPremium = service.isPremium;
              const ratingData = partnerRatings.get(service.name);
              const primaryAction = getPrimaryAction(service);

              // Získaj iniciály pre fallback logo (40x40px podľa oponenta)
              const initials = service.name
                .split(' ')
                .filter(word => word.length > 0)
                .slice(0, 2)
                .map(word => word.charAt(0).toUpperCase())
                .join('');

              // Typ služby pre vizuálne odlíšenie
              const serviceType = isPartner ? 'partner' : isPremium ? 'premium' : 'standard';

              return (
                <div
                  key={index}
                  className={`py-3 px-3 transition-colors ${
                    isPartner
                      ? 'bg-purple-50 hover:bg-purple-100'
                      : isPremium
                      ? 'bg-amber-50 hover:bg-amber-100'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Hlavný riadok - logo, názov, akcia */}
                  <div className="flex items-center gap-3" style={{ minHeight: '56px' }}>
                  {/* Logo/Iniciály - 40x40px s fallback podľa oponenta */}
                  <Link href={`/taxi/${city.slug}/${serviceSlug}`} className="flex-shrink-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-transform hover:scale-105 ${
                        isPartner
                          ? 'bg-purple-600 text-white ring-2 ring-purple-300'
                          : isPremium
                          ? 'bg-amber-500 text-white ring-2 ring-amber-300'
                          : 'bg-gray-100 text-gray-700 ring-1 ring-gray-200'
                      }`}
                    >
                      {initials || '?'}
                    </div>
                  </Link>

                  {/* Stredná časť - Názov + info (hierarchia textu podľa oponenta) */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/taxi/${city.slug}/${serviceSlug}`}
                      className="block group"
                    >
                      {/* Názov - tučne, väčší */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-foreground text-base group-hover:text-foreground/80 transition-colors line-clamp-1">
                          {service.name}
                        </span>
                      </div>

                      {/* Sekundárne info - menšie, šedé */}
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {/* Badge */}
                        {isPartner && (
                          <span className="text-[10px] bg-purple-600 text-white px-1.5 py-0.5 rounded font-bold">
                            PARTNER
                          </span>
                        )}
                        {isPremium && !isPartner && (
                          <span className="text-[10px] bg-amber-600 text-white px-1.5 py-0.5 rounded font-bold">
                            PREMIUM
                          </span>
                        )}

                        {/* Rating - malé, len pre ne-partnerov (partneri majú veľký baner) */}
                        {ratingData && !isPartner && (
                          <span className="flex items-center gap-0.5 text-xs text-foreground/60">
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            {ratingData.rating.toFixed(1)}
                            <span className="text-foreground/40">({ratingData.count})</span>
                          </span>
                        )}

                        {/* Web indicator */}
                        {service.website && (
                          <span className="flex items-center gap-0.5 text-xs text-foreground/40">
                            <Globe className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                    </Link>
                  </div>

                  {/* Pravá strana - Primárna akcia podľa typu (oponent) */}
                  {primaryAction && (
                    primaryAction.type === 'phone' ? (
                      <a
                        href={`tel:${primaryAction.value.replace(/\s/g, '')}`}
                        className={`flex-shrink-0 flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                          isPartner
                            ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm shadow-purple-200'
                            : isPremium
                            ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-200'
                            : 'bg-green-600 hover:bg-green-700 text-white shadow-sm shadow-green-200'
                        }`}
                        title={`Zavolať ${service.name}`}
                        style={{ minWidth: '100px' }}
                      >
                        <Phone className="h-4 w-4" />
                        <span>VOLAŤ</span>
                      </a>
                    ) : (
                      <a
                        href={primaryAction.value.startsWith('http') ? primaryAction.value : `https://${primaryAction.value}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex-shrink-0 flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                          isPartner
                            ? 'bg-purple-100 hover:bg-purple-200 text-purple-700'
                            : isPremium
                            ? 'bg-amber-100 hover:bg-amber-200 text-amber-700'
                            : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                        }`}
                        title={`Web ${service.name}`}
                        style={{ minWidth: '100px' }}
                      >
                        <Globe className="h-4 w-4" />
                        <span>WEB</span>
                      </a>
                    )
                  )}
                  </div>

                  {/* Google Rating Baner - LEN pre Partnerov (je v cene) */}
                  {isPartner && ratingData && (
                    <div className="mt-2 flex items-center gap-2 px-2 py-2 bg-white rounded-lg border border-purple-200 shadow-sm">
                      {/* Google logo */}
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                      </div>
                      {/* Hviezdy */}
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= Math.round(ratingData.rating)
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      {/* Hodnotenie a počet */}
                      <span className="font-bold text-gray-900">{ratingData.rating.toFixed(1)}</span>
                      <span className="text-sm text-gray-500">({ratingData.count} hodnotení)</span>
                      {/* Verified badge */}
                      <BadgeCheck className="h-4 w-4 text-purple-600 ml-auto" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Empty state podľa oponenta */}
          {allServices.length === 0 && (
            <div className="py-12 text-center">
              <MapPin className="h-12 w-12 text-foreground/30 mx-auto mb-4" />
              <p className="text-foreground/60 font-medium">
                Žiadne taxislužby nenájdené
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Partner & Premium info banner */}
      <section className="py-8 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
            <Crown className="h-8 w-8 text-purple-600 mx-auto mb-3" />
            <h3 className="font-bold text-lg text-foreground mb-2">
              Ste taxislužba {locationText} {city.name}?
            </h3>
            <p className="text-sm text-foreground/60 mb-4">
              Získajte lepšiu pozíciu a viac zákazníkov
            </p>
            <Link
              href="/pre-taxiky"
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm"
            >
              <Star className="h-4 w-4" />
              Zobraziť ponuku
            </Link>
          </div>
        </div>
      </section>

      <CityContent citySlug={city.slug} cityName={city.name} />
      <NearbyCitiesSection
        nearbyCities={findNearbyCitiesWithTaxis(city, 6)}
        currentCityName={city.name}
      />
      <CityFAQ cityName={city.name} citySlug={city.slug} />
      <HowItWorks />
      <Footer />
    </div>
  );
}

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
  // Pre obce s isVillage: true používame "v obci", inak "v meste"
  const locationText = city.isVillage ? 'v obci' : 'v meste';

  // Fetch ratings for partner services
  const partnerRatings = await getPartnerRatings(city.taxiServices);

  // Všetky mestá používajú vylepšený List View dizajn od oponenta
  return <UniversalListView city={city} regionSlug={regionSlug} locationText={locationText} partnerRatings={partnerRatings} />;

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
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Header />

      <SEOBreadcrumbs items={breadcrumbItems} />

      {/* Above The Fold dizajn - konzistentný s taxi-trasa */}
      <section className="relative bg-gradient-to-br from-primary-yellow/10 via-white to-primary-yellow/5">
        <div className="container mx-auto max-w-6xl px-4 py-6 md:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">

            {/* Ľavá strana - Info */}
            <div className="lg:col-span-2 flex flex-col">
              <div className="mb-4">
                <p className="text-sm text-foreground/60 mb-1">
                  {isHierarchical && actualDistrict ? `Okres ${actualDistrict.name}` : municipality.region}
                </p>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-foreground leading-tight">
                  {municipality.name}
                </h1>
                <p className="text-sm sm:text-base text-foreground/70 mt-2">
                  Objednajte si taxi v okolí
                </p>
              </div>

              {!hasTaxiServices && nearestCities.length > 0 && (
                <>
                  {/* Orientačná cena */}
                  <div className="bg-white rounded-xl shadow-lg border-2 border-primary-yellow p-4 mb-4">
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-3xl md:text-4xl font-black text-green-600">
                        {Math.ceil(2 + nearestCities[0].distance * 0.85)}€
                      </span>
                      <span className="text-lg text-foreground/50">
                        - {Math.ceil(2 + nearestCities[0].distance * 1.15)}€
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-foreground/70">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {nearestCities[0].roadDistance} km
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {nearestCities[0].duration} min
                      </span>
                    </div>
                    <p className="text-xs text-foreground/60 mt-2">
                      do {nearestCities[0].city.name}
                    </p>
                  </div>

                  {/* CTA */}
                  <div className="space-y-3">
                    <Link
                      href={`/taxi/${nearestCities[0].city.slug}`}
                      className="flex items-center justify-center gap-3 w-full px-6 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg hover:shadow-xl text-lg"
                    >
                      <Phone className="h-6 w-6" />
                      Taxislužby v {nearestCities[0].city.name}
                    </Link>
                    <Link
                      href={`#taxi-sluzby`}
                      className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-primary-yellow text-foreground font-bold rounded-xl hover:bg-primary-yellow/90 transition-all"
                    >
                      <Car className="h-5 w-5" />
                      Zobraziť všetky možnosti
                    </Link>
                  </div>
                </>
              )}

              {hasTaxiServices && cityWithTaxi && (
                <>
                  <div className="bg-primary-yellow/10 rounded-xl p-4 mb-4">
                    <p className="text-sm font-semibold text-foreground/80">
                      ✓ V obci {municipality.name} máme {cityWithTaxi.taxiServices.length} taxislužieb
                    </p>
                  </div>
                  <Link
                    href="#taxi-sluzby"
                    className="flex items-center justify-center gap-3 w-full px-6 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg hover:shadow-xl text-lg"
                  >
                    <Phone className="h-6 w-6" />
                    Zobraziť taxislužby
                  </Link>
                </>
              )}
            </div>

            {/* Pravá strana - Mapa */}
            {!hasTaxiServices && nearestCities.length > 0 &&
             municipality.latitude && municipality.longitude &&
             nearestCities[0].city.latitude && nearestCities[0].city.longitude && (
              <div className="lg:col-span-3">
                <div className="rounded-xl overflow-hidden shadow-lg h-[250px] md:h-[300px] lg:h-full lg:min-h-[350px]">
                  <RouteMapWrapper
                    fromLat={municipality.latitude}
                    fromLng={municipality.longitude}
                    fromName={municipality.name}
                    fromSlug={municipality.slug}
                    toLat={nearestCities[0].city.latitude}
                    toLng={nearestCities[0].city.longitude}
                    toName={nearestCities[0].city.name}
                    toSlug={nearestCities[0].city.slug}
                    distance={nearestCities[0].distance}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Breadcrumb - navigácia */}
          <div className="mt-6 pt-4 border-t border-foreground/10">
            <Link
              href={isHierarchical && actualDistrict ? `/taxi/${regionSlug}/${actualDistrict.slug}` : `/kraj/${regionSlug}`}
              className="inline-flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {isHierarchical && actualDistrict ? `Späť na okres ${actualDistrict.name}` : `Späť na ${municipality.region}`}
            </Link>
          </div>
        </div>
      </section>

      {/* Najbližšie taxislužby */}
      {!hasTaxiServices && nearestCities.length > 0 && (
        <section className="py-12 md:py-16 lg:py-20 px-4 md:px-8 relative bg-white">
          <div className="container mx-auto max-w-6xl relative z-10">
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
                  <div className="card-3d ">
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
                            <Card className="hover: transition-shadow">
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
          <div className="container mx-auto max-w-6xl relative z-10">
            <div className="mb-8 text-center">
              <h2 className="text-2xl md:text-3xl font-black mb-4 text-foreground">
                Taxislužby {cityWithTaxi.isVillage ? 'v obci' : 'v meste'} {municipality.name}
              </h2>
            </div>

            <div className="grid gap-2">
              {cityWithTaxi.taxiServices.map((service, index) => (
                <Card key={index} className="perspective-1000">
                  <div className="card-3d  transition-all">
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

  // Helper function to get correct URL for municipality/city
  // Cities with taxi services get primary URL, others get hierarchical URL
  const getMunicipalityUrl = (mun: Municipality): string => {
    const cityWithTaxi = getCityBySlug(mun.slug);
    if (cityWithTaxi && cityWithTaxi.taxiServices.length > 0) {
      return `/taxi/${cityWithTaxi.slug}`;
    }
    return `/taxi/${regionSlug}/${district.slug}/${mun.slug}`;
  };

  // Check if municipality has taxi services (for visual indicator)
  const hasTaxiServices = (mun: Municipality): boolean => {
    const city = getCityBySlug(mun.slug);
    return !!(city && city.taxiServices.length > 0);
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
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
              <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-extrabold mb-3 md:mb-6 text-foreground">
                Taxi okres {district.name}
              </h1>
              <p className="text-sm sm:text-base md:text-xl font-semibold px-2 sm:px-4 text-foreground/90">
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
            {municipalities.map((municipality) => {
              const hasTaxi = hasTaxiServices(municipality);
              return (
                <Link
                  key={municipality.slug}
                  href={getMunicipalityUrl(municipality)}
                  className="perspective-1000 group"
                >
                  <div className={`card-3d  transition-all rounded-lg p-3 md:p-4 h-full ${hasTaxi ? 'bg-yellow-50 ring-1 ring-yellow-300' : 'bg-card'}`}>
                    <div className="flex items-center gap-2">
                      <MapPin className={`h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0 transition-colors ${hasTaxi ? 'text-yellow-600' : 'text-foreground/40 group-hover:text-success'}`} />
                      <span className="font-semibold text-sm md:text-base text-foreground truncate">
                        {municipality.name}
                      </span>
                      {hasTaxi && (
                        <span className="text-[10px] bg-yellow-400 text-yellow-900 px-1 py-0.5 rounded font-bold ml-auto flex-shrink-0">TAXI</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-8 md:py-12 px-4 md:px-8 bg-foreground/5">
        <div className="container mx-auto max-w-6xl text-center">
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
  // Pre obce s isVillage: true používame "v obci", inak "v meste"
  const locationText = city.isVillage ? 'v obci' : 'v meste';
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
      <div className="min-h-screen bg-white overflow-x-hidden">
        <TaxiServiceSchema
          service={service}
          city={city}
          citySlug={city.slug}
          serviceSlug={serviceSlug}
        />
        <Header />

        {/* Hero Section - Partner */}
        <section className="pt-0 pb-8 md:pb-12 lg:pb-16 px-4 md:px-8 relative overflow-hidden min-h-[400px] md:min-h-[500px] lg:min-h-[600px]">
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
              {/* Decorative elements - hidden on mobile to prevent overflow */}
              <div className="hidden md:block absolute top-0 right-0 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="hidden md:block absolute bottom-0 left-0 w-64 h-64 bg-purple-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
            </>
          )}
          {/* Breadcrumbs inside hero */}
          <div className="relative z-10">
            <SEOBreadcrumbs
              items={[
                { label: city.region, href: `/kraj/${regionSlug}` },
                { label: city.name, href: `/taxi/${city.slug}` },
                { label: service.name },
              ]}
            />
          </div>

          <div className="container mx-auto max-w-6xl relative z-10">
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
                <div className="bg-green-500 text-white text-sm font-black px-4 py-1.5 rounded-full flex items-center gap-1.5 ">
                  <BadgeCheck className="h-4 w-4" />
                  OVERENÉ
                </div>
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-purple-900 text-sm font-black px-4 py-1.5 rounded-full flex items-center gap-1.5 ">
                  <Star className="h-4 w-4" />
                  PARTNER
                </div>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 ">
                {service.name}
              </h1>
              <p className="text-xl text-white/90 mb-8">
                Profesionálna taxislužba {locationText} {city.name}
              </p>

              {/* Contact buttons with GA4 tracking */}
              <ServiceContactButtons
                phone={service.phone}
                website={service.website}
                serviceName={service.name}
                cityName={city.name}
                variant="hero"
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 md:py-16 px-4 md:px-8 bg-white">
          <div className="container mx-auto max-w-6xl">
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
          <div className="container mx-auto max-w-6xl text-center">
            <h2 className="text-2xl md:text-3xl font-black text-purple-900 mb-4">
              Potrebujete taxi {locationText} {city.name}?
            </h2>
            <p className="text-purple-900/70 mb-6 text-lg">
              Zavolajte nám a odvezieme vás kam potrebujete.
            </p>
            <ServiceContactButtons
              phone={service.phone}
              serviceName={service.name}
              cityName={city.name}
              variant="cta"
            />
          </div>
        </section>

        {/* Other services */}
        {city.taxiServices.length > 1 && (
          <section className="py-12 md:py-16 px-4 md:px-8 bg-foreground/5">
            <div className="container mx-auto max-w-6xl">
              <h2 className="text-2xl font-black mb-6 text-foreground text-center">
                Ďalšie taxislužby {locationText} {city.name}
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
                          <div className="card-3d  transition-all p-4">
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

  // Získaj iniciály pre fallback logo
  const initials = service.name
    .split(' ')
    .filter(word => word.length > 0 && !['taxi', 'TAXI', 'Taxi'].includes(word))
    .slice(0, 2)
    .map(word => word.charAt(0).toUpperCase())
    .join('') || service.name.charAt(0).toUpperCase();

  return (
    <>
      <div className="min-h-screen bg-gray-50 overflow-x-hidden pb-20 md:pb-0">
        <TaxiServiceSchema
          service={service}
          city={city}
          citySlug={city.slug}
          serviceSlug={serviceSlug}
        />
        <Header />

        {/* Kompaktné breadcrumbs - len späť */}
        <div className="bg-white border-b border-gray-100">
          <div className="container mx-auto max-w-4xl px-4 py-3">
            <Link
              href={`/taxi/${city.slug}`}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{city.name}</span>
              <span className="text-gray-400">({city.taxiServices.length} taxislužieb)</span>
            </Link>
          </div>
        </div>

        {/* Profilová sekcia - zlúčená karta */}
        <section className="bg-white">
          <div className="container mx-auto max-w-4xl px-4 py-6">
            {/* Logo + Názov + Badge */}
            <div className="flex items-start gap-4 mb-6">
              {/* Logo/Iniciály */}
              <div className={`flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold ${
                isPremium
                  ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {initials}
              </div>

              {/* Názov a info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 flex-wrap">
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
                    {service.name}
                  </h1>
                  {isPremium && (
                    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-full">
                      <Star className="h-3 w-3" />
                      PREMIUM
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                  <MapPin className="h-4 w-4" />
                  <span>{city.name}, {city.region}</span>
                </div>
                {/* Overená taxislužba badge */}
                <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-medium">Overená taxislužba</span>
                </div>
              </div>
            </div>

            {/* Hlavné CTA tlačidlo - cez celú šírku */}
            {service.phone && (
              <a
                href={`tel:${service.phone.replace(/\s/g, '')}`}
                className="flex items-center justify-center gap-3 w-full px-6 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all shadow-lg text-lg"
              >
                <Phone className="h-6 w-6" />
                <span>Zavolať {service.phone}</span>
              </a>
            )}

            {/* Webová stránka - sekundárne */}
            {service.website && (
              <a
                href={service.website.startsWith('http') ? service.website : `https://${service.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full mt-3 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all"
              >
                <Globe className="h-5 w-5" />
                <span>Navštíviť web</span>
              </a>
            )}
          </div>
        </section>

        {/* O taxislužbe - SEO content */}
        <section className="py-6 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                O taxislužbe
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">{content.intro}</p>
              <p className="text-gray-500 text-xs leading-relaxed">{content.disclaimer}</p>
            </div>
          </div>
        </section>

        {/* Promo banner for non-Premium/Partner services */}
        {!isPremium && !isPartner && (
          <section className="px-4 pb-6">
            <div className="container mx-auto max-w-4xl">
              <div className="bg-gradient-to-r from-purple-50 to-amber-50 rounded-xl p-4 border border-purple-100">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-amber-500 flex items-center justify-center flex-shrink-0">
                      <Crown className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">Ste majiteľom?</p>
                      <p className="text-gray-500 text-xs">Získajte lepšiu pozíciu</p>
                    </div>
                  </div>
                  <Link
                    href="/pre-taxiky"
                    className="inline-flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all"
                  >
                    Zistiť viac
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Ďalšie taxislužby */}
        {city.taxiServices.length > 1 && (
          <section className="px-4 pb-6">
            <div className="container mx-auto max-w-4xl">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Ďalšie taxislužby {locationText} {city.name}
              </h2>
              <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
                {[...city.taxiServices]
                  .sort((a, b) => a.name.localeCompare(b.name, 'sk'))
                  .filter((s) => s.name !== service.name)
                  .slice(0, 5)
                  .map((otherService, index) => {
                    const otherSlug = createServiceSlug(otherService.name);
                    return (
                      <Link
                        key={index}
                        href={`/taxi/${city.slug}/${otherSlug}`}
                        className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-medium text-gray-900">{otherService.name}</span>
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                      </Link>
                    );
                  })}
              </div>
            </div>
          </section>
        )}

        <Footer />
      </div>

      {/* Sticky Footer - vždy viditeľné na mobile */}
      {service.phone && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.15)] z-50 md:hidden"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="flex items-center justify-between px-4 py-3">
            <div className="text-sm">
              <span className="text-gray-500">Taxislužba</span>
              <p className="font-bold text-gray-900 truncate max-w-[150px]">{service.name}</p>
            </div>
            <a
              href={`tel:${service.phone.replace(/\s/g, '')}`}
              className="flex items-center gap-2 px-5 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all"
            >
              <Phone className="h-5 w-5" />
              <span>Zavolať</span>
            </a>
          </div>
        </div>
      )}
    </>
  );
}

function Footer() {
  return (
    <footer className="border-t border-foreground/30 py-8 md:py-12 px-4 md:px-8 relative">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-foreground/20 to-transparent"></div>
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
          <div className="text-xs md:text-sm text-foreground font-bold text-center md:text-left">
            © 2025 Taxi NearMe. Všetky práva vyhradené.
          </div>
          <div className="flex flex-wrap justify-center gap-4 md:gap-8">
            <Link href="/ochrana-sukromia" className="text-xs md:text-sm text-foreground font-bold hover:text-foreground/70 transition-colors duration-200">
              Ochrana súkromia
            </Link>
            <Link href="/podmienky-pouzivania" className="text-xs md:text-sm text-foreground font-bold hover:text-foreground/70 transition-colors duration-200">
              Podmienky používania
            </Link>
            <Link href="/" className="text-xs md:text-sm text-foreground font-bold hover:text-foreground/70 transition-colors duration-200">
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
      permanentRedirect(routeType.to);
      // permanentRedirect() throws, but we need return for ESLint no-fallthrough rule
      return null;

    case 'notFound':
    default:
      notFound();
  }
}
