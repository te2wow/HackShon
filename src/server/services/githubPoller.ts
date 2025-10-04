import { dataStore } from '../store/dataStore.js';
import { eventEmitter } from './eventEmitter.js';
import { fetchRepositoryLanguages } from './githubService.js';

const POLLING_INTERVAL = 30 * 60 * 1000; // 30 minutes

async function pollRepositories() {
  console.log('Starting repository polling...');
  
  const repositories = dataStore.getRepositories();
  console.log('Repositories to poll:', repositories);
  
  for (const repo of repositories) {
    const languages = await fetchRepositoryLanguages(repo.owner, repo.name);
    
    if (languages) {
      // Create a single metric entry with all languages combined
      const timestamp = new Date().toISOString();
      
      for (const [language, bytes] of Object.entries(languages)) {
        const lines = Math.round((bytes as number) / 50);
        await dataStore.addMetricWithTimestamp(repo.id, language, bytes as number, lines, timestamp);
      }
      
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