// Vercel Serverless Function pre publikovanie staged zmien do GitHubu
// Tento endpoint berie všetky staged zmeny a robí jeden hromadný commit

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = 'fabianmarian8/taxi-vision-studio';
const CITIES_FILE = 'src/data/cities.json';
const SUGGESTIONS_FILE = 'src/data/suggestions.json';
const STAGED_CHANGES_FILE = 'staged-changes.json';
const STAGED_SUGGESTIONS_FILE = 'staged-suggestions.json';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Kontrola autorizácie
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    let changesSummary = [];
    let totalChanges = 0;

    // 1. SPRACUJ STAGED CHANGES (cities.json)
    try {
      const stagedChangesResponse = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/contents/${STAGED_CHANGES_FILE}`,
        {
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      if (stagedChangesResponse.ok) {
        const stagedData = await stagedChangesResponse.json();
        const stagedContent = Buffer.from(stagedData.content, 'base64').toString('utf-8');
        const stagedChanges = JSON.parse(stagedContent);

        if (stagedChanges.changes && stagedChanges.changes.length > 0) {
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
            throw new Error('Failed to fetch cities.json');
          }

          const citiesData = await citiesResponse.json();
          const citiesContent = Buffer.from(citiesData.content, 'base64').toString('utf-8');
          const citiesJson = JSON.parse(citiesContent);

          // Aplikuj staged changes na cities
          for (const change of stagedChanges.changes) {
            const cityIndex = citiesJson.cities.findIndex(c => c.slug === change.citySlug);
            if (cityIndex !== -1) {
              citiesJson.cities[cityIndex].taxiServices = change.taxiServices;
              changesSummary.push(`Updated ${change.citySlug}`);
              totalChanges++;
            }
          }

          citiesJson.lastUpdated = new Date().toISOString();

          // Commitni cities.json
          const newCitiesContent = Buffer.from(JSON.stringify(citiesJson, null, 2)).toString('base64');

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
                message: `Publish batch changes: ${changesSummary.join(', ')}`,
                content: newCitiesContent,
                sha: citiesData.sha,
                branch: 'main',
              }),
            }
          );

          if (!citiesUpdateResponse.ok) {
            const errorData = await citiesUpdateResponse.json();
            throw new Error(`Failed to update cities.json: ${JSON.stringify(errorData)}`);
          }

          // Vymaž staged-changes.json
          await fetch(
            `https://api.github.com/repos/${GITHUB_REPO}/contents/${STAGED_CHANGES_FILE}`,
            {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                message: 'Clear staged changes after publish',
                sha: stagedData.sha,
                branch: 'main',
              }),
            }
          );
        }
      }
    } catch (error) {
      console.log('No staged changes to publish:', error.message);
    }

    // 2. SPRACUJ STAGED SUGGESTIONS (suggestions.json)
    try {
      const stagedSuggestionsResponse = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/contents/${STAGED_SUGGESTIONS_FILE}`,
        {
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      if (stagedSuggestionsResponse.ok) {
        const stagedSugData = await stagedSuggestionsResponse.json();
        const stagedSugContent = Buffer.from(stagedSugData.content, 'base64').toString('utf-8');
        const stagedSuggestions = JSON.parse(stagedSugContent);

        if (stagedSuggestions.suggestions && stagedSuggestions.suggestions.length > 0) {
          // Načítaj suggestions.json
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
            throw new Error('Failed to fetch suggestions.json');
          }

          const suggestionsData = await suggestionsResponse.json();
          const suggestionsContent = Buffer.from(suggestionsData.content, 'base64').toString('utf-8');
          const suggestionsJson = JSON.parse(suggestionsContent);

          // Pridaj staged suggestions
          const pendingCount = stagedSuggestions.suggestions.filter(s => s.status === 'pending').length;
          suggestionsJson.suggestions = [...suggestionsJson.suggestions, ...stagedSuggestions.suggestions];
          suggestionsJson.lastUpdated = new Date().toISOString();

          // Commitni suggestions.json
          const newSuggestionsContent = Buffer.from(JSON.stringify(suggestionsJson, null, 2)).toString('base64');

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
                message: `Publish ${pendingCount} new suggestions from staging`,
                content: newSuggestionsContent,
                sha: suggestionsData.sha,
                branch: 'main',
              }),
            }
          );

          if (!suggestionsUpdateResponse.ok) {
            const errorData = await suggestionsUpdateResponse.json();
            throw new Error(`Failed to update suggestions.json: ${JSON.stringify(errorData)}`);
          }

          changesSummary.push(`${pendingCount} suggestions`);
          totalChanges += pendingCount;

          // Vymaž staged-suggestions.json
          await fetch(
            `https://api.github.com/repos/${GITHUB_REPO}/contents/${STAGED_SUGGESTIONS_FILE}`,
            {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                message: 'Clear staged suggestions after publish',
                sha: stagedSugData.sha,
                branch: 'main',
              }),
            }
          );
        }
      }
    } catch (error) {
      console.log('No staged suggestions to publish:', error.message);
    }

    if (totalChanges === 0) {
      return res.status(200).json({
        success: true,
        message: 'No staged changes to publish',
        changes: 0
      });
    }

    return res.status(200).json({
      success: true,
      message: `Published ${totalChanges} changes: ${changesSummary.join(', ')}`,
      changes: totalChanges,
      summary: changesSummary
    });

  } catch (error) {
    console.error('Error in publish API:', error);
    return res.status(500).json({
      error: 'Failed to publish changes',
      message: error.message,
      details: error.stack
    });
  }
}
