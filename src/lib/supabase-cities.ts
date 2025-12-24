/**
 * Supabase Cities Library
 *
 * Fetches city and taxi service data from Supabase with fallback to JSON.
 * Used for server-side rendering and API routes.
 */

import { createClient } from '@supabase/supabase-js';
import type { CityData, TaxiService } from '@/data/cities';

// Supabase client for server-side use
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Database types
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
  city_id: string;
  city_slug: string;
  name: string;
  phone: string | null;
  website: string | null;
  address: string | null;
  place_id: string | null;
  is_premium: boolean;
  is_promotional: boolean;
  premium_expires_at: string | null;
  subscription_id: string | null;
  display_order: number;
}

// Transform database city to CityData format
function transformCity(dbCity: DbCity, taxiServices: DbTaxiService[]): CityData {
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
      .map(transformTaxiService),
  };
}

// Transform database taxi service to TaxiService format
function transformTaxiService(dbTs: DbTaxiService): TaxiService {
  return {
    name: dbTs.name,
    phone: dbTs.phone ?? undefined,
    website: dbTs.website ?? undefined,
    address: dbTs.address ?? undefined,
    placeId: dbTs.place_id ?? undefined,
    isPremium: dbTs.is_premium,
    isPromotional: dbTs.is_promotional,
    premiumExpiresAt: dbTs.premium_expires_at ?? undefined,
  };
}

/**
 * Fetch all cities from Supabase
 * Returns null if Supabase is not configured or query fails
 */
export async function fetchCitiesFromSupabase(): Promise<CityData[] | null> {
  if (!supabase) {
    console.log('Supabase not configured, using JSON fallback');
    return null;
  }

  try {
    // Fetch cities
    const { data: cities, error: citiesError } = await supabase
      .from('cities')
      .select('*')
      .order('name');

    if (citiesError) {
      console.error('Error fetching cities:', citiesError);
      return null;
    }

    // Fetch all taxi services
    const { data: taxiServices, error: tsError } = await supabase
      .from('taxi_services')
      .select('*')
      .order('display_order');

    if (tsError) {
      console.error('Error fetching taxi services:', tsError);
      return null;
    }

    // Transform to CityData format
    return cities.map((city: DbCity) =>
      transformCity(city, taxiServices as DbTaxiService[])
    );
  } catch (error) {
    console.error('Supabase fetch error:', error);
    return null;
  }
}

/**
 * Fetch single city by slug from Supabase
 */
export async function fetchCityBySlugFromSupabase(slug: string): Promise<CityData | null> {
  if (!supabase) {
    return null;
  }

  try {
    // Fetch city
    const { data: city, error: cityError } = await supabase
      .from('cities')
      .select('*')
      .eq('slug', slug)
      .single();

    if (cityError || !city) {
      return null;
    }

    // Fetch taxi services for this city
    const { data: taxiServices, error: tsError } = await supabase
      .from('taxi_services')
      .select('*')
      .eq('city_slug', slug)
      .order('display_order');

    if (tsError) {
      return null;
    }

    return transformCity(city as DbCity, taxiServices as DbTaxiService[]);
  } catch (error) {
    console.error('Supabase fetch error:', error);
    return null;
  }
}

/**
 * Update taxi service premium status (called from Stripe webhook)
 */
export async function updateTaxiServicePremium(
  citySlug: string,
  taxiServiceName: string,
  isPremium: boolean,
  premiumExpiresAt: string | null,
  subscriptionId: string | null
): Promise<boolean> {
  if (!supabase) {
    console.error('Supabase not configured');
    return false;
  }

  try {
    const { error } = await supabase
      .from('taxi_services')
      .update({
        is_premium: isPremium,
        premium_expires_at: premiumExpiresAt,
        subscription_id: subscriptionId,
      })
      .eq('city_slug', citySlug)
      .ilike('name', taxiServiceName);

    if (error) {
      console.error('Error updating taxi service:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Supabase update error:', error);
    return false;
  }
}

/**
 * Check if Supabase cities table has data
 */
export async function hasSupabaseCities(): Promise<boolean> {
  if (!supabase) {
    return false;
  }

  try {
    const { count, error } = await supabase
      .from('cities')
      .select('*', { count: 'exact', head: true });

    return !error && (count ?? 0) > 0;
  } catch {
    return false;
  }
}

/**
 * Get cities with caching (for use in server components)
 * Falls back to JSON if Supabase is not available or empty
 */
export async function getCitiesWithFallback(): Promise<CityData[]> {
  // Try Supabase first
  const supabaseCities = await fetchCitiesFromSupabase();

  if (supabaseCities && supabaseCities.length > 0) {
    return supabaseCities;
  }

  // Fallback to JSON
  const { slovakCities } = await import('@/data/cities');
  return slovakCities;
}

/**
 * Get city by slug with fallback
 */
export async function getCityBySlugWithFallback(slug: string): Promise<CityData | undefined> {
  // Try Supabase first
  const supabaseCity = await fetchCityBySlugFromSupabase(slug);

  if (supabaseCity) {
    return supabaseCity;
  }

  // Fallback to JSON
  const { getCityBySlug } = await import('@/data/cities');
  return getCityBySlug(slug);
}
