import { Team, Repository, Metric, TeamWithRepos } from '@shared/types';

interface LocalStorageData {
  teams: Record<number, Team>;
  repositories: Record<number, Repository>;
  metrics: Record<number, Metric[]>;
  nextId: {
    team: number;
    repository: number;
    metric: number;
  };
  lastUpdated: string;
}

const STORAGE_KEY = 'hackshon-data';
const MAX_METRICS_PER_REPO = 100; // Limit metrics to prevent localStorage bloat

class LocalStorageService {
  private data: LocalStorageData = {
    teams: {},
    repositories: {},
    metrics: {},
    nextId: {
      team: 1,
      repository: 1,
      metric: 1,
    },
    lastUpdated: new Date().toISOString(),
  };

  constructor() {
    this.loadData();
  }

  private loadData(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.data = { ...this.data, ...JSON.parse(stored) };
        console.log('Loaded data from localStorage:', {
          teams: Object.keys(this.data.teams).length,
          repositories: Object.keys(this.data.repositories).length,
          metrics: Object.keys(this.data.metrics).length,
        });
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
    }
  }

  private saveData(): void {
    try {
      this.data.lastUpdated = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      console.log('Data saved to localStorage');
    } catch (error) {
      console.error('Error saving data to localStorage:', error);
      // If localStorage is full, try to clean old metrics
      this.cleanOldData();
    }
  }

  private cleanOldData(): void {
    console.log('Cleaning old data to free up localStorage space...');
    
    // Keep only last 50 metrics per repository instead of 100
    Object.keys(this.data.metrics).forEach(repoId => {
      const metrics = this.data.metrics[parseInt(repoId)];
      if (metrics && metrics.length > 50) {
        this.data.metrics[parseInt(repoId)] = metrics.slice(-50);
      }
    });

    try {
      this.saveData();
    } catch (error) {
      console.error('Still unable to save after cleanup:', error);
    }
  }

  // Teams
  getTeams(): Team[] {
    return Object.values(this.data.teams);
  }

  getTeam(id: number): Team | undefined {
    return this.data.teams[id];
  }

  getTeamWithRepos(id: number): TeamWithRepos | undefined {
    const team = this.data.teams[id];
    if (!team) return undefined;
    
    const repositories = this.getRepositoriesByTeam(id);
    return { ...team, repositories };
  }

  createTeam(name: string): Team {
    const team: Team = {
      id: this.data.nextId.team++,
      name,
      createdAt: new Date().toISOString(),
    };
    this.data.teams[team.id] = team;
    this.saveData();
    return team;
  }

  updateTeam(id: number, name: string): Team | undefined {
    const team = this.data.teams[id];
    if (!team) return undefined;
    
    team.name = name;
    this.saveData();
    return team;
  }

  deleteTeam(id: number): boolean {
    const repos = this.getRepositoriesByTeam(id);
    repos.forEach(repo => this.deleteRepository(repo.id));
    const success = delete this.data.teams[id];
    if (success) this.saveData();
    return success;
  }

  // Repositories
  getRepositories(): Repository[] {
    return Object.values(this.data.repositories);
  }

  getRepository(id: number): Repository | undefined {
    return this.data.repositories[id];
  }

  getRepositoriesByTeam(teamId: number): Repository[] {
    return Object.values(this.data.repositories).filter(repo => repo.teamId === teamId);
  }

  createRepository(teamId: number, owner: string, name: string, url: string): Repository {
    const repository: Repository = {
      id: this.data.nextId.repository++,
      teamId,
      owner,
      name,
      url,
      createdAt: new Date().toISOString(),
    };
    this.data.repositories[repository.id] = repository;
    this.saveData();
    return repository;
  }

  deleteRepository(id: number): boolean {
    delete this.data.metrics[id];
    const success = delete this.data.repositories[id];
    if (success) this.saveData();
    return success;
  }

  // Metrics
  addMetrics(repositoryId: number, languageData: Record<string, number>): void {
    const timestamp = new Date().toISOString();
    
    if (!this.data.metrics[repositoryId]) {
      this.data.metrics[repositoryId] = [];
    }

    // Add metrics for each language with the same timestamp
    Object.entries(languageData).forEach(([language, bytes]) => {
      const lines = Math.round(bytes / 50);
      const metric: Metric = {
        id: this.data.nextId.metric++,
        repositoryId,
        language,
        bytes,
        lines,
        timestamp,
      };
      this.data.metrics[repositoryId].push(metric);
    });

    // Keep only recent metrics to prevent localStorage bloat
    if (this.data.metrics[repositoryId].length > MAX_METRICS_PER_REPO) {
      this.data.metrics[repositoryId] = this.data.metrics[repositoryId].slice(-MAX_METRICS_PER_REPO);
    }

    this.saveData();
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

  // Utility
  getStorageInfo(): { used: string; total: string; percentage: number } {
    try {
      const used = JSON.stringify(this.data).length;
      const total = 5 * 1024 * 1024; // 5MB typical localStorage limit
      return {
        used: (used / 1024).toFixed(1) + 'KB',
        total: (total / 1024 / 1024).toFixed(1) + 'MB',
        percentage: Math.round((used / total) * 100)
      };
    } catch {
      return { used: 'Unknown', total: 'Unknown', percentage: 0 };
    }
  }

  clearAllData(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.data = {
      teams: {},
      repositories: {},
      metrics: {},
      nextId: { team: 1, repository: 1, metric: 1 },
      lastUpdated: new Date().toISOString(),
    };
  }
}

export const localStorageService = new LocalStorageService();