import { Hono } from 'hono';
import { dataStore } from '../store/dataStore.js';
import { ChartData } from '@shared/types';

const app = new Hono();

app.get('/', (c) => {
  const teamId = c.req.query('teamId');
  const repositoryId = c.req.query('repositoryId');
  const limit = c.req.query('limit');
  
  let metrics;
  
  if (repositoryId) {
    metrics = dataStore.getMetricsByRepository(parseInt(repositoryId), limit ? parseInt(limit) : undefined);
  } else if (teamId) {
    metrics = dataStore.getMetricsByTeam(parseInt(teamId), limit ? parseInt(limit) : undefined);
  } else {
    metrics = dataStore.getAllMetrics(limit ? parseInt(limit) : undefined);
  }
  
  return c.json(metrics);
});

app.get('/chart/:teamId', (c) => {
  const teamId = parseInt(c.req.param('teamId'));
  const team = dataStore.getTeam(teamId);
  
  if (!team) {
    return c.json({ error: 'Team not found' }, 404);
  }
  
  const repos = dataStore.getRepositoriesByTeam(teamId);
  const allMetrics = dataStore.getMetricsByTeam(teamId);
  
  const timeMap = new Map<string, any>();
  
  allMetrics.forEach(metric => {
    const repo = repos.find(r => r.id === metric.repositoryId);
    if (!repo) return;
    
    const timestamp = new Date(metric.timestamp).toISOString();
    
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