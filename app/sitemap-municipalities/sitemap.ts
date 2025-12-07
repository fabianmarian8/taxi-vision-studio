/**
 * Sitemap - Obce (~2900)
 *
 * Nižšia priorita - navigačné stránky k mestám s taxi
 * Starší lastmod aby Google necrawloval príliš často
 */

import { MetadataRoute } from 'next';
import citiesData from '@/data/cities.json';
import { allMunicipalities } from '@/data/municipalities';
import { getDistrictForMunicipality } from '@/data/districts';

export const revalidate = 86400; // 24 hours
export const runtime = 'nodejs';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.taxinearme.sk';
  // Obce boli vytvorené pred 2 mesiacmi - starší lastmod
  const municipalitiesDate = new Date('2024-10-01');

  const sitemap: MetadataRoute.Sitemap = [];

  // Filtrujeme obce, ktoré už sú pokryté v mestách
  const existingSlugs = new Set(citiesData.cities.map((c) => c.slug));

  allMunicipalities.forEach((obec) => {
    // Pridať iba ak už nie je pokryté v hlavnom zozname miest
    if (!existingSlugs.has(obec.slug)) {
      const district = getDistrictForMunicipality(obec);

      if (district) {
        // Hierarchický formát: /taxi/[regionSlug]/[districtSlug]/[municipalitySlug]
        sitemap.push({
          url: `${baseUrl}/taxi/${district.regionSlug}/${district.slug}/${obec.slug}`,
          lastModified: municipalitiesDate,
          changeFrequency: 'monthly',
          priority: 0.3,
        });
      }
    }
  });

  return sitemap;
}
