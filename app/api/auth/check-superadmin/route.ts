import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSuperadmin } from '@/lib/superadmin';

/**
 * API endpoint to check if current user is a superadmin
 * This runs server-side so it has access to SUPERADMIN_EMAILS env var
 *
 * Cached for 60s per user to reduce serverless function invocations
 */
export async function GET() {
  try {
    const supabase = await createClient();
    // Use getUser() instead of getSession() — getUser() validates JWT server-side
    const { data: { user } } = await supabase.auth.getUser();

    // Cache headers - private (per-user), 60s cache
    const cacheHeaders = {
      'Cache-Control': 'private, max-age=60, stale-while-revalidate=120',
    };

    if (!user) {
      return NextResponse.json(
        { isAdmin: false },
        { headers: cacheHeaders }
      );
    }

    const email = user.email;
    const isAdmin = isSuperadmin(email);

    return NextResponse.json(
      { isAdmin },
      { headers: cacheHeaders }
    );
  } catch (error) {
    console.error('[check-superadmin] Error:', error);
    return NextResponse.json(
      { isAdmin: false, email: null, error: 'Server error' },
      { status: 500 }
    );
  }
}
