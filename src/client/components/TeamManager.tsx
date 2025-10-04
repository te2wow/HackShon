import React, { useState } from 'react';
import { TeamWithRepos } from '@shared/types';

interface TeamManagerProps {
  teams: TeamWithRepos[];
  onUpdate: () => void;
}

export default function TeamManager({ teams, onUpdate }: TeamManagerProps) {
  const [newTeamName, setNewTeamName] = useState('');
  const [newRepo, setNewRepo] = useState({ teamId: '', owner: '', name: '' });

  const createTeam = async () => {
    if (!newTeamName.trim()) return;

    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTeamName }),
      });

      if (response.ok) {
        setNewTeamName('');
        onUpdate();
      }
    } catch (error) {
      console.error('Error creating team:', error);
    }
  };

  const deleteTeam = async (id: number) => {
    if (!confirm('Are you sure you want to delete this team?')) return;

    try {
      const response = await fetch(`/api/teams/${id}`, { method: 'DELETE' });
      if (response.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error deleting team:', error);
    }
  };

  const addRepository = async () => {
    if (!newRepo.teamId || !newRepo.owner || !newRepo.name) return;

    try {
      const response = await fetch('/api/repos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: parseInt(newRepo.teamId),
          owner: newRepo.owner,
          name: newRepo.name,
        }),
      });

      if (response.ok) {
        setNewRepo({ teamId: '', owner: '', name: '' });
        onUpdate();
      }
    } catch (error) {
      console.error('Error adding repository:', error);
    }
  };

  const deleteRepository = async (id: number) => {
    if (!confirm('Are you sure you want to delete this repository?')) return;

    try {
      const response = await fetch(`/api/repos/${id}`, { method: 'DELETE' });
      if (response.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error deleting repository:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Create New Team</h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            placeholder="Team name"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
          />
          <button
            onClick={createTeam}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create Team
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Add Repository</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={newRepo.teamId}
            onChange={(e) => setNewRepo({ ...newRepo, teamId: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md"
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
            className="px-3 py-2 border border-gray-300 rounded-md"
          />
          <input
            type="text"
            value={newRepo.name}
            onChange={(e) => setNewRepo({ ...newRepo, name: e.target.value })}
            placeholder="Repository name"
            className="px-3 py-2 border border-gray-300 rounded-md"
          />
          <button
            onClick={addRepository}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Add Repository
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Teams & Repositories</h2>
        <div className="space-y-4">
          {teams.map((team) => (
            <div key={team.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-lg">{team.name}</h3>
                <button
                  onClick={() => deleteTeam(team.id)}
                  className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                >
                  Delete Team
                </button>
              </div>
              {team.repositories.length > 0 ? (
                <ul className="space-y-1">
                  {team.repositories.map((repo) => (
                    <li key={repo.id} className="flex justify-between items-center pl-4">
                      <span className="text-sm text-gray-600">
                        {repo.owner}/{repo.name}
                      </span>
                      <button
                        onClick={() => deleteRepository(repo.id)}
                        className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 pl-4">No repositories yet</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}