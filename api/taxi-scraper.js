import axios from 'axios';
import * as cheerio from 'cheerio';

// Slovenské mestá pre validáciu
const SLOVAK_CITIES = [
  'Bratislava', 'Košice', 'Prešov', 'Žilina', 'Banská Bystrica',
  'Nitra', 'Trnava', 'Martin', 'Trenčín', 'Poprad', 'Prievidza', 'Zvolen'
];

// Regex pre slovenské telefónne čísla
const PHONE_REGEX = /(\+421|00421|0)[\s]?[1-9][0-9]{2}[\s]?[0-9]{3}[\s]?[0-9]{3}/g;

// Helper: Normalizácia telefónneho čísla
function normalizePhone(phone) {
  if (!phone) return null;
  // Odstráň medzery a špeciálne znaky
  let normalized = phone.replace(/[\s\-\(\)]/g, '');
  // Konvertuj na +421 formát
  if (normalized.startsWith('00421')) {
    normalized = '+421' + normalized.substring(5);
  } else if (normalized.startsWith('0') && !normalized.startsWith('00')) {
    normalized = '+421' + normalized.substring(1);
  }
  return normalized;
}

// Helper: Overenie či URL funguje
async function checkUrlHealth(url, timeout = 5000) {
  try {
    const response = await axios.head(url, { 
      timeout,
      maxRedirects: 3,
      validateStatus: (status) => status < 500
    });
    return response.status >= 200 && response.status < 400;
  } catch (error) {
    // Skús GET ak HEAD zlyhá
    try {
      const response = await axios.get(url, { 
        timeout,
        maxRedirects: 3,
        validateStatus: (status) => status < 500
      });
      return response.status >= 200 && response.status < 400;
    } catch {
      return false;
    }
  }
}

// Helper: Extrakcia údajov zo stránky
async function extractDataFromUrl(url, timeout = 8000) {
  try {
    const response = await axios.get(url, {
      timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    
    // Extrakcia názvu
    let name = $('title').text().trim();
    if (!name) {
      name = $('h1').first().text().trim();
    }
    if (!name) {
      name = new URL(url).hostname.replace('www.', '');
    }

    // Čistenie názvu
    name = name.split('|')[0].split('-')[0].trim();
    if (name.length > 100) {
      name = name.substring(0, 100) + '...';
    }

    // Extrakcia telefónneho čísla
    const bodyText = $('body').text();
    const phones = bodyText.match(PHONE_REGEX);
    const phone = phones ? normalizePhone(phones[0]) : null;

    return { name, url, phone };
  } catch (error) {
    console.error(`Error extracting data from ${url}:`, error.message);
    return null;
  }
}

// Hlavná funkcia - Vercel Serverless Handler
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { city, limit = 10 } = req.body;

  // Validácia
  if (!city || typeof city !== 'string') {
    return res.status(400).json({ error: 'City parameter is required' });
  }

  const searchLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 20);

  try {
    console.log(`Starting search for: ${city}, limit: ${searchLimit}`);

    // Google search query
    const searchQuery = encodeURIComponent(`taxislužba ${city}`);
    const googleUrl = `https://www.google.com/search?q=${searchQuery}&num=${searchLimit * 2}`;

    // Fetch Google search results
    const searchResponse = await axios.get(googleUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(searchResponse.data);
    const urls = [];

    // Extrakcia URLs z Google výsledkov
    $('a[href^="http"]').each((i, elem) => {
      const href = $(elem).attr('href');
      if (href && !href.includes('google.com') && !href.includes('youtube.com')) {
        try {
          const url = new URL(href);
          const cleanUrl = `${url.protocol}//${url.hostname}${url.pathname === '/' ? '' : url.pathname}`;
          if (!urls.includes(cleanUrl) && urls.length < searchLimit * 2) {
            urls.push(cleanUrl);
          }
        } catch (e) {
          // Invalid URL, skip
        }
      }
    });

    console.log(`Found ${urls.length} URLs from Google`);

    // Paralelné spracovanie URLs
    const results = [];
    const seenPhones = new Set();
    const seenUrls = new Set();

    // Spracuj URLs po dávkach (max 3 naraz)
    const batchSize = 3;
    for (let i = 0; i < urls.length && results.length < searchLimit; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      
      const batchResults = await Promise.allSettled(
        batch.map(async (url) => {
          // Skip ak už máme tento URL
          if (seenUrls.has(url)) return null;
          seenUrls.add(url);

          // Overiť health
          const isHealthy = await checkUrlHealth(url);
          if (!isHealthy) {
            console.log(`Skipping unhealthy URL: ${url}`);
            return null;
          }

          // Extrahovať dáta
          const data = await extractDataFromUrl(url);
          if (!data || !data.phone) {
            console.log(`Skipping URL without phone: ${url}`);
            return null;
          }

          // Skip duplicitné telefónne čísla
          if (seenPhones.has(data.phone)) {
            console.log(`Skipping duplicate phone: ${data.phone}`);
            return null;
          }

          seenPhones.add(data.phone);
          return data;
        })
      );

      // Pridaj úspešné výsledky
      batchResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value && results.length < searchLimit) {
          results.push(result.value);
        }
      });

      // Stop ak už máme dostatok výsledkov
      if (results.length >= searchLimit) break;
    }

    console.log(`Returning ${results.length} results`);

    return res.status(200).json({
      success: true,
      city,
      count: results.length,
      results
    });

  } catch (error) {
    console.error('Error in taxi-scraper:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
}
