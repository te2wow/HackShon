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
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { teamId } = req.query;
  
  if (!teamId) {
    return res.status(400).json({ error: 'Team ID is required' });
  }

  const database = getDatabase();

  try {
    // Get team info
    const teamResult = await database.query('SELECT * FROM teams WHERE id = $1', [teamId]);
    const team = teamResult.rows[0];
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Get metrics for all repositories in the team
    const metricsResult = await database.query(
      `SELECT 
         m.timestamp,
         m.language,
         SUM(m.bytes) as bytes,
         SUM(m.lines) as lines
       FROM metrics m
       JOIN repositories r ON m.repository_id = r.id
       WHERE r.team_id = $1
       GROUP BY m.timestamp, m.language
       ORDER BY m.timestamp ASC`,
      [teamId]
    );

    // Group metrics by timestamp
    const timeMap = new Map();
    
    metricsResult.rows.forEach(metric => {
      const timestamp = metric.timestamp.toISOString();
      
      if (!timeMap.has(timestamp)) {
        timeMap.set(timestamp, {
          timestamp,
          languages: {},
          total: { bytes: 0, lines: 0 }
        });
      }
      
      const entry = timeMap.get(timestamp);
      entry.languages[metric.language] = {
        bytes: parseInt(metric.bytes),
        lines: parseInt(metric.lines)
      };
      entry.total.bytes += parseInt(metric.bytes);
      entry.total.lines += parseInt(metric.lines);
    });

    const chartData = {
      teamId: parseInt(teamId),
      teamName: team.name,
      data: Array.from(timeMap.values())
    };

    return res.status(200).json(chartData);
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Failed to fetch chart data' });
  }
}