import { Hono } from 'hono';
import { dataStore } from '../store/dataStore.js';

const app = new Hono();

app.get('/', (c) => {
  const teams = dataStore.getTeams();
  return c.json(teams);
});

app.get('/:id', (c) => {
  const id = parseInt(c.req.param('id'));
  const team = dataStore.getTeamWithRepos(id);
  
  if (!team) {
    return c.json({ error: 'Team not found' }, 404);
  }
  
  return c.json(team);
});

app.post('/', async (c) => {
  const { name } = await c.req.json();
  
  if (!name || typeof name !== 'string') {
    return c.json({ error: 'Team name is required' }, 400);
  }
  
  const team = await dataStore.createTeam(name);
  return c.json(team, 201);
});

app.put('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const { name } = await c.req.json();
  
  if (!name || typeof name !== 'string') {
    return c.json({ error: 'Team name is required' }, 400);
  }
  
  const team = await dataStore.updateTeam(id, name);
  
  if (!team) {
    return c.json({ error: 'Team not found' }, 404);
  }
  
  return c.json(team);
});

app.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const success = await dataStore.deleteTeam(id);
  
  if (!success) {
    return c.json({ error: 'Team not found' }, 404);
  }
  
  return c.json({ message: 'Team deleted successfully' });
});

export default app;