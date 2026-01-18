import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { isSuperadmin } from '@/lib/superadmin';

// POST /api/partner/publish-changes
// Uloženie a publikovanie zmien (pre partner editor)
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
    const { partner_id, draft_id, formData } = body;

    if (!partner_id || !formData) {
      return NextResponse.json({
        success: false,
        error: 'partner_id and formData are required'
      }, { status: 400 });
    }

    // Check if user is superadmin
    const userIsSuperadmin = isSuperadmin(user.email);

    // Use admin client for superadmins to bypass RLS
    const queryClient = userIsSuperadmin
      ? createAdminClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
      : supabase;

    // Overenie vlastníctva + načítanie partnera
    let partnerQuery = queryClient
      .from('partners')
      .select('id, slug, city_slug, user_id')
      .eq('id', partner_id);

    if (!userIsSuperadmin) {
      partnerQuery = partnerQuery.eq('user_id', user.id);
    }

    const { data: partner, error: partnerError } = await partnerQuery.single();

    if (partnerError || !partner) {
      return NextResponse.json({
        success: false,
        error: 'Not owner or partner not found'
      }, { status: 403 });
    }

    // Priprav draft data
    const draftData = {
      partner_id: partner_id,
      status: 'approved' as const,
      ...formData,
      submitted_at: new Date().toISOString(),
      reviewed_at: new Date().toISOString(),
    };

    let result;
    let newDraftId = draft_id;

    if (draft_id) {
      // Update existing draft
      result = await queryClient
        .from('partner_drafts')
        .update(draftData)
        .eq('id', draft_id)
        .select('id')
        .single();
    } else {
      // Insert new draft
      result = await queryClient
        .from('partner_drafts')
        .insert(draftData)
        .select('id')
        .single();

      if (result.data?.id) {
        newDraftId = result.data.id;
      }
    }

    if (result.error) {
      console.error('[publish-changes] Error:', result.error);
      return NextResponse.json({
        success: false,
        error: result.error.message
      }, { status: 500 });
    }

    // Revalidácia stránky
    const pagePath = `/taxi/${partner.city_slug}/${partner.slug}`;
    revalidatePath(pagePath);

    console.log('[publish-changes] Published:', {
      partner_id,
      draft_id: newDraftId,
      path: pagePath,
      by_superadmin: userIsSuperadmin
    });

    return NextResponse.json({
      success: true,
      draft_id: newDraftId,
      revalidated: true,
      path: pagePath
    });

  } catch (error) {
    console.error('[publish-changes] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
