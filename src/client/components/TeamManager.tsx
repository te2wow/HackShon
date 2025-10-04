import React, { useState } from 'react';
import { TeamWithRepos } from '@shared/types';
import { localStorageService } from '../services/localStorageService';
import { adminService } from '../services/adminService';
import AdminPasswordModal from './AdminPasswordModal';

interface TeamManagerProps {
  teams: TeamWithRepos[];
  onUpdate: () => void;
}

export default function TeamManager({ teams, onUpdate }: TeamManagerProps) {
  const [newTeamName, setNewTeamName] = useState('');
  const [newRepoUrl, setNewRepoUrl] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreateTeamClick = () => {
    if (!adminService.isAuthenticated()) {
      setShowPasswordModal(true);
    } else {
      setShowCreateForm(true);
    }
  };

  const handlePasswordSubmit = async (password: string) => {
    const isValid = await adminService.authenticate(password);
    if (isValid) {
      setShowPasswordModal(false);
      setShowCreateForm(true);
    } else {
      alert('パスワードが正しくありません');
    }
  };

  const createTeam = () => {
    if (!newTeamName.trim()) return;

    try {
      localStorageService.createTeam(newTeamName);
      setNewTeamName('');
      setShowCreateForm(false);
      onUpdate();
    } catch (error) {
      console.error('Error creating team:', error);
    }
  };

  const cancelCreateTeam = () => {
    setNewTeamName('');
    setShowCreateForm(false);
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

  const parseGitHubUrl = (url: string): { owner: string; name: string } | null => {
    try {
      const regex = /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/?$/;
      const match = url.match(regex);
      if (match) {
        return { owner: match[1], name: match[2] };
      }
      return null;
    } catch {
      return null;
    }
  };

  const addRepository = async () => {
    if (!selectedTeamId || !newRepoUrl.trim()) {
      alert('チームを選択してGitHubリポジトリのURLを入力してください');
      return;
    }

    const repoInfo = parseGitHubUrl(newRepoUrl.trim());
    if (!repoInfo) {
      alert('有効なGitHubリポジトリのURLを入力してください\n例: https://github.com/yamada-tarou2525/BigSky');
      return;
    }

    console.log('Adding repository:', repoInfo);
    try {
      // First verify the repository exists on GitHub
      const response = await fetch(`/api/github/languages/${repoInfo.owner}/${repoInfo.name}`);
      
      if (!response.ok) {
        alert('リポジトリが見つからないか、アクセスできません。URLを確認してください。');
        return;
      }

      // Create repository in localStorage
      localStorageService.createRepository(parseInt(selectedTeamId), repoInfo.owner, repoInfo.name, newRepoUrl);
      
      setNewRepoUrl('');
      setSelectedTeamId('');
      onUpdate();
    } catch (error) {
      console.error('Error adding repository:', error);
      alert('リポジトリの追加でエラーが発生しました。再度お試しください。');
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
        {!showCreateForm ? (
          <button
            onClick={handleCreateTeamClick}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 shadow-lg shadow-cyan-500/25"
          >
            新しいチームを作成
          </button>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-4">
              <input
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="Team name"
                className="flex-1 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                autoFocus
              />
              <button
                onClick={createTeam}
                disabled={!newTeamName.trim()}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg ${
                  newTeamName.trim()
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600 shadow-cyan-500/25'
                    : 'bg-slate-600/50 text-slate-400 cursor-not-allowed'
                }`}
              >
                作成
              </button>
              <button
                onClick={cancelCreateTeam}
                className="px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors duration-200"
              >
                キャンセル
              </button>
            </div>
            {adminService.isAuthenticated() && (
              <p className="text-sm text-green-400">
                管理者として認証済み（残り時間: {Math.ceil(adminService.getRemainingTime() / 60000)}分）
              </p>
            )}
          </div>
        )}
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4 text-white">Add Repository</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              <option value="">チームを選択</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
            <button
              onClick={addRepository}
              disabled={!selectedTeamId || !newRepoUrl.trim()}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg ${
                selectedTeamId && newRepoUrl.trim()
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 shadow-green-500/25'
                  : 'bg-slate-600/50 text-slate-400 cursor-not-allowed'
              }`}
            >
              リポジトリ追加
            </button>
          </div>
          
          <div>
            <input
              type="url"
              value={newRepoUrl}
              onChange={(e) => setNewRepoUrl(e.target.value)}
              placeholder="https://github.com/yamada-tarou2525/BigSky"
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
            <p className="text-slate-400 text-sm mt-2">
              GitHubリポジトリのURLを入力してください（例: https://github.com/owner/repository）
            </p>
          </div>
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
      
      <AdminPasswordModal
        isOpen={showPasswordModal}
        onSubmit={handlePasswordSubmit}
        onCancel={() => setShowPasswordModal(false)}
      />
    </div>
  );
}