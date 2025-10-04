import React from 'react';
import { TeamWithRepos } from '@shared/types';

interface TeamSelectorProps {
  teams: TeamWithRepos[];
  selectedTeamId: number | null;
  onSelectTeam: (teamId: number) => void;
}

export default function TeamSelector({ teams, selectedTeamId, onSelectTeam }: TeamSelectorProps) {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 shadow-2xl">
      <h2 className="text-xl font-semibold mb-6 text-white flex items-center">
        <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
        Select a Team
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map((team) => (
          <button
            key={team.id}
            onClick={() => onSelectTeam(team.id)}
            className={`group p-6 border rounded-xl transition-all duration-300 transform hover:scale-105 ${
              selectedTeamId === team.id
                ? 'border-purple-500/50 bg-gradient-to-br from-purple-500/20 to-blue-500/20 shadow-lg shadow-purple-500/25'
                : 'border-slate-600/50 bg-slate-700/30 hover:border-slate-500/50 hover:bg-slate-600/30'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg text-white">{team.name}</h3>
              <div className={`w-2 h-2 rounded-full transition-colors ${
                selectedTeamId === team.id ? 'bg-purple-400' : 'bg-slate-500 group-hover:bg-slate-400'
              }`}></div>
            </div>
            <p className="text-sm text-slate-400 text-left">
              {team.repositories.length} {team.repositories.length === 1 ? 'repository' : 'repositories'}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}