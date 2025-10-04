import { Hono } from 'hono';
import { fetchRepositoryLanguages } from '../services/githubService.js';

const app = new Hono();

app.get('/languages/:owner/:repo', async (c) => {
  const owner = c.req.param('owner');
  const repo = c.req.param('repo');
  
  console.log(`Fetching languages for ${owner}/${repo}`);
  
  const languages = await fetchRepositoryLanguages(owner, repo);
  
  if (languages) {
    return c.json(languages);
  } else {
    return c.json({ error: 'Failed to fetch language data' }, 500);
  }
});

export default app;