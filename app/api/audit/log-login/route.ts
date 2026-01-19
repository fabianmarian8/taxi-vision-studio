import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getServiceClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }
  return createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });
}

export async function POST(request: NextRequest) {
  try {
    // Get current user from session
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get IP address from headers
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';

    // Use service client to write to audit log
    const serviceClient = getServiceClient();
    if (!serviceClient) {
      return NextResponse.json({ error: 'Service not configured' }, { status: 500 });
    }

    // Insert login event into audit log
    const { error } = await serviceClient.rpc('log_partner_login', {
      p_user_id: user.id,
      p_user_email: user.email,
      p_ip_address: ipAddress
    });

    if (error) {
      console.error('Error logging login:', error);
      // Don't fail the request, just log the error
      return NextResponse.json({ success: true, logged: false });
    }

    return NextResponse.json({ success: true, logged: true });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ success: true, logged: false });
  }
}
