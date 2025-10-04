import { Team, Repository, Metric, TeamWithRepos } from '@shared/types';
import { PersistentStore } from './persistentStore.js';

class DataStore extends PersistentStore {
  constructor() {
    super();
  }


  getTeamWithRepos(id: number): TeamWithRepos | undefined {
    const team = this.getTeam(id);
    if (!team) return undefined;
    
    const repositories = this.getRepositoriesByTeam(id);
    return { ...team, repositories };
  }
}

export const dataStore = new DataStore();