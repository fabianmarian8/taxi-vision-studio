// API endpoint to generate XML sitemap
// URL: /api/sitemap.xml

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch cities data from GitHub
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_REPO = process.env.GITHUB_REPO || 'fabianmarian8/taxi-vision-studio';
    
    const citiesResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/src/data/cities.json`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3.raw',
        },
      }
    );

    if (!citiesResponse.ok) {
      throw new Error('Failed to fetch cities data');
    }

    const citiesData = await citiesResponse.json();
    const cities = citiesData.cities || [];
    
    // Generate sitemap XML
    const baseUrl = 'https://www.taxinearme.sk';
    const currentDate = new Date().toISOString().split('T')[0];
    
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    // Homepage
    sitemap += `  <url>\n`;
    sitemap += `    <loc>${baseUrl}/</loc>\n`;
    sitemap += `    <lastmod>${currentDate}</lastmod>\n`;
    sitemap += `    <changefreq>daily</changefreq>\n`;
    sitemap += `    <priority>1.0</priority>\n`;
    sitemap += `  </url>\n`;
    
    // Static pages
    const staticPages = [
      { path: '/ochrana-sukromia', priority: '0.3', changefreq: 'monthly' },
      { path: '/podmienky-pouzivania', priority: '0.3', changefreq: 'monthly' },
      { path: '/kontakt', priority: '0.5', changefreq: 'monthly' },
      { path: '/ako-to-funguje', priority: '0.6', changefreq: 'monthly' }
    ];
    
    staticPages.forEach(page => {
      sitemap += `  <url>\n`;
      sitemap += `    <loc>${baseUrl}${page.path}</loc>\n`;
      sitemap += `    <lastmod>${currentDate}</lastmod>\n`;
      sitemap += `    <changefreq>${page.changefreq}</changefreq>\n`;
      sitemap += `    <priority>${page.priority}</priority>\n`;
      sitemap += `  </url>\n`;
    });
    
    // City pages
    cities.forEach(city => {
      sitemap += `  <url>\n`;
      sitemap += `    <loc>${baseUrl}/taxi/${city.slug}</loc>\n`;
      sitemap += `    <lastmod>${currentDate}</lastmod>\n`;
      sitemap += `    <changefreq>weekly</changefreq>\n`;
      sitemap += `    <priority>0.8</priority>\n`;
      sitemap += `  </url>\n`;
      
      // Individual taxi service pages
      if (city.taxiServices && city.taxiServices.length > 0) {
        city.taxiServices.forEach(service => {
          const serviceSlug = service.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
          
          sitemap += `  <url>\n`;
          sitemap += `    <loc>${baseUrl}/taxi/${city.slug}/${serviceSlug}</loc>\n`;
          sitemap += `    <lastmod>${currentDate}</lastmod>\n`;
          sitemap += `    <changefreq>monthly</changefreq>\n`;
          sitemap += `    <priority>0.6</priority>\n`;
          sitemap += `  </url>\n`;
        });
      }
    });
    
    // Region pages
    const regions = [
      'banskobystricky-kraj',
      'bratislavsky-kraj',
      'kosicky-kraj',
      'nitriansky-kraj',
      'presovsky-kraj',
      'trenciansky-kraj',
      'trnavsky-kraj',
      'zilinsky-kraj'
    ];
    
    regions.forEach(region => {
      sitemap += `  <url>\n`;
      sitemap += `    <loc>${baseUrl}/kraj/${region}</loc>\n`;
      sitemap += `    <lastmod>${currentDate}</lastmod>\n`;
      sitemap += `    <changefreq>weekly</changefreq>\n`;
      sitemap += `    <priority>0.7</priority>\n`;
      sitemap += `  </url>\n`;
    });
    
    sitemap += '</urlset>';
    
    // Set response headers
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    
    return res.status(200).send(sitemap);
    
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return res.status(500).json({ error: 'Failed to generate sitemap' });
  }
}
