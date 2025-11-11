// Vercel Serverless Function pre správu taxislužieb pomocou GitHub API
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

      return res.status(200).json(citiesData);
    }

    if (req.method === 'POST') {
      // Aktualizácia dát cez GitHub API
      const { citySlug, taxiServices } = req.body;

      if (!citySlug || !taxiServices) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Načítanie aktuálneho súboru
      const fileResponse = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`,
        {
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      if (!fileResponse.ok) {
        throw new Error('Failed to fetch current file');
      }

      const fileData = await fileResponse.json();
      const currentContent = Buffer.from(fileData.content, 'base64').toString('utf-8');
      const citiesData = JSON.parse(currentContent);

      // Nájdenie a aktualizácia mesta
      const cityIndex = citiesData.cities.findIndex(c => c.slug === citySlug);
      if (cityIndex === -1) {
        return res.status(404).json({ error: 'City not found' });
      }

      citiesData.cities[cityIndex].taxiServices = taxiServices;
      citiesData.lastUpdated = new Date().toISOString();

      // Vytvorenie nového commitu
      const newContent = Buffer.from(JSON.stringify(citiesData, null, 2)).toString('base64');
      
      const updateResponse = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: `Update taxi services for ${citySlug}`,
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

      return res.status(200).json({ success: true, message: 'Data updated successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
