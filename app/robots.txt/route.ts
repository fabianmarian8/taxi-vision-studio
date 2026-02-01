/**
 * Robots.txt API Route
 * Plná kontrola nad obsahom vrátane Crawl-delay
 *
 * Obíde Cloudflare modifikáciu a poskytuje:
 * - Pravidlá pre hlavné vyhľadávače
 * - Crawl-delay pre SEO nástroje
 * - Blokovanie škodlivých botov
 * - Všetky sitemapy vrátane sitemap-index
 */

export async function GET() {
  const baseUrl = 'https://www.taxinearme.sk';

  const robotsTxt = `# Robots.txt pre taxinearme.sk
# Generované: ${new Date().toISOString().split('T')[0]}

# === HLAVNÉ VYHĽADÁVAČE ===
User-Agent: Googlebot
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /_next/static/

User-Agent: Bingbot
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /_next/static/
Crawl-delay: 1

User-Agent: Yandex
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /_next/static/
Crawl-delay: 2

# === SOCIAL MEDIA BOTY ===
User-Agent: facebookexternalhit
Allow: /

User-Agent: Twitterbot
Allow: /

User-Agent: LinkedInBot
Allow: /

# === SEO NÁSTROJE (spomalené) ===
User-Agent: AhrefsBot
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /_next/static/
Crawl-delay: 10

User-Agent: SemrushBot
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /_next/static/
Crawl-delay: 10

# === BLOKOVANÉ BOTY ===
User-Agent: MJ12bot
Disallow: /

User-Agent: DotBot
Disallow: /

User-Agent: PetalBot
Disallow: /

User-Agent: BLEXBot
Disallow: /

# === VŠETCI OSTATNÍ ===
User-Agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /_next/static/

# === SITEMAPY ===
# Sitemap Index (odporúčané pre Google)
Sitemap: ${baseUrl}/sitemap-index.xml

# Jednotlivé sitemapy
Sitemap: ${baseUrl}/sitemap.xml
Sitemap: ${baseUrl}/sitemap-cities/sitemap.xml
Sitemap: ${baseUrl}/sitemap-municipalities/sitemap.xml
Sitemap: ${baseUrl}/sitemap-routes/sitemap.xml
`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
