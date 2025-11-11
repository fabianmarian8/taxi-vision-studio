import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Vercel Serverless Function pre správu taxislužieb
export default function handler(req, res) {
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

  const citiesFilePath = join(process.cwd(), 'src', 'data', 'cities.json');

  try {
    if (req.method === 'GET') {
      // Načítanie dát
      const citiesData = readFileSync(citiesFilePath, 'utf-8');
      return res.status(200).json(JSON.parse(citiesData));
    }

    if (req.method === 'POST') {
      // Aktualizácia dát
      const { citySlug, taxiServices } = req.body;

      if (!citySlug || !taxiServices) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Načítanie aktuálnych dát
      const citiesData = JSON.parse(readFileSync(citiesFilePath, 'utf-8'));
      
      // Nájdenie a aktualizácia mesta
      const cityIndex = citiesData.cities.findIndex(c => c.slug === citySlug);
      if (cityIndex === -1) {
        return res.status(404).json({ error: 'City not found' });
      }

      citiesData.cities[cityIndex].taxiServices = taxiServices;
      citiesData.lastUpdated = new Date().toISOString();

      // Uloženie dát
      writeFileSync(citiesFilePath, JSON.stringify(citiesData, null, 2), 'utf-8');

      return res.status(200).json({ success: true, message: 'Data updated successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
