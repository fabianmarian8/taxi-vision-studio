/**
 * Brave Search utility for taxi service discovery.
 * Supports official Brave API and brave_shim proxy (DuckDuckGo fallback).
 *
 * Env vars:
 *   BRAVE_SEARCH_URL - base URL (default: http://localhost:8000)
 *   BRAVE_API_KEY    - optional, for official api.search.brave.com
 */

export interface BraveSearchResult {
  title: string;
  url: string;
  description: string;
}

export interface DiscoveryCandidate {
  name: string;
  phone: string | null;
  phoneNormalized: string | null;
  website: string | null;
  address: string | null;
  sourceUrl: string;
  rawSnippet: string;
  searchQuery: string;
  isNonstop: boolean;
}

const SK_PHONE_REGEX = /(?:\+421|00421|0)[\s.-]?9\d{2}[\s.-]?\d{3}[\s.-]?\d{3}/g;
const SK_LANDLINE_REGEX = /(?:\+421|00421|0)[\s.-]?[2-8]\d[\s.-]?\d{3}[\s.-]?\d{2,4}/g;
const NONSTOP_KEYWORDS = ['nonstop', 'non-stop', 'non stop', '24/7', '24h', '0-24'];

function getBaseUrl(): string {
  return process.env.BRAVE_SEARCH_URL || 'http://localhost:8000';
}

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };
  if (process.env.BRAVE_API_KEY) {
    headers['X-Subscription-Token'] = process.env.BRAVE_API_KEY;
  }
  return headers;
}

export function normalizePhone(phone: string | null): string {
  if (!phone) return '';
  return phone.replace(/[^0-9]/g, '').slice(-9);
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/[^0-9+]/g, '');
  const digits = cleaned.replace(/[^0-9]/g, '');
  if (digits.length === 9) return `+421${digits}`;
  if (digits.startsWith('421') && digits.length === 12) return `+${digits}`;
  if (digits.startsWith('0') && digits.length === 10) return `+421${digits.slice(1)}`;
  return cleaned;
}

function extractPhonesFromText(text: string): string[] {
  const phones: string[] = [];
  const mobileMatches = text.match(SK_PHONE_REGEX) || [];
  const landlineMatches = text.match(SK_LANDLINE_REGEX) || [];
  for (const m of [...mobileMatches, ...landlineMatches]) {
    const cleaned = m.replace(/[\s.-]/g, '');
    phones.push(cleaned);
  }
  return [...new Set(phones)];
}

function detectNonstop(text: string): boolean {
  const lower = text.toLowerCase();
  return NONSTOP_KEYWORDS.some(kw => lower.includes(kw));
}

function cleanTaxiName(title: string): string {
  // Remove common suffixes from search result titles
  return title
    .replace(/\s*[-|]\s*(Azet\.sk|Zlaté Stránky|Firmy\.cz|Google|Facebook|Instagram).*$/i, '')
    .replace(/\s*[-|]\s*Taxi.*$/i, (match) => {
      // Keep "Taxi" in name if it's the core name part
      if (match.toLowerCase().includes('taxi')) return match.replace(/\s*[-|]\s*/, ' - ');
      return '';
    })
    .trim();
}

/**
 * Search Brave/DuckDuckGo for taxi services in a city.
 */
export async function searchBrave(query: string, count: number = 10): Promise<BraveSearchResult[]> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}`;

  const response = await fetch(url, {
    headers: getHeaders(),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`Brave search failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const results: BraveSearchResult[] = (data?.web?.results || []).map((r: Record<string, unknown>) => ({
    title: String(r.title || ''),
    url: String(r.url || ''),
    description: String(r.description || ''),
  }));

  return results;
}

/**
 * Discover taxi services for a given city using Brave Search.
 * Runs multiple search queries and extracts taxi candidates from results.
 */
export async function discoverTaxiServices(
  cityName: string,
  existingNormalizedPhones: Set<string>
): Promise<{ candidates: DiscoveryCandidate[]; apiCalls: number; errors: string[] }> {
  const queries = [
    `taxi ${cityName}`,
    `taxislužba ${cityName} telefón`,
  ];

  const candidates: DiscoveryCandidate[] = [];
  const seenPhones = new Set<string>();
  const seenUrls = new Set<string>();
  let apiCalls = 0;
  const errors: string[] = [];

  for (const query of queries) {
    try {
      const results = await searchBrave(query, 15);
      apiCalls++;

      for (const result of results) {
        // Skip non-relevant results
        const combinedText = `${result.title} ${result.description}`.toLowerCase();
        if (!combinedText.includes('taxi') && !combinedText.includes('taxislužba') && !combinedText.includes('taxisluž')) {
          continue;
        }

        // Skip aggregator/directory pages (we want individual businesses)
        if (result.url.includes('taxinearme.sk') || result.url.includes('zlatestranky.sk')) {
          continue;
        }

        // Skip if we already processed this URL
        if (seenUrls.has(result.url)) continue;
        seenUrls.add(result.url);

        // Extract phones from title + description
        const fullText = `${result.title} ${result.description}`;
        const phones = extractPhonesFromText(fullText);
        const isNonstop = detectNonstop(fullText);
        const name = cleanTaxiName(result.title);

        if (!name) continue;

        if (phones.length > 0) {
          // Create a candidate for each unique phone
          for (const phone of phones) {
            const normalized = normalizePhone(phone);
            if (!normalized) continue;
            if (existingNormalizedPhones.has(normalized)) continue;
            if (seenPhones.has(normalized)) continue;
            seenPhones.add(normalized);

            candidates.push({
              name,
              phone: formatPhone(phone),
              phoneNormalized: normalized,
              website: result.url.includes('azet.sk') || result.url.includes('firmy.cz')
                ? null : result.url,
              address: null,
              sourceUrl: result.url,
              rawSnippet: result.description.slice(0, 500),
              searchQuery: query,
              isNonstop,
            });
          }
        } else {
          // No phone found, still create a candidate if it looks like a taxi business website
          const urlLower = result.url.toLowerCase();
          if (urlLower.includes('taxi') || urlLower.includes('preprava')) {
            if (!seenUrls.has(result.url + ':nophone')) {
              seenUrls.add(result.url + ':nophone');
              candidates.push({
                name,
                phone: null,
                phoneNormalized: null,
                website: result.url,
                address: null,
                sourceUrl: result.url,
                rawSnippet: result.description.slice(0, 500),
                searchQuery: query,
                isNonstop,
              });
            }
          }
        }
      }
    } catch (error) {
      errors.push(`Brave search "${query}": ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return { candidates, apiCalls, errors };
}
