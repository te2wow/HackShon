import { Hono } from 'hono';
import { getRepositoryProgressHistory } from '../services/githubCommitsService.js';

const app = new Hono();

// Get repository progress history
app.get('/repository/:owner/:repo', async (c) => {
  const { owner, repo } = c.req.param();
  const since = c.req.query('since');
  const until = c.req.query('until');
  const intervalMinutes = parseInt(c.req.query('interval') || '5');
  
  if (!since) {
    return c.json({ error: 'since parameter is required (ISO 8601 format)' }, 400);
  }

  try {
    // Validate ISO 8601 date format
    const sinceDate = new Date(since);
    if (isNaN(sinceDate.getTime())) {
      return c.json({ error: 'Invalid since date format. Use ISO 8601 format (e.g., 2025-10-04T10:00:00Z)' }, 400);
    }

    let untilDate = null;
    if (until) {
      untilDate = new Date(until);
      if (isNaN(untilDate.getTime())) {
        return c.json({ error: 'Invalid until date format. Use ISO 8601 format (e.g., 2025-10-04T18:00:00Z)' }, 400);
      }
    }

    console.log(`Getting progress history for ${owner}/${repo} from ${since}${until ? ` to ${until}` : ''} with ${intervalMinutes}min intervals`);

    const progressData = await getRepositoryProgressHistory(
      owner,
      repo,
      since,
      until,
      intervalMinutes
    );

    return c.json(progressData);
  } catch (error: any) {
    console.error(`Error getting progress history for ${owner}/${repo}:`, error.message);
    
    if (error.status === 404) {
      return c.json({ error: 'Repository not found' }, 404);
    } else if (error.status === 403) {
      return c.json({ error: 'Access forbidden or API rate limit exceeded' }, 403);
    } else if (error.status === 401) {
      return c.json({ error: 'Invalid GitHub token' }, 401);
    }
    
    return c.json({ error: error.message || 'Failed to fetch progress history' }, 500);
  }
});

// Get multiple repositories progress for comparison
app.post('/compare', async (c) => {
  try {
    const body = await c.req.json();
    const { repositories, since, until, intervalMinutes = 5 } = body;

    if (!repositories || !Array.isArray(repositories) || repositories.length === 0) {
      return c.json({ error: 'repositories array is required' }, 400);
    }

    if (!since) {
      return c.json({ error: 'since parameter is required' }, 400);
    }

    const results = [];
    
    for (const repoInfo of repositories) {
      const { owner, repo } = repoInfo;
      if (!owner || !repo) {
        continue; // Skip invalid entries
      }

      try {
        const progressData = await getRepositoryProgressHistory(
          owner,
          repo,
          since,
          until,
          intervalMinutes
        );
        results.push(progressData);
      } catch (error) {
        console.error(`Error fetching ${owner}/${repo}:`, error);
        // Continue with other repositories
        results.push({
          repository: `${owner}/${repo}`,
          error: error instanceof Error ? error.message : 'Failed to fetch data',
        });
      }
    }

    return c.json({
      period: {
        start: since,
        end: until || new Date().toISOString(),
      },
      intervalMinutes,
      repositories: results,
    });
  } catch (error: any) {
    console.error('Error in progress comparison:', error.message);
    return c.json({ error: 'Failed to process comparison request' }, 500);
  }
});

// Get progress for team repositories
app.get('/team/:teamId', async (c) => {
  const teamId = parseInt(c.req.param('teamId'));
  const since = c.req.query('since');
  const until = c.req.query('until');
  const intervalMinutes = parseInt(c.req.query('interval') || '5');

  if (!since) {
    return c.json({ error: 'since parameter is required' }, 400);
  }

  try {
    // Import here to avoid circular dependency issues
    const { dbService } = await import('../db/models.js');
    
    const team = await dbService.getTeamById(teamId);
    if (!team) {
      return c.json({ error: 'Team not found' }, 404);
    }

    const repositories = await dbService.getRepositoriesByTeam(teamId);
    if (repositories.length === 0) {
      return c.json({ 
        team,
        repositories: [],
        message: 'No repositories found for this team'
      });
    }

    const results = [];
    
    for (const repo of repositories) {
      try {
        const progressData = await getRepositoryProgressHistory(
          repo.owner,
          repo.name,
          since,
          until,
          intervalMinutes
        );
        results.push(progressData);
      } catch (error) {
        console.error(`Error fetching ${repo.owner}/${repo.name}:`, error);
        results.push({
          repository: `${repo.owner}/${repo.name}`,
          error: error instanceof Error ? error.message : 'Failed to fetch data',
        });
      }
    }

    return c.json({
      team,
      period: {
        start: since,
        end: until || new Date().toISOString(),
      },
      intervalMinutes,
      repositories: results,
    });
  } catch (error: any) {
    console.error(`Error getting team progress for team ${teamId}:`, error.message);
    return c.json({ error: 'Failed to fetch team progress' }, 500);
  }
});

export default app;