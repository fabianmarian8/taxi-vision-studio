/**
 * Cloudflare Worker for SEO Meta Tag Injection - taxinearme.sk
 * 
 * This worker detects search engine bots and injects proper meta tags
 * and structured data into the HTML before serving it.
 */

// List of bot user agents that should receive enhanced HTML
const BOT_USER_AGENTS = [
  'googlebot',
  'google-inspectiontool',
  'bingbot',
  'yandex',
  'baiduspider',
  'duckduckbot',
  'slurp',
  'facebookexternalhit',
  'twitterbot',
  'linkedinbot',
  'whatsapp',
  'discord',
  'slackbot',
  'embedly',
  'pinterest',
];

/**
 * Check if the request is from a bot
 */
function isBot(request) {
  const userAgent = (request.headers.get('User-Agent') || '').toLowerCase();
  return BOT_USER_AGENTS.some(bot => userAgent.includes(bot));
}

/**
 * Check if the request wants HTML
 */
function wantsHTML(request) {
  const accept = request.headers.get('Accept') || '';
  return accept.includes('text/html');
}

/**
 * Generate meta tags for city pages
 */
function generateCityMetaTags(citySlug, cityData) {
  const cityName = cityData.name;
  const taxiCount = cityData.taxiServiceCount || 0;
  const region = cityData.region || '';
  
  const title = `Taxi ${cityName} - ${taxiCount} Taxislužieb | Taxi NearMe`;
  const description = cityData.metaDescription || `Nájdite taxi v meste ${cityName}. ${taxiCount} taxislužieb s telefónnymi číslami a webovými stránkami. Kontaktujte priamo.`;
  const keywords = cityData.keywords || `taxi ${cityName}, taxislužby ${cityName}, taxi slovensko`;
  const canonical = `https://www.taxinearme.sk/taxi/${citySlug}`;
  
  return {
    title,
    description,
    keywords,
    canonical,
    ogTitle: title,
    ogDescription: description,
    ogUrl: canonical,
  };
}

/**
 * Generate meta tags for region pages
 */
function generateRegionMetaTags(regionSlug, regionData) {
  const regionName = regionData.name;
  const cityCount = regionData.cityCount || 0;
  
  const title = `Taxi ${regionName} - ${cityCount} Miest | Taxi NearMe`;
  const description = `Nájdite taxi v kraji ${regionName}. Zoznam ${cityCount} miest s taxislužbami. Kompletná databáza taxislužieb.`;
  const keywords = `taxi ${regionName}, taxislužby ${regionName}, taxi slovensko`;
  const canonical = `https://www.taxinearme.sk/kraj/${regionSlug}`;
  
  return {
    title,
    description,
    keywords,
    canonical,
    ogTitle: title,
    ogDescription: description,
    ogUrl: canonical,
  };
}

/**
 * Inject meta tags into HTML
 */
function injectMetaTags(html, metaTags) {
  // Replace title
  html = html.replace(
    /<title>.*?<\/title>/i,
    `<title>${metaTags.title}</title>`
  );
  
  // Replace or inject meta description
  if (html.includes('name="description"')) {
    html = html.replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="description" content="${metaTags.description}" />`
    );
  } else {
    html = html.replace(
      '</head>',
      `    <meta name="description" content="${metaTags.description}" />\n  </head>`
    );
  }
  
  // Replace or inject meta keywords
  if (html.includes('name="keywords"')) {
    html = html.replace(
      /<meta\s+name="keywords"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="keywords" content="${metaTags.keywords}" />`
    );
  } else {
    html = html.replace(
      '</head>',
      `    <meta name="keywords" content="${metaTags.keywords}" />\n  </head>`
    );
  }
  
  // Replace canonical URL
  if (html.includes('rel="canonical"')) {
    html = html.replace(
      /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
      `<link rel="canonical" href="${metaTags.canonical}" />`
    );
  } else {
    html = html.replace(
      '</head>',
      `    <link rel="canonical" href="${metaTags.canonical}" />\n  </head>`
    );
  }
  
  // Replace Open Graph tags
  html = html.replace(
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:title" content="${metaTags.ogTitle}" />`
  );
  html = html.replace(
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:description" content="${metaTags.ogDescription}" />`
  );
  
  // Inject og:url if not present
  if (!html.includes('property="og:url"')) {
    html = html.replace(
      '</head>',
      `    <meta property="og:url" content="${metaTags.ogUrl}" />\n  </head>`
    );
  } else {
    html = html.replace(
      /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:url" content="${metaTags.ogUrl}" />`
    );
  }
  
  // Replace Twitter card tags
  html = html.replace(
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:title" content="${metaTags.ogTitle}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:description" content="${metaTags.ogDescription}" />`
  );
  
  return html;
}

/**
 * Fetch city data from cities.json
 */
async function fetchCityData(citySlug) {
  try {
    const response = await fetch('https://www.taxinearme.sk/cities.json');
    if (!response.ok) return null;
    
    const cities = await response.json();
    return cities.find(city => city.slug === citySlug) || null;
  } catch (error) {
    console.error('[PRERENDER] Error fetching city data:', error);
    return null;
  }
}

/**
 * Main Worker handler
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Only process GET requests
    if (request.method !== 'GET') {
      return fetch(request);
    }
    
    // Check if this is a bot requesting HTML
    const isBotRequest = isBot(request) && wantsHTML(request);
    
    // If not a bot, serve normally
    if (!isBotRequest) {
      return fetch(request);
    }
    
    // Parse the URL to determine page type
    const pathname = url.pathname;
    let metaTags = null;
    
    // City page: /taxi/{citySlug}
    if (pathname.startsWith('/taxi/')) {
      const citySlug = pathname.split('/')[2];
      if (citySlug) {
        const cityData = await fetchCityData(citySlug);
        if (cityData) {
          metaTags = generateCityMetaTags(citySlug, cityData);
        }
      }
    }
    
    // Region page: /kraj/{regionSlug}
    // For now, we'll skip region pages as we don't have region data structure
    
    // If no meta tags to inject, serve normally
    if (!metaTags) {
      return fetch(request);
    }
    
    // Create cache key
    const cacheKey = new Request(url.toString(), {
      method: 'GET',
      headers: { 'Accept': 'text/html' }
    });
    
    // Check cache first
    const cache = caches.default;
    let cachedResponse = await cache.match(cacheKey);
    
    if (cachedResponse) {
      console.log(`[PRERENDER] Cache HIT for ${pathname}`);
      const newHeaders = new Headers(cachedResponse.headers);
      newHeaders.set('X-Prerender-Cache', 'HIT');
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        headers: newHeaders,
      });
    }
    
    console.log(`[PRERENDER] Cache MISS for ${pathname}, injecting meta tags...`);
    
    try {
      // Fetch the original page
      const response = await fetch(request);
      
      if (!response.ok) {
        console.log(`[PRERENDER] Origin returned ${response.status}, passing through`);
        return response;
      }
      
      // Get the HTML
      let html = await response.text();
      
      // Inject meta tags
      html = injectMetaTags(html, metaTags);
      
      // Create response with cache headers
      const prerenderResponse = new Response(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
          'Vary': 'Accept-Encoding, User-Agent',
          'X-Prerendered': 'true',
          'X-Prerender-Cache': 'MISS',
        },
      });
      
      // Cache the response
      ctx.waitUntil(cache.put(cacheKey, prerenderResponse.clone()));
      
      return prerenderResponse;
      
    } catch (error) {
      console.error(`[PRERENDER] Error processing ${pathname}:`, error);
      // Fall back to origin on error
      return fetch(request);
    }
  },
};
