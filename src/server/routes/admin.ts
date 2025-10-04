import { Hono } from 'hono';

const app = new Hono();

app.post('/auth', async (c) => {
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

export default app;