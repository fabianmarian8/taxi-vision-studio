import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { isSuperadmin } from '@/lib/superadmin';
import { normalizePlanType } from '@/lib/tier-config';

/**
 * GET /api/partner/inline-edit/session/[slug]
 *
 * Bootstrap endpoint pre inline editor session.
 * Server je autorita — vráti isOwner, partnerId, workingDraftId, planTier.
 * Ak working draft neexistuje, vytvorí ho (clone z approved alebo prázdny).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ isOwner: false }, { status: 200 });
    }

    const userIsAdmin = isSuperadmin(user.email);

    // Use admin client to bypass RLS
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Find partner by slug
    const { data: partner } = await adminClient
      .from('partners')
      .select('id, user_id, slug, city_slug, plan_type')
      .eq('slug', slug)
      .single();

    if (!partner) {
      return NextResponse.json({ isOwner: false }, { status: 200 });
    }

    const isOwner = partner.user_id === user.id || userIsAdmin;
    if (!isOwner) {
      return NextResponse.json({ isOwner: false }, { status: 200 });
    }

    const planTier = normalizePlanType(partner.plan_type);

    // Find existing working draft (status='draft')
    const { data: existingDraft } = await adminClient
      .from('partner_drafts')
      .select('id, status, company_name, description, phone, email, website, hero_image_url, hero_image_zoom, hero_image_pos_x, hero_image_pos_y, hero_title, hero_subtitle, services, show_services, services_description, gallery, social_facebook, social_instagram, whatsapp, booking_url, pricelist_url, transport_rules_url, contact_url, template_variant, show_description, updated_at')
      .eq('partner_id', partner.id)
      .eq('status', 'draft')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingDraft) {
      return NextResponse.json({
        isOwner: true,
        partnerId: partner.id,
        draftId: existingDraft.id,
        planTier,
        draftData: existingDraft,
      });
    }

    // No working draft — don't create one eagerly.
    // Save route will create it on first actual edit.
    // This prevents dashboard from showing "Rozpracované" when nothing was changed.
    return NextResponse.json({
      isOwner: true,
      partnerId: partner.id,
      draftId: null,
      planTier,
      draftData: null,
    });
  } catch (error) {
    console.error('[session] Error:', error);
    return NextResponse.json({ isOwner: false, error: 'Server error' }, { status: 500 });
  }
}
