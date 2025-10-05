#!/usr/bin/env node

import pkg from 'pg';
const { Pool } = pkg;
import { Octokit } from 'octokit';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

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

async function collectMetrics() {
  console.log('Starting metrics collection...');
  
  try {
    // Check environment variables
    if (!process.env.GITHUB_TOKEN) {
      throw new Error('GITHUB_TOKEN environment variable is not set');
    }

    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    const database = getDatabase();
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    // Get all repositories
    const repoResult = await database.query('SELECT * FROM repositories');
    const repositories = repoResult.rows;
    
    console.log(`Found ${repositories.length} repositories to process`);

    let successCount = 0;
    let errorCount = 0;

    for (const repo of repositories) {
      try {
        console.log(`Processing repository: ${repo.owner}/${repo.name}`);
        
        // Fetch language data from GitHub
        const response = await octokit.rest.repos.listLanguages({
          owner: repo.owner,
          repo: repo.name,
        });

        const languageData = response.data;
        console.log(`Languages found for ${repo.owner}/${repo.name}:`, Object.keys(languageData));
        
        if (Object.keys(languageData).length > 0) {
          // Round timestamp to the nearest minute
          const timestamp = new Date();
          timestamp.setSeconds(0, 0);
          
          // Check if we already have data for this timestamp and repository
          const existingData = await database.query(
            'SELECT COUNT(*) FROM metrics WHERE repository_id = $1 AND timestamp = $2',
            [repo.id, timestamp]
          );
          
          if (parseInt(existingData.rows[0].count) > 0) {
            console.log(`Skipping ${repo.owner}/${repo.name} - data already exists for ${timestamp.toISOString()}`);
            continue;
          }
          
          // Start transaction
          const client = await database.connect();
          
          try {
            await client.query('BEGIN');
            
            // Insert metrics for each language
            for (const [language, bytes] of Object.entries(languageData)) {
              const lines = Math.round(bytes / 50); // Rough estimate
              
              await client.query(
                'INSERT INTO metrics (repository_id, language, bytes, lines, timestamp) VALUES ($1, $2, $3, $4, $5)',
                [repo.id, language, bytes, lines, timestamp]
              );
            }
            
            await client.query('COMMIT');
            console.log(`✓ Updated metrics for ${repo.owner}/${repo.name}`);
            successCount++;
          } catch (error) {
            await client.query('ROLLBACK');
            console.error(`✗ Transaction error for ${repo.owner}/${repo.name}:`, error.message);
            errorCount++;
          } finally {
            client.release();
          }
        } else {
          console.log(`No languages found for ${repo.owner}/${repo.name}`);
        }
      } catch (error) {
        console.error(`✗ Error processing ${repo.owner}/${repo.name}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\nMetrics collection completed:`);
    console.log(`  ✓ Success: ${successCount} repositories`);
    console.log(`  ✗ Errors: ${errorCount} repositories`);
    
    // Close database connection
    await database.end();
    
    return {
      success: true,
      processed: repositories.length,
      successful: successCount,
      errors: errorCount
    };
    
  } catch (error) {
    console.error('Metrics collection failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  collectMetrics()
    .then((result) => {
      console.log('Metrics collection script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Metrics collection script failed:', error);
      process.exit(1);
    });
}

export { collectMetrics };