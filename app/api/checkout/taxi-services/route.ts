import { NextRequest, NextResponse } from 'next/server';
import citiesData from '@/data/cities.json';

interface TaxiService {
  name: string;
  isPremium?: boolean;
  isPromotional?: boolean;
  isPartner?: boolean;
}

interface City {
  name: string;
  slug: string;
  taxiServices: TaxiService[];
}

export async function GET(request: NextRequest) {
  const citySlug = request.nextUrl.searchParams.get('city');

  // Return all cities (slug + name) if no city specified
  if (!citySlug) {
    const cities = (citiesData as { cities: City[] }).cities
      .map((c) => ({ slug: c.slug, name: c.name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'sk'));

    return NextResponse.json({ cities });
  }

  // Find city and return its taxi services
  const city = (citiesData as { cities: City[] }).cities.find(
    (c) => c.slug === citySlug
  );

  if (!city) {
    return NextResponse.json({ error: 'City not found' }, { status: 404 });
  }

  // Return only non-promotional premium names (exclude paid premium/partner from dropdown)
  const services = city.taxiServices.map((t) => ({
    name: t.name,
    hasPaidSubscription: t.isPremium && !t.isPromotional,
    isPartner: t.isPartner || false,
  }));

  return NextResponse.json({
    city: { slug: city.slug, name: city.name },
    services,
  });
}
