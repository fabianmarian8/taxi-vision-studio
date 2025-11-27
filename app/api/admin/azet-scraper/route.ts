import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import * as https from 'https';

interface AzetService {
  name: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  description: string | null;
  azet_url: string;
  azet_id: string;
}

// Simple fetch using native https
function fetchUrl(url: string): Promise<string> {
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

// Extract company links from search results
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

// Extract details from company detail page
function extractCompanyDetails(html: string, url: string): AzetService | null {
  const idMatch = url.match(/\/firma\/(\d+)\//);
  const azet_id = idMatch ? idMatch[1] : '';

  const nameMatch = html.match(/itemprop="name"[^>]*>([^<]+)</);
  const name = nameMatch ? nameMatch[1].trim() : '';

  if (!name) return null;

  const phoneMatch = html.match(/href="tel:([^"]+)"/);
  let phone = phoneMatch ? phoneMatch[1] : null;

  if (!phone) {
    const phoneMatch2 = html.match(/(\+421|0)\s*\d{3}\s*\d{3}\s*\d{3}/);
    phone = phoneMatch2 ? phoneMatch2[0].replace(/\s/g, '') : null;
  }

  const streetMatch = html.match(/itemprop="streetAddress">([^<]+)</);
  const postalMatch = html.match(/itemprop="postalCode">([^<]+)</);
  const localityMatch = html.match(/itemprop="addressLocality">([^<]+)</);

  const address = streetMatch ? streetMatch[1].trim() : null;
  const postalCode = postalMatch ? postalMatch[1].trim() : null;
  const city = localityMatch ? localityMatch[1].trim() : null;

  const descMatch = html.match(/itemprop="description"[^>]*>([^<]+)</);
  const description = descMatch ? descMatch[1].trim() : null;

  return { name, phone, address, city, postalCode, description, azet_url: url, azet_id };
}

// Normalize phone for comparison
function normalizePhone(phone: string | null): string {
  if (!phone) return '';
  return phone.replace(/[^0-9]/g, '').slice(-9);
}

export async function POST(request: NextRequest) {
  // Check authentication
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { cityName, existingPhones = [] } = await request.json();

    if (!cityName) {
      return NextResponse.json({ error: 'City name is required' }, { status: 400 });
    }

    const results: AzetService[] = [];
    const seenIds = new Set<string>();
    const searchQuery = encodeURIComponent('taxi');
    const cityQuery = encodeURIComponent(cityName);

    // Search up to 2 pages
    for (let page = 1; page <= 2; page++) {
      const pageParam = page > 1 ? `&p=${page}` : '';
      const url = `https://www.azet.sk/katalog/vyhladavanie/firmy/?q=${searchQuery}&k=${cityQuery}${pageParam}`;

      try {
        const html = await fetchUrl(url);
        const companies = extractCompanyLinks(html);

        // Filter out already seen
        const newCompanies = companies.filter(c => {
          if (seenIds.has(c.id)) return false;
          seenIds.add(c.id);
          return true;
        });

        if (newCompanies.length === 0) break;

        // Get details for each company
        for (const company of newCompanies) {
          try {
            await new Promise(resolve => setTimeout(resolve, 300)); // Rate limit
            const detailHtml = await fetchUrl(company.url);
            const details = extractCompanyDetails(detailHtml, company.url);

            if (details && details.name.toLowerCase().includes('taxi')) {
              // Check if phone already exists
              const normalizedPhone = normalizePhone(details.phone);
              const existingNormalized = existingPhones.map((p: string) => normalizePhone(p));

              if (!normalizedPhone || !existingNormalized.includes(normalizedPhone)) {
                // Format phone number
                if (details.phone) {
                  const cleaned = details.phone.replace(/[^0-9]/g, '');
                  if (cleaned.length === 9) {
                    details.phone = `+421${cleaned}`;
                  } else if (cleaned.startsWith('421')) {
                    details.phone = `+${cleaned}`;
                  } else if (cleaned.startsWith('0')) {
                    details.phone = `+421${cleaned.slice(1)}`;
                  }
                }
                results.push(details);
              }
            }
          } catch {
            // Skip failed requests
          }
        }
      } catch {
        break;
      }
    }

    // Filter duplicates by phone within results
    const uniqueResults: AzetService[] = [];
    const seenPhones = new Set<string>();

    for (const service of results) {
      const normalized = normalizePhone(service.phone);
      if (!normalized || !seenPhones.has(normalized)) {
        if (normalized) seenPhones.add(normalized);
        uniqueResults.push(service);
      }
    }

    return NextResponse.json({
      success: true,
      services: uniqueResults,
      count: uniqueResults.length
    });

  } catch (error) {
    console.error('Azet scraper error:', error);
    return NextResponse.json({ error: 'Scraper failed' }, { status: 500 });
  }
}
