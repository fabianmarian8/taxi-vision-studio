/**
 * Azet.sk taxi service scraper.
 * Extracted from /app/api/admin/azet-scraper/route.ts for shared use.
 */

import * as https from 'https';

export interface AzetService {
  name: string;
  phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  description: string | null;
  azet_url: string;
  azet_id: string;
}

export interface ScrapeResult {
  services: AzetService[];
  totalFound: number;
  duplicatesSkipped: number;
  errors: string[];
}

// Azet.sk reklamne/sprostredkovatelske cisla - IGNOROVAT
const AZET_BLACKLISTED_PHONES = [
  '516588045',
  '421516588045',
  '+421516588045',
];

function isMobilePhone(phone: string): boolean {
  const cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('09') && cleaned.length === 10) return true;
  if (cleaned.startsWith('4219') && cleaned.length === 12) return true;
  if (cleaned.startsWith('9') && cleaned.length === 9) return true;
  return false;
}

function isBlacklistedPhone(phone: string): boolean {
  const cleaned = phone.replace(/[^0-9]/g, '');
  return AZET_BLACKLISTED_PHONES.some(bp => {
    const bpCleaned = bp.replace(/[^0-9]/g, '');
    return cleaned.includes(bpCleaned) || bpCleaned.includes(cleaned);
  });
}

export function fetchUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'sk,en-US;q=0.9,en;q=0.8'
      }
    }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchUrl(res.headers.location).then(resolve).catch(reject);
        return;
      }
      let data = '';
      res.on('data', (chunk: string) => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

function extractCompanyLinks(html: string): { name: string; url: string; id: string }[] {
  const results: { name: string; url: string; id: string }[] = [];
  const regex = /href="(https:\/\/www\.azet\.sk\/firma\/(\d+)\/[^"]+\/)"[^>]*>([^<]+)<\/a>/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const url = match[1];
    const id = match[2];
    const name = match[3].trim();
    if (!results.some(r => r.id === id) && name && name.length > 1) {
      results.push({ name, url, id });
    }
  }
  return results;
}

function extractCompanyDetails(html: string, url: string): AzetService | null {
  const idMatch = url.match(/\/firma\/(\d+)\//);
  const azet_id = idMatch ? idMatch[1] : '';

  const nameMatch = html.match(/itemprop="name"[^>]*>([^<]+)/);
  const name = nameMatch ? nameMatch[1].trim() : '';
  if (!name) return null;

  const allPhones: string[] = [];
  const telMatches = html.matchAll(/href="tel:([^"]+)"/g);
  for (const match of telMatches) {
    allPhones.push(match[1]);
  }
  const textMatches = html.matchAll(/(\+421|0)\s*\d{3}\s*\d{3}\s*\d{3}/g);
  for (const match of textMatches) {
    allPhones.push(match[0].replace(/\s/g, ''));
  }

  const validPhones = allPhones.filter(p => !isBlacklistedPhone(p));
  const mobilePhones = validPhones.filter(p => isMobilePhone(p));
  const landlinePhones = validPhones.filter(p => !isMobilePhone(p));

  let phone: string | null = null;
  if (mobilePhones.length > 0) {
    phone = mobilePhones[0];
  } else if (landlinePhones.length > 0) {
    phone = landlinePhones[0];
  }

  const streetMatch = html.match(/itemprop="streetAddress">([^<]+)/);
  const postalMatch = html.match(/itemprop="postalCode">([^<]+)/);
  const localityMatch = html.match(/itemprop="addressLocality">([^<]+)/);

  const address = streetMatch ? streetMatch[1].trim() : null;
  const postalCode = postalMatch ? postalMatch[1].trim() : null;
  const city = localityMatch ? localityMatch[1].trim() : null;

  const descMatch = html.match(/itemprop="description"[^>]*>([^<]+)/);
  const description = descMatch ? descMatch[1].trim() : null;

  let website: string | null = null;
  const mainLinkMatch = html.match(/class="mainLink"[^>]*href="(https?:\/\/[^"?]+)/);
  if (mainLinkMatch) {
    let cleanUrl = mainLinkMatch[1];
    if (cleanUrl.startsWith('http://')) {
      cleanUrl = cleanUrl.replace('http://', 'https://');
    }
    website = cleanUrl;
  }
  if (!website) {
    const urlMatch = html.match(/itemprop="url"[^>]*href="(https?:\/\/[^"?]+)/);
    if (urlMatch && !urlMatch[1].includes('azet.sk') && !urlMatch[1].includes('aimg.sk')) {
      website = urlMatch[1];
    }
  }

  return { name, phone, website, address, city, postalCode, description, azet_url: url, azet_id };
}

export function normalizePhone(phone: string | null): string {
  if (!phone) return '';
  return phone.replace(/[^0-9]/g, '').slice(-9);
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.length === 9) return `+421${cleaned}`;
  if (cleaned.startsWith('421')) return `+${cleaned}`;
  if (cleaned.startsWith('0')) return `+421${cleaned.slice(1)}`;
  return phone;
}

/**
 * Scrape Azet.sk for taxi services in a given city.
 * Returns unique services not matching existingPhones.
 */
export async function scrapeAzetForCity(
  cityName: string,
  existingPhones: string[]
): Promise<ScrapeResult> {
  const results: AzetService[] = [];
  const seenIds = new Set<string>();
  const errors: string[] = [];
  const searchQuery = encodeURIComponent('taxi');
  const cityQuery = encodeURIComponent(cityName);
  let totalFound = 0;

  for (let page = 1; page <= 2; page++) {
    const pageParam = page > 1 ? `&p=${page}` : '';
    const url = `https://www.azet.sk/katalog/vyhladavanie/firmy/?q=${searchQuery}&k=${cityQuery}${pageParam}`;

    try {
      const html = await fetchUrl(url);
      const companies = extractCompanyLinks(html);
      const newCompanies = companies.filter(c => {
        if (seenIds.has(c.id)) return false;
        seenIds.add(c.id);
        return true;
      });

      if (newCompanies.length === 0) break;
      totalFound += newCompanies.length;

      for (const company of newCompanies) {
        try {
          await new Promise(resolve => setTimeout(resolve, 300));
          const detailHtml = await fetchUrl(company.url);
          const details = extractCompanyDetails(detailHtml, company.url);

          if (details && details.name.toLowerCase().includes('taxi')) {
            const normalizedPhone = normalizePhone(details.phone);
            const existingNormalized = existingPhones.map(p => normalizePhone(p));

            if (!normalizedPhone || !existingNormalized.includes(normalizedPhone)) {
              if (details.phone) {
                details.phone = formatPhoneNumber(details.phone);
              }
              results.push(details);
            }
          }
        } catch {
          errors.push(`Failed to fetch detail: ${company.url}`);
        }
      }
    } catch {
      errors.push(`Failed to fetch page ${page} for ${cityName}`);
      break;
    }
  }

  // Filter duplicates by phone within results
  const uniqueResults: AzetService[] = [];
  const seenPhones = new Set<string>();
  let duplicatesSkipped = 0;

  for (const service of results) {
    const normalized = normalizePhone(service.phone);
    if (!normalized || !seenPhones.has(normalized)) {
      if (normalized) seenPhones.add(normalized);
      uniqueResults.push(service);
    } else {
      duplicatesSkipped++;
    }
  }

  return {
    services: uniqueResults,
    totalFound,
    duplicatesSkipped,
    errors,
  };
}
