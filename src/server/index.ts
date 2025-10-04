import dotenv from 'dotenv';
dotenv.config();

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serveStatic } from '@hono/node-server/serve-static';
import teamsRoutes from './routes/teams.js';
import reposRoutes from './routes/repos.js';
import metricsRoutes from './routes/metrics.js';
import streamRoutes from './routes/stream.js';
import githubRoutes from './routes/github.js';
import adminRoutes from './routes/admin.js';
import { startPolling } from './services/githubPoller.js';
import { initializeDatabase } from './db/database.js';

const app = new Hono();

app.use('*', logger());
app.use('/api/*', cors());

app.route('/api/teams', teamsRoutes);
app.route('/api/repos', reposRoutes);
app.route('/api/metrics', metricsRoutes);
app.route('/api/stream', streamRoutes);
app.route('/api/github', githubRoutes);
app.route('/api/admin', adminRoutes);

app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/*', serveStatic({ root: './dist/client' }));

const port = parseInt(process.env.PORT || '3000');

console.log(`Starting HackShon server on port ${port}...`);

// Initialize database
await initializeDatabase();

serve({
  fetch: app.fetch,
  port,
});

startPolling();

console.log(`HackShon server running at http://localhost:${port}`);