import fs from 'fs';
import path from 'path';

// Create Vercel-compatible API handler
const apiHandler = `
const { Hono } = require('hono');
const { cors } = require('hono/cors');

const app = new Hono();

app.use('*', cors());

app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (c) => {
  return c.json({ message: 'HackShon API', status: 'running' });
});

// Export handler for Vercel
module.exports = (req, res) => {
  return app.fetch(req).then(response => {
    res.status(response.status);
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    return response.text();
  }).then(body => {
    res.end(body);
  }).catch(err => {
    console.error('API Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  });
};
`;

// Write the API handler
fs.writeFileSync('api/index.js', apiHandler.trim());

// Create package.json for API
const packageJson = {
  "dependencies": {
    "hono": "^4.0.0"
  }
};

fs.writeFileSync('api/package.json', JSON.stringify(packageJson, null, 2));

console.log('Created Vercel-compatible API handler');