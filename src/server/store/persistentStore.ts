import fs from 'fs/promises';
import path from 'path';
import { Team, Repository, Metric } from '@shared/types';

interface StoreData {
  teams: Record<number, Team>;
  repositories: Record<number, Repository>;
  metrics: Record<number, Metric[]>;
  nextId: {
    team: number;
    repository: number;
    metric: number;
  };
}

const DATA_FILE = path.join(process.cwd(), 'store-data.json');

export class PersistentStore {
  private data: StoreData = {
    teams: {},
    repositories: {},
    metrics: {},
    nextId: {
      team: 1,
      repository: 1,
      metric: 1,
    },
  };

  constructor() {
    this.loadData();
  }

  private async loadData() {
    try {
      const fileData = await fs.readFile(DATA_FILE, 'utf-8');
      this.data = JSON.parse(fileData);
      console.log('Loaded persisted data:', {
        teams: Object.keys(this.data.teams).length,
        repositories: Object.keys(this.data.repositories).length,
        metrics: Object.keys(this.data.metrics).length,
      });
    } catch (error) {
      console.log('No persisted data found, starting fresh');
      await this.saveData();
    }
  }

  async saveData() {
    try {
      await fs.writeFile(DATA_FILE, JSON.stringify(this.data, null, 2));
      console.log('Data persisted to disk');
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  getTeams(): Team[] {
    return Object.values(this.data.teams);
  }

  getTeam(id: number): Team | undefined {
    return this.data.teams[id];
  }

  async createTeam(name: string): Promise<Team> {
    const team: Team = {
      id: this.data.nextId.team++,
      name,
      createdAt: new Date().toISOString(),
    };
    this.data.teams[team.id] = team;
    await this.saveData();
    return team;
  }

  async updateTeam(id: number, name: string): Promise<Team | undefined> {
    const team = this.data.teams[id];
    if (!team) return undefined;
    
    team.name = name;
    await this.saveData();
    return team;
  }

  async deleteTeam(id: number): Promise<boolean> {
    const repos = this.getRepositoriesByTeam(id);
    for (const repo of repos) {
      await this.deleteRepository(repo.id);
    }
    const success = delete this.data.teams[id];
    if (success) {
      await this.saveData();
    }
    return success;
  }

  getRepositories(): Repository[] {
    return Object.values(this.data.repositories);
  }

  getRepository(id: number): Repository | undefined {
    return this.data.repositories[id];
  }

  getRepositoriesByTeam(teamId: number): Repository[] {
    return Object.values(this.data.repositories).filter(repo => repo.teamId === teamId);
  }

  async createRepository(teamId: number, owner: string, name: string, url: string): Promise<Repository> {
    const repository: Repository = {
      id: this.data.nextId.repository++,
      teamId,
      owner,
      name,
      url,
      createdAt: new Date().toISOString(),
    };
    this.data.repositories[repository.id] = repository;
    await this.saveData();
    return repository;
  }

  async deleteRepository(id: number): Promise<boolean> {
    delete this.data.metrics[id];
    const success = delete this.data.repositories[id];
    if (success) {
      await this.saveData();
    }
    return success;
  }

  async addMetric(repositoryId: number, language: string, bytes: number, lines: number): Promise<Metric> {
    return this.addMetricWithTimestamp(repositoryId, language, bytes, lines, new Date().toISOString());
  }

  async addMetricWithTimestamp(repositoryId: number, language: string, bytes: number, lines: number, timestamp: string): Promise<Metric> {
    const metric: Metric = {
      id: this.data.nextId.metric++,
      repositoryId,
      language,
      bytes,
      lines,
      timestamp,
    };
    
    if (!this.data.metrics[repositoryId]) {
      this.data.metrics[repositoryId] = [];
    }
    
    this.data.metrics[repositoryId].push(metric);
    
    // Keep only last 100 metrics per repository
    if (this.data.metrics[repositoryId].length > 100) {
      this.data.metrics[repositoryId] = this.data.metrics[repositoryId].slice(-100);
    }
    
    await this.saveData();
    return metric;
  }

  getMetricsByRepository(repositoryId: number, limit?: number): Metric[] {
    const metrics = this.data.metrics[repositoryId] || [];
    if (limit) {
      return metrics.slice(-limit);
    }
    return metrics;
  }

  getMetricsByTeam(teamId: number, limit?: number): Metric[] {
    const repos = this.getRepositoriesByTeam(teamId);
    const allMetrics: Metric[] = [];
    
    repos.forEach(repo => {
      const metrics = this.getMetricsByRepository(repo.id, limit);
      allMetrics.push(...metrics);
    });
    
    return allMetrics.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  getAllMetrics(limit?: number): Metric[] {
    const allMetrics: Metric[] = [];
    
    Object.values(this.data.metrics).forEach(metrics => {
      allMetrics.push(...metrics);
    });
    
    const sorted = allMetrics.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    return limit ? sorted.slice(0, limit) : sorted;
  }
}