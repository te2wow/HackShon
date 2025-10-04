export interface Team {
  id: number;
  name: string;
  createdAt: string;
}

export interface Repository {
  id: number;
  teamId: number;
  owner: string;
  name: string;
  url: string;
  createdAt: string;
}

export interface Metric {
  id: number;
  repositoryId: number;
  language: string;
  bytes: number;
  lines: number;
  timestamp: string;
}

export interface TeamWithRepos extends Team {
  repositories: Repository[];
}

export interface MetricWithRepo extends Metric {
  repository: Repository;
}

export interface ChartData {
  teamId: number;
  teamName: string;
  data: {
    timestamp: string;
    languages: {
      [language: string]: {
        bytes: number;
        lines: number;
      };
    };
    total: {
      bytes: number;
      lines: number;
    };
  }[];
}