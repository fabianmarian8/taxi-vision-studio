// Vercel Serverless Function pre správu návrhov taxislužieb
// NOVÁ LOGIKA: Návrhy sa ukladajú do staged-suggestions.json a commitujú až pri publish

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = 'fabianmarian8/taxi-vision-studio';
const SUGGESTIONS_FILE = 'src/data/suggestions.json';
const STAGED_SUGGESTIONS_FILE = 'staged-suggestions.json';
const CITIES_FILE = 'src/data/cities.json';

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
    // GET - Načítanie všetkých návrhov (vrátane staged)
    if (req.method === 'GET') {
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/contents/${SUGGESTIONS_FILE}`,
        {
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions from GitHub');
      }

      const data = await response.json();
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      const suggestionsData = JSON.parse(content);

      // Načítaj staged suggestions a pridaj ich
      const { data: stagedData } = await loadStagedSuggestions();
      if (stagedData.suggestions && stagedData.suggestions.length > 0) {
        // Merge staged suggestions s existujúcimi
        suggestionsData.suggestions = [...suggestionsData.suggestions, ...stagedData.suggestions];
      }

      return res.status(200).json(suggestionsData);
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

      // Akcia: Označiť ako approved (len update staged suggestions, bez commitu)
      if (action === 'mark-approved') {
        if (!suggestionIds || !Array.isArray(suggestionIds)) {
          return res.status(400).json({ error: 'suggestionIds array is required' });
        }

        const { data: stagedData, sha: stagedSha } = await loadStagedSuggestions();
        
        // Označ suggestions ako approved v staged
        suggestionIds.forEach(id => {
          const suggestion = stagedData.suggestions.find(s => s.id === id);
          if (suggestion) {
            suggestion.status = 'approved';
            suggestion.approvedAt = new Date().toISOString();
          }
        });

        stagedData.lastUpdated = new Date().toISOString();
        await saveStagedSuggestions(stagedData, stagedSha);

        return res.status(200).json({
          success: true,
          message: 'Suggestions marked as approved in staging'
        });
      }

      return res.status(400).json({ error: 'Invalid action' });
    }

    // DELETE - Zamietnuť návrh (tiež len v staged)
    if (req.method === 'DELETE') {
      const { suggestionId } = req.body;

      if (!suggestionId) {
        return res.status(400).json({ error: 'suggestionId is required' });
      }

      const { data: stagedData, sha: stagedSha } = await loadStagedSuggestions();

      // Nájdi a označ návrh ako zamietnutý v staged
      const suggestion = stagedData.suggestions.find(s => s.id === suggestionId);
      if (!suggestion) {
        return res.status(404).json({ error: 'Suggestion not found in staging' });
      }

      suggestion.status = 'rejected';
      suggestion.rejectedAt = new Date().toISOString();
      stagedData.lastUpdated = new Date().toISOString();

      await saveStagedSuggestions(stagedData, stagedSha);

      return res.status(200).json({ success: true, message: 'Suggestion rejected in staging' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in suggestions API:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
