import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { createServerClient } from '@supabase/ssr';

// Lazy initialization - only validate when actually used (not at build time)
function getSecretKey(): Uint8Array {
  if (!process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET environment variable is required');
  }
  return new TextEncoder().encode(process.env.SESSION_SECRET);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Partner portal routes and API routes - Supabase auth
  if ((pathname.startsWith('/partner') || pathname.startsWith('/api/partner')) && pathname !== '/partner/login') {
    let response = NextResponse.next({ request });
    const isApiRoute = pathname.startsWith('/api/partner');

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // For API routes, return JSON 401 instead of redirect
      if (isApiRoute) {
        return NextResponse.json(
          { error: 'Neautorizovaný prístup' },
          { status: 401 }
        );
      }
      return NextResponse.redirect(new URL('/partner/login', request.url));
    }

    return response;
  }

  // Protect /admin and /api/admin routes (except login endpoints)
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (pathname === '/admin/login' || pathname === '/api/admin/login') {
      // Allow access to login page and login API
      return NextResponse.next();
    }

    const isApiRoute = pathname.startsWith('/api/admin');

    // First check for legacy JWT session
    const legacySession = request.cookies.get('session')?.value;
    if (legacySession) {
      try {
        await jwtVerify(legacySession, getSecretKey());
        return NextResponse.next();
      } catch {
        // Legacy session invalid, continue to check Supabase auth
      }
    }

    // Check for Supabase auth (for superadmin users)
    let response = NextResponse.next({ request });
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // User is authenticated via Supabase, allow access
      // The API route itself will check if user is superadmin
      return response;
    }

    // No valid session found
    if (isApiRoute) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/partner/:path*',
    '/api/partner/:path*',
  ],
};
