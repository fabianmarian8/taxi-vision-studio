// API endpoint to serve robots.txt
// URL: /api/robots.txt

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const robotsTxt = `# robots.txt for taxinearme.sk

User-agent: *
Allow: /
Disallow: /admin/
Disallow: /scraper/
Disallow: /api/

# Sitemap
Sitemap: https://www.taxinearme.sk/api/sitemap.xml

# Crawl-delay for polite bots
Crawl-delay: 1

# Allow Google and Bing to crawl everything except admin
User-agent: Googlebot
Allow: /
Disallow: /admin/
Disallow: /scraper/

User-agent: Bingbot
Allow: /
Disallow: /admin/
Disallow: /scraper/

# Block bad bots
User-agent: AhrefsBot
Crawl-delay: 10

User-agent: SemrushBot
Crawl-delay: 10

User-agent: MJ12bot
Disallow: /

User-agent: DotBot
Disallow: /
`;

  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
  
  return res.status(200).send(robotsTxt);
}
