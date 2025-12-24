import citiesDataJson from './cities.json';
import { createClient } from '@supabase/supabase-js';

// Supabase client for server-side fetching
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Cache for Supabase data (refreshed on each request in ISR)
let cachedCities: CityData[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30000; // 30 seconds

export interface PricelistItem {
  destination: string;
  distance?: number; // km
  price: string;
  note?: string;
}

export interface PartnerData {
  heroImage?: string;
  shortDescription?: string;
  description?: string;
  servicesDescription?: string; // Popis služieb (pre inline editor)
  services?: string[];
  workingHours?: string;
  googlePlaceId?: string;
  googleMapsUrl?: string;
  pricelist?: PricelistItem[]; // Cenník taxislužby
  pricePerKm?: string; // Cena za km (napr. "0.80€/km")
  paymentMethods?: string[]; // Spôsoby platby
  whatsapp?: string; // WhatsApp číslo
  bookingUrl?: string; // URL na časovú objednávku
  secondaryCity?: string; // Druhé mesto pôsobenia (pre CTA sekciu)
  customCtaTitle?: string; // Vlastný text pre CTA sekciu (napr. "do okolitých obcí")
  pricelistUrl?: string; // Externý odkaz na cenník
  transportRulesUrl?: string; // Externý odkaz na prepravný poriadok
  contactUrl?: string; // Externý odkaz na kontaktné informácie
}

export interface TaxiService {
  name: string;
  website?: string;
  phone?: string;
  phone2?: string; // Druhé telefónne číslo
  phone3?: string; // Tretie telefónne číslo
  address?: string; // Adresa taxislužby z Google Places API
  placeId?: string; // Google Places ID pre budúce využitie
  description?: string;
  customDescription?: string; // Vlastný text pre detail stránku (namiesto generovania)
  logo?: string; // Cesta k logu taxislužby (napr. /logos/fast-taxi-zvolen.webp)
  gallery?: string[]; // Pole ciest k fotkám taxislužby (zobrazí sa ako galéria)
  isPremium?: boolean;
  isPartner?: boolean;
  isPromotional?: boolean; // Flag pre marketingové promo premium (neplatia)
  premiumExpiresAt?: string; // ISO date string pre expiráciu
  partnerData?: PartnerData;
  redirectTo?: string; // Presmerovanie na inú stránku (napr. partner stránku v inom meste)
  nonstop?: boolean; // 24/7 služba
}

export interface CityData {
  name: string;
  slug: string;
  region: string;
  description: string;
  metaDescription: string;
  keywords: string[];
  taxiServices: TaxiService[];
  latitude?: number;
  longitude?: number;
  heroImage?: string;
  isVillage?: boolean; // true pre obce, ktoré majú taxi ale nie sú mestá
}

// Načítanie dát z JSON súboru
export const slovakCities: CityData[] = citiesDataJson.cities as CityData[];

export const getCityBySlug = (slug: string): CityData | undefined => {
  return slovakCities.find(city => city.slug === slug);
};

// Získanie jedinečného zoznamu krajov
export const getUniqueRegions = (): string[] => {
  const regions = slovakCities.map(city => city.region);
  return Array.from(new Set(regions)).sort();
};

// Funkcia na vytvorenie slug z názvu kraja
export const createRegionSlug = (regionName: string): string => {
  return regionName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Odstránenie diakritiky
    .replace(/\s+/g, '-'); // Nahradenie medzier pomlčkami
};

// Získanie miest v danom kraji (vylúči obce s isVillage: true)
export const getCitiesByRegion = (regionName: string): CityData[] => {
  return slovakCities
    .filter(city => city.region === regionName && !city.isVillage)
    .sort((a, b) => a.name.localeCompare(b.name, 'sk'));
};

// Získanie kraja podľa slug
export const getRegionBySlug = (slug: string): string | undefined => {
  const regions = getUniqueRegions();
  return regions.find(region => createRegionSlug(region) === slug);
};

// Export regiónu s dátami
export interface RegionData {
  name: string;
  slug: string;
  citiesCount: number;
}

// Získanie všetkých regiónov s dátami
export const getRegionsData = (): RegionData[] => {
  const regions = getUniqueRegions();
  return regions.map(region => ({
    name: region,
    slug: createRegionSlug(region),
    citiesCount: getCitiesByRegion(region).length
  }));
};

/**
 * Calculate distance between two coordinates using Haversine formula
 */
const calculateDistanceBetweenCities = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Find nearby cities with taxi services
 * @param currentCity The city to search from
 * @param limit How many nearby cities to return (default 5)
 * @returns Array of cities sorted by distance
 */
export const findNearbyCitiesWithTaxis = (
  currentCity: CityData,
  limit: number = 5
): Array<{ city: CityData; distance: number }> => {
  if (!currentCity.latitude || !currentCity.longitude) {
    return [];
  }

  // Get cities with taxi services and coordinates, excluding current city
  const citiesWithTaxis = slovakCities.filter(
    (city) =>
      city.slug !== currentCity.slug &&
      city.taxiServices &&
      city.taxiServices.length > 0 &&
      city.latitude &&
      city.longitude
  );

  // Calculate distances
  const citiesWithDistances = citiesWithTaxis.map((city) => ({
    city,
    distance: Math.round(
      calculateDistanceBetweenCities(
        currentCity.latitude!,
        currentCity.longitude!,
        city.latitude!,
        city.longitude!
      )
    ),
  }));

  // Sort by distance and return limited results
  return citiesWithDistances
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
};

// =============================================================================
// ASYNC FUNCTIONS (Supabase as primary, JSON as fallback)
// Use these in Server Components for live data from Supabase
// =============================================================================

interface DbCity {
  id: string;
  name: string;
  slug: string;
  region: string;
  description: string | null;
  meta_description: string | null;
  keywords: string[] | null;
  latitude: number | null;
  longitude: number | null;
  hero_image: string | null;
}

interface DbTaxiService {
  id: string;
  city_slug: string;
  name: string;
  phone: string | null;
  website: string | null;
  address: string | null;
  place_id: string | null;
  is_premium: boolean;
  is_promotional: boolean;
  premium_expires_at: string | null;
  display_order: number;
}

function transformDbCity(dbCity: DbCity, taxiServices: DbTaxiService[]): CityData {
  return {
    name: dbCity.name,
    slug: dbCity.slug,
    region: dbCity.region,
    description: dbCity.description || '',
    metaDescription: dbCity.meta_description || '',
    keywords: dbCity.keywords || [],
    latitude: dbCity.latitude ?? undefined,
    longitude: dbCity.longitude ?? undefined,
    heroImage: dbCity.hero_image ?? undefined,
    taxiServices: taxiServices
      .filter(ts => ts.city_slug === dbCity.slug)
      .sort((a, b) => a.display_order - b.display_order)
      .map(ts => ({
        name: ts.name,
        phone: ts.phone ?? undefined,
        website: ts.website ?? undefined,
        address: ts.address ?? undefined,
        placeId: ts.place_id ?? undefined,
        isPremium: ts.is_premium,
        isPromotional: ts.is_promotional,
        premiumExpiresAt: ts.premium_expires_at ?? undefined,
      })),
  };
}

/**
 * Fetch all cities from Supabase (primary) with JSON fallback
 * Use in Server Components for live data
 */
export async function getCitiesAsync(): Promise<CityData[]> {
  // Check cache first
  if (cachedCities && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedCities;
  }

  if (!supabase) {
    return slovakCities;
  }

  try {
    const [citiesRes, servicesRes] = await Promise.all([
      supabase.from('cities').select('*').order('name'),
      supabase.from('taxi_services').select('*').order('display_order'),
    ]);

    if (citiesRes.error || servicesRes.error) {
      console.error('Supabase fetch error:', citiesRes.error || servicesRes.error);
      return slovakCities;
    }

    const cities = (citiesRes.data as DbCity[]).map(city =>
      transformDbCity(city, servicesRes.data as DbTaxiService[])
    );

    // Update cache
    cachedCities = cities;
    cacheTimestamp = Date.now();

    return cities;
  } catch (error) {
    console.error('Error fetching from Supabase:', error);
    return slovakCities;
  }
}

/**
 * Fetch single city by slug from Supabase (primary) with JSON fallback
 * Use in Server Components for live data
 */
export async function getCityBySlugAsync(slug: string): Promise<CityData | undefined> {
  if (!supabase) {
    return getCityBySlug(slug);
  }

  try {
    const [cityRes, servicesRes] = await Promise.all([
      supabase.from('cities').select('*').eq('slug', slug).single(),
      supabase.from('taxi_services').select('*').eq('city_slug', slug).order('display_order'),
    ]);

    if (cityRes.error || !cityRes.data) {
      return getCityBySlug(slug);
    }

    return transformDbCity(cityRes.data as DbCity, servicesRes.data as DbTaxiService[] || []);
  } catch (error) {
    console.error('Error fetching city from Supabase:', error);
    return getCityBySlug(slug);
  }
}

/**
 * Get regions data from Supabase (primary) with JSON fallback
 */
export async function getRegionsDataAsync(): Promise<RegionData[]> {
  const cities = await getCitiesAsync();
  const regions = Array.from(new Set(cities.map(c => c.region))).sort();

  return regions.map(region => ({
    name: region,
    slug: createRegionSlug(region),
    citiesCount: cities.filter(c => c.region === region && !c.isVillage).length,
  }));
}

/**
 * Get cities by region from Supabase (primary) with JSON fallback
 */
export async function getCitiesByRegionAsync(regionName: string): Promise<CityData[]> {
  const cities = await getCitiesAsync();
  return cities
    .filter(city => city.region === regionName && !city.isVillage)
    .sort((a, b) => a.name.localeCompare(b.name, 'sk'));
}
