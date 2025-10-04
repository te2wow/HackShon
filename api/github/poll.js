import pkg from 'pg';
const { Pool } = pkg;
import { Octokit } from 'octokit';

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
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const database = getDatabase();
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
  });

  try {
    // Get all repositories
    const repoResult = await database.query('SELECT * FROM repositories');
    const repositories = repoResult.rows;
    
    console.log(`Polling ${repositories.length} repositories...`);

    for (const repo of repositories) {
      try {
        // Fetch language data from GitHub
        const response = await octokit.rest.repos.listLanguages({
          owner: repo.owner,
          repo: repo.name,
        });

        const languageData = response.data;
        
        if (Object.keys(languageData).length > 0) {
          // Start transaction
          const client = await database.connect();
          
          try {
            await client.query('BEGIN');
            
            const timestamp = new Date();
            
            // Insert metrics for each language
            for (const [language, bytes] of Object.entries(languageData)) {
              const lines = Math.round(bytes / 50); // Rough estimate
              
              await client.query(
                'INSERT INTO metrics (repository_id, language, bytes, lines, timestamp) VALUES ($1, $2, $3, $4, $5)',
                [repo.id, language, bytes, lines, timestamp]
              );
            }
            
            await client.query('COMMIT');
            console.log(`Updated metrics for ${repo.owner}/${repo.name}`);
          } catch (error) {
            await client.query('ROLLBACK');
            throw error;
          } finally {
            client.release();
          }
        }
      } catch (error) {
        console.error(`Error polling ${repo.owner}/${repo.name}:`, error.message);
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: `Polled ${repositories.length} repositories` 
    });
  } catch (error) {
    console.error('Polling error:', error);
    return res.status(500).json({ error: 'Polling failed' });
  }
}