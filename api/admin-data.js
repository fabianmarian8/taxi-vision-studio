// Vercel Serverless Function pre správu taxislužieb - READ ONLY
// POST operácie idú cez /api/publish endpoint!
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
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
      // POST je zakázaný - použite /api/publish namiesto toho!
      return res.status(400).json({
        error: 'Direct POST to admin-data is no longer supported',
        message: 'Please use /api/publish endpoint for batch publishing instead.',
        migration: {
          old: 'POST /api/admin-data',
          new: 'POST /api/publish',
          reason: 'Batch publishing to reduce Vercel deployments'
        }
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
