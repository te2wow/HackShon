export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const info = {
    environment: {
      NODE_ENV: process.env.NODE_ENV || 'not set',
      DATABASE_URL: process.env.DATABASE_URL ? 'Set (hidden)' : 'Not set',
      GITHUB_TOKEN: process.env.GITHUB_TOKEN ? 'Set (hidden)' : 'Not set',
      ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ? 'Set (hidden)' : 'Not set',
    },
    database: {
      configured: !!process.env.DATABASE_URL,
      host: process.env.DATABASE_URL ? 
        process.env.DATABASE_URL.match(/db\.([^.]+)\.supabase\.co/)?.[1] || 'unknown' : 
        'not configured',
    },
    timestamp: new Date().toISOString(),
  };

  return res.status(200).json(info);
}