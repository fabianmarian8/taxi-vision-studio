import { createClient } from '@/lib/supabase/server';
import type { TaxiService, CityData } from '@/data/cities';

interface TaxiServiceDB {
  name: string;
  is_premium: boolean;
  is_partner: boolean;
  premium_expires_at: string | null;
}

/**
 * Merge taxi services from JSON with premium/partner status from Supabase
 * This allows automatic updates from Stripe webhooks to take effect
 */
export async function mergeTaxiServicesWithDB(city: CityData): Promise<CityData> {
  try {
    const supabase = await createClient();

    // Fetch taxi services status from DB for this city
    const { data: dbServices, error } = await supabase
      .from('taxi_services')
      .select('name, is_premium, is_partner, premium_expires_at')
      .eq('city_slug', city.slug);

    if (error) {
      console.error('Error fetching taxi services from DB:', error);
      return city; // Return original data on error
    }

    if (!dbServices || dbServices.length === 0) {
      return city; // No DB data, return original
    }

    // Create a map for quick lookup (case-insensitive)
    const dbServiceMap = new Map<string, TaxiServiceDB>();
    dbServices.forEach((service) => {
      dbServiceMap.set(service.name.toLowerCase(), service);
    });

    // Helper to check if premium is expired
    const isExpired = (expiresAt: string | null | undefined): boolean => {
      if (!expiresAt) return false;
      return new Date(expiresAt) < new Date();
    };

    // Merge DB status into JSON taxi services
    const mergedServices = city.taxiServices.map((service): TaxiService => {
      const dbService = dbServiceMap.get(service.name.toLowerCase());

      if (dbService) {
        // Determine effective expiration (DB takes priority)
        const effectiveExpiration = dbService.premium_expires_at ?? service.premiumExpiresAt;

        // DB premium is valid if true and not expired
        const dbPremiumValid = dbService.is_premium && !isExpired(dbService.premium_expires_at);
        // JSON premium is valid if true and not expired (and DB doesn't have its own expiration)
        const jsonPremiumValid = service.isPremium && !isExpired(service.premiumExpiresAt) && !dbService.premium_expires_at;

        // Partner status: DB takes priority, fallback to JSON
        const isPartner = dbService.is_partner || service.isPartner;

        return {
          ...service,
          isPremium: dbPremiumValid || jsonPremiumValid,
          isPartner,
          premiumExpiresAt: effectiveExpiration,
        };
      }

      // No DB record - check if JSON premium is expired
      if (service.isPremium && isExpired(service.premiumExpiresAt)) {
        return {
          ...service,
          isPremium: false,
        };
      }

      return service;
    });

    return {
      ...city,
      taxiServices: mergedServices,
    };
  } catch (error) {
    console.error('Error merging taxi services:', error);
    return city; // Return original data on error
  }
}

/**
 * Get city data with merged DB status
 * Use this instead of getCityBySlug when you need real-time partner/premium status
 */
export async function getCityWithDBStatus(citySlug: string): Promise<CityData | undefined> {
  const { getCityBySlug } = await import('@/data/cities');
  const city = getCityBySlug(citySlug);

  if (!city) {
    return undefined;
  }

  return mergeTaxiServicesWithDB(city);
}
