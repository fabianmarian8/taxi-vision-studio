/**
 * Sitemap Index
 * Meta-sitemap odkazujúca na všetky jednotlivé sitemapy
 *
 * Generuje XML podľa Google Sitemap Protocol:
 * https://www.sitemaps.org/protocol.html#index
 *
 * URL: /sitemap-index.xml
 */

export async function GET() {
  const baseUrl = 'https://www.taxinearme.sk';
  // Reálny dátum poslednej aktualizácie datasetu
  const lastmod = '2026-01-15T17:30:00.000Z';

  // Definícia všetkých sitemap
  const sitemaps = [
    {
      loc: `${baseUrl}/sitemap.xml`,
      lastmod,
    },
    {
      loc: `${baseUrl}/sitemap-cities/sitemap.xml`,
      lastmod,
    },
    {
      loc: `${baseUrl}/sitemap-municipalities/sitemap.xml`,
      lastmod,
    },
    {
      loc: `${baseUrl}/sitemap-routes/sitemap.xml`,
      lastmod,
    },
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps
  .map(
    (sitemap) => `  <sitemap>
    <loc>${sitemap.loc}</loc>
    <lastmod>${sitemap.lastmod}</lastmod>
  </sitemap>`
  )
  .join('\n')}
</sitemapindex>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
