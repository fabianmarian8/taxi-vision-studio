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
    const { data: { session } } = await supabase.auth.getSession();

    // Cache headers - private (per-user), 60s cache
    const cacheHeaders = {
      'Cache-Control': 'private, max-age=60, stale-while-revalidate=120',
    };

    if (!session?.user) {
      return NextResponse.json(
        { isAdmin: false, email: null },
        { headers: cacheHeaders }
      );
    }

    const email = session.user.email;
    const isAdmin = isSuperadmin(email);

    return NextResponse.json(
      {
        isAdmin,
        email,
        userId: session.user.id
      },
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
