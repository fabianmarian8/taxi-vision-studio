import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getCityBySlug, slovakCities } from '@/data/cities';
import type { CityData } from '@/data/cities';
import fs from 'fs/promises';
import path from 'path';

// GET - načítanie mesta
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    console.log('[API] GET /api/admin/cities/[slug] - START');

    const session = await getSession();
    if (!session) {
      console.log('[API] No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;
    console.log('[API] Looking for city with slug:', slug);
    console.log('[API] Total cities available:', slovakCities.length);

    const city = getCityBySlug(slug);
    console.log('[API] City found:', city ? 'YES' : 'NO');

    if (!city) {
      console.log('[API] City not found - returning 404');
      console.log('[API] First 5 slugs:', slovakCities.slice(0, 5).map(c => c.slug));

      // Return detailed debug info in response
      return NextResponse.json({
        error: 'City not found',
        debug: {
          requestedSlug: slug,
          totalCities: slovakCities.length,
          sampleSlugs: slovakCities.slice(0, 10).map(c => c.slug),
          possibleMatches: slovakCities
            .filter(c => c.slug.includes(slug.substring(0, 5)))
            .map(c => ({ name: c.name, slug: c.slug }))
        }
      }, { status: 404 });
    }

    console.log('[API] Returning city:', city.name);
    return NextResponse.json(city);
  } catch (error) {
    console.error('[API] CRITICAL ERROR:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

// PUT - aktualizácia mesta
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    console.log('[API] PUT /api/admin/cities/[slug] - START');

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;
    console.log('[API] Updating city:', slug);

    const updatedCity: CityData = await request.json();

    // Načítaj cities.json
    const citiesPath = path.join(process.cwd(), 'src/data/cities.json');
    const fileContent = await fs.readFile(citiesPath, 'utf-8');
    const data = JSON.parse(fileContent);

    // Nájdi a aktualizuj mesto
    const cityIndex = data.cities.findIndex((c: CityData) => c.slug === slug);

    if (cityIndex === -1) {
      console.log('[API] City not found for update:', slug);
      return NextResponse.json({ error: 'City not found' }, { status: 404 });
    }

    data.cities[cityIndex] = updatedCity;
    data.lastUpdated = new Date().toISOString();

    // Ulož späť do súboru
    await fs.writeFile(citiesPath, JSON.stringify(data, null, 2), 'utf-8');

    console.log('[API] City updated successfully:', slug);
    return NextResponse.json({ success: true, city: updatedCity });
  } catch (error) {
    console.error('[API] Error updating city:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE - vymazanie mesta
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    console.log('[API] DELETE /api/admin/cities/[slug] - START');

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;
    console.log('[API] Deleting city:', slug);

    // Načítaj cities.json
    const citiesPath = path.join(process.cwd(), 'src/data/cities.json');
    const fileContent = await fs.readFile(citiesPath, 'utf-8');
    const data = JSON.parse(fileContent);

    // Odstráň mesto
    const cityIndex = data.cities.findIndex((c: CityData) => c.slug === slug);

    if (cityIndex === -1) {
      console.log('[API] City not found for deletion:', slug);
      return NextResponse.json({ error: 'City not found' }, { status: 404 });
    }

    data.cities.splice(cityIndex, 1);
    data.lastUpdated = new Date().toISOString();

    // Ulož späť do súboru
    await fs.writeFile(citiesPath, JSON.stringify(data, null, 2), 'utf-8');

    console.log('[API] City deleted successfully:', slug);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Error deleting city:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
