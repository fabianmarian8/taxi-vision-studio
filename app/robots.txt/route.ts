/**
 * Robots.txt API Route
 * Vracia statický robots.txt - obíde Cloudflare modifikáciu
 */

export async function GET() {
  const robotsTxt = `# Robots.txt pre taxinearme.sk

User-Agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

User-Agent: Googlebot
Allow: /

User-Agent: Bingbot
Allow: /
Crawl-delay: 1

User-Agent: Yandex
Allow: /
Crawl-delay: 2

User-Agent: facebookexternalhit
Allow: /

User-Agent: Twitterbot
Allow: /

User-Agent: LinkedInBot
Allow: /

User-Agent: AhrefsBot
Crawl-delay: 10

User-Agent: SemrushBot
Crawl-delay: 10

User-Agent: MJ12bot
Disallow: /

User-Agent: DotBot
Disallow: /

Sitemap: https://www.taxinearme.sk/sitemap.xml
`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
