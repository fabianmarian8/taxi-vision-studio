const fs = require('fs');
const path = require('path');

let verifyAdminAuth = null;
try { ({ verifyAdminAuth } = require('./admin-auth')); } catch (_) {}

const STAGED_PATH = path.join(process.cwd(), 'staged-suggestions.json');

function readStaged() {
  try {
    const raw = fs.readFileSync(STAGED_PATH, 'utf8');
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return { suggestions: [] };
    if (!Array.isArray(data.suggestions)) return { suggestions: [] };
    return data;
  } catch (_) {
    return { suggestions: [] };
  }
}

module.exports = async function handler(req, res) {
  try {
    if (verifyAdminAuth) {
      const ok = await verifyAdminAuth(req, res);
      if (ok === false) return;
    }
    if (req.method !== 'GET') {
      return res.status(405).json({ message: 'Method Not Allowed' });
    }
    const staged = readStaged();
    // Normalizuj polia na jednotný tvar, aby UI nikdy nezobrazilo prázdne karty
    const suggestions = (staged.suggestions || []).map((s) => ({
      id: String(s.id ?? s._id ?? s.uid ?? ''),
      citySlug: String(s.citySlug || s.city || ''),
      name: s.name || s.title || s.company || '',
      website: s.website || s.url || s.link || '',
      phone: s.phone || s.phoneNumber || s.tel || '',
      address: s.address || s.formatted_address || s.addr || '',
      createdAt: s.createdAt || s.created_at || undefined,
    })).filter(x => x.id && x.citySlug);

    return res.status(200).json({ suggestions });
  } catch (e) {
    console.error('suggestions-list error', e);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};