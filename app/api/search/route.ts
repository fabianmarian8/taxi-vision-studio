import { NextRequest, NextResponse } from 'next/server';
import citiesData from '../../../src/data/cities.json';
import locationsData from '../../../src/data/locations.json';
import municipalitiesData from '../../../slovenske-obce-main/obce.json';
import postalCodesData from '../../../src/data/villages-psc.json';

interface SearchResult {
  name: string;
  region: string;
  district?: string;
  slug: string;
  type: 'city' | 'municipality' | 'location';
  taxiCount?: number;
}

// Helper function to generate slug from text
const toSlug = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

// Normalize text - remove diacritics and convert to lowercase
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

// Check if input looks like postal code (PSC)
const looksLikePostalCode = (input: string): boolean => {
  const cleaned = input.replace(/\s/g, '');
  return /^\d{3,5}$/.test(cleaned);
};

// Normalize postal code format
const normalizePostalCode = (psc: string): string => {
  const cleaned = psc.replace(/\s/g, '');
  if (cleaned.length === 5) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
  }
  return cleaned;
};

// Pre-compute city slugs for duplicate detection
const citySlugs = new Set(
  (citiesData.cities as Array<{ slug: string }>).map((c) => c.slug)
);

// Pre-compute municipality slug counts
const slugCount = new Map<string, number>();
(municipalitiesData as Array<{ name: string }>).forEach((item) => {
  const baseSlug = toSlug(item.name);
  slugCount.set(baseSlug, (slugCount.get(baseSlug) || 0) + 1);
});

// Build PSC lookup map
interface PostalCodeEntry {
  id: number;
  fullname: string;
  shortname: string;
  zip: string | number;
  district_id: number;
  region_id: number;
}

const pscMap = new Map<string, { name: string; slug: string }>();
(postalCodesData as PostalCodeEntry[]).forEach((item) => {
  const zipStr = String(item.zip).replace(/\s/g, '');
  // Check if city exists, otherwise use municipality slug
  const matchingCity = (citiesData.cities as Array<{ name: string; slug: string }>).find(
    (c) => c.name.toLowerCase() === item.fullname.toLowerCase()
  );
  const slug = matchingCity ? matchingCity.slug : toSlug(item.fullname);
  pscMap.set(zipStr, { name: item.fullname, slug });
});

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q')?.trim() || '';
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20);

  if (!query) {
    return NextResponse.json([], {
      headers: {
        'Cache-Control': 'public, max-age=60',
      },
    });
  }

  const results: SearchResult[] = [];

  // Check if searching by postal code (PSC)
  if (looksLikePostalCode(query)) {
    const cleanedPsc = query.replace(/\s/g, '');
    const pscResult = pscMap.get(cleanedPsc);
    if (pscResult) {
      const normalizedPsc = normalizePostalCode(query);
      results.push({
        name: pscResult.name,
        region: `PSC ${normalizedPsc}`,
        slug: pscResult.slug,
        type: 'city',
      });
      return NextResponse.json(results, {
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        },
      });
    }
  }

  const normalizedQuery = normalizeText(query);

  // Search in cities (with taxi services)
  const cities = citiesData.cities as Array<{
    name: string;
    slug: string;
    region: string;
    taxiServices?: Array<unknown>;
    isVillage?: boolean;
  }>;

  for (const city of cities) {
    if (normalizeText(city.name).includes(normalizedQuery)) {
      results.push({
        name: city.name,
        region: city.region,
        slug: city.slug,
        type: city.isVillage ? 'municipality' : 'city',
        taxiCount: city.taxiServices?.length || 0,
      });
    }
    if (results.length >= limit) break;
  }

  // Search in locations (resorts, POI)
  if (results.length < limit) {
    const locations = locationsData as Array<{
      name: string;
      region: string;
      district?: string;
      slug: string;
    }>;

    for (const loc of locations) {
      if (normalizeText(loc.name).includes(normalizedQuery)) {
        results.push({
          name: loc.name,
          region: loc.region,
          district: loc.district,
          slug: loc.slug,
          type: 'location',
        });
      }
      if (results.length >= limit) break;
    }
  }

  // Search in municipalities (without taxi services)
  if (results.length < limit) {
    const municipalities = municipalitiesData as Array<{
      name: string;
      district: string;
      region: string;
    }>;

    const seenSlugs = new Set(results.map((r) => r.slug));

    for (const mun of municipalities) {
      if (normalizeText(mun.name).includes(normalizedQuery)) {
        const baseSlug = toSlug(mun.name);
        const isDuplicateSlug = (slugCount.get(baseSlug) || 0) > 1;
        const slug = isDuplicateSlug
          ? toSlug(`${mun.name}-${mun.district}`)
          : baseSlug;

        // Skip if already in results or is a main city
        if (seenSlugs.has(slug) || citySlugs.has(slug)) continue;
        seenSlugs.add(slug);

        results.push({
          name: mun.name,
          region: mun.region,
          district: mun.district,
          slug,
          type: 'municipality',
        });
      }
      if (results.length >= limit) break;
    }
  }

  return NextResponse.json(results, {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
