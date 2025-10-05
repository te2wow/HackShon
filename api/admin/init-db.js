import pkg from 'pg';
const { Pool } = pkg;

let db;

function getDatabase() {
  if (!db) {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    db = new Pool({
      connectionString: connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
  }
  return db;
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check admin password
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword || password !== adminPassword) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const database = getDatabase();

    // Create tables
    const createTablesSQL = `
      -- Create teams table
      CREATE TABLE IF NOT EXISTS teams (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create repositories table
      CREATE TABLE IF NOT EXISTS repositories (
          id SERIAL PRIMARY KEY,
          team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
          owner VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          url VARCHAR(512) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create metrics table
      CREATE TABLE IF NOT EXISTS metrics (
          id SERIAL PRIMARY KEY,
          repository_id INTEGER REFERENCES repositories(id) ON DELETE CASCADE,
          language VARCHAR(100) NOT NULL,
          bytes INTEGER NOT NULL,
          lines INTEGER NOT NULL,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_repositories_team_id ON repositories(team_id);
      CREATE INDEX IF NOT EXISTS idx_metrics_repository_id ON metrics(repository_id);
      CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics(timestamp);
    `;

    // Execute each statement
    const statements = createTablesSQL.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await database.query(statement);
      }
    }

    // Verify tables exist
    const result = await database.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('teams', 'repositories', 'metrics')
      ORDER BY table_name
    `);

    const createdTables = result.rows.map(row => row.table_name);

    return res.status(200).json({
      success: true,
      message: 'Database initialized successfully',
      tables: createdTables
    });

  } catch (error) {
    console.error('Database initialization error:', error);
    return res.status(500).json({ 
      error: 'Database initialization failed', 
      detail: error.message 
    });
  }
}