import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { isPartnerSkinId } from '@/lib/partner-skins';
import { NextRequest, NextResponse } from 'next/server';

// Superadmin emails - can edit ALL partner pages
const SUPERADMIN_EMAILS = [
  'fabianmarian8@gmail.com',
  'fabianmarian8@users.noreply.github.com',
];

// Whitelist povolených polí
const ALLOWED_FIELDS = [
  'company_name',
  'description',
  'show_description',
  'phone',
  'email',
  'website',
  'hero_title',
  'hero_subtitle',
  'hero_image_url',
  'hero_image_zoom',
  'hero_image_pos_x',
  'hero_image_pos_y',
  'services',
  'show_services',
  'gallery',
  'social_facebook',
  'social_instagram',
  'whatsapp',
  'booking_url',
  'pricelist_url',
  'transport_rules_url',
  'contact_url',
  'services_description',
  'template_variant'
];

// URL polia ktoré vyžadujú validáciu
const URL_FIELDS = ['website', 'booking_url', 'pricelist_url', 'transport_rules_url', 'contact_url', 'hero_image_url'];

// Validácia URL - musí byť prázdny string, null, undefined alebo začínať http:// alebo https://
function isValidUrl(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return true; // empty values are OK
  if (typeof value !== 'string') return false;
  return /^https?:\/\//i.test(value);
}

// Validácia telefónneho čísla pre WhatsApp (len čísla, + a medzery)
function isValidWhatsApp(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  if (value === '') return true;
  return /^[\d\s+]+$/.test(value);
}

// Validácia string array (pre services, gallery)
function isValidStringArray(value: unknown): boolean {
  if (!Array.isArray(value)) return false;
  return value.every(item => typeof item === 'string');
}

// Polia ktoré musia byť string[]
const ARRAY_FIELDS = ['services', 'gallery'];

// POST /api/partner/inline-edit/save
// Uloženie zmeny jedného alebo viacerých polí
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Overenie autentifikácie
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    const body = await request.json();
    const { partner_id, draft_id, changes } = body;

    if (!partner_id) {
      return NextResponse.json({
        success: false,
        error: 'partner_id is required'
      }, { status: 400 });
    }

    if (!changes || Object.keys(changes).length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No changes provided'
      }, { status: 400 });
    }

    // Check if user is superadmin
    const isSuperadmin = user.email && SUPERADMIN_EMAILS.includes(user.email.toLowerCase());

    // Use admin client for superadmins to bypass RLS
    const queryClient = isSuperadmin
      ? createAdminClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
      : supabase;

    // Overenie vlastníctva (superadmins can edit any partner)
    let partnerQuery = queryClient
      .from('partners')
      .select('id, slug, city_slug, user_id')
      .eq('id', partner_id);

    // Non-superadmins must own the partner
    if (!isSuperadmin) {
      partnerQuery = partnerQuery.eq('user_id', user.id);
    }

    const { data: partner, error: partnerError } = await partnerQuery.single();

    if (partnerError || !partner) {
      return NextResponse.json({
        success: false,
        error: 'Not owner or partner not found'
      }, { status: 403 });
    }

    // Sanitizácia - len povolené polia + type coercion + validácia
    const sanitizedChanges: Record<string, unknown> = {};
    const validationErrors: string[] = [];

    for (const [key, value] of Object.entries(changes as Record<string, unknown>)) {
      if (ALLOWED_FIELDS.includes(key)) {
        // Konverzia na správne typy pre databázu
        if (key === 'hero_image_pos_x' || key === 'hero_image_pos_y' || key === 'hero_image_zoom') {
          // Tieto polia sú integer v databáze
          sanitizedChanges[key] = Math.round(Number(value) || 0);
        } else if (URL_FIELDS.includes(key)) {
          // Validácia URL polí
          console.log(`[inline-edit/save] URL field ${key}:`, typeof value, JSON.stringify(value)?.substring(0, 100));
          if (!isValidUrl(value)) {
            validationErrors.push(`${key} must be a valid URL starting with http:// or https://`);
          } else {
            sanitizedChanges[key] = value;
          }
        } else if (key === 'whatsapp') {
          // Validácia WhatsApp čísla
          if (!isValidWhatsApp(value)) {
            validationErrors.push('whatsapp must contain only numbers, + and spaces');
          } else {
            sanitizedChanges[key] = value;
          }
        } else if (key === 'template_variant') {
          if (typeof value !== 'string' || !isPartnerSkinId(value)) {
            validationErrors.push('template_variant must be a valid template option');
          } else {
            sanitizedChanges[key] = value;
          }
        } else if (ARRAY_FIELDS.includes(key)) {
          // Validácia string[] polí (services, gallery)
          if (!isValidStringArray(value)) {
            validationErrors.push(`${key} must be an array of strings`);
          } else {
            sanitizedChanges[key] = value;
          }
        } else {
          sanitizedChanges[key] = value;
        }
      }
    }

    if (validationErrors.length > 0) {
      console.error('[inline-edit/save] Validation errors:', validationErrors);
      return NextResponse.json({
        success: false,
        error: validationErrors.join(', ')
      }, { status: 400 });
    }

    if (Object.keys(sanitizedChanges).length === 0) {
      console.error('[inline-edit/save] No valid fields. Received changes:', changes);
      return NextResponse.json({
        success: false,
        error: 'No valid fields to update'
      }, { status: 400 });
    }

    // Získať IP adresu
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor?.split(',')[0]?.trim() || null;

    // Použiť RPC funkciu ktorá nastaví audit kontext A vykoná operáciu v jednej transakcii
    if (draft_id) {
      // Update existujúci draft cez RPC
      const { data, error } = await queryClient.rpc('update_partner_draft_with_audit', {
        p_draft_id: draft_id,
        p_partner_id: partner_id,
        p_changes: sanitizedChanges,
        p_user_id: user.id,
        p_user_email: user.email || null,
        p_ip_address: ipAddress
      });

      if (error) {
        console.error('[inline-edit/save] RPC update error:', error);
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 500 });
      }

      if (!data?.success) {
        console.error('[inline-edit/save] Update failed:', data?.error);
        return NextResponse.json({
          success: false,
          error: data?.error || 'Update failed'
        }, { status: 500 });
      }

      console.log('[inline-edit/save] Saved via RPC:', {
        partner_id,
        draft_id: data.draft_id,
        fields: Object.keys(sanitizedChanges)
      });

      return NextResponse.json({
        success: true,
        draft_id: data.draft_id,
        updated_at: data.updated_at
      });
    } else {
      // Insert nový draft cez RPC
      const { data, error } = await queryClient.rpc('insert_partner_draft_with_audit', {
        p_partner_id: partner_id,
        p_changes: sanitizedChanges,
        p_user_id: user.id,
        p_user_email: user.email || null,
        p_ip_address: ipAddress
      });

      if (error) {
        console.error('[inline-edit/save] RPC insert error:', error);
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 500 });
      }

      if (!data?.success) {
        console.error('[inline-edit/save] Insert failed:', data?.error);
        return NextResponse.json({
          success: false,
          error: data?.error || 'Insert failed'
        }, { status: 500 });
      }

      console.log('[inline-edit/save] Created via RPC:', {
        partner_id,
        draft_id: data.draft_id,
        fields: Object.keys(sanitizedChanges)
      });

      return NextResponse.json({
        success: true,
        draft_id: data.draft_id,
        updated_at: data.updated_at
      });
    }

  } catch (error) {
    console.error('[inline-edit/save] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
