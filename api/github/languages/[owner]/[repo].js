import { Octokit } from 'octokit';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { owner, repo } = req.query;

  if (!owner || !repo) {
    return res.status(400).json({ error: 'Owner and repo are required' });
  }

  try {
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    // Get repository languages
    const response = await octokit.rest.repos.listLanguages({
      owner,
      repo,
    });

    return res.status(200).json(response.data);
  } catch (error) {
    console.error('GitHub API error:', error);
    
    if (error.status === 404) {
      return res.status(404).json({ error: 'Repository not found' });
    }
    
    if (error.status === 403) {
      return res.status(403).json({ error: 'API rate limit exceeded or access denied' });
    }

    return res.status(500).json({ error: 'Failed to fetch repository languages' });
  }
}