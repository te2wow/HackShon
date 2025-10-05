import { Team, Repository, Metric, TeamWithRepos, ChartData } from './types';

describe('Types', () => {
  describe('Team interface', () => {
    it('should have correct structure', () => {
      const team: Team = {
        id: 1,
        name: 'Test Team',
        created_at: '2024-01-01T00:00:00Z'
      };

      expect(team).toHaveProperty('id');
      expect(team).toHaveProperty('name');
      expect(team).toHaveProperty('created_at');
      expect(typeof team.id).toBe('number');
      expect(typeof team.name).toBe('string');
      expect(typeof team.created_at).toBe('string');
    });
  });

  describe('Repository interface', () => {
    it('should have correct structure', () => {
      const repository: Repository = {
        id: 1,
        team_id: 1,
        owner: 'testowner',
        name: 'testrepo',
        url: 'https://github.com/testowner/testrepo',
        created_at: '2024-01-01T00:00:00Z'
      };

      expect(repository).toHaveProperty('id');
      expect(repository).toHaveProperty('team_id');
      expect(repository).toHaveProperty('owner');
      expect(repository).toHaveProperty('name');
      expect(repository).toHaveProperty('url');
      expect(repository).toHaveProperty('created_at');
      expect(typeof repository.id).toBe('number');
      expect(typeof repository.team_id).toBe('number');
      expect(typeof repository.owner).toBe('string');
      expect(typeof repository.name).toBe('string');
      expect(typeof repository.url).toBe('string');
      expect(typeof repository.created_at).toBe('string');
    });
  });

  describe('Metric interface', () => {
    it('should have correct structure', () => {
      const metric: Metric = {
        id: 1,
        repository_id: 1,
        language: 'TypeScript',
        bytes: 1000,
        lines: 50,
        timestamp: '2024-01-01T00:00:00Z'
      };

      expect(metric).toHaveProperty('id');
      expect(metric).toHaveProperty('repository_id');
      expect(metric).toHaveProperty('language');
      expect(metric).toHaveProperty('bytes');
      expect(metric).toHaveProperty('lines');
      expect(metric).toHaveProperty('timestamp');
      expect(typeof metric.id).toBe('number');
      expect(typeof metric.repository_id).toBe('number');
      expect(typeof metric.language).toBe('string');
      expect(typeof metric.bytes).toBe('number');
      expect(typeof metric.lines).toBe('number');
      expect(typeof metric.timestamp).toBe('string');
    });
  });

  describe('TeamWithRepos interface', () => {
    it('should have correct structure', () => {
      const teamWithRepos: TeamWithRepos = {
        id: 1,
        name: 'Test Team',
        created_at: '2024-01-01T00:00:00Z',
        repositories: [
          {
            id: 1,
            team_id: 1,
            owner: 'testowner',
            name: 'testrepo',
            url: 'https://github.com/testowner/testrepo',
            created_at: '2024-01-01T00:00:00Z'
          }
        ]
      };

      expect(teamWithRepos).toHaveProperty('id');
      expect(teamWithRepos).toHaveProperty('name');
      expect(teamWithRepos).toHaveProperty('created_at');
      expect(teamWithRepos).toHaveProperty('repositories');
      expect(Array.isArray(teamWithRepos.repositories)).toBe(true);
      expect(teamWithRepos.repositories).toHaveLength(1);
    });
  });

  describe('ChartData interface', () => {
    it('should have correct structure', () => {
      const chartData: ChartData = {
        teamId: 1,
        teamName: 'Test Team',
        data: [
          {
            timestamp: '2024-01-01T00:00:00Z',
            languages: {
              TypeScript: { bytes: 1000, lines: 50 },
              JavaScript: { bytes: 500, lines: 25 }
            },
            total: { bytes: 1500, lines: 75 }
          }
        ]
      };

      expect(chartData).toHaveProperty('teamId');
      expect(chartData).toHaveProperty('teamName');
      expect(chartData).toHaveProperty('data');
      expect(typeof chartData.teamId).toBe('number');
      expect(typeof chartData.teamName).toBe('string');
      expect(Array.isArray(chartData.data)).toBe(true);
      expect(chartData.data).toHaveLength(1);
      
      const dataPoint = chartData.data[0];
      expect(dataPoint).toHaveProperty('timestamp');
      expect(dataPoint).toHaveProperty('languages');
      expect(dataPoint).toHaveProperty('total');
      expect(typeof dataPoint.timestamp).toBe('string');
      expect(typeof dataPoint.languages).toBe('object');
      expect(typeof dataPoint.total).toBe('object');
      expect(dataPoint.total).toHaveProperty('bytes');
      expect(dataPoint.total).toHaveProperty('lines');
    });

    it('should handle empty data array', () => {
      const chartData: ChartData = {
        teamId: 1,
        teamName: 'Empty Team',
        data: []
      };

      expect(chartData.data).toHaveLength(0);
      expect(Array.isArray(chartData.data)).toBe(true);
    });

    it('should handle multiple languages in data point', () => {
      const chartData: ChartData = {
        teamId: 1,
        teamName: 'Multi-lang Team',
        data: [
          {
            timestamp: '2024-01-01T00:00:00Z',
            languages: {
              TypeScript: { bytes: 1000, lines: 50 },
              JavaScript: { bytes: 500, lines: 25 },
              Python: { bytes: 800, lines: 40 },
              Go: { bytes: 300, lines: 15 }
            },
            total: { bytes: 2600, lines: 130 }
          }
        ]
      };

      const languages = chartData.data[0].languages;
      expect(Object.keys(languages)).toHaveLength(4);
      expect(languages.TypeScript.bytes).toBe(1000);
      expect(languages.Python.lines).toBe(40);
    });
  });
});