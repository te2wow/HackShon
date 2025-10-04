import React, { useState } from 'react';
import { TeamWithRepos } from '@shared/types';
import { localStorageService } from '../services/localStorageService';

interface TeamManagerProps {
  teams: TeamWithRepos[];
  onUpdate: () => void;
}

export default function TeamManager({ teams, onUpdate }: TeamManagerProps) {
  const [newTeamName, setNewTeamName] = useState('');
  const [newRepo, setNewRepo] = useState({ teamId: '', owner: '', name: '' });

  const createTeam = () => {
    if (!newTeamName.trim()) return;

    try {
      localStorageService.createTeam(newTeamName);
      setNewTeamName('');
      onUpdate();
    } catch (error) {
      console.error('Error creating team:', error);
    }
  };

  const deleteTeam = (id: number) => {
    if (!confirm('Are you sure you want to delete this team?')) return;

    try {
      localStorageService.deleteTeam(id);
      onUpdate();
    } catch (error) {
      console.error('Error deleting team:', error);
    }
  };

  const addRepository = async () => {
    if (!newRepo.teamId || !newRepo.owner || !newRepo.name) {
      alert('Please fill in all fields');
      return;
    }

    console.log('Adding repository:', newRepo);
    try {
      // First verify the repository exists on GitHub
      const response = await fetch(`/api/github/languages/${newRepo.owner}/${newRepo.name}`);
      
      if (!response.ok) {
        alert('Repository not found or not accessible. Please check the owner and repository name.');
        return;
      }

      // Create repository in localStorage
      const url = `https://github.com/${newRepo.owner}/${newRepo.name}`;
      localStorageService.createRepository(parseInt(newRepo.teamId), newRepo.owner, newRepo.name, url);
      
      setNewRepo({ teamId: '', owner: '', name: '' });
      onUpdate();
    } catch (error) {
      console.error('Error adding repository:', error);
      alert('Error adding repository. Please try again.');
    }
  };

  const deleteRepository = (id: number) => {
    if (!confirm('Are you sure you want to delete this repository?')) return;

    try {
      localStorageService.deleteRepository(id);
      onUpdate();
    } catch (error) {
      console.error('Error deleting repository:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4 text-white">Create New Team</h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            placeholder="Team name"
            className="flex-1 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
          <button
            onClick={createTeam}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 shadow-lg shadow-cyan-500/25"
          >
            Create Team
          </button>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4 text-white">Add Repository</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={newRepo.teamId}
            onChange={(e) => setNewRepo({ ...newRepo, teamId: e.target.value })}
            className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          >
            <option value="">Select team</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={newRepo.owner}
            onChange={(e) => setNewRepo({ ...newRepo, owner: e.target.value })}
            placeholder="Owner"
            className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
          <input
            type="text"
            value={newRepo.name}
            onChange={(e) => setNewRepo({ ...newRepo, name: e.target.value })}
            placeholder="Repository name"
            className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
          <button
            onClick={addRepository}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-lg shadow-green-500/25"
          >
            Add Repository
          </button>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4 text-white">Teams & Repositories</h2>
        <div className="space-y-4">
          {teams.map((team) => (
            <div key={team.id} className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-lg text-white">{team.name}</h3>
                <button
                  onClick={() => deleteTeam(team.id)}
                  className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm transition-colors duration-200"
                >
                  Delete Team
                </button>
              </div>
              {team.repositories.length > 0 ? (
                <ul className="space-y-1">
                  {team.repositories.map((repo) => (
                    <li key={repo.id} className="flex justify-between items-center pl-4">
                      <span className="text-sm text-slate-300">
                        {repo.owner}/{repo.name}
                      </span>
                      <button
                        onClick={() => deleteRepository(repo.id)}
                        className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors duration-200"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-400 pl-4">No repositories yet</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}