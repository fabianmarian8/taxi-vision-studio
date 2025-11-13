// Vercel Serverless Function pre publikovanie staged zmien do GitHubu
// Používa GitHub Tree API pre atomické commity (všetky zmeny v jednom commite)

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = 'fabianmarian8/taxi-vision-studio';
const CITIES_FILE = 'src/data/cities.json';
const SUGGESTIONS_FILE = 'src/data/suggestions.json';
const STAGED_CHANGES_FILE = 'staged-changes.json';
const STAGED_SUGGESTIONS_FILE = 'staged-suggestions.json';

async function getFileContent(filePath) {
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
      return null;
    }
    throw new Error(`Failed to fetch ${filePath}: ${response.status}`);
  }

  const data = await response.json();
  const content = Buffer.from(data.content, 'base64').toString('utf-8');
  return { content: JSON.parse(content), sha: data.sha };
}

async function createAtomicCommit(changes, message) {
  // 1. Get the latest commit SHA
  const refResponse = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/git/refs/heads/main`,
    {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    }
  );

  if (!refResponse.ok) {
    throw new Error('Failed to get main branch ref');
  }

  const refData = await refResponse.json();
  const latestCommitSha = refData.object.sha;

  // 2. Get the tree SHA from the latest commit
  const commitResponse = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/git/commits/${latestCommitSha}`,
    {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    }
  );

  if (!commitResponse.ok) {
    throw new Error('Failed to get latest commit');
  }

  const commitData = await commitResponse.json();
  const baseTreeSha = commitData.tree.sha;

  // 3. Create a new tree with all changes
  const tree = changes.map(change => ({
    path: change.path,
    mode: '100644',
    type: 'blob',
    content: change.content ? JSON.stringify(change.content, null, 2) : null,
    sha: change.delete ? null : undefined
  })).filter(item => item.content !== null || item.sha === null);

  const treeResponse = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/git/trees`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: tree
      }),
    }
  );

  if (!treeResponse.ok) {
    const errorData = await treeResponse.json();
    throw new Error(`Failed to create tree: ${JSON.stringify(errorData)}`);
  }

  const treeData = await treeResponse.json();
  const newTreeSha = treeData.sha;

  // 4. Create a new commit
  const newCommitResponse = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/git/commits`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        tree: newTreeSha,
        parents: [latestCommitSha]
      }),
    }
  );

  if (!newCommitResponse.ok) {
    const errorData = await newCommitResponse.json();
    throw new Error(`Failed to create commit: ${JSON.stringify(errorData)}`);
  }

  const newCommitData = await newCommitResponse.json();
  const newCommitSha = newCommitData.sha;

  // 5. Update the reference
  const updateRefResponse = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/git/refs/heads/main`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sha: newCommitSha,
        force: false
      }),
    }
  );

  if (!updateRefResponse.ok) {
    const errorData = await updateRefResponse.json();
    throw new Error(`Failed to update ref: ${JSON.stringify(errorData)}`);
  }

  return newCommitSha;
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Kontrola autorizácie
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    let changesSummary = [];
    let totalChanges = 0;
    let approvedSuggestions = [];
    const filesToUpdate = [];

    // 1. Load all necessary files
    const stagedSuggestionsFile = await getFileContent(STAGED_SUGGESTIONS_FILE);
    const stagedChangesFile = await getFileContent(STAGED_CHANGES_FILE);
    const suggestionsFile = await getFileContent(SUGGESTIONS_FILE);
    const citiesFile = await getFileContent(CITIES_FILE);

    if (!suggestionsFile || !citiesFile) {
      throw new Error('Missing required files: suggestions.json or cities.json');
    }

    const suggestionsJson = suggestionsFile.content;
    const citiesJson = citiesFile.content;

    // 2. Process staged suggestions
    if (stagedSuggestionsFile && stagedSuggestionsFile.content.suggestions?.length > 0) {
      const stagedSuggestions = stagedSuggestionsFile.content;
      approvedSuggestions = stagedSuggestions.suggestions.filter(s => s.status === 'approved');
      const pendingCount = stagedSuggestions.suggestions.filter(s => s.status === 'pending').length;

      // Add all staged suggestions to suggestions.json
      suggestionsJson.suggestions = [...suggestionsJson.suggestions, ...stagedSuggestions.suggestions];
      suggestionsJson.lastUpdated = new Date().toISOString();

      changesSummary.push(`${pendingCount} suggestions`);
      totalChanges += pendingCount;

      // Mark suggestions.json for update
      filesToUpdate.push({
        path: SUGGESTIONS_FILE,
        content: suggestionsJson
      });

      // Mark staged-suggestions.json for deletion
      filesToUpdate.push({
        path: STAGED_SUGGESTIONS_FILE,
        delete: true
      });
    }

    // 3. Process staged changes (cities.json updates)
    let citiesModified = false;

    if (stagedChangesFile && stagedChangesFile.content.changes?.length > 0) {
      const stagedChanges = stagedChangesFile.content;

      for (const change of stagedChanges.changes) {
        const cityIndex = citiesJson.cities.findIndex(c => c.slug === change.citySlug);
        if (cityIndex !== -1) {
          citiesJson.cities[cityIndex].taxiServices = change.taxiServices;
          changesSummary.push(`Updated ${change.citySlug}`);
          totalChanges++;
          citiesModified = true;
        }
      }

      // Mark staged-changes.json for deletion
      filesToUpdate.push({
        path: STAGED_CHANGES_FILE,
        delete: true
      });
    }

    // 4. Add approved suggestions to cities
    if (approvedSuggestions.length > 0) {
      const suggestionsByCity = {};
      approvedSuggestions.forEach(suggestion => {
        if (!suggestionsByCity[suggestion.citySlug]) {
          suggestionsByCity[suggestion.citySlug] = [];
        }
        suggestionsByCity[suggestion.citySlug].push(suggestion.taxiService);
      });

      Object.entries(suggestionsByCity).forEach(([citySlug, services]) => {
        const cityIndex = citiesJson.cities.findIndex(c => c.slug === citySlug);
        if (cityIndex !== -1) {
          if (!citiesJson.cities[cityIndex].taxiServices) {
            citiesJson.cities[cityIndex].taxiServices = [];
          }

          citiesJson.cities[cityIndex].taxiServices.push(...services);
          changesSummary.push(`Added ${services.length} approved to ${citySlug}`);
          totalChanges += services.length;
          citiesModified = true;
        }
      });
    }

    // 5. Mark cities.json for update if modified
    if (citiesModified) {
      citiesJson.lastUpdated = new Date().toISOString();
      filesToUpdate.push({
        path: CITIES_FILE,
        content: citiesJson
      });
    }

    // 6. If no changes, return early
    if (totalChanges === 0) {
      return res.status(200).json({
        success: true,
        message: 'No staged changes to publish',
        changes: 0
      });
    }

    // 7. Create single atomic commit with all changes
    const commitMessage = `Publish changes: ${changesSummary.join(', ')}`;
    const commitSha = await createAtomicCommit(filesToUpdate, commitMessage);

    console.log(`Successfully created atomic commit: ${commitSha}`);

    return res.status(200).json({
      success: true,
      message: `Published ${totalChanges} changes in single commit`,
      changes: totalChanges,
      summary: changesSummary,
      commitSha: commitSha
    });

  } catch (error) {
    console.error('Error in publish API:', error);
    return res.status(500).json({
      error: 'Failed to publish changes',
      message: error.message,
      details: error.stack
    });
  }
}
