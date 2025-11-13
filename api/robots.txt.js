export default function handler(req, res) {
  const baseUrl = 'https://taxinearme.sk';

  const robotsTxt = `# Robots.txt pre taxinearme.sk
# Generované dynamicky pre optimálne SEO

# Povolenie pre všetkých botov
User-agent: *
Allow: /

# Blokovanie admin sekcií
Disallow: /admin/
Disallow: /scraper

# Blokovanie API endpointov (nie sú potrebné pre indexovanie)
Disallow: /api/

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Crawl delay pre lepšiu performance
Crawl-delay: 1

# Špecifické nastavenia pre hlavných vyhľadávačov
User-agent: Googlebot
Allow: /
Crawl-delay: 0

User-agent: Bingbot
Allow: /
Crawl-delay: 1

User-agent: Yandex
Allow: /
Crawl-delay: 2

# Social media bots
User-agent: facebookexternalhit
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: LinkedInBot
Allow: /

# Blokovanie škodlivých botov
User-agent: AhrefsBot
Crawl-delay: 10

User-agent: SemrushBot
Crawl-delay: 10

User-agent: MJ12bot
Disallow: /

User-agent: DotBot
Disallow: /
`;

  // Nastavenie správnych headers pre text/plain
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
  res.status(200).send(robotsTxt);
}
