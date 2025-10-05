import { Hono } from 'hono';

const app = new Hono();

app.post('/auth', async (c) => {
  try {
    const { password } = await c.req.json();
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    console.log('Admin auth attempt - Password received:', password ? 'Yes' : 'No');
    console.log('Admin auth attempt - ADMIN_PASSWORD env var exists:', adminPassword ? 'Yes' : 'No');

    if (!adminPassword) {
      console.error('ADMIN_PASSWORD environment variable is not set');
      return c.json({ error: 'Server configuration error' }, 500);
    }

    if (!password) {
      return c.json({ error: 'Password is required' }, 400);
    }

    if (password === adminPassword) {
      console.log('Admin auth successful');
      return c.json({ success: true });
    } else {
      console.log('Admin auth failed - password mismatch');
      console.log('Expected length:', adminPassword.length);
      console.log('Received length:', password.length);
      return c.json({ error: 'Invalid password' }, 401);
    }
  } catch (error) {
    console.error('Admin auth error:', error);
    return c.json({ error: 'Authentication failed' }, 500);
  }
});

export default app;