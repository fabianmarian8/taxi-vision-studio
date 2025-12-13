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

// GET - List all pending drafts for admin
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status') || 'pending';

  const supabase = getAdminClient();

  const { data: drafts, error } = await supabase
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
    .eq('status', status)
    .order('submitted_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ drafts });
}
