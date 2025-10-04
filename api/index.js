const { Hono } = require('hono');
const { cors } = require('hono/cors');

const app = new Hono();

app.use('*', cors());

// Admin authentication endpoint
app.post('/admin/auth', async (c) => {
  try {
    const { password } = await c.req.json();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.error('ADMIN_PASSWORD environment variable is not set');
      return c.json({ error: 'Server configuration error' }, 500);
    }

    if (!password) {
      return c.json({ error: 'Password is required' }, 400);
    }

    if (password === adminPassword) {
      return c.json({ success: true });
    } else {
      return c.json({ error: 'Invalid password' }, 401);
    }
  } catch (error) {
    console.error('Admin auth error:', error);
    return c.json({ error: 'Authentication failed' }, 500);
  }
});

// Health check
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