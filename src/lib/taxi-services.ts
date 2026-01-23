import { createClient } from '@/lib/supabase/server';
import type { TaxiService, CityData } from '@/data/cities';

interface TaxiServiceDB {
  id: string;
  name: string;
  is_verified: boolean;
  is_premium: boolean;
  is_partner: boolean;
  premium_expires_at: string | null;
}

interface ApprovedSubmission {
  name: string;
  phone: string;
  description: string | null;
  city_slug: string;
}

interface HiddenService {
  service_name: string;
  city_slug: string;
}

/**
 * Merge taxi services from JSON with premium/partner status from Supabase
 * Also includes approved user submissions as new taxi services
 * This allows automatic updates from Stripe webhooks to take effect
 */
export async function mergeTaxiServicesWithDB(city: CityData): Promise<CityData> {
  try {
    const supabase = await createClient();

    // Fetch taxi services status, approved submissions, and hidden services in parallel
    const [dbServicesResult, approvedSubmissionsResult, hiddenServicesResult] = await Promise.all([
      supabase
        .from('taxi_services')
        .select('id, name, is_verified, is_premium, is_partner, premium_expires_at')
        .eq('city_slug', city.slug),
      supabase
        .from('taxi_submissions')
        .select('name, phone, description, city_slug')
        .eq('city_slug', city.slug)
        .eq('status', 'approved'),
      supabase
        .from('hidden_taxi_services')
        .select('service_name, city_slug')
        .eq('city_slug', city.slug),
    ]);

    const { data: dbServices, error } = dbServicesResult;
    const { data: approvedSubmissions, error: submissionsError } = approvedSubmissionsResult;
    const { data: hiddenServices, error: hiddenError } = hiddenServicesResult;

    if (error) {
      console.error('Error fetching taxi services from DB:', error);
    }
    if (submissionsError) {
      console.error('Error fetching approved submissions:', submissionsError);
    }
    if (hiddenError) {
      console.error('Error fetching hidden services:', hiddenError);
    }

    // Create a set of hidden service names (case-insensitive)
    const hiddenNames = new Set<string>();
    if (hiddenServices) {
      hiddenServices.forEach((hs) => hiddenNames.add(hs.service_name.toLowerCase()));
    }

    // Create a map for quick lookup (case-insensitive)
    const dbServiceMap = new Map<string, TaxiServiceDB>();
    if (dbServices) {
      dbServices.forEach((service) => {
        dbServiceMap.set(service.name.toLowerCase(), service);
      });
    }

    // Helper to check if premium is expired
    const isExpired = (expiresAt: string | null | undefined): boolean => {
      if (!expiresAt) return false;
      return new Date(expiresAt) < new Date();
    };

    // Merge DB status into JSON taxi services
    const mergedFromJson = city.taxiServices.map((service): TaxiService => {
      const dbService = dbServiceMap.get(service.name.toLowerCase());

      if (dbService) {
        // Determine effective expiration (DB takes priority)
        const effectiveExpiration = dbService.premium_expires_at ?? service.premiumExpiresAt;

        // DB premium is valid if true and not expired
        const dbPremiumValid = dbService.is_premium && !isExpired(dbService.premium_expires_at);
        // JSON premium is valid if true and not expired (and DB doesn't have its own expiration)
        const jsonPremiumValid = service.isPremium && !isExpired(service.premiumExpiresAt) && !dbService.premium_expires_at;
        // Promotional premium (FOMO marketing) - never expires based on date, only when flag is removed
        const promotionalPremiumValid = service.isPremium && service.isPromotional;

        // Partner status: DB takes priority, fallback to JSON
        const isPartner = dbService.is_partner || service.isPartner;

        // Verified status from DB (all paid plans get verified)
        const isVerified = dbService.is_verified || dbPremiumValid || isPartner;

        return {
          ...service,
          id: dbService.id, // Include DB ID for checkout links
          isVerified,
          isPremium: dbPremiumValid || jsonPremiumValid || promotionalPremiumValid,
          isPartner,
          premiumExpiresAt: effectiveExpiration,
        };
      }

      // No DB record - check if JSON premium is expired (but not promotional)
      if (service.isPremium && !service.isPromotional && isExpired(service.premiumExpiresAt)) {
        return {
          ...service,
          isPremium: false,
        };
      }

      return service;
    });

    // Create a set of existing service names (case-insensitive) to avoid duplicates
    const existingNames = new Set(
      city.taxiServices.map((s) => s.name.toLowerCase())
    );

    // Add approved submissions that are not already in JSON
    const submissionsAsServices: TaxiService[] = [];
    if (approvedSubmissions && approvedSubmissions.length > 0) {
      for (const submission of approvedSubmissions) {
        // Skip if already exists in JSON
        if (existingNames.has(submission.name.toLowerCase())) {
          continue;
        }

        // Create TaxiService from submission
        const newService: TaxiService = {
          name: submission.name,
          phone: submission.phone,
          description: submission.description || undefined,
          isPremium: false,
          isPartner: false,
        };

        submissionsAsServices.push(newService);
      }
    }

    // Combine JSON services with approved submissions
    const allServices = [...mergedFromJson, ...submissionsAsServices];

    // Filter out hidden services
    const visibleServices = allServices.filter(
      (service) => !hiddenNames.has(service.name.toLowerCase())
    );

    return {
      ...city,
      taxiServices: visibleServices,
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
