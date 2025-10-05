import { Hono } from 'hono';
import { dbService } from '../db/models.js';
import { ChartData } from '../shared/types.js';

const app = new Hono();

app.get('/', async (c) => {
  const teamId = c.req.query('teamId');
  const repositoryId = c.req.query('repositoryId');
  const limit = c.req.query('limit');
  
  let metrics;
  
  if (repositoryId) {
    metrics = await dbService.getMetricsByRepository(parseInt(repositoryId), limit ? parseInt(limit) : undefined);
  } else if (teamId) {
    metrics = await dbService.getMetricsByTeam(parseInt(teamId), limit ? parseInt(limit) : undefined);
  } else {
    return c.json({ error: 'teamId or repositoryId is required' }, 400);
  }
  
  return c.json(metrics);
});

app.get('/chart/:teamId', async (c) => {
  const teamId = parseInt(c.req.param('teamId'));
  const team = await dbService.getTeamById(teamId);
  
  if (!team) {
    return c.json({ error: 'Team not found' }, 404);
  }
  
  const repos = await dbService.getRepositoriesByTeam(teamId);
  const allMetrics = await dbService.getMetricsByTeam(teamId);
  
  const timeMap = new Map<string, any>();
  
  allMetrics.forEach(metric => {
    const repoId = metric.repositoryId || (metric as any).repository_id;
    const repo = repos.find(r => r.id === repoId);
    if (!repo) return;
    
    // Round timestamp to the nearest minute to group data from the same polling cycle
    const date = new Date(metric.timestamp);
    date.setSeconds(0, 0); // Reset seconds and milliseconds to 0
    const timestamp = date.toISOString();
    
    if (!timeMap.has(timestamp)) {
      timeMap.set(timestamp, {
        timestamp,
        languages: {},
        total: { bytes: 0, lines: 0 }
      });
    }
    
    const entry = timeMap.get(timestamp);
    
    if (!entry.languages[metric.language]) {
      entry.languages[metric.language] = { bytes: 0, lines: 0 };
    }
    
    entry.languages[metric.language].bytes += metric.bytes;
    entry.languages[metric.language].lines += metric.lines;
    entry.total.bytes += metric.bytes;
    entry.total.lines += metric.lines;
  });
  
  const chartData: ChartData = {
    teamId: team.id,
    teamName: team.name,
    data: Array.from(timeMap.values()).sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
  };
  
  return c.json(chartData);
});

export default app;