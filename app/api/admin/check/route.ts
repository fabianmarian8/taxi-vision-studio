import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

// Disable caching for this route
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();

  const headers = {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
  };

  if (!session) {
    return NextResponse.json({ isAdmin: false }, { headers });
  }

  return NextResponse.json({
    isAdmin: true,
    username: session.username,
  }, { headers });
}
