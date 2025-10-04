import { dbService } from '../db/models.js';
import { eventEmitter } from './eventEmitter.js';
import { fetchRepositoryLanguages } from './githubService.js';

const POLLING_INTERVAL = 5 * 60 * 1000; // 5 minutes

async function pollRepositories() {
  console.log('Starting repository polling...');
  
  const repositories = await dbService.getAllRepositories();
  console.log('Repositories to poll:', repositories.length);
  
  for (const repo of repositories) {
    const languages = await fetchRepositoryLanguages(repo.owner, repo.name);
    
    if (languages) {
      await dbService.addMetrics(repo.id, languages);
      console.log(`Updated metrics for ${repo.owner}/${repo.name}`);
    }
  }
  
  eventEmitter.emit('metrics-updated');
  console.log('Repository polling completed');
}

export function startPolling() {
  pollRepositories();
  
  setInterval(() => {
    pollRepositories();
  }, POLLING_INTERVAL);
  
  console.log(`GitHub polling started with ${POLLING_INTERVAL / 1000}s interval`);
}

export function triggerImmediatePolling() {
  console.log('Triggering immediate polling...');
  pollRepositories();
}