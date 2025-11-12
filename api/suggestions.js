// Vercel Serverless Function pre správu návrhov taxislužieb
// NOVÁ LOGIKA: Návrhy sa ukladajú do staged-suggestions.json a commitujú až pri publish
// Debug mode enabled for duplicate detection

const fs = require('fs');
const path = require('path');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = 'fabianmarian8/taxi-vision-studio';
const SUGGESTIONS_FILE = 'src/data/suggestions.json';
const STAGED_SUGGESTIONS_FILE = 'staged-suggestions.json';
const CITIES_FILE = 'src/data/cities.json';
const STAGED_PATH = path.join(process.cwd(), STAGED_SUGGESTIONS_FILE);

// Helper function to check if running locally (no GitHub token or explicit local mode)
const isLocalMode = () => !GITHUB_TOKEN || process.env.NODE_ENV === 'development';

// Normalizačná funkcia pre suggestions - zjednotí všetky tvary do konzistentného formátu
function normalizeSuggestion(raw) {
  // Helper to get first non-empty value
  const take = (...vals) => {
    for (const v of vals) {
      if (v !== undefined && v !== null && String(v).trim() !== '') {
        return String(v).trim();
      }
    }
    return '';
  };

  // Helper to access nested properties
  const fromNested = (obj, keys) => {
    let cur = obj;
    for (const k of keys) {
      if (!cur) return undefined;
      cur = cur[k];
    }
    return cur;
  };

  // Extract ID - try various field names including nested structures
  const id = take(
    raw?.id,
    raw?._id,
    raw?.uid,
    fromNested(raw, ['gbp', 'id']),
    fromNested(raw, ['place', 'place_id'])
  );

  // Extract citySlug
  const citySlug = take(
    raw?.citySlug,
    raw?.city,
    fromNested(raw, ['gbp', 'citySlug']),
    fromNested(raw, ['place', 'citySlug'])
  );

  // Extract name - try many aliases including nested fields
  let name = take(
    raw?.name,
    raw?.title,
    raw?.company,
    fromNested(raw, ['taxiService', 'name']),
    fromNested(raw, ['gbp', 'name']),
    fromNested(raw, ['gbp', 'title']),
    fromNested(raw, ['place', 'name']),
    fromNested(raw, ['data', 'name'])
  );

  // Extract website
  const website = take(
    raw?.website,
    raw?.url,
    raw?.link,
    fromNested(raw, ['taxiService', 'website']),
    fromNested(raw, ['gbp', 'website']),
    fromNested(raw, ['place', 'website'])
  ) || undefined;

  // Extract phone
  const phone = take(
    raw?.phone,
    raw?.phoneNumber,
    raw?.tel,
    fromNested(raw, ['taxiService', 'phone']),
    fromNested(raw, ['gbp', 'phone']),
    fromNested(raw, ['place', 'formatted_phone_number']),
    fromNested(raw, ['place', 'international_phone_number'])
  ) || undefined;

  // Extract address
  const address = take(
    raw?.address,
    raw?.formatted_address,
    raw?.addr,
    fromNested(raw, ['taxiService', 'address']),
    fromNested(raw, ['gbp', 'address']),
    fromNested(raw, ['place', 'vicinity']),
    fromNested(raw, ['place', 'formatted_address'])
  ) || undefined;

  // Extract createdAt
  const createdAt = take(
    raw?.createdAt,
    raw?.created_at,
    raw?.timestamp,
    fromNested(raw, ['gbp', 'createdAt'])
  ) || undefined;

  // If name is missing, derive from website, phone, or address
  if (!name) {
    if (website) {
      try {
        const url = website.startsWith('http') ? new URL(website) : new URL('https://' + website);
        name = url.hostname.replace('www.', '');
      } catch {
        // ignore invalid URL
      }
    }
    if (!name && phone) {
      name = phone;
    }
    if (!name && address) {
      name = address.split(',')[0].trim();
    }
    if (!name) {
      name = '—'; // fallback to em dash
    }
  }

  // Only return if we have at least id and citySlug
  if (!id || !citySlug) {
    return null;
  }

  return {
    id,
    citySlug,
    name,
    website,
    phone,
    address,
    createdAt
  };
}

// Read staged suggestions from local filesystem
function readStagedLocal() {
  try {
    const raw = fs.readFileSync(STAGED_PATH, 'utf8');
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return { suggestions: [] };
    if (!Array.isArray(data.suggestions)) return { suggestions: [] };
    return data;
  } catch (err) {
    console.error('Error reading staged suggestions:', err.message);
    return { suggestions: [] };
  }
}

// Write staged suggestions to local filesystem
function writeStagedLocal(data) {
  try {
    fs.writeFileSync(STAGED_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing staged suggestions:', err.message);
    throw err;
  }
}

// Pomocná funkcia pre načítanie staged suggestions z GitHub
async function loadStagedSuggestions() {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${STAGED_SUGGESTIONS_FILE}`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      return { data: JSON.parse(content), sha: data.sha };
    }
  } catch (error) {
    console.log('No staged suggestions found:', error.message);
  }
  return { data: { suggestions: [] }, sha: null };
}

// Pomocná funkcia pre uloženie staged suggestions do GitHub
async function saveStagedSuggestions(stagedData, sha) {
  try {
    const content = Buffer.from(JSON.stringify(stagedData, null, 2)).toString('base64');
    
    const body = {
      message: 'Update staged suggestions',
      content: content,
      branch: 'main',
    };

    if (sha) {
      body.sha = sha;
    }

    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${STAGED_SUGGESTIONS_FILE}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to save staged suggestions: ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving staged suggestions:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Kontrola autorizácie
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // GET - Načítanie všetkých návrhov (len zo staging area, s normalizáciou)
    if (req.method === 'GET') {
      // V lokálnom režime čítame z filesystemu, v produkcii z GitHubu
      let stagedData;

      if (isLocalMode()) {
        // Local mode - read from filesystem
        stagedData = readStagedLocal();
      } else {
        // Production mode - read from GitHub
        const { data } = await loadStagedSuggestions();
        stagedData = data;
      }

      // Normalizuj všetky suggestions na jednotný tvar
      const normalizedSuggestions = (stagedData.suggestions || [])
        .map(normalizeSuggestion)
        .filter(s => s !== null); // Remove any that couldn't be normalized

      console.log('=== GET SUGGESTIONS DEBUG ===');
      console.log(`Raw suggestions: ${stagedData.suggestions ? stagedData.suggestions.length : 0}`);
      console.log(`Normalized suggestions: ${normalizedSuggestions.length}`);

      return res.status(200).json({ suggestions: normalizedSuggestions });
    }

    // POST - Pridanie nových návrhov alebo schválenie návrhu
    if (req.method === 'POST') {
      const { action, citySlug, suggestions, suggestionId, suggestionIds } = req.body;

      if (!action) {
        return res.status(400).json({ error: 'Action is required' });
      }

      // Akcia: Pridať nové návrhy DO STAGED SUGGESTIONS (BEZ COMMITU!)
      if (action === 'add') {
        if (!citySlug || !suggestions || !Array.isArray(suggestions)) {
          return res.status(400).json({ error: 'citySlug and suggestions array are required' });
        }

        // Načítanie existujúcich taxislužieb pre kontrolu duplicít
        const citiesResponse = await fetch(
          `https://api.github.com/repos/${GITHUB_REPO}/contents/${CITIES_FILE}`,
          {
            headers: {
              'Authorization': `Bearer ${GITHUB_TOKEN}`,
              'Accept': 'application/vnd.github.v3+json',
            },
          }
        );

        if (!citiesResponse.ok) {
          throw new Error('Failed to fetch cities file');
        }

        const citiesFileData = await citiesResponse.json();
        const citiesContent = Buffer.from(citiesFileData.content, 'base64').toString('utf-8');
        const citiesData = JSON.parse(citiesContent);

        // Nájdi mesto
        const city = citiesData.cities.find(c => c.slug === citySlug);
        if (!city) {
          return res.status(404).json({ error: 'City not found' });
        }

        const existingServices = city.taxiServices || [];

        // Načítaj existujúce suggestions (committed)
        const suggestionsResponse = await fetch(
          `https://api.github.com/repos/${GITHUB_REPO}/contents/${SUGGESTIONS_FILE}`,
          {
            headers: {
              'Authorization': `Bearer ${GITHUB_TOKEN}`,
              'Accept': 'application/vnd.github.v3+json',
            },
          }
        );

        const suggestionsFileData = await suggestionsResponse.json();
        const suggestionsContent = Buffer.from(suggestionsFileData.content, 'base64').toString('utf-8');
        const existingSuggestionsData = JSON.parse(suggestionsContent);

        // Načítaj staged suggestions
        const { data: stagedData, sha: stagedSha } = await loadStagedSuggestions();

        // Normalizácia telefónneho čísla pre porovnanie
        const normalizePhone = (phone) => {
          if (!phone) return '';
          return phone.replace(/[\s\-\(\)]/g, '').toLowerCase();
        };

        // Filtruj duplicity
        const newSuggestions = suggestions.filter(suggestion => {
          // Kontrola duplicít s existujúcimi službami
          const isDuplicate = existingServices.some(service => {
            if (service.name.toLowerCase() === suggestion.name.toLowerCase()) {
              return true;
            }
            if (suggestion.phone && service.phone) {
              if (normalizePhone(service.phone) === normalizePhone(suggestion.phone)) {
                return true;
              }
            }
            if (suggestion.website && service.website) {
              if (service.website.toLowerCase() === suggestion.website.toLowerCase()) {
                return true;
              }
            }
            return false;
          });

          // Kontrola duplicít s existujúcimi návrhmi (committed)
          const isDuplicateSuggestion = existingSuggestionsData.suggestions.some(s => {
            if (s.citySlug !== citySlug || s.status === 'rejected') return false;
            if (s.taxiService.name.toLowerCase() === suggestion.name.toLowerCase()) {
              return true;
            }
            if (suggestion.phone && s.taxiService.phone) {
              if (normalizePhone(s.taxiService.phone) === normalizePhone(suggestion.phone)) {
                return true;
              }
            }
            return false;
          });

          // Kontrola duplicít so staged suggestions
          const isDuplicateStaged = stagedData.suggestions.some(s => {
            if (s.citySlug !== citySlug || s.status === 'rejected') return false;
            if (s.taxiService.name.toLowerCase() === suggestion.name.toLowerCase()) {
              return true;
            }
            if (suggestion.phone && s.taxiService.phone) {
              if (normalizePhone(s.taxiService.phone) === normalizePhone(suggestion.phone)) {
                return true;
              }
            }
            return false;
          });

          return !isDuplicate && !isDuplicateSuggestion && !isDuplicateStaged;
        });

        // Pridaj nové návrhy DO STAGED SUGGESTIONS
        const timestamp = new Date().toISOString();
        newSuggestions.forEach(suggestion => {
          stagedData.suggestions.push({
            id: `${citySlug}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            citySlug,
            taxiService: {
              name: suggestion.name,
              phone: suggestion.phone || null,
              website: suggestion.website || null,
              address: suggestion.address || null
            },
            status: 'pending',
            timestamp
          });
        });

        stagedData.lastUpdated = timestamp;

        // Ulož do staged-suggestions.json (BEZ COMMITU DO suggestions.json!)
        await saveStagedSuggestions(stagedData, stagedSha);

        // Debug info
        console.log('=== SUGGESTIONS DEBUG ===');
        console.log(`City: ${citySlug}`);
        console.log(`Total scraped: ${suggestions.length}`);
        console.log(`New (after dedup): ${newSuggestions.length}`);
        console.log(`Skipped duplicates: ${suggestions.length - newSuggestions.length}`);
        console.log(`Existing services in city: ${existingServices.length}`);
        console.log(`Existing committed suggestions: ${existingSuggestionsData.suggestions.filter(s => s.citySlug === citySlug && s.status !== 'rejected').length}`);
        console.log(`Staged suggestions: ${stagedData.suggestions.filter(s => s.citySlug === citySlug && s.status !== 'rejected').length}`);

        return res.status(200).json({
          success: true,
          message: `Added ${newSuggestions.length} new suggestions to staging area${newSuggestions.length === 0 ? ' (all were duplicates)' : ''}. ${newSuggestions.length > 0 ? 'Click "Publish Changes" to commit.' : ''}`,
          added: newSuggestions.length,
          skipped: suggestions.length - newSuggestions.length,
          debug: {
            citySlug,
            existingServicesCount: existingServices.length,
            existingSuggestionsCount: existingSuggestionsData.suggestions.filter(s => s.citySlug === citySlug && s.status !== 'rejected').length,
            stagedSuggestionsCount: stagedData.suggestions.filter(s => s.citySlug === citySlug && s.status !== 'rejected').length,
            scrapedNames: suggestions.map(s => s.name),
            existingNames: existingServices.map(s => s.name)
          }
        });
      }

      // Akcia: DELETE - Odstrániť jeden návrh zo staging (zamietnuť)
      if (action === 'delete') {
        if (!suggestionId) {
          return res.status(400).json({ error: 'suggestionId is required' });
        }

        // Load staged data based on environment
        let stagedData, stagedSha;
        if (isLocalMode()) {
          stagedData = readStagedLocal();
          stagedSha = null;
        } else {
          const result = await loadStagedSuggestions();
          stagedData = result.data;
          stagedSha = result.sha;
        }

        // Remove the suggestion from staging
        const beforeCount = stagedData.suggestions.length;
        stagedData.suggestions = stagedData.suggestions.filter(
          s => String(s.id) !== String(suggestionId)
        );
        const removed = beforeCount - stagedData.suggestions.length;
        stagedData.lastUpdated = new Date().toISOString();

        // Save based on environment
        if (isLocalMode()) {
          writeStagedLocal(stagedData);
        } else {
          await saveStagedSuggestions(stagedData, stagedSha);
        }

        return res.status(200).json({
          success: true,
          removed,
          message: 'Suggestion removed from staging'
        });
      }

      // Akcia: MARK-APPROVED - Odstrániť schválené návrhy zo staging (bulk)
      if (action === 'mark-approved') {
        if (!suggestionIds || !Array.isArray(suggestionIds)) {
          return res.status(400).json({ error: 'suggestionIds array is required' });
        }

        // Load staged data based on environment
        let stagedData, stagedSha;
        if (isLocalMode()) {
          stagedData = readStagedLocal();
          stagedSha = null;
        } else {
          const result = await loadStagedSuggestions();
          stagedData = result.data;
          stagedSha = result.sha;
        }

        // Remove approved suggestions from staging
        const idsSet = new Set(suggestionIds.map(String));
        const beforeCount = stagedData.suggestions.length;
        stagedData.suggestions = stagedData.suggestions.filter(
          s => !idsSet.has(String(s.id))
        );
        const removed = beforeCount - stagedData.suggestions.length;
        stagedData.lastUpdated = new Date().toISOString();

        // Save based on environment
        if (isLocalMode()) {
          writeStagedLocal(stagedData);
        } else {
          await saveStagedSuggestions(stagedData, stagedSha);
        }

        return res.status(200).json({
          success: true,
          removed,
          message: 'Approved suggestions removed from staging'
        });
      }

      return res.status(400).json({ error: 'Invalid action' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in suggestions API:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
