import fs from 'fs';
import path from 'path';

// Cesta k staged changes súboru na Verceli
const STAGED_CHANGES_FILE = path.join('/tmp', 'staged-changes.json');

// Pomocná funkcia pre načítanie staged changes
function loadStagedChanges() {
  try {
    if (fs.existsSync(STAGED_CHANGES_FILE)) {
      const content = fs.readFileSync(STAGED_CHANGES_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error('Error loading staged changes:', error);
  }
  return { changes: [] };
}

// Pomocná funkcia pre uloženie staged changes
function saveStagedChanges(stagedData) {
  try {
    fs.writeFileSync(STAGED_CHANGES_FILE, JSON.stringify(stagedData, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving staged changes:', error);
    throw error;
  }
}

// Vercel Serverless Function pre správu taxislužieb
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
  const FILE_PATH = 'src/data/cities.json';

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
      const stagedData = loadStagedChanges();
      
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
      // Uloženie zmien do staged-changes.json
      const { citySlug, taxiServices } = req.body;

      if (!citySlug || !taxiServices) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Načítaj aktuálne staged changes
      const stagedData = loadStagedChanges();

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

      // Ulož staged changes
      saveStagedChanges(stagedData);

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
