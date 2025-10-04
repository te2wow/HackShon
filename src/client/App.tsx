import React, { useState, useEffect } from 'react';
import { Team, TeamWithRepos, ChartData } from '@shared/types';
import TeamSelector from './components/TeamSelector';
import ProgressChart from './components/ProgressChart';
import TeamManager from './components/TeamManager';
import { useLocalStorage } from './hooks/useLocalStorage';

function App() {
  const [teams, setTeams] = useState<TeamWithRepos[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [chartData, setChartData] = useLocalStorage<ChartData[]>('hackshon-chart-data', []);
  const [isManaging, setIsManaging] = useState(false);

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      const data = await response.json();
      
      const teamsWithRepos = await Promise.all(
        data.map(async (team: Team) => {
          const repoResponse = await fetch(`/api/teams/${team.id}`);
          return repoResponse.json();
        })
      );
      
      setTeams(teamsWithRepos);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const fetchChartData = async (teamId: number) => {
    try {
      const response = await fetch(`/api/metrics/chart/${teamId}`);
      const data = await response.json();
      
      setChartData(prev => {
        const filtered = prev.filter(d => d.teamId !== teamId);
        return [...filtered, data];
      });
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  };

  useEffect(() => {
    fetchTeams();
    
    const eventSource = new EventSource('/api/stream');
    
    eventSource.addEventListener('update', (event) => {
      const updates = JSON.parse(event.data);
      setChartData(updates);
    });
    
    return () => {
      eventSource.close();
    };
  }, []);

  useEffect(() => {
    if (selectedTeamId) {
      fetchChartData(selectedTeamId);
    }
  }, [selectedTeamId]);

  const selectedChartData = chartData.find(d => d.teamId === selectedTeamId);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">HackShon</h1>
            <button
              onClick={() => setIsManaging(!isManaging)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {isManaging ? 'View Progress' : 'Manage Teams'}
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isManaging ? (
          <TeamManager teams={teams} onUpdate={fetchTeams} />
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