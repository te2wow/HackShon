import { Hono } from 'hono';
import { dataStore } from '../store/dataStore.js';
import { verifyRepository } from '../services/githubService.js';
import { triggerImmediatePolling } from '../services/githubPoller.js';

const app = new Hono();

app.get('/', (c) => {
  const teamId = c.req.query('teamId');
  
  if (teamId) {
    const repos = dataStore.getRepositoriesByTeam(parseInt(teamId));
    return c.json(repos);
  }
  
  const repos = dataStore.getRepositories();
  return c.json(repos);
});

app.get('/:id', (c) => {
  const id = parseInt(c.req.param('id'));
  const repo = dataStore.getRepository(id);
  
  if (!repo) {
    return c.json({ error: 'Repository not found' }, 404);
  }
  
  return c.json(repo);
});

app.post('/', async (c) => {
  const { teamId, owner, name, url } = await c.req.json();
  console.log('Add repository request:', { teamId, owner, name, url });
  
  if (!teamId || !owner || !name) {
    return c.json({ error: 'teamId, owner, and name are required' }, 400);
  }
  
  const team = dataStore.getTeam(teamId);
  if (!team) {
    return c.json({ error: 'Team not found' }, 404);
  }
  
  // Verify repository exists and is accessible
  try {
    const verification = await verifyRepository(owner, name);
    if (!verification.valid) {
      console.log('Repository verification failed:', verification.error);
      return c.json({ error: verification.error || 'Repository verification failed' }, 400);
    }
  } catch (error) {
    console.error('Error during repository verification:', error);
    return c.json({ error: 'Failed to verify repository' }, 500);
  }
  
  const repoUrl = url || `https://github.com/${owner}/${name}`;
  const repo = await dataStore.createRepository(teamId, owner, name, repoUrl);
  
  // Trigger immediate polling for the new repository
  triggerImmediatePolling();
  
  return c.json(repo, 201);
});

app.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const success = await dataStore.deleteRepository(id);
  
  if (!success) {
    return c.json({ error: 'Repository not found' }, 404);
  }
  
  return c.json({ message: 'Repository deleted successfully' });
});

export default app;