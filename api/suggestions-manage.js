// Vercel Serverless Function pre správu návrhov (delete, mark-approved)
// Používa GitHub API a dokáže odstrániť návrhy zo staged aj committed suggestions

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = 'fabianmarian8/taxi-vision-studio';
const STAGED_SUGGESTIONS_FILE = 'staged-suggestions.json';
const SUGGESTIONS_FILE = 'src/data/suggestions.json';

async function loadFile(filePath) {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`,
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
    console.error(`Error loading ${filePath}:`, error);
    return { suggestions: [], sha: null };
  }
}

async function saveFile(filePath, suggestions, sha) {
  try {
    const content = JSON.stringify({ 
      lastUpdated: new Date().toISOString(),
      suggestions 
    }, null, 2);
    const encodedContent = Buffer.from(content).toString('base64');

    const body = {
      message: `Update ${filePath} via API`,
      content: encodedContent,
      branch: 'main',
    };

    if (sha) {
      body.sha = sha;
    }

    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`,
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
    console.error(`Error saving ${filePath}:`, error);
    throw error;
  }
}

export default async function handler(req, res) {
  try {
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

      let removed = 0;

      // Try to remove from staged suggestions first
      const staged = await loadFile(STAGED_SUGGESTIONS_FILE);
      if (staged.suggestions.length > 0) {
        const before = staged.suggestions.length;
        const filtered = staged.suggestions.filter((s) => String(s.id) !== String(suggestionId));
        if (filtered.length < before) {
          await saveFile(STAGED_SUGGESTIONS_FILE, filtered, staged.sha);
          removed = before - filtered.length;
        }
      }

      // If not found in staged, try committed suggestions
      if (removed === 0) {
        const committed = await loadFile(SUGGESTIONS_FILE);
        const before = committed.suggestions.length;
        const filtered = committed.suggestions.filter((s) => String(s.id) !== String(suggestionId));
        if (filtered.length < before) {
          await saveFile(SUGGESTIONS_FILE, filtered, committed.sha);
          removed = before - filtered.length;
        }
      }

      return res.status(200).json({ removed, success: true });
    }

    if (action === 'mark-approved') {
      const { suggestionIds } = req.body || {};
      if (!Array.isArray(suggestionIds) || suggestionIds.length === 0) {
        return res.status(400).json({ message: 'Missing suggestionIds' });
      }

      const set = new Set(suggestionIds.map(String));
      let removed = 0;

      // Try to remove from staged suggestions first
      const staged = await loadFile(STAGED_SUGGESTIONS_FILE);
      if (staged.suggestions.length > 0) {
        const before = staged.suggestions.length;
        const filtered = staged.suggestions.filter((s) => !set.has(String(s.id)));
        if (filtered.length < before) {
          await saveFile(STAGED_SUGGESTIONS_FILE, filtered, staged.sha);
          removed += before - filtered.length;
        }
      }

      // Also check committed suggestions
      const committed = await loadFile(SUGGESTIONS_FILE);
      const before = committed.suggestions.length;
      const filtered = committed.suggestions.filter((s) => !set.has(String(s.id)));
      if (filtered.length < before) {
        await saveFile(SUGGESTIONS_FILE, filtered, committed.sha);
        removed += before - filtered.length;
      }

      return res.status(200).json({ removed, success: true });
    }

    return res.status(400).json({ message: 'Unknown action' });
  } catch (e) {
    console.error('suggestions-manage error', e);
    return res.status(500).json({ message: 'Internal Server Error', error: e.message });
  }
}
