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
import { TeamWithRepos, ChartData } from '@shared/types';
import { localStorageService } from '../services/localStorageService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface TeamComparisonProps {
  teams: TeamWithRepos[];
}

type TimeInterval = '1h' | '6h' | '24h' | '7d' | '30d' | 'all';

const TIME_INTERVALS = [
  { value: '1h' as TimeInterval, label: '1時間' },
  { value: '6h' as TimeInterval, label: '6時間' },
  { value: '24h' as TimeInterval, label: '24時間' },
  { value: '7d' as TimeInterval, label: '7日' },
  { value: '30d' as TimeInterval, label: '30日' },
  { value: 'all' as TimeInterval, label: '全期間' },
];

function filterDataByTimeInterval(data: ChartData[], interval: TimeInterval): ChartData[] {
  if (interval === 'all') return data;
  
  const now = new Date();
  let cutoffTime: Date;
  
  switch (interval) {
    case '1h':
      cutoffTime = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case '6h':
      cutoffTime = new Date(now.getTime() - 6 * 60 * 60 * 1000);
      break;
    case '24h':
      cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      cutoffTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      return data;
  }
  
  return data.map(teamData => ({
    ...teamData,
    data: teamData.data.filter(d => new Date(d.timestamp) >= cutoffTime)
  }));
}

export default function TeamComparison({ teams }: TeamComparisonProps) {
  const [chartDataList, setChartDataList] = useState<ChartData[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);
  const [selectedInterval, setSelectedInterval] = useState<TimeInterval>('24h');

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

  const loadChartData = () => {
    const data = teams.map(team => generateChartData(team.id)).filter(Boolean) as ChartData[];
    setChartDataList(data);
  };

  useEffect(() => {
    loadChartData();
  }, [teams]);

  // Listen for manual fetch events
  useEffect(() => {
    const handleStorageChange = () => {
      loadChartData();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Custom event for manual fetch
    const handleManualFetch = () => {
      setTimeout(() => loadChartData(), 100); // Small delay to ensure localStorage is updated
    };
    
    window.addEventListener('manualFetchCompleted', handleManualFetch);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('manualFetchCompleted', handleManualFetch);
    };
  }, []);

  const toggleTeamSelection = (teamId: number) => {
    setSelectedTeams(prev => 
      prev.includes(teamId) 
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  };

  const teamFilteredData = chartDataList.filter(data => 
    selectedTeams.length === 0 || selectedTeams.includes(data.teamId)
  );
  
  const filteredData = filterDataByTimeInterval(teamFilteredData, selectedInterval);

  // Generate unique colors for each team
  const teamColors = [
    'rgb(255, 99, 132)',
    'rgb(54, 162, 235)',
    'rgb(255, 205, 86)',
    'rgb(75, 192, 192)',
    'rgb(153, 102, 255)',
    'rgb(255, 159, 64)',
    'rgb(199, 199, 199)',
    'rgb(83, 102, 255)',
  ];

  // Prepare chart data for comparison
  const allTimestamps = Array.from(new Set(
    filteredData.flatMap(teamData => 
      teamData.data.map(d => d.timestamp)
    )
  )).sort();

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    if (selectedInterval === '1h' || selectedInterval === '6h') {
      return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    } else if (selectedInterval === '24h') {
      return date.toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
    }
  };

  const comparisonChartData = {
    labels: allTimestamps.map(timestamp => formatTimestamp(timestamp)),
    datasets: filteredData.map((teamData, index) => {
      // Create data array with forward fill for missing values
      let lastValue = null;
      const dataArray = allTimestamps.map(timestamp => {
        const dataPoint = teamData.data.find(d => d.timestamp === timestamp);
        if (dataPoint) {
          lastValue = dataPoint.total.bytes;
          return lastValue;
        }
        // Return last known value to maintain continuous line
        return lastValue;
      });

      return {
        label: teamData.teamName,
        data: dataArray,
        borderColor: teamColors[index % teamColors.length],
        backgroundColor: teamColors[index % teamColors.length].replace('rgb', 'rgba').replace(')', ', 0.1)'),
        tension: 0.1, // Add some curve to the line
        fill: false,
      };
    })
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#e2e8f0',
          font: {
            size: 12,
            weight: 500,
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
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
      },
    },
    scales: {
      y: {
        beginAtZero: true,
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
            return (Number(value) / 1000).toFixed(0) + 'K';
          },
        },
        title: {
          display: true,
          text: 'Code Size',
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
            size: 11,
          },
          maxTicksLimit: 8,
        },
        title: {
          display: true,
          text: 'Time',
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
        radius: 4,
        hoverRadius: 8,
        borderWidth: 2,
        hoverBorderWidth: 3,
      },
      line: {
        tension: 0.2,
        borderWidth: 3,
      },
    },
  };

  return (
    <div className="space-y-8">
      {/* Team Selection */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 shadow-2xl">
        <h2 className="text-xl font-semibold mb-6 text-white flex items-center">
          <div className="w-2 h-2 bg-cyan-400 rounded-full mr-3"></div>
          Select Teams to Compare
        </h2>
        <div className="flex flex-wrap gap-3">
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
        <p className="text-sm text-slate-400 mt-4 flex items-center">
          <div className="w-1 h-1 bg-slate-500 rounded-full mr-2"></div>
          {selectedTeams.length === 0 
            ? 'All teams are shown. Click to select specific teams.' 
            : `Showing ${selectedTeams.length} selected team(s).`}
        </p>
      </div>

      {/* Comparison Chart */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8 shadow-2xl">
        <div className="mb-4 flex justify-between items-center">
          <h3 className="text-lg font-medium text-white flex items-center">
            <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
            Team Progress Comparison
          </h3>
          <div className="flex gap-1 p-1 bg-slate-700/50 rounded-lg border border-slate-600/50">
            {TIME_INTERVALS.map((interval) => (
              <button
                key={interval.value}
                onClick={() => setSelectedInterval(interval.value)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                  selectedInterval === interval.value
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25'
                    : 'text-slate-300 hover:text-white hover:bg-slate-600/50'
                }`}
              >
                {interval.label}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-slate-900/30 rounded-lg p-4" style={{ height: '400px' }}>
          <Line options={options} data={comparisonChartData} />
        </div>
      </div>

      {/* Team Statistics */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 shadow-2xl">
        <h3 className="text-lg font-semibold mb-6 text-white flex items-center">
          <div className="w-2 h-2 bg-emerald-400 rounded-full mr-3"></div>
          Team Statistics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredData.map((teamData, index) => {
            const latestData = teamData.data[teamData.data.length - 1];
            const firstData = teamData.data[0];
            const growth = latestData && firstData 
              ? latestData.total.bytes - firstData.total.bytes 
              : 0;

            return (
              <div 
                key={teamData.teamId} 
                className="relative p-6 rounded-xl bg-slate-700/30 border transition-all duration-300 hover:transform hover:scale-105 hover:shadow-xl"
                style={{ 
                  borderColor: teamColors[index % teamColors.length] + '40',
                  boxShadow: `0 4px 20px ${teamColors[index % teamColors.length]}20`
                }}
              >
                <div className="absolute top-4 right-4 w-3 h-3 rounded-full" 
                     style={{ backgroundColor: teamColors[index % teamColors.length] }}></div>
                <h4 className="font-semibold text-lg text-white mb-4">{teamData.teamName}</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Current Size:</span>
                    <span className="font-mono text-cyan-400 font-medium">
                      {latestData ? (latestData.total.bytes / 1000).toFixed(1) : 0}K
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Growth:</span>
                    <span className={`font-mono font-medium ${growth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {growth >= 0 ? '+' : ''}{(growth / 1000).toFixed(1)}K
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-600/30">
                    <span className="text-slate-400 text-sm block mb-2">Languages:</span>
                    <div className="flex flex-wrap gap-1">
                      {latestData ? Object.keys(latestData.languages).map(lang => (
                        <span key={lang} className="px-2 py-1 bg-slate-600/30 text-slate-300 text-xs rounded-md">
                          {lang}
                        </span>
                      )) : (
                        <span className="text-slate-500 text-xs">None</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}