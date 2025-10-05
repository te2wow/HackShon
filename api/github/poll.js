import pkg from 'pg';
const { Pool } = pkg;
import { Octokit } from 'octokit';

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
    // Check environment variables first
    if (!process.env.GITHUB_TOKEN) {
      console.error('GITHUB_TOKEN not found in environment variables');
      return res.status(500).json({ error: 'GITHUB_TOKEN environment variable is not set' });
    }

    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL not found in environment variables');
      return res.status(500).json({ error: 'DATABASE_URL environment variable is not set' });
    }

    console.log('Environment variables check passed');

    let database;
    try {
      database = getDatabase();
      console.log('Database connection established');
    } catch (dbError) {
      console.error('Database connection failed:', dbError.message);
      return res.status(500).json({ error: 'Database connection failed: ' + dbError.message });
    }

    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    // Get all repositories
    let repositories;
    try {
      const repoResult = await database.query('SELECT * FROM repositories');
      repositories = repoResult.rows;
      console.log(`Found ${repositories.length} repositories to poll`);
    } catch (queryError) {
      console.error('Query failed:', queryError.message);
      return res.status(500).json({ error: 'Database query failed: ' + queryError.message });
    }
    for (const repo of repositories) {
      try {
        console.log(`Polling repository: ${repo.owner}/${repo.name}`);
        
        // Fetch language data from GitHub
        const response = await octokit.rest.repos.listLanguages({
          owner: repo.owner,
          repo: repo.name,
        });

        const languageData = response.data;
        console.log(`Languages found for ${repo.owner}/${repo.name}:`, Object.keys(languageData));
        
        if (Object.keys(languageData).length > 0) {
          // Start transaction
          const client = await database.connect();
          
          try {
            await client.query('BEGIN');
            
            // Round timestamp to the nearest minute to avoid duplicates from rapid polling
            const timestamp = new Date();
            timestamp.setSeconds(0, 0); // Reset seconds and milliseconds to 0
            
            // Check if we already have data for this timestamp and repository
            const existingData = await client.query(
              'SELECT COUNT(*) FROM metrics WHERE repository_id = $1 AND timestamp = $2',
              [repo.id, timestamp]
            );
            
            if (parseInt(existingData.rows[0].count) > 0) {
              console.log(`Skipping ${repo.owner}/${repo.name} - data already exists for ${timestamp.toISOString()}`);
              await client.query('ROLLBACK');
            } else {
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
            }
          } catch (error) {
            await client.query('ROLLBACK');
            console.error(`Transaction error for ${repo.owner}/${repo.name}:`, error.message);
            throw error;
          } finally {
            client.release();
          }
        } else {
          console.log(`No languages found for ${repo.owner}/${repo.name}`);
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
    console.error('Polling error:', error.message, error.stack);
    return res.status(500).json({ error: 'Polling failed: ' + error.message });
  }
}