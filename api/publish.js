import { Buffer } from 'node:buffer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { citySlug, servicesDraft, approvedSuggestionIds } = req.body || {};
  if (!process.env.GITHUB_TOKEN) {
    res.status(500).json({ error: 'Missing GITHUB_TOKEN env' });
    return;
  }
  if (!citySlug || !Array.isArray(servicesDraft)) {
    res.status(400).json({ error: 'Invalid payload' });
    return;
  }

  const owner = 'fabianmarian8';
  const repo = 'taxi-vision-studio';
  const branch = 'main';

  async function gh(path, init = {}) {
    const r = await fetch(`https://api.github.com/repos/${owner}/${repo}${path}`, {
      ...init,
      headers: {
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}` ,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
        ...(init.headers||{})
      }
    });
    if (!r.ok) {
      const t = await r.text().catch(()=> '');
      throw new Error(`GitHub API ${r.status}: ${t}`);
    }
    return r.json();
  }

  // Helper to get file (content + sha) from a ref
  async function getFile(path) {
    const data = await gh(`/contents/${encodeURIComponent(path)}?ref=${branch}`);
    const content = Buffer.from(data.content, data.encoding || 'base64').toString('utf8');
    return { content, sha: data.sha, path };
  }

  // Helper to put file back
  async function putFile(path, content, sha, message) {
    const body = { message, content: Buffer.from(content, 'utf8').toString('base64'), branch, sha };
    return gh(`/contents/${encodeURIComponent(path)}`, { method: 'PUT', body: JSON.stringify(body) });
  }

  try {
    // 1) Load cities.json and suggestions.json from src/data
    const citiesFile = await getFile('src/data/cities.json');
    const suggFile   = await getFile('src/data/suggestions.json');

    const cities = JSON.parse(citiesFile.content);
    const suggestions = JSON.parse(suggFile.content);

    // 2) Merge draft services into the target city
    if (!cities[citySlug]) {
      cities[citySlug] = {};
    }
    cities[citySlug].services = servicesDraft;

    // 3) Mark suggestions as published/approved in suggestions.json
    const mark = new Set(Array.isArray(approvedSuggestionIds) ? approvedSuggestionIds : []);
    if (Array.isArray(suggestions.suggestions)) {
      suggestions.suggestions = suggestions.suggestions.map(s => {
        if (mark.has(s.id)) {
          return { ...s, approved: true, status: 'published', publishedAt: new Date().toISOString() };
        }
        return s;
      });
    }

    // 4) Commit both files in two PUTs (GitHub Contents API commits separately per file)
    const commitMsg = `chore(publish): ${citySlug} + ${mark.size} suggestions`;
    await putFile('src/data/cities.json', JSON.stringify(cities, null, 2), citiesFile.sha, commitMsg);
    await putFile('src/data/suggestions.json', JSON.stringify(suggestions, null, 2), suggFile.sha, commitMsg);

    res.status(200).json({ ok: true, committed: true, citySlug, approvedCount: mark.size });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
