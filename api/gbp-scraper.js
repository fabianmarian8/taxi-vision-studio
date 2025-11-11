import axios from 'axios';

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

// Helper: Normalizácia URL
function normalizeUrl(url) {
  if (!url) return null;
  try {
    // Ak URL začína s http:// alebo https://, použij ho priamo
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return `${urlObj.protocol}//${urlObj.hostname}`;
  } catch (e) {
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

  // Kontrola API key
  const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
  if (!GOOGLE_API_KEY) {
    console.error('GOOGLE_PLACES_API_KEY is not set in environment variables');
    return res.status(500).json({ 
      error: 'API key not configured',
      message: 'Google Places API key is missing'
    });
  }

  const searchLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 20);

  try {
    console.log(`Starting Google Places API search for: ${city}, limit: ${searchLimit}`);

    // Krok 1: Text Search - vyhľadaj taxislužby v meste
    const searchQuery = encodeURIComponent(`taxi ${city} Slovakia`);
    const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${searchQuery}&language=sk&key=${GOOGLE_API_KEY}`;

    console.log(`Fetching Places API: ${textSearchUrl.replace(GOOGLE_API_KEY, 'API_KEY_HIDDEN')}`);

    const searchResponse = await axios.get(textSearchUrl, {
      timeout: 10000
    });

    if (searchResponse.data.status !== 'OK' && searchResponse.data.status !== 'ZERO_RESULTS') {
      console.error('Places API error:', searchResponse.data.status, searchResponse.data.error_message);
      return res.status(500).json({
        error: 'Places API error',
        message: searchResponse.data.error_message || searchResponse.data.status
      });
    }

    const places = searchResponse.data.results || [];
    console.log(`Found ${places.length} places from Text Search`);

    if (places.length === 0) {
      return res.status(200).json({
        success: true,
        city,
        count: 0,
        results: [],
        message: 'Nenašli sa žiadne taxislužby v tomto meste'
      });
    }

    // Krok 2: Pre každé miesto získaj detailné informácie
    const results = [];
    const seenPhones = new Set();
    const seenNames = new Set();

    // Spracuj maximálne searchLimit miest
    const placesToProcess = places.slice(0, searchLimit);

    console.log(`Fetching details for ${placesToProcess.length} places...`);

    // Spracuj paralelne po 5 naraz (aby sme nepreťažili API)
    const batchSize = 5;
    for (let i = 0; i < placesToProcess.length; i += batchSize) {
      const batch = placesToProcess.slice(i, i + batchSize);

      const batchResults = await Promise.allSettled(
        batch.map(async (place) => {
          try {
            // Place Details API call
            const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_phone_number,international_phone_number,website,formatted_address,url&language=sk&key=${GOOGLE_API_KEY}`;

            const detailsResponse = await axios.get(detailsUrl, {
              timeout: 8000
            });

            if (detailsResponse.data.status !== 'OK') {
              console.warn(`Failed to get details for ${place.name}: ${detailsResponse.data.status}`);
              return null;
            }

            const details = detailsResponse.data.result;

            // Normalizuj telefón
            const phone = normalizePhone(
              details.international_phone_number || 
              details.formatted_phone_number
            );

            // Normalizuj website
            const website = normalizeUrl(details.website);

            // Skip ak nemáme aspoň jeden kontakt
            if (!phone && !website) {
              console.log(`Skipping ${details.name} - no contact info`);
              return null;
            }

            // Skip duplicity podľa názvu
            const nameLower = details.name.toLowerCase();
            if (seenNames.has(nameLower)) {
              console.log(`Skipping duplicate name: ${details.name}`);
              return null;
            }

            // Skip duplicity podľa telefónu
            if (phone && seenPhones.has(phone)) {
              console.log(`Skipping duplicate phone: ${phone}`);
              return null;
            }

            console.log(`✓ Found: ${details.name} - Phone: ${phone || 'N/A'} - Website: ${website || 'N/A'}`);

            seenNames.add(nameLower);
            if (phone) seenPhones.add(phone);

            return {
              name: details.name,
              phone: phone || null,
              website: website || null,
              address: details.formatted_address || null,
              googleMapsUrl: details.url || null
            };
          } catch (error) {
            console.error(`Error fetching details for ${place.name}:`, error.message);
            return null;
          }
        })
      );

      // Pridaj úspešné výsledky
      batchResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          results.push(result.value);
        }
      });

      // Stop ak už máme dostatok výsledkov
      if (results.length >= searchLimit) break;
    }

    console.log(`Returning ${results.length} results from Google Places API`);

    return res.status(200).json({
      success: true,
      city,
      count: results.length,
      results,
      source: 'Google Places API'
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
