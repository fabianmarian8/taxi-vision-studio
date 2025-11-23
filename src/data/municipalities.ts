import municipalitiesData from '../../slovenske-obce-main/obce.json';
import { slovakCities, CityData } from './cities';
import { calculateDistance } from '@/utils/geo';

export interface Municipality {
  name: string;
  district: string;
  region: string;
  latitude: number;
  longitude: number;
  slug: string;
}

// Transform obce.json format (x,y) to our format (latitude, longitude)
const allMunicipalities: Municipality[] = municipalitiesData.map((item: any) => {
  const slug = item.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  return {
    name: item.name,
    district: item.district,
    region: item.region,
    latitude: item.x,
    longitude: item.y,
    slug,
  };
});

/**
 * Get municipality by slug
 */
export function getMunicipalityBySlug(slug: string): Municipality | undefined {
  return allMunicipalities.find((m) => m.slug === slug);
}

/**
 * Find nearest city with taxi services
 * @param municipality The municipality to search from
 * @param limit How many nearest cities to return
 * @returns Array of cities sorted by distance
 */
export function findNearestCitiesWithTaxis(
  municipality: Municipality,
  limit: number = 3
): Array<{ city: CityData; distance: number }> {
  // Only consider cities that have taxi services
  const citiesWithTaxis = slovakCities.filter(
    (city) => city.taxiServices && city.taxiServices.length > 0 && city.latitude && city.longitude
  );

  // Calculate distances
  const citiesWithDistances = citiesWithTaxis.map((city) => ({
    city,
    distance: calculateDistance(
      { latitude: municipality.latitude, longitude: municipality.longitude },
      { latitude: city.latitude!, longitude: city.longitude! }
    ),
  }));

  // Sort by distance and return top N
  return citiesWithDistances.sort((a, b) => a.distance - b.distance).slice(0, limit);
}

/**
 * Check if slug is a municipality (not in main cities list)
 */
export function isMunicipality(slug: string): boolean {
  const isMainCity = slovakCities.some((city) => city.slug === slug);
  const isMunicipality = allMunicipalities.some((m) => m.slug === slug);
  return !isMainCity && isMunicipality;
}

export { allMunicipalities };
