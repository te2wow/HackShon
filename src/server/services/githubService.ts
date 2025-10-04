import { Octokit } from 'octokit';

let octokit: Octokit;

function getOctokit() {
  if (!octokit) {
    const githubToken = process.env.GITHUB_TOKEN;
    console.log('Initializing GitHub client - Token configured:', githubToken ? 'Yes' : 'No');
    octokit = new Octokit({
      auth: githubToken,
    });
  }
  return octokit;
}

export async function verifyRepository(owner: string, name: string): Promise<{ valid: boolean; error?: string }> {
  try {
    console.log(`Verifying repository: ${owner}/${name}`);
    
    // Check if repository exists and get basic info
    const { data: repo } = await getOctokit().rest.repos.get({
      owner,
      repo: name,
    });
    
    if (repo.private) {
      return { valid: false, error: 'Private repositories are not supported' };
    }
    
    // Try to get languages to ensure we have proper access
    const { data: languages } = await getOctokit().rest.repos.listLanguages({
      owner,
      repo: name,
    });
    
    console.log(`Repository ${owner}/${name} verified successfully`);
    console.log('Languages found:', Object.keys(languages).length > 0 ? Object.keys(languages).join(', ') : 'None');
    
    return { valid: true };
  } catch (error: any) {
    console.error(`Error verifying repository ${owner}/${name}:`, error.message);
    
    if (error.status === 404) {
      return { valid: false, error: 'Repository not found' };
    } else if (error.status === 403) {
      return { valid: false, error: 'API rate limit exceeded or access forbidden' };
    } else if (error.status === 401) {
      return { valid: false, error: 'Invalid GitHub token' };
    }
    
    return { valid: false, error: error.message || 'Failed to verify repository' };
  }
}

export async function fetchRepositoryLanguages(owner: string, repo: string) {
  try {
    console.log(`Fetching languages for ${owner}/${repo}...`);
    const { data } = await getOctokit().rest.repos.listLanguages({
      owner,
      repo,
    });
    
    console.log(`Languages data for ${owner}/${repo}:`, data);
    return data;
  } catch (error: any) {
    console.error(`Error fetching languages for ${owner}/${repo}:`, error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return null;
  }
}