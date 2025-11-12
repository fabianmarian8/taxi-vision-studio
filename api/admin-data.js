// Vercel Serverless Function pre správu taxislužieb pomocou GitHub API
// STAGED CHANGES sa ukladajú do GitHub súboru "staged-changes.json"

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = 'fabianmarian8/taxi-vision-studio';
const FILE_PATH = 'src/data/cities.json';
const STAGED_FILE_PATH = 'staged-changes.json';

// Pomocná funkcia pre načítanie staged changes z GitHub
async function loadStagedChanges() {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${STAGED_FILE_PATH}`,
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
    console.log('No staged changes found:', error.message);
  }
  return { data: { changes: [] }, sha: null };
}

// Pomocná funkcia pre uloženie staged changes do GitHub
async function saveStagedChanges(stagedData, sha) {
  try {
    const content = Buffer.from(JSON.stringify(stagedData, null, 2)).toString('base64');
    
    const body = {
      message: 'Update staged changes',
      content: content,
      branch: 'main',
    };

    if (sha) {
      body.sha = sha;
    }

    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${STAGED_FILE_PATH}`,
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
      throw new Error(`Failed to save staged changes: ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving staged changes:', error);
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
    if (req.method === 'GET') {
      // Načítanie dát z GitHub
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`,
        {
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch from GitHub');
      }

      const data = await response.json();
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      const citiesData = JSON.parse(content);

      // Načítanie staged changes a aplikovanie na dáta
      const { data: stagedData } = await loadStagedChanges();
      
      // Aplikuj staged changes na cities data
      if (stagedData.changes && stagedData.changes.length > 0) {
        for (const change of stagedData.changes) {
          const cityIndex = citiesData.cities.findIndex(c => c.slug === change.citySlug);
          if (cityIndex !== -1) {
            citiesData.cities[cityIndex].taxiServices = change.taxiServices;
          }
        }
      }

      return res.status(200).json(citiesData);
    }

    if (req.method === 'POST') {
      // Uloženie zmien do staged-changes.json v GitHub
      const { citySlug, taxiServices } = req.body;

      if (!citySlug || !taxiServices) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Načítaj aktuálne staged changes
      const { data: stagedData, sha } = await loadStagedChanges();

      // Najdi existujúcu zmenu pre toto mesto alebo vytvor novú
      const changeIndex = stagedData.changes.findIndex(c => c.citySlug === citySlug);
      
      const change = {
        citySlug,
        taxiServices,
        timestamp: new Date().toISOString()
      };

      if (changeIndex !== -1) {
        // Aktualizuj existujúcu zmenu
        stagedData.changes[changeIndex] = change;
      } else {
        // Pridaj novú zmenu
        stagedData.changes.push(change);
      }

      // Ulož staged changes do GitHub
      await saveStagedChanges(stagedData, sha);

      return res.status(200).json({ 
        success: true, 
        message: 'Changes staged successfully. Click "Publish Changes" to commit to GitHub.',
        stagedChanges: stagedData.changes.length
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
