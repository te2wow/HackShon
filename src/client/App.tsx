import React, { useState, useEffect } from 'react';
import { Team, TeamWithRepos, ChartData } from '@shared/types';
import TeamSelector from './components/TeamSelector';
import ProgressChart from './components/ProgressChart';
import TeamManager from './components/TeamManager';
import TeamComparison from './components/TeamComparison';
import { localStorageService } from './services/localStorageService';

function App() {
  const [teams, setTeams] = useState<TeamWithRepos[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [currentView, setCurrentView] = useState<'individual' | 'comparison' | 'manage'>('individual');
  const [isManualFetching, setIsManualFetching] = useState(false);

  const loadTeams = () => {
    const allTeams = localStorageService.getTeams();
    const teamsWithRepos = allTeams.map(team => 
      localStorageService.getTeamWithRepos(team.id)
    ).filter(Boolean) as TeamWithRepos[];
    setTeams(teamsWithRepos);
  };

  const generateChartData = (teamId: number): ChartData | null => {
    const team = localStorageService.getTeam(teamId);
    if (!team) return null;

    const metrics = localStorageService.getMetricsByTeam(teamId);
    
    // Group metrics by timestamp
    const timeMap = new Map<string, any>();
    
    metrics.forEach(metric => {
      const timestamp = metric.timestamp;
      
      if (!timeMap.has(timestamp)) {
        timeMap.set(timestamp, {
          timestamp,
          languages: {},
          total: { bytes: 0, lines: 0 }
        });
      }
      
      const entry = timeMap.get(timestamp);
      
      if (!entry.languages[metric.language]) {
        entry.languages[metric.language] = { bytes: 0, lines: 0 };
      }
      
      entry.languages[metric.language].bytes += metric.bytes;
      entry.languages[metric.language].lines += metric.lines;
      entry.total.bytes += metric.bytes;
      entry.total.lines += metric.lines;
    });
    
    return {
      teamId: team.id,
      teamName: team.name,
      data: Array.from(timeMap.values()).sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
    };
  };

  const updateChartData = () => {
    const allChartData = teams.map(team => generateChartData(team.id)).filter(Boolean) as ChartData[];
    setChartData(allChartData);
  };

  // Polling function to fetch from GitHub API every 5 minutes
  const pollGitHubData = async () => {
    const repositories = localStorageService.getRepositories();
    
    for (const repo of repositories) {
      try {
        const response = await fetch(`/api/github/languages/${repo.owner}/${repo.name}`);
        if (response.ok) {
          const languageData = await response.json();
          localStorageService.addMetrics(repo.id, languageData);
        }
      } catch (error) {
        console.error(`Error fetching data for ${repo.owner}/${repo.name}:`, error);
      }
    }
    
    updateChartData();
  };

  // Manual fetch for debugging
  const manualFetch = async () => {
    if (isManualFetching) return;
    
    setIsManualFetching(true);
    console.log('Manual fetch started...');
    
    try {
      const repositories = localStorageService.getRepositories();
      console.log('Repositories to fetch:', repositories.length);
      
      for (const repo of repositories) {
        try {
          console.log(`Fetching data for ${repo.owner}/${repo.name}...`);
          const response = await fetch(`/api/github/languages/${repo.owner}/${repo.name}`);
          if (response.ok) {
            const languageData = await response.json();
            console.log(`Data received for ${repo.owner}/${repo.name}:`, languageData);
            localStorageService.addMetrics(repo.id, languageData);
          } else {
            console.error(`Failed to fetch ${repo.owner}/${repo.name}:`, response.status);
          }
        } catch (error) {
          console.error(`Error fetching data for ${repo.owner}/${repo.name}:`, error);
        }
      }
      
      // Force reload teams and update chart data
      loadTeams();
      
      // Generate fresh chart data
      const allTeams = localStorageService.getTeams();
      const teamsWithRepos = allTeams.map(team => 
        localStorageService.getTeamWithRepos(team.id)
      ).filter(Boolean) as TeamWithRepos[];
      
      const freshChartData = teamsWithRepos.map(team => generateChartData(team.id)).filter(Boolean) as ChartData[];
      setChartData(freshChartData);
      
      // Notify other components about the update
      window.dispatchEvent(new CustomEvent('manualFetchCompleted'));
      
      console.log('Manual fetch completed, charts updated');
    } catch (error) {
      console.error('Manual fetch failed:', error);
    } finally {
      setIsManualFetching(false);
    }
  };

  useEffect(() => {
    loadTeams();
    updateChartData();
    
    // Initial data fetch
    pollGitHubData();
    
    // Set up 5-minute polling
    const interval = setInterval(pollGitHubData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    updateChartData();
  }, [teams]);

  const selectedChartData = chartData.find(d => d.teamId === selectedTeamId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-slate-700/50 backdrop-blur-sm bg-slate-900/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-slate-900 font-bold text-lg">H</span>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                HackShon
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex gap-1 p-1 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <button
                  onClick={() => setCurrentView('individual')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    currentView === 'individual' 
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  Individual
                </button>
                <button
                  onClick={() => setCurrentView('comparison')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    currentView === 'comparison' 
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  Compare Teams
                </button>
                <button
                  onClick={() => setCurrentView('manage')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    currentView === 'manage' 
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  Manage Teams
                </button>
              </div>
              
              <button
                onClick={manualFetch}
                disabled={isManualFetching}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
                  isManualFetching
                    ? 'bg-slate-600/50 text-slate-400 border-slate-600/50 cursor-not-allowed'
                    : 'bg-slate-700/50 text-slate-300 border-slate-600/50 hover:bg-green-600/20 hover:border-green-500/50 hover:text-green-400'
                }`}
                title="デバッグ用：手動でGitHubデータを取得"
              >
                {isManualFetching ? (
                  <div className="flex items-center">
                    <div className="w-3 h-3 border border-slate-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                    取得中...
                  </div>
                ) : (
                  '手動取得'
                )}
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'manage' ? (
          <TeamManager teams={teams} onUpdate={loadTeams} />
        ) : currentView === 'comparison' ? (
          <TeamComparison teams={teams} />
        ) : (
          <>
            <TeamSelector
              teams={teams}
              selectedTeamId={selectedTeamId}
              onSelectTeam={setSelectedTeamId}
            />
            
            {selectedChartData && (
              <div className="mt-8">
                <ProgressChart data={selectedChartData} />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;