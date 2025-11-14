/**
 * Cloudflare Worker for Prerendering taxinearme.sk
 * 
 * This worker detects search engine bots and serves them fully rendered HTML
 * with proper meta tags and structured data, while serving the normal React SPA to humans.
 */

// List of bot user agents that should receive prerendered HTML
const BOT_USER_AGENTS = [
  'googlebot',
  'google-inspectiontool',
  'bingbot',
  'yandex',
  'baiduspider',
  'duckduckbot',
  'slurp', // Yahoo
  'facebookexternalhit',
  'twitterbot',
  'linkedinbot',
  'whatsapp',
  'discord',
  'slackbot',
  'embedly',
  'pinterest',
  'quora',
];

// Routes that should be prerendered
const PRERENDER_ROUTES = [
  '/',
  '/taxi/',
  '/kraj/',
  '/ochrana-sukromia',
  '/podmienky-pouzivania',
  '/kontakt',
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
 * Check if the route should be prerendered
 */
function shouldPrerender(url) {
  const pathname = url.pathname;
  return PRERENDER_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Wait for the page to be fully loaded and React to render
 */
async function waitForReact(page) {
  // Wait for React root to be populated
  await page.waitForSelector('#root > *', { timeout: 10000 });
  
  // Wait for network to be idle (all resources loaded)
  await page.waitForLoadState('networkidle', { timeout: 10000 });
  
  // Additional wait for React hydration
  await page.waitForTimeout(2000);
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
    const shouldPrerenderRoute = shouldPrerender(url);
    
    // If not a bot or not a prerenderable route, serve normally
    if (!isBotRequest || !shouldPrerenderRoute) {
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
      console.log(`[PRERENDER] Cache HIT for ${url.pathname}`);
      return cachedResponse;
    }
    
    console.log(`[PRERENDER] Cache MISS for ${url.pathname}, rendering...`);
    
    try {
      // Fetch the original page
      const response = await fetch(request);
      
      if (!response.ok) {
        console.log(`[PRERENDER] Origin returned ${response.status}, passing through`);
        return response;
      }
      
      // Get the HTML
      let html = await response.text();
      
      // For now, we'll serve the original HTML with cache headers
      // In production, you would use Cloudflare Browser Rendering here
      // to fully render the React app
      
      // Create response with cache headers
      const prerenderResponse = new Response(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=600, s-maxage=600, stale-while-revalidate=86400',
          'Vary': 'Accept-Encoding, User-Agent',
          'X-Prerendered': 'true',
          'X-Prerender-Cache': 'MISS',
        },
      });
      
      // Cache the response
      ctx.waitUntil(cache.put(cacheKey, prerenderResponse.clone()));
      
      return prerenderResponse;
      
    } catch (error) {
      console.error(`[PRERENDER] Error rendering ${url.pathname}:`, error);
      // Fall back to origin on error
      return fetch(request);
    }
  },
};
