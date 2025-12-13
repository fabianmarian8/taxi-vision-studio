import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create admin client with service role
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

interface Props {
  params: Promise<{ id: string }>;
}

// GET - Get single draft
export async function GET(request: NextRequest, { params }: Props) {
  const { id } = await params;
  const supabase = getAdminClient();

  const { data: draft, error } = await supabase
    .from('partner_drafts')
    .select(`
      *,
      partners (
        id,
        name,
        slug,
        city_slug,
        email
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ draft });
}

// PATCH - Approve or reject draft
export async function PATCH(request: NextRequest, { params }: Props) {
  const { id } = await params;
  const body = await request.json();
  const { action, admin_notes } = body;

  if (!action || !['approve', 'reject'].includes(action)) {
    return NextResponse.json(
      { error: 'Invalid action. Must be "approve" or "reject".' },
      { status: 400 }
    );
  }

  const supabase = getAdminClient();

  const newStatus = action === 'approve' ? 'approved' : 'rejected';

  const { data: draft, error } = await supabase
    .from('partner_drafts')
    .update({
      status: newStatus,
      admin_notes: admin_notes || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: 'admin', // TODO: Get actual admin name
    })
    .eq('id', id)
    .select(`
      *,
      partners (
        id,
        name,
        slug,
        city_slug,
        email
      )
    `)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // TODO: Send email notification to partner
  // TODO: If approved, update the actual taxi service data in cities.json

  return NextResponse.json({
    success: true,
    draft,
    message: action === 'approve' ? 'Draft approved successfully' : 'Draft rejected',
  });
}
