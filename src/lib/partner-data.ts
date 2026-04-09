import { createClient } from '@supabase/supabase-js';
import { normalizePlanType, type PlanTier } from '@/lib/tier-config';

// Create a read-only client for fetching approved partner data
function getReadOnlyClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

// Admin client for bypassing RLS (server-side only)
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
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
  services_description: string | null;
  show_services: boolean | null;
  gallery: string[] | null;
  social_facebook: string | null;
  social_instagram: string | null;
  whatsapp: string | null;
  booking_url: string | null;
  pricelist_url: string | null;
  transport_rules_url: string | null;
  contact_url: string | null;
  template_variant: string | null;
}

/**
 * Fetch approved partner data from Supabase using SECURITY DEFINER RPC function
 * This bypasses RLS to allow public reading of approved partner data
 * Returns null if no approved draft exists
 *
 * NOTE: No in-memory caching is used because:
 * 1. Vercel serverless functions are stateless - cache doesn't persist across instances
 * 2. We use on-demand revalidation (revalidatePath) in admin API after approval
 * 3. Next.js ISR with revalidate=3600 provides the caching layer
 */
export async function getApprovedPartnerData(partnerSlug: string, citySlug?: string): Promise<ApprovedPartnerData | null> {
  try {
    const supabase = getReadOnlyClient();

    // Use SECURITY DEFINER function to bypass RLS
    const { data, error } = await supabase.rpc('get_approved_partner_data', {
      p_slug: partnerSlug
    });

    if (error) {
      console.error('[getApprovedPartnerData] RPC error:', error.message);
      return null;
    }

    // RPC returns an array, get first result
    let draft = Array.isArray(data) ? data[0] : data;

    // Fallback: try with city suffix if not found (DB slug may include city)
    if (!draft && citySlug) {
      const slugWithCity = `${partnerSlug}-${citySlug}`;
      const { data: data2 } = await supabase.rpc('get_approved_partner_data', {
        p_slug: slugWithCity
      });
      draft = Array.isArray(data2) ? data2[0] : data2;
    }

    if (!draft) {
      console.log('[getApprovedPartnerData] No approved draft found for:', partnerSlug);
      return null;
    }

    console.log('[getApprovedPartnerData] Found approved data with gallery:', draft.gallery?.length || 0, 'images');

    return {
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
      services_description: draft.services_description,
      show_services: draft.show_services,
      gallery: draft.gallery,
      social_facebook: draft.social_facebook,
      social_instagram: draft.social_instagram,
      whatsapp: draft.whatsapp,
      booking_url: draft.booking_url,
      pricelist_url: draft.pricelist_url,
      transport_rules_url: draft.transport_rules_url,
      contact_url: draft.contact_url,
      template_variant: draft.template_variant,
    };
  } catch (error) {
    console.error('[getApprovedPartnerData] Error:', error);
    return null;
  }
}

export interface ClaimedProfile {
  partnerId: string;
  planTier: PlanTier;
}

/**
 * Check if a service has been claimed (has a partner record).
 * Uses admin client to bypass RLS.
 * Returns partner info if claimed, null otherwise.
 */
export async function getClaimedProfile(serviceSlug: string, citySlug?: string): Promise<ClaimedProfile | null> {
  try {
    const supabase = getAdminClient();

    // Try exact slug match first
    const { data: partner, error } = await supabase
      .from('partners')
      .select('id, plan_type')
      .eq('slug', serviceSlug)
      .maybeSingle();

    if (!error && partner) {
      return {
        partnerId: partner.id,
        planTier: normalizePlanType(partner.plan_type),
      };
    }

    // Fallback: partner DB slug may have city suffix (e.g. "lest-taxi-vojensky-obvod-zvolen")
    // while URL uses service slug without city (e.g. "lest-taxi-vojensky-obvod")
    if (citySlug) {
      const slugWithCity = `${serviceSlug}-${citySlug}`;
      const { data: partnerWithCity } = await supabase
        .from('partners')
        .select('id, plan_type')
        .eq('slug', slugWithCity)
        .maybeSingle();

      if (partnerWithCity) {
        return {
          partnerId: partnerWithCity.id,
          planTier: normalizePlanType(partnerWithCity.plan_type),
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}
