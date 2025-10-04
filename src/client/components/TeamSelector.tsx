import React from 'react';
import { TeamWithRepos } from '@shared/types';

interface TeamSelectorProps {
  teams: TeamWithRepos[];
  selectedTeamId: number | null;
  onSelectTeam: (teamId: number) => void;
}

export default function TeamSelector({ teams, selectedTeamId, onSelectTeam }: TeamSelectorProps) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Select a Team</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map((team) => (
          <button
            key={team.id}
            onClick={() => onSelectTeam(team.id)}
            className={`p-4 border rounded-lg transition-colors ${
              selectedTeamId === team.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <h3 className="font-medium text-lg">{team.name}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {team.repositories.length} {team.repositories.length === 1 ? 'repository' : 'repositories'}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}