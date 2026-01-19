import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { setAuditContext } from '@/lib/audit-context';

// Superadmin emails - can edit ALL partner pages
const SUPERADMIN_EMAILS = [
  'fabianmarian8@gmail.com',
  'fabianmarian8@users.noreply.github.com',
];

// POST /api/partner/inline-edit/publish
// Publikovanie zmien (status -> approved)
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
    const { partner_id, draft_id } = body;

    if (!partner_id || !draft_id) {
      return NextResponse.json({
        success: false,
        error: 'partner_id and draft_id are required'
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

    // Overenie vlastníctva + načítanie partnera (superadmins can publish any)
    let partnerQuery = queryClient
      .from('partners')
      .select('id, slug, city_slug, user_id')
      .eq('id', partner_id);

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

    // Nastaviť audit kontext pred zmenami
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor?.split(',')[0]?.trim() || null;
    await setAuditContext(queryClient, user.id, user.email || null, ipAddress);

    // Aktualizácia statusu na approved - verify that row was actually updated
    const { data: updatedDraft, error: updateError } = await queryClient
      .from('partner_drafts')
      .update({
        status: 'approved',
        submitted_at: new Date().toISOString(),
        reviewed_at: new Date().toISOString() // Self-approved (inline editor)
      })
      .eq('id', draft_id)
      .eq('partner_id', partner_id)
      .select('id')
      .single();

    if (updateError) {
      console.error('[inline-edit/publish] Update error:', updateError);
      return NextResponse.json({
        success: false,
        error: updateError.message
      }, { status: 500 });
    }

    // Verify that we actually updated a row
    if (!updatedDraft) {
      console.error('[inline-edit/publish] No draft found to update:', { draft_id, partner_id });
      return NextResponse.json({
        success: false,
        error: 'Draft not found or already published'
      }, { status: 404 });
    }

    // Revalidácia stránky
    const pagePath = `/taxi/${partner.city_slug}/${partner.slug}`;
    revalidatePath(pagePath);

    console.log('[inline-edit/publish] Published:', {
      partner_id,
      draft_id,
      path: pagePath
    });

    return NextResponse.json({
      success: true,
      revalidated: true,
      path: pagePath
    });

  } catch (error) {
    console.error('[inline-edit/publish] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
