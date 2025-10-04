import { Hono } from 'hono';
import { dataStore } from '../store/dataStore.js';

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
  
  if (!teamId || !owner || !name) {
    return c.json({ error: 'teamId, owner, and name are required' }, 400);
  }
  
  const team = dataStore.getTeam(teamId);
  if (!team) {
    return c.json({ error: 'Team not found' }, 404);
  }
  
  const repoUrl = url || `https://github.com/${owner}/${name}`;
  const repo = dataStore.createRepository(teamId, owner, name, repoUrl);
  
  return c.json(repo, 201);
});

app.delete('/:id', (c) => {
  const id = parseInt(c.req.param('id'));
  const success = dataStore.deleteRepository(id);
  
  if (!success) {
    return c.json({ error: 'Repository not found' }, 404);
  }
  
  return c.json({ message: 'Repository deleted successfully' });
});

export default app;