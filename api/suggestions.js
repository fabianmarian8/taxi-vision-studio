// Vercel Serverless Function pre správu návrhov taxislužieb
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

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_REPO = 'fabianmarian8/taxi-vision-studio';
  const SUGGESTIONS_FILE = 'src/data/suggestions.json';
  const CITIES_FILE = 'src/data/cities.json';

  try {
    // GET - Načítanie všetkých návrhov
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

      return res.status(200).json(suggestionsData);
    }

    // POST - Pridanie nových návrhov alebo schválenie návrhu
    if (req.method === 'POST') {
      const { action, citySlug, suggestions, suggestionId } = req.body;

      if (!action) {
        return res.status(400).json({ error: 'Action is required' });
      }

      // Načítanie súčasných návrhov
      const suggestionsResponse = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/contents/${SUGGESTIONS_FILE}`,
        {
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      if (!suggestionsResponse.ok) {
        throw new Error('Failed to fetch suggestions file');
      }

      const suggestionsFileData = await suggestionsResponse.json();
      const suggestionsContent = Buffer.from(suggestionsFileData.content, 'base64').toString('utf-8');
      const suggestionsData = JSON.parse(suggestionsContent);

      // Akcia: Pridať nové návrhy
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

        // Normalizácia telefónneho čísla pre porovnanie
        const normalizePhone = (phone) => {
          if (!phone) return '';
          return phone.replace(/[\s\-\(\)]/g, '').toLowerCase();
        };

        // Filtruj duplicity
        const newSuggestions = suggestions.filter(suggestion => {
          // Kontrola duplicít s existujúcimi službami
          const isDuplicate = existingServices.some(service => {
            // Porovnaj názov (case-insensitive)
            if (service.name.toLowerCase() === suggestion.name.toLowerCase()) {
              return true;
            }
            // Porovnaj telefón
            if (suggestion.phone && service.phone) {
              if (normalizePhone(service.phone) === normalizePhone(suggestion.phone)) {
                return true;
              }
            }
            // Porovnaj website
            if (suggestion.website && service.website) {
              if (service.website.toLowerCase() === suggestion.website.toLowerCase()) {
                return true;
              }
            }
            return false;
          });

          // Kontrola duplicít s existujúcimi návrhmi
          const isDuplicateSuggestion = suggestionsData.suggestions.some(s => {
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

          return !isDuplicate && !isDuplicateSuggestion;
        });

        // Pridaj nové návrhy
        const timestamp = new Date().toISOString();
        newSuggestions.forEach(suggestion => {
          suggestionsData.suggestions.push({
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

        suggestionsData.lastUpdated = timestamp;

        // Ulož aktualizované návrhy
        const newContent = Buffer.from(JSON.stringify(suggestionsData, null, 2)).toString('base64');

        const updateResponse = await fetch(
          `https://api.github.com/repos/${GITHUB_REPO}/contents/${SUGGESTIONS_FILE}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${GITHUB_TOKEN}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: `Add ${newSuggestions.length} new suggestions for ${citySlug}`,
              content: newContent,
              sha: suggestionsFileData.sha,
              branch: 'main',
            }),
          }
        );

        if (!updateResponse.ok) {
          const errorData = await updateResponse.json();
          throw new Error(`Failed to update suggestions file: ${JSON.stringify(errorData)}`);
        }

        return res.status(200).json({
          success: true,
          message: `Added ${newSuggestions.length} new suggestions`,
          added: newSuggestions.length,
          skipped: suggestions.length - newSuggestions.length
        });
      }

      // Akcia: Schváliť návrh
      if (action === 'approve') {
        if (!suggestionId) {
          return res.status(400).json({ error: 'suggestionId is required' });
        }

        // Nájdi návrh
        const suggestion = suggestionsData.suggestions.find(s => s.id === suggestionId);
        if (!suggestion) {
          return res.status(404).json({ error: 'Suggestion not found' });
        }

        // Načítaj cities.json
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
        const cityIndex = citiesData.cities.findIndex(c => c.slug === suggestion.citySlug);
        if (cityIndex === -1) {
          return res.status(404).json({ error: 'City not found' });
        }

        // Pridaj taxislužbu do mesta
        if (!citiesData.cities[cityIndex].taxiServices) {
          citiesData.cities[cityIndex].taxiServices = [];
        }

        citiesData.cities[cityIndex].taxiServices.push({
          name: suggestion.taxiService.name,
          phone: suggestion.taxiService.phone,
          website: suggestion.taxiService.website
        });

        citiesData.lastUpdated = new Date().toISOString();

        // Ulož cities.json
        const citiesNewContent = Buffer.from(JSON.stringify(citiesData, null, 2)).toString('base64');

        const citiesUpdateResponse = await fetch(
          `https://api.github.com/repos/${GITHUB_REPO}/contents/${CITIES_FILE}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${GITHUB_TOKEN}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: `Approve suggestion: ${suggestion.taxiService.name} for ${suggestion.citySlug}`,
              content: citiesNewContent,
              sha: citiesFileData.sha,
              branch: 'main',
            }),
          }
        );

        if (!citiesUpdateResponse.ok) {
          const errorData = await citiesUpdateResponse.json();
          throw new Error(`Failed to update cities file: ${JSON.stringify(errorData)}`);
        }

        // Označ návrh ako schválený
        suggestion.status = 'approved';
        suggestion.approvedAt = new Date().toISOString();
        suggestionsData.lastUpdated = new Date().toISOString();

        // Znovu načítaj suggestions file (mohlo sa zmeniť SHA)
        const refreshedSuggestionsResponse = await fetch(
          `https://api.github.com/repos/${GITHUB_REPO}/contents/${SUGGESTIONS_FILE}`,
          {
            headers: {
              'Authorization': `Bearer ${GITHUB_TOKEN}`,
              'Accept': 'application/vnd.github.v3+json',
            },
          }
        );

        const refreshedSuggestionsData = await refreshedSuggestionsResponse.json();

        // Ulož aktualizované návrhy
        const suggestionsNewContent = Buffer.from(JSON.stringify(suggestionsData, null, 2)).toString('base64');

        const suggestionsUpdateResponse = await fetch(
          `https://api.github.com/repos/${GITHUB_REPO}/contents/${SUGGESTIONS_FILE}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${GITHUB_TOKEN}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: `Mark suggestion ${suggestionId} as approved`,
              content: suggestionsNewContent,
              sha: refreshedSuggestionsData.sha,
              branch: 'main',
            }),
          }
        );

        if (!suggestionsUpdateResponse.ok) {
          const errorData = await suggestionsUpdateResponse.json();
          throw new Error(`Failed to update suggestions file: ${JSON.stringify(errorData)}`);
        }

        return res.status(200).json({
          success: true,
          message: 'Suggestion approved and added to city'
        });
      }

      // Akcia: Bulk schválenie
      if (action === 'approve-bulk') {
        const { suggestionIds } = req.body;

        if (!suggestionIds || !Array.isArray(suggestionIds)) {
          return res.status(400).json({ error: 'suggestionIds array is required' });
        }

        // Načítaj cities.json
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

        let approvedCount = 0;

        // Spracuj každý návrh
        for (const suggestionId of suggestionIds) {
          const suggestion = suggestionsData.suggestions.find(s => s.id === suggestionId);
          if (!suggestion || suggestion.status !== 'pending') continue;

          // Nájdi mesto
          const cityIndex = citiesData.cities.findIndex(c => c.slug === suggestion.citySlug);
          if (cityIndex === -1) continue;

          // Pridaj taxislužbu
          if (!citiesData.cities[cityIndex].taxiServices) {
            citiesData.cities[cityIndex].taxiServices = [];
          }

          citiesData.cities[cityIndex].taxiServices.push({
            name: suggestion.taxiService.name,
            phone: suggestion.taxiService.phone,
            website: suggestion.taxiService.website
          });

          // Označ ako schválený
          suggestion.status = 'approved';
          suggestion.approvedAt = new Date().toISOString();
          approvedCount++;
        }

        if (approvedCount === 0) {
          return res.status(400).json({ error: 'No valid suggestions to approve' });
        }

        citiesData.lastUpdated = new Date().toISOString();
        suggestionsData.lastUpdated = new Date().toISOString();

        // Ulož cities.json
        const citiesNewContent = Buffer.from(JSON.stringify(citiesData, null, 2)).toString('base64');

        const citiesUpdateResponse = await fetch(
          `https://api.github.com/repos/${GITHUB_REPO}/contents/${CITIES_FILE}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${GITHUB_TOKEN}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: `Bulk approve ${approvedCount} suggestions`,
              content: citiesNewContent,
              sha: citiesFileData.sha,
              branch: 'main',
            }),
          }
        );

        if (!citiesUpdateResponse.ok) {
          const errorData = await citiesUpdateResponse.json();
          throw new Error(`Failed to update cities file: ${JSON.stringify(errorData)}`);
        }

        // Znovu načítaj suggestions file
        const refreshedSuggestionsResponse = await fetch(
          `https://api.github.com/repos/${GITHUB_REPO}/contents/${SUGGESTIONS_FILE}`,
          {
            headers: {
              'Authorization': `Bearer ${GITHUB_TOKEN}`,
              'Accept': 'application/vnd.github.v3+json',
            },
          }
        );

        const refreshedSuggestionsData = await refreshedSuggestionsResponse.json();

        // Ulož suggestions.json
        const suggestionsNewContent = Buffer.from(JSON.stringify(suggestionsData, null, 2)).toString('base64');

        const suggestionsUpdateResponse = await fetch(
          `https://api.github.com/repos/${GITHUB_REPO}/contents/${SUGGESTIONS_FILE}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${GITHUB_TOKEN}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: `Mark ${approvedCount} suggestions as approved`,
              content: suggestionsNewContent,
              sha: refreshedSuggestionsData.sha,
              branch: 'main',
            }),
          }
        );

        if (!suggestionsUpdateResponse.ok) {
          const errorData = await suggestionsUpdateResponse.json();
          throw new Error(`Failed to update suggestions file: ${JSON.stringify(errorData)}`);
        }

        return res.status(200).json({
          success: true,
          message: `${approvedCount} suggestions approved`,
          approvedCount
        });
      }

      return res.status(400).json({ error: 'Invalid action' });
    }

    // DELETE - Zamietnuť návrh
    if (req.method === 'DELETE') {
      const { suggestionId } = req.body;

      if (!suggestionId) {
        return res.status(400).json({ error: 'suggestionId is required' });
      }

      // Načítaj suggestions
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
        throw new Error('Failed to fetch suggestions');
      }

      const fileData = await response.json();
      const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
      const suggestionsData = JSON.parse(content);

      // Nájdi a označ návrh ako zamietnutý
      const suggestion = suggestionsData.suggestions.find(s => s.id === suggestionId);
      if (!suggestion) {
        return res.status(404).json({ error: 'Suggestion not found' });
      }

      suggestion.status = 'rejected';
      suggestion.rejectedAt = new Date().toISOString();
      suggestionsData.lastUpdated = new Date().toISOString();

      // Ulož
      const newContent = Buffer.from(JSON.stringify(suggestionsData, null, 2)).toString('base64');

      const updateResponse = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/contents/${SUGGESTIONS_FILE}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: `Reject suggestion ${suggestionId}`,
            content: newContent,
            sha: fileData.sha,
            branch: 'main',
          }),
        }
      );

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(`Failed to update file: ${JSON.stringify(errorData)}`);
      }

      return res.status(200).json({ success: true, message: 'Suggestion rejected' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in suggestions API:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
