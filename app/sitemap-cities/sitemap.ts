/**
 * Sitemap - Mestá s taxi službami (NAJVYŠŠIA PRIORITA)
 *
 * Obsahuje ~155 miest + ich taxislužby (~884)
 * Tieto stránky majú reálny obsah a mali by byť indexované prednostne
 */

import { MetadataRoute } from 'next';
import citiesData from '@/data/cities.json';

export const revalidate = 86400; // 24 hours
export const runtime = 'nodejs';

// Helper funkcia pre vytvorenie slug
const createServiceSlug = (serviceName: string): string => {
  return serviceName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.taxinearme.sk';
  const currentDate = new Date();

  const sitemap: MetadataRoute.Sitemap = [];

  // Stránky miest s taxi službami - NAJVYŠŠIA PRIORITA
  citiesData.cities.forEach((city) => {
    const hasTaxi = city.taxiServices && city.taxiServices.length > 0;

    if (hasTaxi) {
      // Mesto s taxi
      sitemap.push({
        url: `${baseUrl}/taxi/${city.slug}`,
        lastModified: currentDate,
        changeFrequency: 'weekly',
        priority: 0.9,
      });

      // Jednotlivé taxislužby
      city.taxiServices.forEach((service) => {
        const serviceSlug = createServiceSlug(service.name);
        sitemap.push({
          url: `${baseUrl}/taxi/${city.slug}/${serviceSlug}`,
          lastModified: currentDate,
          changeFrequency: 'monthly',
          priority: 0.8,
        });
      });
    }
  });

  return sitemap;
}
