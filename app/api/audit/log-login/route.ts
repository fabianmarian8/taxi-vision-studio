import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
    // Parse request body to get user info
    const body = await request.json();
    const { userId, userEmail } = body;

    if (!userId || !userEmail) {
      return NextResponse.json({ error: 'Missing user ID or email' }, { status: 400 });
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

    // Insert login event into audit log using the new RPC function
    const { error } = await serviceClient.rpc('log_partner_login', {
      p_user_id: userId,
      p_user_email: userEmail,
      p_ip_address: ipAddress
    });

    if (error) {
      console.error('Error logging login:', error);
      // Don't fail the request, just log the error
      return NextResponse.json({ success: true, logged: false, error: error.message });
    }

    return NextResponse.json({ success: true, logged: true });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json({
      success: true,
      logged: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    });
  }
}