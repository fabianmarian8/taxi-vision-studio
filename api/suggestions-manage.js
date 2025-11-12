// Vercel Serverless Function pre správu návrhov (delete, mark-approved)
// Používa GitHub API namiesto lokálneho súborového systému

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = 'fabianmarian8/taxi-vision-studio';
const STAGED_SUGGESTIONS_FILE = 'staged-suggestions.json';

// Optional admin auth if available
let verifyAdminAuth = null;
try {
  ({ verifyAdminAuth } = require('./admin-auth'));
} catch (_) {}

async function loadStagedSuggestions() {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${STAGED_SUGGESTIONS_FILE}`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return { suggestions: [], sha: null };
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    const parsed = JSON.parse(content);
    
    return {
      suggestions: Array.isArray(parsed?.suggestions) ? parsed.suggestions : [],
      sha: data.sha
    };
  } catch (error) {
    console.error('Error loading staged suggestions:', error);
    return { suggestions: [], sha: null };
  }
}

async function saveStagedSuggestions(suggestions, sha) {
  try {
    const content = JSON.stringify({ suggestions }, null, 2);
    const encodedContent = Buffer.from(content).toString('base64');

    const body = {
      message: 'Update staged suggestions via API',
      content: encodedContent,
      branch: 'main',
    };

    if (sha) {
      body.sha = sha;
    }

    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${STAGED_SUGGESTIONS_FILE}`,
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
      throw new Error(`GitHub API error: ${response.status} - ${errorData.message}`);
    }

    return true;
  } catch (error) {
    console.error('Error saving staged suggestions:', error);
    throw error;
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
      if (!suggestionId) {
        return res.status(400).json({ message: 'Missing suggestionId' });
      }

      const { suggestions, sha } = await loadStagedSuggestions();
      const before = suggestions.length;
      const filtered = suggestions.filter((s) => String(s.id) !== String(suggestionId));
      const removed = before - filtered.length;

      if (removed > 0) {
        await saveStagedSuggestions(filtered, sha);
      }

      return res.status(200).json({ removed, success: true });
    }

    if (action === 'mark-approved') {
      const { suggestionIds } = req.body || {};
      if (!Array.isArray(suggestionIds) || suggestionIds.length === 0) {
        return res.status(400).json({ message: 'Missing suggestionIds' });
      }

      const set = new Set(suggestionIds.map(String));
      const { suggestions, sha } = await loadStagedSuggestions();
      const before = suggestions.length;
      const filtered = suggestions.filter((s) => !set.has(String(s.id)));
      const removed = before - filtered.length;

      if (removed > 0) {
        await saveStagedSuggestions(filtered, sha);
      }

      return res.status(200).json({ removed, success: true });
    }

    return res.status(400).json({ message: 'Unknown action' });
  } catch (e) {
    console.error('suggestions-manage error', e);
    return res.status(500).json({ message: 'Internal Server Error', error: e.message });
  }
};
