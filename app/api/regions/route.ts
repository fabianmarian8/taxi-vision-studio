import { NextResponse } from 'next/server';
import citiesData from '../../../src/data/cities.json';

interface CityData {
  name: string;
  slug: string;
  region: string;
  isVillage?: boolean;
}

interface RegionData {
  name: string;
  slug: string;
  citiesCount: number;
}

// Helper function to create slug from region name
const createRegionSlug = (regionName: string): string => {
  return regionName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-');
};

// Pre-compute regions data at module load (cached by Next.js)
const cities = citiesData.cities as CityData[];

const uniqueRegions = Array.from(new Set(cities.map((city) => city.region))).sort();

const regionsData: RegionData[] = uniqueRegions.map((region) => ({
  name: region,
  slug: createRegionSlug(region),
  citiesCount: cities.filter((city) => city.region === region && !city.isVillage).length,
}));

export async function GET() {
  return NextResponse.json(regionsData, {
    headers: {
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
