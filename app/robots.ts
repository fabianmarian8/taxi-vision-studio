/**
 * Robots.txt - Next.js App Router
 *
 * Migrované z: api/robots.txt.js
 *
 * Next.js automaticky generuje /robots.txt z tohto súboru
 */

import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://www.taxinearme.sk';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Blokujeme len admin panel a API routes (nie verejný obsah)
        disallow: ['/admin/', '/api/'],
        crawlDelay: 1,
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        crawlDelay: 0,
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        crawlDelay: 1,
      },
      {
        userAgent: 'Yandex',
        allow: '/',
        crawlDelay: 2,
      },
      {
        userAgent: ['facebookexternalhit', 'Twitterbot', 'LinkedInBot'],
        allow: '/',
      },
      {
        userAgent: 'AhrefsBot',
        crawlDelay: 10,
      },
      {
        userAgent: 'SemrushBot',
        crawlDelay: 10,
      },
      {
        userAgent: ['MJ12bot', 'DotBot'],
        disallow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
