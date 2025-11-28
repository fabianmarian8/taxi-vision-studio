/**
 * Sitemap - Next.js App Router
 *
 * Migrované z: api/sitemap.xml.js
 *
 * Next.js automaticky generuje /sitemap.xml z tohto súboru
 */

import { MetadataRoute } from 'next';
import citiesData from '@/data/cities.json';
import { allMunicipalities } from '@/data/municipalities';
import { getDistrictForMunicipality, getAllDistricts } from '@/data/districts';
import { createRegionSlug } from '@/data/cities';

// Performance optimization: Cache sitemap for 24 hours
export const revalidate = 86400; // 24 hours in seconds

// Use Node.js runtime for better performance with large data
export const runtime = 'nodejs';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.taxinearme.sk';
  const currentDate = new Date();

  // Helper funkcia pre vytvorenie slug z názvu taxislužby (cached)
  const slugCache = new Map<string, string>();
  const createServiceSlug = (serviceName: string): string => {
    if (slugCache.has(serviceName)) {
      return slugCache.get(serviceName)!;
    }
    const slug = serviceName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    slugCache.set(serviceName, slug);
    return slug;
  };

  // Získanie unikátnych regiónov
  const regions = [...new Set(citiesData.cities.map((city) => city.region))].sort();

  // Pre-allocate array s približným počtom URL (performance)
  const sitemap: MetadataRoute.Sitemap = [];

  // Homepage
  sitemap.push({
    url: baseUrl,
    lastModified: currentDate,
    changeFrequency: 'daily',
    priority: 1.0,
  });

  // Stránky krajov
  regions.forEach((region) => {
    const regionSlug = createRegionSlug(region);
    sitemap.push({
      url: `${baseUrl}/kraj/${regionSlug}`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  });

  // Stránky okresov - /taxi/[regionSlug]/[districtSlug]
  const districts = getAllDistricts();
  districts.forEach((district) => {
    sitemap.push({
      url: `${baseUrl}/taxi/${district.regionSlug}/${district.slug}`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.75,
    });
  });

  // Stránky miest
  citiesData.cities.forEach((city) => {
    sitemap.push({
      url: `${baseUrl}/taxi/${city.slug}`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    });

    // Stránky jednotlivých taxislužieb
    if (city.taxiServices && city.taxiServices.length > 0) {
      city.taxiServices.forEach((service) => {
        const serviceSlug = createServiceSlug(service.name);
        sitemap.push({
          url: `${baseUrl}/taxi/${city.slug}/${serviceSlug}`,
          lastModified: currentDate,
          changeFrequency: 'monthly',
          priority: 0.7,
        });
      });
    }
  });

  // Právne stránky
  const legalPages = [
    { path: '/ochrana-sukromia', priority: 0.3 },
    { path: '/cookies', priority: 0.3 },
    { path: '/podmienky-pouzivania', priority: 0.3 },
    { path: '/kontakt', priority: 0.5 },
  ];

  legalPages.forEach((page) => {
    sitemap.push({
      url: `${baseUrl}${page.path}`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: page.priority,
    });
  });

  // Blog články
  const blogArticles = [
    '/hodnotenie-vodicov',
    '/alkohol-nocny-zivot',
    '/co-musi-zniest-vodic',
    '/elektrifikacia-taxi',
    '/komunikacia-taxikar-zakaznik',
    '/navigacia',
    '/psychologia-zakaznikov',
    '/taxi-ceny',
    '/komplexny-sprievodca-taxi',
    '/temna-strana-bolt-uber',
    '/porovnanie-cien-taxi-2024-2025',
    '/prieskum-cien-taxisluzieb-slovensko-2025', // Redirect na porovnanie-cien-taxi-2024-2025
  ];

  blogArticles.forEach((article) => {
    sitemap.push({
      url: `${baseUrl}${article}`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    });
  });

  // Pridanie všetkých slovenských obcí (~2900) v hierarchickom formáte
  // /taxi/[kraj]/[okres]/[obec]
  // Filtrujeme duplicity - obce, ktoré už sú v Tier 1 mestách
  const existingSlugs = new Set(citiesData.cities.map((c) => c.slug));

  allMunicipalities.forEach((obec) => {
    // Pridať iba ak už nie je pokryté v hlavnom zozname miest
    if (!existingSlugs.has(obec.slug)) {
      // Získať district pre správny hierarchický URL formát
      const district = getDistrictForMunicipality(obec);

      if (district) {
        // Hierarchický formát: /taxi/[regionSlug]/[districtSlug]/[municipalitySlug]
        sitemap.push({
          url: `${baseUrl}/taxi/${district.regionSlug}/${district.slug}/${obec.slug}`,
          lastModified: currentDate,
          changeFrequency: 'monthly',
          priority: 0.5,
        });
      }
    }
  });

  return sitemap;
}
