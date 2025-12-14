import { createClient } from '@supabase/supabase-js';

// Create a read-only client for fetching approved partner data
function getReadOnlyClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

export interface ApprovedPartnerData {
  company_name: string | null;
  description: string | null;
  show_description: boolean | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  hero_image_url: string | null;
  hero_image_zoom: number | null;
  hero_image_pos_x: number | null;
  hero_image_pos_y: number | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  banner_title: string | null;
  banner_subtitle: string | null;
  services: string[] | null;
  show_services: boolean | null;
  gallery: string[] | null;
  social_facebook: string | null;
  social_instagram: string | null;
}

// Cache for approved partner data (in-memory, per server instance)
const partnerDataCache = new Map<string, { data: ApprovedPartnerData | null; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch approved partner data from Supabase using SECURITY DEFINER RPC function
 * This bypasses RLS to allow public reading of approved partner data
 * Returns null if no approved draft exists
 */
export async function getApprovedPartnerData(partnerSlug: string): Promise<ApprovedPartnerData | null> {
  // Check cache first
  const cached = partnerDataCache.get(partnerSlug);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const supabase = getReadOnlyClient();

    // Use SECURITY DEFINER function to bypass RLS
    const { data, error } = await supabase.rpc('get_approved_partner_data', {
      p_slug: partnerSlug
    });

    if (error) {
      console.error('[getApprovedPartnerData] RPC error:', error.message);
      partnerDataCache.set(partnerSlug, { data: null, timestamp: Date.now() });
      return null;
    }

    // RPC returns an array, get first result
    const draft = Array.isArray(data) ? data[0] : data;

    if (!draft) {
      console.log('[getApprovedPartnerData] No approved draft found for:', partnerSlug);
      partnerDataCache.set(partnerSlug, { data: null, timestamp: Date.now() });
      return null;
    }

    console.log('[getApprovedPartnerData] Found approved data with gallery:', draft.gallery?.length || 0, 'images');

    const approvedData: ApprovedPartnerData = {
      company_name: draft.company_name,
      description: draft.description,
      show_description: draft.show_description,
      phone: draft.phone,
      email: draft.email,
      website: draft.website,
      hero_image_url: draft.hero_image_url,
      hero_image_zoom: draft.hero_image_zoom,
      hero_image_pos_x: draft.hero_image_pos_x,
      hero_image_pos_y: draft.hero_image_pos_y,
      hero_title: draft.hero_title,
      hero_subtitle: draft.hero_subtitle,
      banner_title: draft.banner_title,
      banner_subtitle: draft.banner_subtitle,
      services: draft.services,
      show_services: draft.show_services,
      gallery: draft.gallery,
      social_facebook: draft.social_facebook,
      social_instagram: draft.social_instagram,
    };

    partnerDataCache.set(partnerSlug, { data: approvedData, timestamp: Date.now() });
    return approvedData;
  } catch (error) {
    console.error('[getApprovedPartnerData] Error:', error);
    return null;
  }
}

/**
 * Clear cache for a specific partner (call after approval)
 */
export function clearPartnerCache(partnerSlug: string): void {
  partnerDataCache.delete(partnerSlug);
}
