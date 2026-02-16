import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { scrapeAzetForCity } from '@/lib/azet-scraper';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { cityName, existingPhones = [] } = await request.json();

    if (!cityName) {
      return NextResponse.json({ error: 'City name is required' }, { status: 400 });
    }

    const result = await scrapeAzetForCity(cityName, existingPhones);

    return NextResponse.json({
      success: true,
      services: result.services,
      count: result.services.length,
    });
  } catch (error) {
    console.error('Azet scraper error:', error);
    return NextResponse.json({ error: 'Scraper failed' }, { status: 500 });
  }
}
