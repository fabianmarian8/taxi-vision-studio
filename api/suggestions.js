export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }
    const { action, suggestionIds } = req.body || {};
    if (action !== 'mark-approved') {
      res.status(400).json({ error: 'Unsupported action' });
      return;
    }

    // Update suggestions locally (no commit to cities.json here)
    const fs = await import('node:fs/promises');
    const path = 'src/data/suggestions.json';
    const raw = await fs.readFile(path, 'utf8');
    const db = JSON.parse(raw);

    const set = new Set(Array.isArray(suggestionIds) ? suggestionIds : []);
    db.suggestions = (db.suggestions || []).map(s => set.has(s.id) ? { ...s, approved: true } : s);
    await fs.writeFile(path, JSON.stringify(db, null, 2), 'utf8');

    res.status(200).json({ ok: true, updated: set.size });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
