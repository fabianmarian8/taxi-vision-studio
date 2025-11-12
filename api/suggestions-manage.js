const fs = require('fs');
const path = require('path');

// Optional admin auth if available
let verifyAdminAuth = null;
try {
  ({ verifyAdminAuth } = require('./admin-auth'));
} catch (_) {}

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

function writeStaged(data) {
  try {
    fs.writeFileSync(STAGED_PATH, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Failed to write staged-suggestions.json', e);
  }
}

module.exports = async function handler(req, res) {
  try {
    if (verifyAdminAuth) {
      const ok = await verifyAdminAuth(req, res);
      if (ok === false) return;
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { action } = req.body || {};
    if (!action) {
      return res.status(400).json({ message: 'Missing action' });
    }

    if (action === 'delete') {
      const { suggestionId } = req.body || {};
      if (!suggestionId) return res.status(400).json({ message: 'Missing suggestionId' });
      const staged = readStaged();
      const before = staged.suggestions.length;
      staged.suggestions = staged.suggestions.filter((s) => String(s.id) !== String(suggestionId));
      const removed = before - staged.suggestions.length;
      writeStaged(staged);
      return res.status(200).json({ removed });
    }

    if (action === 'mark-approved') {
      const { suggestionIds } = req.body || {};
      if (!Array.isArray(suggestionIds) || suggestionIds.length === 0) {
        return res.status(400).json({ message: 'Missing suggestionIds' });
      }
      const set = new Set(suggestionIds.map(String));
      const staged = readStaged();
      const before = staged.suggestions.length;
      staged.suggestions = staged.suggestions.filter((s) => !set.has(String(s.id)));
      const removed = before - staged.suggestions.length;
      writeStaged(staged);
      return res.status(200).json({ removed });
    }

    return res.status(400).json({ message: 'Unknown action' });
  } catch (e) {
    console.error('suggestions-manage error', e);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};