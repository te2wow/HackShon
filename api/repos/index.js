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
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const database = getDatabase();

  try {
    if (req.method === 'GET') {
      const { teamId } = req.query;
      
      if (teamId) {
        // Get repositories for a specific team
        const result = await database.query(
          'SELECT * FROM repositories WHERE team_id = $1 ORDER BY created_at DESC',
          [teamId]
        );
        return res.status(200).json(result.rows);
      } else {
        // Get all repositories
        const result = await database.query('SELECT * FROM repositories ORDER BY created_at DESC');
        return res.status(200).json(result.rows);
      }
    }

    if (req.method === 'POST') {
      const { teamId, owner, name, url } = req.body;
      
      if (!teamId || !owner || !name || !url) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const result = await database.query(
        'INSERT INTO repositories (team_id, owner, name, url) VALUES ($1, $2, $3, $4) RETURNING *',
        [teamId, owner, name, url]
      );
      return res.status(201).json(result.rows[0]);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ error: 'Repository ID is required' });
      }

      const result = await database.query('DELETE FROM repositories WHERE id = $1', [id]);
      const success = (result.rowCount || 0) > 0;
      return res.status(200).json({ success });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Database operation failed' });
  }
}