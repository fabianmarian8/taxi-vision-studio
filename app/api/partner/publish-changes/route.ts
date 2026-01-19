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

    // Získať IP adresu
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor?.split(',')[0]?.trim() || null;

    let newDraftId = draft_id;

    // DEBUG: Log user info pre audit
    console.log('[publish-changes] DEBUG User:', {
      user_id: user.id,
      user_email: user.email,
      isSuperadmin: userIsSuperadmin
    });

    if (draft_id) {
      // Update existing draft cez RPC s audit parametrami
      const { data, error } = await queryClient.rpc('update_partner_draft_with_audit', {
        p_draft_id: draft_id,
        p_partner_id: partner_id,
        p_changes: draftData,
        p_user_id: user.id,
        p_user_email: user.email || null,
        p_ip_address: ipAddress
      });

      if (error) {
        console.error('[publish-changes] RPC update error:', error);
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 500 });
      }

      if (!data?.success) {
        console.error('[publish-changes] Update failed:', data?.error);
        return NextResponse.json({
          success: false,
          error: data?.error || 'Update failed'
        }, { status: 500 });
      }

      newDraftId = data.draft_id;
    } else {
      // Insert new draft cez RPC s audit parametrami
      const { data, error } = await queryClient.rpc('insert_partner_draft_with_audit', {
        p_partner_id: partner_id,
        p_changes: draftData,
        p_user_id: user.id,
        p_user_email: user.email || null,
        p_ip_address: ipAddress
      });

      if (error) {
        console.error('[publish-changes] RPC insert error:', error);
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 500 });
      }

      if (!data?.success) {
        console.error('[publish-changes] Insert failed:', data?.error);
        return NextResponse.json({
          success: false,
          error: data?.error || 'Insert failed'
        }, { status: 500 });
      }

      newDraftId = data.draft_id;
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
