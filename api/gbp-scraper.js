import axios from 'axios';
import * as cheerio from 'cheerio';

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

// Helper: Extrakcia dát z Google Business Profile karty
function extractGBPData($, element) {
  const $elem = $(element);

  // Extrakcia názvu - väčšinou v h3 alebo div s role="heading"
  let name = $elem.find('h3').first().text().trim();
  if (!name) {
    name = $elem.find('[role="heading"]').first().text().trim();
  }
  if (!name) {
    name = $elem.find('.qBF1Pd').first().text().trim(); // Google-specific class
  }

  // Extrakcia telefónu - hľadaj v textovom obsahu
  const cardText = $elem.text();
  const phoneMatches = cardText.match(PHONE_REGEX);
  const phone = phoneMatches ? normalizePhone(phoneMatches[0]) : null;

  // Extrakcia webovej stránky
  let website = null;
  $elem.find('a').each((_, link) => {
    const href = $(link).attr('href');
    if (href && (href.startsWith('http') || href.startsWith('www'))) {
      // Skip Google-related URLs
      if (!href.includes('google.com') && !href.includes('maps.google')) {
        try {
          const url = new URL(href.startsWith('http') ? href : `https://${href}`);
          website = `${url.protocol}//${url.hostname}`;
          return false; // break loop
        } catch (e) {
          // Invalid URL, continue
        }
      }
    }
  });

  // Extrakcia adresy
  let address = null;
  // Hľadaj elementy ktoré by mohli obsahovať adresu
  $elem.find('[class*="address"], [class*="Address"]').each((_, addrElem) => {
    const text = $(addrElem).text().trim();
    if (text && text.length > 5) {
      address = text;
      return false; // break
    }
  });

  // Ak nemáme adresu, skús hľadať v texte
  if (!address) {
    const lines = cardText.split('\n').map(l => l.trim()).filter(l => l.length > 5);
    for (const line of lines) {
      // Hľadaj riadok ktorý obsahuje slovenské mesto alebo PSČ
      if (/\d{3}\s?\d{2}/.test(line) || /ulica|nám\.|cesta/i.test(line)) {
        address = line;
        break;
      }
    }
  }

  return {
    name: name || null,
    phone,
    website,
    address
  };
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
    console.log(`Starting GBP search for: ${city}, limit: ${searchLimit}`);

    // Google search query optimized for Business Profiles
    const searchQuery = encodeURIComponent(`taxi ${city}`);
    const googleUrl = `https://www.google.com/search?q=${searchQuery}&num=${searchLimit * 2}`;

    console.log(`Fetching Google URL: ${googleUrl}`);

    // Fetch Google search results
    const searchResponse = await axios.get(googleUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'sk-SK,sk;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://www.google.com/'
      },
      timeout: 10000
    });

    console.log(`Google response status: ${searchResponse.status}`);
    console.log(`Google response length: ${searchResponse.data.length} bytes`);

    const $ = cheerio.load(searchResponse.data);
    const results = [];
    const seenPhones = new Set();
    const seenNames = new Set();

    console.log('Parsing Google Business Profile results...');

    // Metóda 1: Hľadaj GBP karty pomocou tried (Google často používa špecifické triedy)
    // Tieto selektory sú založené na bežných GBP štruktúrach
    const gbpSelectors = [
      '[data-attrid="kc:/local:one box"]', // Local knowledge panel
      '[jsname]', // JS-generated business cards
      '.g', // Standard search results (môže obsahovať GBP info)
      '[data-sokoban-container]', // Business listings
      '.VkpGBb', // Specific GBP class
      '.rllt__details' // Local results details
    ];

    for (const selector of gbpSelectors) {
      $(selector).each((i, elem) => {
        if (results.length >= searchLimit) return false;

        try {
          const data = extractGBPData($, elem);

          // Validácia - musíme mať aspoň názov
          if (!data.name || data.name.length < 3) return;

          // Skip duplicity podľa názvu
          const nameLower = data.name.toLowerCase();
          if (seenNames.has(nameLower)) {
            console.log(`Skipping duplicate name: ${data.name}`);
            return;
          }

          // Skip duplicity podľa telefónu
          if (data.phone && seenPhones.has(data.phone)) {
            console.log(`Skipping duplicate phone: ${data.phone}`);
            return;
          }

          // Aspoň jeden kontakt musí byť prítomný
          if (!data.phone && !data.website) {
            console.log(`Skipping ${data.name} - no contact info`);
            return;
          }

          console.log(`Found GBP result: ${data.name} - Phone: ${data.phone || 'N/A'} - Website: ${data.website || 'N/A'}`);

          seenNames.add(nameLower);
          if (data.phone) seenPhones.add(data.phone);

          results.push({
            name: data.name,
            phone: data.phone,
            website: data.website,
            address: data.address
          });
        } catch (error) {
          console.error(`Error parsing GBP element:`, error.message);
        }
      });

      if (results.length >= searchLimit) break;
    }

    // Metóda 2: Fallback - hľadaj v texte stránky pre telefónne čísla a názvy
    if (results.length < 3) {
      console.log('Using fallback method - searching for phone numbers in page text');

      const pageText = $('body').text();
      const allPhones = pageText.match(new RegExp(PHONE_REGEX, 'g')) || [];

      const uniquePhones = [...new Set(allPhones.map(p => normalizePhone(p)))];

      for (const phone of uniquePhones) {
        if (results.length >= searchLimit) break;
        if (seenPhones.has(phone)) continue;

        // Skús nájsť názov v blízkosti telefónneho čísla
        const phoneIndex = pageText.indexOf(phone);
        if (phoneIndex > -1) {
          const contextBefore = pageText.substring(Math.max(0, phoneIndex - 200), phoneIndex);
          const lines = contextBefore.split('\n').filter(l => l.trim().length > 3);
          const potentialName = lines[lines.length - 1]?.trim();

          if (potentialName && potentialName.length < 100) {
            console.log(`Found via fallback: ${potentialName} - ${phone}`);
            results.push({
              name: potentialName,
              phone,
              website: null,
              address: null
            });
            seenPhones.add(phone);
          }
        }
      }
    }

    console.log(`Returning ${results.length} GBP results`);

    return res.status(200).json({
      success: true,
      city,
      count: results.length,
      results
    });

  } catch (error) {
    console.error('Error in gbp-scraper:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
