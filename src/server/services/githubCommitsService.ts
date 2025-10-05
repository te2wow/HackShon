import { Octokit } from 'octokit';

let octokit: Octokit;

function getOctokit() {
  if (!octokit) {
    const githubToken = process.env.GITHUB_TOKEN;
    console.log('Initializing GitHub client for commits - Token configured:', githubToken ? 'Yes' : 'No');
    octokit = new Octokit({
      auth: githubToken,
    });
  }
  return octokit;
}

interface CommitStats {
  sha: string;
  date: string;
  author: string;
  message: string;
  additions: number;
  deletions: number;
  totalChanges: number;
  cumulativeAdditions: number;
  cumulativeDeletions: number;
  netCodeSize: number;
}

interface TimeSeriesPoint {
  timestamp: string;
  cumulativeAdditions: number;
  cumulativeDeletions: number;
  netCodeSize: number;
  commitCount: number;
}

export async function fetchCommitHistory(
  owner: string,
  repo: string,
  since: string,
  until?: string
): Promise<CommitStats[]> {
  try {
    console.log(`Fetching commit history for ${owner}/${repo} from ${since}${until ? ` to ${until}` : ''}`);
    
    const params: any = {
      owner,
      repo,
      since,
      per_page: 100
    };
    
    if (until) {
      params.until = until;
    }

    // Get commits with pagination
    const commits = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 10) { // Limit to 10 pages (1000 commits) for performance
      const response = await getOctokit().rest.repos.listCommits({
        ...params,
        page,
      });

      if (response.data.length === 0) {
        hasMore = false;
      } else {
        commits.push(...response.data);
        page++;
        hasMore = response.data.length === 100; // Full page means there might be more
      }
    }

    console.log(`Found ${commits.length} commits`);

    // Get detailed stats for each commit
    const commitStats: CommitStats[] = [];
    let cumulativeAdditions = 0;
    let cumulativeDeletions = 0;

    for (const commit of commits.reverse()) { // Process in chronological order
      try {
        // Get commit details with stats
        const commitDetail = await getOctokit().rest.repos.getCommit({
          owner,
          repo,
          ref: commit.sha,
        });

        const stats = commitDetail.data.stats;
        const additions = stats?.additions || 0;
        const deletions = stats?.deletions || 0;

        cumulativeAdditions += additions;
        cumulativeDeletions += deletions;

        commitStats.push({
          sha: commit.sha,
          date: commit.commit.author?.date || commit.commit.committer?.date || '',
          author: commit.commit.author?.name || 'Unknown',
          message: commit.commit.message.split('\n')[0], // First line only
          additions,
          deletions,
          totalChanges: additions + deletions,
          cumulativeAdditions,
          cumulativeDeletions,
          netCodeSize: cumulativeAdditions - cumulativeDeletions,
        });

        // Rate limiting: small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error fetching commit details for ${commit.sha}:`, error);
        // Continue with other commits
      }
    }

    console.log(`Processed ${commitStats.length} commits with stats`);
    return commitStats;
  } catch (error: any) {
    console.error(`Error fetching commit history for ${owner}/${repo}:`, error.message);
    throw error;
  }
}

export function generateTimeSeriesData(
  commitStats: CommitStats[],
  intervalMinutes: number = 5
): TimeSeriesPoint[] {
  if (commitStats.length === 0) return [];

  const startDate = new Date(commitStats[0].date);
  const endDate = new Date(commitStats[commitStats.length - 1].date);
  
  // Round start time to nearest interval
  startDate.setMinutes(Math.floor(startDate.getMinutes() / intervalMinutes) * intervalMinutes, 0, 0);
  
  const timePoints: TimeSeriesPoint[] = [];
  let currentTime = new Date(startDate);
  let commitIndex = 0;
  
  while (currentTime <= endDate) {
    let cumulativeAdditions = 0;
    let cumulativeDeletions = 0;
    let commitCount = 0;
    
    // Find all commits up to this time point
    while (commitIndex < commitStats.length && new Date(commitStats[commitIndex].date) <= currentTime) {
      const commit = commitStats[commitIndex];
      cumulativeAdditions = commit.cumulativeAdditions;
      cumulativeDeletions = commit.cumulativeDeletions;
      commitIndex++;
    }
    
    // Count commits in this interval
    const intervalStart = new Date(currentTime.getTime() - intervalMinutes * 60 * 1000);
    commitCount = commitStats.filter(commit => {
      const commitDate = new Date(commit.date);
      return commitDate > intervalStart && commitDate <= currentTime;
    }).length;
    
    timePoints.push({
      timestamp: currentTime.toISOString(),
      cumulativeAdditions,
      cumulativeDeletions,
      netCodeSize: cumulativeAdditions - cumulativeDeletions,
      commitCount,
    });
    
    // Move to next interval
    currentTime = new Date(currentTime.getTime() + intervalMinutes * 60 * 1000);
  }
  
  return timePoints;
}

export async function getRepositoryProgressHistory(
  owner: string,
  repo: string,
  since: string,
  until?: string,
  intervalMinutes: number = 5
) {
  try {
    const commitStats = await fetchCommitHistory(owner, repo, since, until);
    const timeSeriesData = generateTimeSeriesData(commitStats, intervalMinutes);
    
    return {
      repository: `${owner}/${repo}`,
      period: {
        start: since,
        end: until || new Date().toISOString(),
      },
      intervalMinutes,
      commits: commitStats,
      timeSeries: timeSeriesData,
      summary: {
        totalCommits: commitStats.length,
        totalAdditions: commitStats[commitStats.length - 1]?.cumulativeAdditions || 0,
        totalDeletions: commitStats[commitStats.length - 1]?.cumulativeDeletions || 0,
        finalCodeSize: commitStats[commitStats.length - 1]?.netCodeSize || 0,
      }
    };
  } catch (error) {
    console.error('Error getting repository progress history:', error);
    throw error;
  }
}