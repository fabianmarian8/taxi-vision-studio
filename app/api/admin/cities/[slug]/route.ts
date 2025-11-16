import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getCityBySlug } from '@/data/cities';
import type { CityData } from '@/data/cities';
import fs from 'fs/promises';
import path from 'path';

// GET - načítanie mesta
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = await params;
  const city = getCityBySlug(slug);

  if (!city) {
    return NextResponse.json({ error: 'City not found' }, { status: 404 });
  }

  return NextResponse.json(city);
}

// PUT - aktualizácia mesta
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { slug } = await params;
    const updatedCity: CityData = await request.json();

    // Načítaj cities.json
    const citiesPath = path.join(process.cwd(), 'src/data/cities.json');
    const fileContent = await fs.readFile(citiesPath, 'utf-8');
    const data = JSON.parse(fileContent);

    // Nájdi a aktualizuj mesto
    const cityIndex = data.cities.findIndex((c: CityData) => c.slug === slug);

    if (cityIndex === -1) {
      return NextResponse.json({ error: 'City not found' }, { status: 404 });
    }

    data.cities[cityIndex] = updatedCity;
    data.lastUpdated = new Date().toISOString();

    // Ulož späť do súboru
    await fs.writeFile(citiesPath, JSON.stringify(data, null, 2), 'utf-8');

    return NextResponse.json({ success: true, city: updatedCity });
  } catch (error) {
    console.error('Error updating city:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - vymazanie mesta
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { slug } = await params;

    // Načítaj cities.json
    const citiesPath = path.join(process.cwd(), 'src/data/cities.json');
    const fileContent = await fs.readFile(citiesPath, 'utf-8');
    const data = JSON.parse(fileContent);

    // Odstráň mesto
    const cityIndex = data.cities.findIndex((c: CityData) => c.slug === slug);

    if (cityIndex === -1) {
      return NextResponse.json({ error: 'City not found' }, { status: 404 });
    }

    data.cities.splice(cityIndex, 1);
    data.lastUpdated = new Date().toISOString();

    // Ulož späť do súboru
    await fs.writeFile(citiesPath, JSON.stringify(data, null, 2), 'utf-8');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting city:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
