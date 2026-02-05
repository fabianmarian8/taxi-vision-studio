import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSession } from '@/lib/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getServiceClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }
  return createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');
  const table = searchParams.get('table') || null;
  const operation = searchParams.get('operation') || null;
  const userId = searchParams.get('user_id') || null;

  // Use RPC function to access audit schema (SECURITY DEFINER)
  const { data, error } = await supabase.rpc('get_audit_log', {
    p_limit: limit,
    p_offset: offset,
    p_table: table,
    p_operation: operation,
    p_user_id: userId
  });

  if (error) {
    console.error('Error fetching audit log:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Extract total_count from first row (window function)
  const total = data && data.length > 0 ? Number(data[0].total_count) : 0;

  return NextResponse.json({
    logs: data || [],
    total,
    limit,
    offset,
  });
}
