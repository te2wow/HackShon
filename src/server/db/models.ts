import { db } from './database.js';
import { Team, Repository, Metric } from '@shared/types.js';

export class DatabaseService {
  // Teams
  async getAllTeams(): Promise<Team[]> {
    const result = await db.query('SELECT * FROM teams ORDER BY created_at DESC');
    return result.rows;
  }

  async getTeamById(id: number): Promise<Team | undefined> {
    const result = await db.query('SELECT * FROM teams WHERE id = $1', [id]);
    return result.rows[0];
  }

  async createTeam(name: string): Promise<Team> {
    const result = await db.query(
      'INSERT INTO teams (name) VALUES ($1) RETURNING *',
      [name]
    );
    return result.rows[0];
  }

  async updateTeam(id: number, name: string): Promise<Team | undefined> {
    const result = await db.query(
      'UPDATE teams SET name = $1 WHERE id = $2 RETURNING *',
      [name, id]
    );
    return result.rows[0];
  }

  async deleteTeam(id: number): Promise<boolean> {
    const result = await db.query('DELETE FROM teams WHERE id = $1', [id]);
    return result.rowCount > 0;
  }

  // Repositories
  async getAllRepositories(): Promise<Repository[]> {
    const result = await db.query('SELECT * FROM repositories ORDER BY created_at DESC');
    return result.rows;
  }

  async getRepositoryById(id: number): Promise<Repository | undefined> {
    const result = await db.query('SELECT * FROM repositories WHERE id = $1', [id]);
    return result.rows[0];
  }

  async getRepositoriesByTeam(teamId: number): Promise<Repository[]> {
    const result = await db.query(
      'SELECT * FROM repositories WHERE team_id = $1 ORDER BY created_at DESC',
      [teamId]
    );
    return result.rows;
  }

  async createRepository(teamId: number, owner: string, name: string, url: string): Promise<Repository> {
    const result = await db.query(
      'INSERT INTO repositories (team_id, owner, name, url) VALUES ($1, $2, $3, $4) RETURNING *',
      [teamId, owner, name, url]
    );
    return result.rows[0];
  }

  async deleteRepository(id: number): Promise<boolean> {
    const result = await db.query('DELETE FROM repositories WHERE id = $1', [id]);
    return result.rowCount > 0;
  }

  // Metrics
  async addMetrics(repositoryId: number, languageData: Record<string, number>): Promise<void> {
    const client = await db.connect();
    
    try {
      await client.query('BEGIN');
      
      const timestamp = new Date();
      
      for (const [language, bytes] of Object.entries(languageData)) {
        const lines = Math.round(bytes / 50);
        await client.query(
          'INSERT INTO metrics (repository_id, language, bytes, lines, timestamp) VALUES ($1, $2, $3, $4, $5)',
          [repositoryId, language, bytes, lines, timestamp]
        );
      }
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getMetricsByRepository(repositoryId: number, limit = 100): Promise<Metric[]> {
    const result = await db.query(
      `SELECT * FROM metrics 
       WHERE repository_id = $1 
       ORDER BY timestamp DESC 
       LIMIT $2`,
      [repositoryId, limit]
    );
    return result.rows;
  }

  async getMetricsByTeam(teamId: number, limit = 100): Promise<Metric[]> {
    const result = await db.query(
      `SELECT m.* FROM metrics m
       JOIN repositories r ON m.repository_id = r.id
       WHERE r.team_id = $1
       ORDER BY m.timestamp DESC
       LIMIT $2`,
      [teamId, limit]
    );
    return result.rows;
  }

  async getLatestMetricsByTeam(teamId: number): Promise<any[]> {
    const result = await db.query(
      `SELECT 
         m.timestamp,
         m.language,
         SUM(m.bytes) as bytes,
         SUM(m.lines) as lines
       FROM metrics m
       JOIN repositories r ON m.repository_id = r.id
       WHERE r.team_id = $1
       GROUP BY m.timestamp, m.language
       ORDER BY m.timestamp DESC`,
      [teamId]
    );
    return result.rows;
  }

  // データクリーンアップ（古いメトリクスを削除）
  async cleanOldMetrics(daysToKeep = 30): Promise<number> {
    const result = await db.query(
      `DELETE FROM metrics 
       WHERE timestamp < NOW() - INTERVAL '$1 days'`,
      [daysToKeep]
    );
    return result.rowCount || 0;
  }

  // データベース統計
  async getDatabaseStats(): Promise<any> {
    const teamsResult = await db.query('SELECT COUNT(*) as count FROM teams');
    const reposResult = await db.query('SELECT COUNT(*) as count FROM repositories');
    const metricsResult = await db.query('SELECT COUNT(*) as count FROM metrics');
    
    return {
      teams: parseInt(teamsResult.rows[0].count),
      repositories: parseInt(reposResult.rows[0].count),
      metrics: parseInt(metricsResult.rows[0].count),
    };
  }
}

export const dbService = new DatabaseService();