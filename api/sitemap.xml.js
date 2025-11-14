import citiesData from '../src/data/cities.json' assert { type: 'json' };

export default function handler(req, res) {
  const baseUrl = 'https://www.taxinearme.sk';
  const currentDate = new Date().toISOString();

  // Helper funkcia pre vytvorenie slug z názvu kraja
  const createRegionSlug = (regionName) => {
    return regionName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-');
  };

  // Helper funkcia pre vytvorenie slug z názvu taxislužby
  const createServiceSlug = (serviceName) => {
    return serviceName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  // Získanie unikátnych regiónov
  const regions = [...new Set(citiesData.cities.map(city => city.region))].sort();

  // Začiatok XML sitemap
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // Homepage
  xml += '  <url>\n';
  xml += `    <loc>${baseUrl}/</loc>\n`;
  xml += `    <lastmod>${currentDate}</lastmod>\n`;
  xml += '    <changefreq>daily</changefreq>\n';
  xml += '    <priority>1.0</priority>\n';
  xml += '  </url>\n';

  // Stránky krajov
  regions.forEach(region => {
    const regionSlug = createRegionSlug(region);
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}/kraj/${regionSlug}</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.8</priority>\n';
    xml += '  </url>\n';
  });

  // Stránky miest
  citiesData.cities.forEach(city => {
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}/taxi/${city.slug}</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.9</priority>\n';
    xml += '  </url>\n';

    // Stránky jednotlivých taxislužieb
    if (city.taxiServices && city.taxiServices.length > 0) {
      city.taxiServices.forEach(service => {
        const serviceSlug = createServiceSlug(service.name);
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/taxi/${city.slug}/${serviceSlug}</loc>\n`;
        xml += `    <lastmod>${currentDate}</lastmod>\n`;
        xml += '    <changefreq>monthly</changefreq>\n';
        xml += '    <priority>0.7</priority>\n';
        xml += '  </url>\n';
      });
    }
  });

  // Právne stránky
  const legalPages = [
    { path: '/ochrana-sukromia', priority: '0.3' },
    { path: '/cookies', priority: '0.3' },
    { path: '/podmienky-pouzivania', priority: '0.3' },
    { path: '/kontakt', priority: '0.5' }
  ];

  legalPages.forEach(page => {
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}${page.path}</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += '    <changefreq>monthly</changefreq>\n';
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += '  </url>\n';
  });

  xml += '</urlset>';

  // Nastavenie správnych headers pre XML
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  res.status(200).send(xml);
}
