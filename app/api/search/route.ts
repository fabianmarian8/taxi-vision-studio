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

interface ScoredSearchResult extends SearchResult {
  score: number;
  typeRank: number;
}

interface CityEntry {
  name: string;
  slug: string;
  region: string;
  taxiServices?: Array<unknown>;
  isVillage?: boolean;
  normalizedName: string;
  normalizedRegion: string;
}

interface LocationEntry {
  name: string;
  region: string;
  district?: string;
  slug: string;
  normalizedName: string;
  normalizedRegion: string;
  normalizedDistrict: string;
}

interface MunicipalityEntry {
  name: string;
  district: string;
  region: string;
  normalizedName: string;
  normalizedDistrict: string;
  normalizedRegion: string;
}

interface PostalCodeEntry {
  id: number;
  fullname: string;
  shortname: string;
  zip: string | number;
  district_id: number;
  region_id: number;
}

const MAX_RESULTS_LIMIT = 20;
const DEFAULT_LIMIT = 10;
const SEARCH_CACHE_TTL_MS = 60 * 1000;
const SEARCH_CACHE_MAX_ENTRIES = 200;

const TYPE_RANK: Record<SearchResult['type'], number> = {
  city: 3,
  location: 2,
  municipality: 1,
};

// Small in-memory cache for hottest queries.
// ISR/cache headers still apply for CDN; this helps per-instance latency.
const searchCache = new Map<string, { expiresAt: number; results: SearchResult[] }>();

const toSlug = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const normalizeText = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const looksLikePostalCode = (input: string): boolean => /^\d{3,5}$/.test(input.replace(/\s/g, ''));

const normalizePostalCode = (psc: string): string => {
  const cleaned = psc.replace(/\s/g, '');
  if (cleaned.length === 5) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
  }
  return cleaned;
};

const getMatchScore = (normalizedQuery: string, normalizedTarget: string): number => {
  if (!normalizedQuery || !normalizedTarget) return -1;
  if (normalizedTarget === normalizedQuery) return 1000;

  if (normalizedTarget.startsWith(normalizedQuery)) {
    return 900 - Math.min(normalizedTarget.length - normalizedQuery.length, 80);
  }

  const words = normalizedTarget.split(/[\s-]+/);
  const wordIndex = words.findIndex((word) => word.startsWith(normalizedQuery));
  if (wordIndex >= 0) {
    return 780 - wordIndex * 10;
  }

  const containsIndex = normalizedTarget.indexOf(normalizedQuery);
  if (containsIndex >= 0) {
    return 600 - Math.min(containsIndex, 250);
  }

  return -1;
};

const cities = (citiesData.cities as Array<{
  name: string;
  slug: string;
  region: string;
  taxiServices?: Array<unknown>;
  isVillage?: boolean;
}>).map((city): CityEntry => ({
  ...city,
  normalizedName: normalizeText(city.name),
  normalizedRegion: normalizeText(city.region),
}));

const locations = (locationsData as Array<{
  name: string;
  region: string;
  district?: string;
  slug: string;
}>).map((location): LocationEntry => ({
  ...location,
  normalizedName: normalizeText(location.name),
  normalizedRegion: normalizeText(location.region),
  normalizedDistrict: normalizeText(location.district || ''),
}));

const municipalities = (municipalitiesData as Array<{
  name: string;
  district: string;
  region: string;
}>).map((municipality): MunicipalityEntry => ({
  ...municipality,
  normalizedName: normalizeText(municipality.name),
  normalizedDistrict: normalizeText(municipality.district),
  normalizedRegion: normalizeText(municipality.region),
}));

const citySlugs = new Set(cities.map((city) => city.slug));

const slugCount = new Map<string, number>();
municipalities.forEach((municipality) => {
  const baseSlug = toSlug(municipality.name);
  slugCount.set(baseSlug, (slugCount.get(baseSlug) || 0) + 1);
});

const cityNameToSlug = new Map(cities.map((city) => [city.name.toLowerCase(), city.slug]));

const pscMap = new Map<string, { name: string; slug: string }>();
(postalCodesData as PostalCodeEntry[]).forEach((item) => {
  const zipStr = String(item.zip).replace(/\s/g, '');
  const slug = cityNameToSlug.get(item.fullname.toLowerCase()) || toSlug(item.fullname);
  pscMap.set(zipStr, { name: item.fullname, slug });
});

function cleanupSearchCache(now: number): void {
  for (const [key, value] of searchCache.entries()) {
    if (value.expiresAt <= now) {
      searchCache.delete(key);
    }
  }

  if (searchCache.size <= SEARCH_CACHE_MAX_ENTRIES) return;

  const entriesByExpiry = Array.from(searchCache.entries()).sort(
    (a, b) => a[1].expiresAt - b[1].expiresAt
  );
  const entriesToRemove = entriesByExpiry.slice(0, searchCache.size - SEARCH_CACHE_MAX_ENTRIES);
  entriesToRemove.forEach(([key]) => searchCache.delete(key));
}

function getCachedResults(key: string, now: number): SearchResult[] | null {
  const cached = searchCache.get(key);
  if (!cached) return null;
  if (cached.expiresAt <= now) {
    searchCache.delete(key);
    return null;
  }
  return cached.results;
}

function setCachedResults(key: string, results: SearchResult[], now: number): void {
  cleanupSearchCache(now);
  searchCache.set(key, {
    results,
    expiresAt: now + SEARCH_CACHE_TTL_MS,
  });
}

function upsertResult(
  resultsBySlug: Map<string, ScoredSearchResult>,
  result: SearchResult,
  score: number
): void {
  if (score < 0) return;

  const candidate: ScoredSearchResult = {
    ...result,
    score,
    typeRank: TYPE_RANK[result.type],
  };

  const existing = resultsBySlug.get(result.slug);
  if (!existing) {
    resultsBySlug.set(result.slug, candidate);
    return;
  }

  const candidateTaxiCount = candidate.taxiCount || 0;
  const existingTaxiCount = existing.taxiCount || 0;

  const shouldReplace =
    candidate.score > existing.score ||
    (candidate.score === existing.score && candidate.typeRank > existing.typeRank) ||
    (candidate.score === existing.score &&
      candidate.typeRank === existing.typeRank &&
      candidateTaxiCount > existingTaxiCount);

  if (shouldReplace) {
    resultsBySlug.set(result.slug, candidate);
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q')?.trim() || '';
  const parsedLimit = Number.parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10);
  const limit =
    Number.isFinite(parsedLimit) && parsedLimit > 0
      ? Math.min(parsedLimit, MAX_RESULTS_LIMIT)
      : DEFAULT_LIMIT;

  if (!query) {
    return NextResponse.json([], {
      headers: {
        'Cache-Control': 'public, max-age=60',
      },
    });
  }

  // Fast path for postal codes.
  if (looksLikePostalCode(query)) {
    const cleanedPsc = query.replace(/\s/g, '');
    const pscResult = pscMap.get(cleanedPsc);
    if (pscResult) {
      const normalizedPsc = normalizePostalCode(query);
      return NextResponse.json(
        [
          {
            name: pscResult.name,
            region: `PSC ${normalizedPsc}`,
            slug: pscResult.slug,
            type: 'city',
          } satisfies SearchResult,
        ],
        {
          headers: {
            'Cache-Control': 'public, max-age=3600, s-maxage=3600',
          },
        }
      );
    }
  }

  const normalizedQuery = normalizeText(query);
  const cacheKey = `${normalizedQuery}:${limit}`;
  const now = Date.now();
  const cached = getCachedResults(cacheKey, now);
  if (cached) {
    return NextResponse.json(cached, {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  }

  const resultsBySlug = new Map<string, ScoredSearchResult>();

  for (const city of cities) {
    const nameScore = getMatchScore(normalizedQuery, city.normalizedName);
    const regionScore = getMatchScore(normalizedQuery, city.normalizedRegion);
    const score = Math.max(nameScore, regionScore > -1 ? regionScore - 250 : -1);

    upsertResult(
      resultsBySlug,
      {
        name: city.name,
        region: city.region,
        slug: city.slug,
        type: city.isVillage ? 'municipality' : 'city',
        taxiCount: city.taxiServices?.length || 0,
      },
      score + Math.min(city.taxiServices?.length || 0, 15)
    );
  }

  for (const location of locations) {
    const nameScore = getMatchScore(normalizedQuery, location.normalizedName);
    const districtScore = getMatchScore(normalizedQuery, location.normalizedDistrict);
    const regionScore = getMatchScore(normalizedQuery, location.normalizedRegion);

    const score = Math.max(
      nameScore,
      districtScore > -1 ? districtScore - 180 : -1,
      regionScore > -1 ? regionScore - 220 : -1
    );

    upsertResult(
      resultsBySlug,
      {
        name: location.name,
        region: location.region,
        district: location.district,
        slug: location.slug,
        type: 'location',
      },
      score
    );
  }

  for (const municipality of municipalities) {
    const nameScore = getMatchScore(normalizedQuery, municipality.normalizedName);
    const districtScore = getMatchScore(normalizedQuery, municipality.normalizedDistrict);
    const regionScore = getMatchScore(normalizedQuery, municipality.normalizedRegion);

    const score = Math.max(
      nameScore,
      districtScore > -1 ? districtScore - 170 : -1,
      regionScore > -1 ? regionScore - 220 : -1
    );

    if (score < 0) continue;

    const baseSlug = toSlug(municipality.name);
    const isDuplicateSlug = (slugCount.get(baseSlug) || 0) > 1;
    const slug = isDuplicateSlug
      ? toSlug(`${municipality.name}-${municipality.district}`)
      : baseSlug;

    // A municipality slug that is also a main city should stay mapped to city page.
    if (citySlugs.has(slug)) continue;

    upsertResult(
      resultsBySlug,
      {
        name: municipality.name,
        region: municipality.region,
        district: municipality.district,
        slug,
        type: 'municipality',
      },
      score
    );
  }

  const results = Array.from(resultsBySlug.values())
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.typeRank !== a.typeRank) return b.typeRank - a.typeRank;
      if ((b.taxiCount || 0) !== (a.taxiCount || 0)) {
        return (b.taxiCount || 0) - (a.taxiCount || 0);
      }
      return a.name.localeCompare(b.name, 'sk');
    })
    .slice(0, limit)
    .map(({ score: _score, typeRank: _typeRank, ...result }) => result);

  setCachedResults(cacheKey, results, now);

  return NextResponse.json(results, {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
