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

  // === KRITICKÁ VALIDÁCIA ENVIRONMENT VARIABLES ===
  const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
  
  if (!GOOGLE_API_KEY) {
    console.error('❌ KRITICKÁ CHYBA: GOOGLE_PLACES_API_KEY nie je nastavený!');
    console.error('📋 Dostupné env variables:', Object.keys(process.env).filter(k => k.includes('GOOGLE')).join(', ') || 'žiadne');
    
    return res.status(500).json({
      error: 'Missing GOOGLE_PLACES_API_KEY',
      message: 'Google Places API kľúč nie je nakonfigurovaný.',
      instructions: [
        '1. Prejdite na Vercel Project Settings',
        '2. Sekcia Environment Variables',
        '3. Pridajte premennú: GOOGLE_PLACES_API_KEY',
        '4. Hodnota: váš Google Places API kľúč',
        '5. Environment: Production, Preview, Development (všetky tri!)',
        '6. Kliknite Save a Re-deploy'
      ],
      availableEnvVars: Object.keys(process.env).filter(k => k.includes('GOOGLE'))
    });
  }

  console.log('✅ GOOGLE_PLACES_API_KEY je nastavený');

  const { city, limit = 10 } = req.body;

  // Validácia
  if (!city || typeof city !== 'string') {
    return res.status(400).json({ error: 'City parameter is required' });
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

      let errorMessage = 'Chyba Google Places API';
      let detailedInstructions = [];
      
      if (searchResponse.data.status === 'REQUEST_DENIED') {
        errorMessage = 'API kľúč je neplatný alebo nemá povolené používať Places API';
        detailedInstructions = [
          '1. Prejdite do Google Cloud Console: https://console.cloud.google.com',
          '2. Vyberte svoj projekt',
          '3. APIs & Services → Library',
          '4. Vyhľadajte "Places API" a "Places API (New)"',
          '5. Kliknite na obe a povoľte ich (Enable)',
          '6. APIs & Services → Credentials',
          '7. Vytvorte alebo upravte API kľúč',
          '8. Application restrictions: None (alebo HTTP referrers s *.vercel.app)',
          '9. API restrictions: Povoľte Places API a Places API (New)',
          '10. Skopírujte API kľúč do Vercel Environment Variables'
        ];
      } else if (searchResponse.data.status === 'OVER_QUERY_LIMIT') {
        errorMessage = 'Prekročený limit požiadaviek na Google Places API';
        detailedInstructions = [
          '1. Skontrolujte kvótu: https://console.cloud.google.com/apis/api/places-backend.googleapis.com/quotas',
          '2. Skontrolujte billing: https://console.cloud.google.com/billing',
          '3. Zvážte zvýšenie limitu alebo počkajte do ďalšieho dňa'
        ];
      } else if (searchResponse.data.status === 'INVALID_REQUEST') {
        errorMessage = 'Neplatná požiadavka na Google Places API';
      } else if (searchResponse.data.error_message) {
        errorMessage = `Google Places API: ${searchResponse.data.error_message}`;
      } else {
        errorMessage = `Google Places API chyba: ${searchResponse.data.status}`;
      }

      return res.status(500).json({
        error: 'Places API error',
        message: errorMessage,
        status: searchResponse.data.status,
        instructions: detailedInstructions.length > 0 ? detailedInstructions : undefined
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
