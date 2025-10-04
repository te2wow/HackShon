import { Team, Repository, Metric, TeamWithRepos } from '@shared/types';

class DataStore {
  private teams: Map<number, Team> = new Map();
  private repositories: Map<number, Repository> = new Map();
  private metrics: Map<number, Metric[]> = new Map();
  private nextId = {
    team: 1,
    repository: 1,
    metric: 1,
  };

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData() {
    const team = this.createTeam('Sample Team');
    this.createRepository(team.id, 'facebook', 'react', 'https://github.com/facebook/react');
  }

  createTeam(name: string): Team {
    const team: Team = {
      id: this.nextId.team++,
      name,
      createdAt: new Date().toISOString(),
    };
    this.teams.set(team.id, team);
    return team;
  }

  getTeams(): Team[] {
    return Array.from(this.teams.values());
  }

  getTeam(id: number): Team | undefined {
    return this.teams.get(id);
  }

  getTeamWithRepos(id: number): TeamWithRepos | undefined {
    const team = this.teams.get(id);
    if (!team) return undefined;
    
    const repositories = this.getRepositoriesByTeam(id);
    return { ...team, repositories };
  }

  updateTeam(id: number, name: string): Team | undefined {
    const team = this.teams.get(id);
    if (!team) return undefined;
    
    team.name = name;
    return team;
  }

  deleteTeam(id: number): boolean {
    const repos = this.getRepositoriesByTeam(id);
    repos.forEach(repo => this.deleteRepository(repo.id));
    return this.teams.delete(id);
  }

  createRepository(teamId: number, owner: string, name: string, url: string): Repository {
    const repository: Repository = {
      id: this.nextId.repository++,
      teamId,
      owner,
      name,
      url,
      createdAt: new Date().toISOString(),
    };
    this.repositories.set(repository.id, repository);
    return repository;
  }

  getRepositories(): Repository[] {
    return Array.from(this.repositories.values());
  }

  getRepository(id: number): Repository | undefined {
    return this.repositories.get(id);
  }

  getRepositoriesByTeam(teamId: number): Repository[] {
    return Array.from(this.repositories.values()).filter(repo => repo.teamId === teamId);
  }

  deleteRepository(id: number): boolean {
    this.metrics.delete(id);
    return this.repositories.delete(id);
  }

  addMetric(repositoryId: number, language: string, bytes: number, lines: number): Metric {
    const metric: Metric = {
      id: this.nextId.metric++,
      repositoryId,
      language,
      bytes,
      lines,
      timestamp: new Date().toISOString(),
    };
    
    const repoMetrics = this.metrics.get(repositoryId) || [];
    repoMetrics.push(metric);
    this.metrics.set(repositoryId, repoMetrics);
    
    return metric;
  }

  getMetricsByRepository(repositoryId: number, limit?: number): Metric[] {
    const metrics = this.metrics.get(repositoryId) || [];
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
    
    this.metrics.forEach(metrics => {
      allMetrics.push(...metrics);
    });
    
    const sorted = allMetrics.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    return limit ? sorted.slice(0, limit) : sorted;
  }
}

export const dataStore = new DataStore();