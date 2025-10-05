import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { TeamWithRepos } from '@shared/types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface HistoricalProgressProps {
  teams: TeamWithRepos[];
}

interface TimeSeriesPoint {
  timestamp: string;
  cumulativeAdditions: number;
  cumulativeDeletions: number;
  netCodeSize: number;
  commitCount: number;
}

interface RepositoryProgress {
  repository: string;
  period: {
    start: string;
    end: string;
  };
  intervalMinutes: number;
  timeSeries: TimeSeriesPoint[];
  summary: {
    totalCommits: number;
    totalAdditions: number;
    totalDeletions: number;
    finalCodeSize: number;
  };
  error?: string;
}

interface TeamProgressData {
  team: any;
  repositories: RepositoryProgress[];
}

export default function HistoricalProgress({ teams }: HistoricalProgressProps) {
  const [progressData, setProgressData] = useState<TeamProgressData[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    start: '2025-10-04T01:00:00.000Z', // JST 10:00 = UTC 01:00
    end: new Date().toISOString()
  });

  const fetchTeamProgress = async (teamId: number): Promise<TeamProgressData | null> => {
    try {
      const response = await fetch(`/api/progress/team/${teamId}?since=${dateRange.start}&until=${dateRange.end}&interval=5`);
      if (response.ok) {
        return await response.json();
      } else {
        console.error(`Failed to fetch progress for team ${teamId}`);
        return null;
      }
    } catch (error) {
      console.error(`Error fetching progress for team ${teamId}:`, error);
      return null;
    }
  };

  const loadProgressData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const targetTeams = selectedTeams.length > 0 
        ? teams.filter(team => selectedTeams.includes(team.id))
        : teams;

      const promises = targetTeams.map(team => fetchTeamProgress(team.id));
      const results = (await Promise.all(promises)).filter(Boolean) as TeamProgressData[];
      
      setProgressData(results);
    } catch (err) {
      setError('Failed to load progress data');
      console.error('Error loading progress data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (teams.length > 0) {
      loadProgressData();
    }
  }, [teams, selectedTeams, dateRange]);

  const toggleTeamSelection = (teamId: number) => {
    setSelectedTeams(prev => 
      prev.includes(teamId) 
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  };

  // Generate chart data for historical progress
  const teamColors = [
    'rgb(255, 99, 132)',   // Red/Pink
    'rgb(54, 162, 235)',   // Blue
    'rgb(255, 205, 86)',   // Yellow
    'rgb(75, 192, 192)',   // Teal
    'rgb(153, 102, 255)',  // Purple
    'rgb(255, 159, 64)',   // Orange
    'rgb(46, 204, 113)',   // Green
    'rgb(231, 76, 60)',    // Dark Red
    'rgb(52, 152, 219)',   // Light Blue
    'rgb(155, 89, 182)',   // Light Purple
  ];

  // Aggregate all time series data
  const allTimestamps = Array.from(new Set(
    progressData.flatMap(teamData =>
      teamData.repositories.flatMap(repo =>
        repo.timeSeries?.map(point => point.timestamp) || []
      )
    )
  )).sort();

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    // Convert to JST for display
    const jstOffset = 9 * 60; // JST is UTC+9
    const jstDate = new Date(date.getTime() + jstOffset * 60 * 1000);
    return jstDate.toLocaleString('ja-JP', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const chartData = {
    labels: allTimestamps.map(timestamp => formatTimestamp(timestamp)),
    datasets: progressData.flatMap((teamData, teamIndex) =>
      teamData.repositories
        .filter(repo => !repo.error && repo.timeSeries && repo.timeSeries.length > 0)
        .map((repo, repoIndex) => {
          const dataArray = allTimestamps.map(timestamp => {
            const point = repo.timeSeries?.find(p => p.timestamp === timestamp);
            return point ? point.netCodeSize : null;
          });

          const color = teamColors[(teamIndex * 3 + repoIndex) % teamColors.length];

          return {
            label: `${teamData.team?.name || 'Team'}: ${repo.repository}`,
            data: dataArray,
            borderColor: color,
            backgroundColor: color,
            pointBackgroundColor: color,
            pointBorderColor: color,
            tension: 0.1,
            fill: false,
            spanGaps: true,
          };
        })
    )
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#e2e8f0',
          font: {
            size: 11,
            weight: 500,
          },
          padding: 15,
          usePointStyle: true,
          pointStyle: 'line',
          pointStyleWidth: 15,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#e2e8f0',
        bodyColor: '#cbd5e1',
        borderColor: '#334155',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            const value = context.parsed.y;
            return `${context.dataset.label}: ${value > 0 ? '+' : ''}${value} lines`;
          }
        }
      },
    },
    scales: {
      y: {
        grid: {
          color: 'rgba(71, 85, 105, 0.3)',
          drawBorder: false,
        },
        ticks: {
          color: '#94a3b8',
          font: {
            size: 11,
          },
          callback: function(value) {
            const num = Number(value);
            if (num >= 1000) {
              return (num / 1000).toFixed(1) + 'K';
            }
            return num.toString();
          },
        },
        title: {
          display: true,
          text: 'Net Code Size (lines)',
          color: '#cbd5e1',
          font: {
            size: 12,
            weight: 500,
          },
        },
      },
      x: {
        grid: {
          color: 'rgba(71, 85, 105, 0.2)',
          drawBorder: false,
        },
        ticks: {
          color: '#94a3b8',
          font: {
            size: 10,
          },
          maxTicksLimit: 12,
        },
        title: {
          display: true,
          text: 'Time (JST)',
          color: '#cbd5e1',
          font: {
            size: 12,
            weight: 500,
          },
        },
      },
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    elements: {
      point: {
        radius: 0,
        hoverRadius: 4,
        borderWidth: 0,
        hoverBorderWidth: 2,
      },
      line: {
        tension: 0.2,
        borderWidth: 2,
      },
    },
  };

  const formatJSTDate = (isoString: string) => {
    const date = new Date(isoString);
    const jstOffset = 9 * 60;
    const jstDate = new Date(date.getTime() + jstOffset * 60 * 1000);
    return jstDate.toLocaleString('ja-JP');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 shadow-2xl">
        <h1 className="text-2xl font-bold mb-4 text-white flex items-center">
          <div className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full mr-3"></div>
          Historical Progress Tracking
        </h1>
        <p className="text-slate-300 text-sm">
          5-minute interval code size tracking from {formatJSTDate(dateRange.start)} to {formatJSTDate(dateRange.end)}
        </p>
      </div>

      {/* Team Selection */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 shadow-2xl">
        <h2 className="text-xl font-semibold mb-6 text-white flex items-center">
          <div className="w-2 h-2 bg-cyan-400 rounded-full mr-3"></div>
          Select Teams for Historical Analysis
        </h2>
        <div className="flex flex-wrap gap-3 mb-4">
          {teams.map((team) => (
            <button
              key={team.id}
              onClick={() => toggleTeamSelection(team.id)}
              className={`group px-6 py-3 rounded-lg border transition-all duration-300 transform hover:scale-105 ${
                selectedTeams.includes(team.id) || selectedTeams.length === 0
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-transparent shadow-lg shadow-cyan-500/25' 
                  : 'bg-slate-700/50 text-slate-300 border-slate-600/50 hover:bg-slate-600/50 hover:border-slate-500/50 hover:text-white'
              }`}
            >
              <span className="font-medium">{team.name}</span>
              <span className="ml-2 text-sm opacity-75">
                ({team.repositories.length} repos)
              </span>
            </button>
          ))}
        </div>
        <button
          onClick={loadProgressData}
          disabled={loading}
          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {loading ? 'Loading...' : 'Refresh Data'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/50 border border-red-700/50 rounded-xl p-4">
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {/* Historical Progress Chart */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8 shadow-2xl">
        <div className="mb-6 flex justify-between items-center">
          <h3 className="text-lg font-medium text-white flex items-center">
            <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
            Code Size Evolution (5-minute intervals)
          </h3>
          <div className="text-sm text-slate-400">
            {chartData.datasets.length} repositories tracked
          </div>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
          </div>
        ) : chartData.datasets.length > 0 ? (
          <div className="bg-slate-900/30 rounded-lg p-4" style={{ height: '500px' }}>
            <Line options={chartOptions} data={chartData} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-96 text-slate-400">
            <div className="text-center">
              <div className="text-4xl mb-4">📊</div>
              <p>No historical data available for the selected period</p>
              <p className="text-sm mt-2">Select teams and ensure repositories have commits in the specified timeframe</p>
            </div>
          </div>
        )}
      </div>

      {/* Progress Summary */}
      {progressData.length > 0 && (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 shadow-2xl">
          <h3 className="text-lg font-semibold mb-6 text-white flex items-center">
            <div className="w-2 h-2 bg-emerald-400 rounded-full mr-3"></div>
            Progress Summary
          </h3>
          <div className="space-y-6">
            {progressData.map((teamData, teamIndex) => (
              <div key={teamData.team?.id || teamIndex} className="border-l-4 border-cyan-400 pl-6">
                <h4 className="font-semibold text-white mb-4">{teamData.team?.name || 'Team'}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {teamData.repositories.map((repo, repoIndex) => (
                    <div key={repo.repository} className="bg-slate-700/30 rounded-lg p-4">
                      <h5 className="font-medium text-cyan-300 mb-3 text-sm">{repo.repository}</h5>
                      {repo.error ? (
                        <p className="text-red-400 text-sm">{repo.error}</p>
                      ) : (
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Commits:</span>
                            <span className="text-white font-mono">{repo.summary?.totalCommits || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Additions:</span>
                            <span className="text-emerald-400 font-mono">+{repo.summary?.totalAdditions || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Deletions:</span>
                            <span className="text-red-400 font-mono">-{repo.summary?.totalDeletions || 0}</span>
                          </div>
                          <div className="flex justify-between border-t border-slate-600/30 pt-2">
                            <span className="text-slate-400">Net Size:</span>
                            <span className="text-cyan-400 font-mono">{repo.summary?.finalCodeSize || 0} lines</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}