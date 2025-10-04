import { Hono } from 'hono';
import { dbService } from '../db/models.js';

const app = new Hono();

app.get('/', async (c) => {
  const teams = await dbService.getAllTeams();
  return c.json(teams);
});

app.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const team = await dbService.getTeamById(id);
  
  if (!team) {
    return c.json({ error: 'Team not found' }, 404);
  }
  
  const repositories = await dbService.getRepositoriesByTeam(id);
  const teamWithRepos = { ...team, repositories };
  
  return c.json(teamWithRepos);
});

app.post('/', async (c) => {
  const { name } = await c.req.json();
  
  if (!name || typeof name !== 'string') {
    return c.json({ error: 'Team name is required' }, 400);
  }
  
  try {
    const team = await dbService.createTeam(name);
    return c.json(team, 201);
  } catch (error) {
    return c.json({ error: 'Team name already exists' }, 400);
  }
});

app.put('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const { name } = await c.req.json();
  
  if (!name || typeof name !== 'string') {
    return c.json({ error: 'Team name is required' }, 400);
  }
  
  try {
    const team = await dbService.updateTeam(id, name);
    
    if (!team) {
      return c.json({ error: 'Team not found' }, 404);
    }
    
    return c.json(team);
  } catch (error) {
    return c.json({ error: 'Team name already exists' }, 400);
  }
});

app.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const success = await dbService.deleteTeam(id);
  
  if (!success) {
    return c.json({ error: 'Team not found' }, 404);
  }
  
  return c.json({ message: 'Team deleted successfully' });
});

export default app;