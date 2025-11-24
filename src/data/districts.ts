import municipalitiesData from '../../slovenske-obce-main/obce.json';
import { Municipality, allMunicipalities } from './municipalities';
import { createRegionSlug } from './cities';

export interface District {
  name: string;
  slug: string;
  region: string;
  regionSlug: string;
  municipalitiesCount: number;
}

/**
 * Create slug from district name
 */
export function createDistrictSlug(districtName: string): string {
  return districtName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/\s+/g, '-'); // Replace spaces with dashes
}

/**
 * Get all unique districts with their data
 */
export function getAllDistricts(): District[] {
  // Create a map to group municipalities by district
  const districtMap = new Map<string, { region: string; count: number }>();

  municipalitiesData.forEach((item: { name: string; district: string; region: string }) => {
    if (!districtMap.has(item.district)) {
      districtMap.set(item.district, { region: item.region, count: 0 });
    }
    const data = districtMap.get(item.district)!;
    data.count++;
  });

  // Convert map to array of District objects
  const districts: District[] = [];
  districtMap.forEach((data, districtName) => {
    districts.push({
      name: districtName,
      slug: createDistrictSlug(districtName),
      region: data.region,
      regionSlug: createRegionSlug(data.region),
      municipalitiesCount: data.count,
    });
  });

  // Sort by name
  return districts.sort((a, b) => a.name.localeCompare(b.name, 'sk'));
}

/**
 * Get districts by region
 */
export function getDistrictsByRegion(regionName: string): District[] {
  const allDistricts = getAllDistricts();
  return allDistricts.filter((district) => district.region === regionName);
}

/**
 * Get district by slug (considering it might be in different regions)
 * Returns the first match or undefined if not found
 */
export function getDistrictBySlug(districtSlug: string): District | undefined {
  const allDistricts = getAllDistricts();
  return allDistricts.find((district) => district.slug === districtSlug);
}

/**
 * Get district by slug within a specific region
 */
export function getDistrictBySlugAndRegion(
  districtSlug: string,
  regionSlug: string
): District | undefined {
  const allDistricts = getAllDistricts();
  return allDistricts.find(
    (district) => district.slug === districtSlug && district.regionSlug === regionSlug
  );
}

/**
 * Get all municipalities in a specific district
 */
export function getMunicipalitiesByDistrict(districtName: string): Municipality[] {
  return allMunicipalities
    .filter((municipality) => municipality.district === districtName)
    .sort((a, b) => a.name.localeCompare(b.name, 'sk'));
}

/**
 * Get all municipalities in a district by slug
 */
export function getMunicipalitiesByDistrictSlug(districtSlug: string): Municipality[] {
  const district = getDistrictBySlug(districtSlug);
  if (!district) return [];
  return getMunicipalitiesByDistrict(district.name);
}

/**
 * Check if a district slug exists
 */
export function isDistrictSlug(slug: string): boolean {
  return getAllDistricts().some((district) => district.slug === slug);
}

/**
 * Get district data for a municipality
 */
export function getDistrictForMunicipality(municipality: Municipality): District | undefined {
  return getAllDistricts().find((district) => district.name === municipality.district);
}
