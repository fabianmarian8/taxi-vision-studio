/**
 * City Page - Redirect to Hierarchical URL Structure
 *
 * This route is maintained for backward compatibility only.
 * All URLs are permanently redirected to the new hierarchical structure:
 * /taxi/[citySlug] → /taxi/[regionSlug]/[districtSlug]/[citySlug]
 *
 * Example:
 * /taxi/bratislava → /taxi/bratislavsky-kraj/bratislava/bratislava
 * /taxi/babina → /taxi/banskobystricky-kraj/zvolen/babina
 */

import { notFound, redirect } from 'next/navigation';
import { getCityBySlug, createRegionSlug, slovakCities } from '@/data/cities';
import { getMunicipalityBySlug } from '@/data/municipalities';
import { getDistrictForMunicipality, createDistrictSlug } from '@/data/districts';

// Manual mapping for cities missing from obce.json
const MANUAL_DISTRICT_MAPPING: Record<string, { district: string; region: string }> = {
  bratislava: { district: 'Bratislava', region: 'Bratislavský kraj' },
  kosice: { district: 'Košice', region: 'Košický kraj' },
  hostovce: { district: 'Snina', region: 'Prešovský kraj' }, // Actually "Hostovice" in obce.json
};

// ISR: Revalidate once per week
export const revalidate = 604800;

// Generate static params for main cities only
export function generateStaticParams() {
  return slovakCities.map((city) => ({
    citySlug: city.slug,
  }));
}

// Enable dynamic params for municipalities (ISR)
export const dynamicParams = true;

export default async function LegacyCityPage({
  params,
}: {
  params: Promise<{ citySlug: string }>;
}) {
  const { citySlug } = await params;

  // Check manual mapping first (for cities missing from obce.json)
  const manualMapping = MANUAL_DISTRICT_MAPPING[citySlug];
  if (manualMapping) {
    const regionSlug = createRegionSlug(manualMapping.region);
    const districtSlug = createDistrictSlug(manualMapping.district);
    redirect(`/taxi/${regionSlug}/${districtSlug}/${citySlug}`);
  }

  // Try to find as main city first
  const city = getCityBySlug(citySlug);

  if (city) {
    const regionSlug = createRegionSlug(city.region);
    // Find the district for this city from municipalities data
    const municipality = getMunicipalityBySlug(citySlug);

    if (municipality) {
      const district = getDistrictForMunicipality(municipality);
      if (district) {
        // Permanent redirect (308) to new hierarchical URL
        redirect(`/taxi/${regionSlug}/${district.slug}/${citySlug}`);
      }
    }

    // Fallback: if city exists but no district found, still show 404
    // This shouldn't happen for properly configured cities
    notFound();
  }

  // Try to find as municipality
  const municipality = getMunicipalityBySlug(citySlug);

  if (municipality) {
    const regionSlug = createRegionSlug(municipality.region);
    const district = getDistrictForMunicipality(municipality);

    if (district) {
      // Permanent redirect (308) to new hierarchical URL
      redirect(`/taxi/${regionSlug}/${district.slug}/${citySlug}`);
    }

    // Fallback: if municipality exists but no district, show 404
    notFound();
  }

  // 404 if neither city nor municipality found
  notFound();
}
