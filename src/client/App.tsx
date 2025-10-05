import React, { useState, useEffect } from 'react';
import { Team, TeamWithRepos, ChartData } from '@shared/types';
import TeamSelector from './components/TeamSelector';
import ProgressChart from './components/ProgressChart';
import TeamManager from './components/TeamManager';
import TeamComparison from './components/TeamComparison';
import HistoricalProgress from './components/HistoricalProgress';
import { adminService } from './services/adminService';
import { pollingService } from './services/pollingService';

function App() {
  const [teams, setTeams] = useState<TeamWithRepos[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [currentView, setCurrentView] = useState<'individual' | 'comparison' | 'manage' | 'historical'>('individual');
  const [isManualFetching, setIsManualFetching] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pollingIntervalRef, setPollingIntervalRef] = useState<NodeJS.Timeout | null>(null);
  const [currentPollingInterval, setCurrentPollingInterval] = useState(pollingService.getPollingInterval());
  
  // Check admin status periodically
  useEffect(() => {
    const checkAdminStatus = () => {
      setIsAdmin(adminService.isAuthenticated());
    };
    
    checkAdminStatus();
    const interval = setInterval(checkAdminStatus, 5000); // Check every 5 seconds
    
    return () => clearInterval(interval);
  }, []);
  const loadTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      if (response.ok) {
        const teams = await response.json();
        
        // Load repositories for each team
        const teamsWithRepos = await Promise.all(
          teams.map(async (team: Team) => {
            const repoResponse = await fetch(`/api/repos?teamId=${team.id}`);
            const repositories = repoResponse.ok ? await repoResponse.json() : [];
            return { ...team, repositories };
          })
        );
        
        setTeams(teamsWithRepos);
      }
    } catch (error) {
      console.error('Error loading teams:', error);
    }
  };

  const generateChartData = async (teamId: number): Promise<ChartData | null> => {
    try {
      const response = await fetch(`/api/metrics/chart/${teamId}`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Error fetching chart data:', error);
      return null;
    }
  };

  const updateChartData = async () => {
    const chartPromises = teams.map(team => generateChartData(team.id));
    const allChartData = (await Promise.all(chartPromises)).filter(Boolean) as ChartData[];
    setChartData(allChartData);
  };

  // Fetch chart data updates (no GitHub API polling)
  const fetchChartUpdates = async () => {
    try {
      // Only update chart data, no GitHub API calls
      await updateChartData();
    } catch (error) {
      console.error('Error fetching chart updates:', error);
    }
  };

  // Manual GitHub data collection (admin only)
  const manualFetch = async () => {
    if (isManualFetching) return;
    
    setIsManualFetching(true);
    console.log('Manual GitHub data collection started...');
    
    try {
      // Call GitHub polling endpoint
      const response = await fetch('/api/github/poll', { method: 'POST' });
      if (response.ok) {
        await loadTeams();
        await updateChartData();
        console.log('Manual fetch completed');
      } else {
        throw new Error('Manual fetch failed');
      }
    } catch (error) {
      console.error('Manual fetch failed:', error);
    } finally {
      setIsManualFetching(false);
    }
  };

  // Manual chart update (admin only)
  const [isManualChartUpdate, setIsManualChartUpdate] = useState(false);
  const manualChartUpdate = async () => {
    if (isManualChartUpdate) return;
    
    setIsManualChartUpdate(true);
    console.log('Manual chart update started...');
    
    try {
      await fetchChartUpdates();
      console.log('Manual chart update completed');
    } catch (error) {
      console.error('Manual chart update failed:', error);
    } finally {
      setIsManualChartUpdate(false);
    }
  };

  const setupChartPolling = (shouldFetchImmediately = false) => {
    // Clear existing interval
    if (pollingIntervalRef) {
      clearInterval(pollingIntervalRef);
    }
    
    // Set up chart data polling to match GitHub Actions interval (5 minutes)
    const intervalMs = 5 * 60 * 1000; // 5 minutes for chart updates
    const newInterval = setInterval(fetchChartUpdates, intervalMs);
    setPollingIntervalRef(newInterval);
    
    console.log('Chart polling set up with 5 minute interval');
    
    // Load initial data
    if (shouldFetchImmediately) {
      fetchChartUpdates();
    }
    
    return newInterval;
  };

  useEffect(() => {
    const initializeApp = async () => {
      await loadTeams();
      // Don't do initial data fetch - let polling handle it
    };
    
    initializeApp();
    
    // Set up chart polling with immediate fetch
    const interval = setupChartPolling(true);
    
    // Remove polling interval change listener (no longer needed)
    // Chart polling is fixed at 30 seconds
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  // Remove automatic chart update on teams change
  // Chart data will be updated through polling only

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
                <button
                  onClick={() => setCurrentView('historical')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    currentView === 'historical' 
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  Historical
                </button>
              </div>
              
              <div className="flex items-center gap-4">
                {isAdmin && (
                  <span className="text-xs text-slate-400">
                    GitHub Actions: 5分間隔でデータ収集
                  </span>
                )}
                {isAdmin && (
                  <div className="flex gap-2">
                    <button
                      onClick={manualFetch}
                      disabled={isManualFetching}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
                        isManualFetching
                          ? 'bg-slate-600/50 text-slate-400 border-slate-600/50 cursor-not-allowed'
                          : 'bg-slate-700/50 text-slate-300 border-slate-600/50 hover:bg-green-600/20 hover:border-green-500/50 hover:text-green-400'
                      }`}
                      title="デバッグ用：手動でGitHubデータを取得"
                    >
                      {isManualFetching ? (
                        <div className="flex items-center">
                          <div className="w-3 h-3 border border-slate-400 border-t-transparent rounded-full animate-spin mr-1"></div>
                          データ取得中
                        </div>
                      ) : (
                        'GitHub取得'
                      )}
                    </button>
                    <button
                      onClick={manualChartUpdate}
                      disabled={isManualChartUpdate}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
                        isManualChartUpdate
                          ? 'bg-slate-600/50 text-slate-400 border-slate-600/50 cursor-not-allowed'
                          : 'bg-slate-700/50 text-slate-300 border-slate-600/50 hover:bg-blue-600/20 hover:border-blue-500/50 hover:text-blue-400'
                      }`}
                      title="グラフデータを手動で更新"
                    >
                      {isManualChartUpdate ? (
                        <div className="flex items-center">
                          <div className="w-3 h-3 border border-slate-400 border-t-transparent rounded-full animate-spin mr-1"></div>
                          更新中
                        </div>
                      ) : (
                        'グラフ更新'
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'manage' ? (
          <TeamManager teams={teams} onUpdate={loadTeams} />
        ) : currentView === 'comparison' ? (
          <TeamComparison teams={teams} />
        ) : currentView === 'historical' ? (
          <HistoricalProgress teams={teams} />
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