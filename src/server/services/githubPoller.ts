import { Octokit } from 'octokit';
import { dataStore } from '../store/dataStore.js';
import { eventEmitter } from './eventEmitter.js';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const POLLING_INTERVAL = 5 * 60 * 1000; // 5 minutes

async function fetchRepositoryLanguages(owner: string, repo: string) {
  try {
    const { data } = await octokit.rest.repos.listLanguages({
      owner,
      repo,
    });
    
    return data;
  } catch (error) {
    console.error(`Error fetching languages for ${owner}/${repo}:`, error);
    return null;
  }
}

async function pollRepositories() {
  console.log('Starting repository polling...');
  
  const repositories = dataStore.getRepositories();
  
  for (const repo of repositories) {
    const languages = await fetchRepositoryLanguages(repo.owner, repo.name);
    
    if (languages) {
      const totalBytes = Object.values(languages).reduce((sum, bytes) => sum + (bytes as number), 0);
      
      for (const [language, bytes] of Object.entries(languages)) {
        const lines = Math.round((bytes as number) / 50);
        dataStore.addMetric(repo.id, language, bytes as number, lines);
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