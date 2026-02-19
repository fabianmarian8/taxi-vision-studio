/**
 * Sitemap - Mestá s taxi službami (NAJVYŠŠIA PRIORITA)
 *
 * Obsahuje ~155 miest + ich taxislužby (~884)
 * Tieto stránky majú reálny obsah a mali by byť indexované prednostne
 *
 * Pre obce (isVillage: true) sa používa hierarchická URL štruktúra:
 * /taxi/{regionSlug}/{districtSlug}/{slug}
 */

import { MetadataRoute } from 'next';
import citiesData from '@/data/cities.json';
import { getMunicipalityBySlug } from '@/data/municipalities';
import { getDistrictForMunicipality } from '@/data/districts';
import { createServiceSlug } from '@/utils/urlUtils';

export const revalidate = 86400; // 24 hours
export const runtime = 'nodejs';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.taxinearme.sk';
  // Reálny dátum poslednej aktualizácie dát
  const dataLastUpdated = new Date(citiesData.lastUpdated || '2026-01-15');

  const sitemap: MetadataRoute.Sitemap = [];

  // Stránky miest s taxi službami - NAJVYŠŠIA PRIORITA
  citiesData.cities.forEach((city) => {
    const hasTaxi = city.taxiServices && city.taxiServices.length > 0;

    if (hasTaxi) {
      // Mestá aj dediny s taxi používajú flat URL /taxi/[slug]
      // (route handler redirectuje hierarchické URL na flat pre dediny s taxi)
      const cityUrl = `${baseUrl}/taxi/${city.slug}`;

      // Mesto/obec s taxi
      sitemap.push({
        url: cityUrl,
        lastModified: dataLastUpdated,
        changeFrequency: 'weekly',
        priority: 0.9,
      });

      // Jednotlivé taxislužby - používame rovnakú base URL ako mesto
      city.taxiServices.forEach((service) => {
        const serviceSlug = createServiceSlug(service.name);
        sitemap.push({
          url: `${cityUrl}/${serviceSlug}`,
          lastModified: dataLastUpdated,
          changeFrequency: 'monthly',
          priority: 0.8,
        });
      });
    }
  });

  return sitemap;
}
