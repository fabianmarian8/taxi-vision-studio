import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'default-secret-change-in-production'
);

export async function middleware(request: NextRequest) {
  // Protect /admin routes (except /admin/login)
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (request.nextUrl.pathname === '/admin/login') {
      // Allow access to login page
      return NextResponse.next();
    }

    const session = request.cookies.get('session')?.value;

    if (!session) {
      // Redirect to login if no session
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    try {
      // Verify session
      await jwtVerify(session, SECRET_KEY);
      return NextResponse.next();
    } catch (error) {
      console.error('Session verification failed in middleware:', error);
      // Redirect to login if session is invalid
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
