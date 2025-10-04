import pkg from 'pg';
const { Pool } = pkg;

let db;

function getDatabase() {
  if (!db) {
    db = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
  }
  return db;
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const database = getDatabase();

  try {
    if (req.method === 'GET') {
      // Get all teams
      const result = await database.query('SELECT * FROM teams ORDER BY created_at DESC');
      return res.status(200).json(result.rows);
    }

    if (req.method === 'POST') {
      // Create new team
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ error: 'Team name is required' });
      }

      const result = await database.query(
        'INSERT INTO teams (name) VALUES ($1) RETURNING *',
        [name]
      );
      return res.status(201).json(result.rows[0]);
    }

    if (req.method === 'DELETE') {
      // Delete team
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ error: 'Team ID is required' });
      }

      const result = await database.query('DELETE FROM teams WHERE id = $1', [id]);
      const success = (result.rowCount || 0) > 0;
      return res.status(200).json({ success });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Database operation failed' });
  }
}