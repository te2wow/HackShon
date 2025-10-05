import React, { useState, useEffect } from 'react';
import { TeamWithRepos } from '@shared/types';
import { adminService } from '../services/adminService';
import { pollingService } from '../services/pollingService';
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
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(pollingService.getPollingInterval());

  // Check if already authenticated on mount
  useEffect(() => {
    if (adminService.isAuthenticated()) {
      setIsAdminMode(true);
    }
  }, []);

  const handlePollingIntervalChange = (minutes: number) => {
    setPollingInterval(minutes);
    pollingService.setPollingInterval(minutes);
    // Notify parent component about the change
    window.dispatchEvent(new CustomEvent('pollingIntervalChanged', { detail: minutes }));
  };

  const handleAdminLogin = () => {
    setShowPasswordModal(true);
  };

  const handleCreateTeamClick = () => {
    setShowCreateForm(true);
  };

  const handlePasswordSubmit = async (password: string) => {
    const isValid = await adminService.authenticate(password);
    if (isValid) {
      setShowPasswordModal(false);
      setIsAdminMode(true);
    } else {
      alert('パスワードが正しくありません');
    }
  };

  const handleLogout = () => {
    adminService.logout();
    setIsAdminMode(false);
    setShowCreateForm(false);
  };

  const initializeDatabase = async () => {
    if (!confirm('データベーステーブルを初期化しますか？この操作は通常は一度だけ実行します。')) {
      return;
    }

    const password = prompt('管理者パスワードを入力してください:');
    if (!password) {
      return;
    }

    try {
      const response = await fetch('/api/admin/init-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`データベース初期化成功！\n作成されたテーブル: ${result.tables.join(', ')}`);
      } else {
        const error = await response.json();
        alert(`エラー: ${error.error || 'データベース初期化に失敗しました'}`);
      }
    } catch (error) {
      console.error('Database initialization error:', error);
      alert('データベース初期化でエラーが発生しました');
    }
  };

  const createTeam = async () => {
    if (!newTeamName.trim()) return;

    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newTeamName }),
      });
      
      if (response.ok) {
        setNewTeamName('');
        setShowCreateForm(false);
        onUpdate();
      } else {
        const error = await response.json();
        alert(`エラー: ${error.error || 'チームの作成に失敗しました'}`);
      }
    } catch (error) {
      console.error('Error creating team:', error);
      alert('チームの作成でエラーが発生しました');
    }
  };

  const cancelCreateTeam = () => {
    setNewTeamName('');
    setShowCreateForm(false);
  };

  const deleteTeam = async (id: number) => {
    if (!confirm('Are you sure you want to delete this team?')) return;

    try {
      const response = await fetch(`/api/teams?id=${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        onUpdate();
      } else {
        alert('チームの削除に失敗しました');
      }
    } catch (error) {
      console.error('Error deleting team:', error);
      alert('チームの削除でエラーが発生しました');
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

      // Create repository in database
      const createResponse = await fetch('/api/repos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId: parseInt(selectedTeamId),
          owner: repoInfo.owner,
          name: repoInfo.name,
          url: newRepoUrl,
        }),
      });
      
      if (createResponse.ok) {
        setNewRepoUrl('');
        setSelectedTeamId('');
        onUpdate();
      } else {
        alert('リポジトリの追加に失敗しました');
      }
    } catch (error) {
      console.error('Error adding repository:', error);
      alert('リポジトリの追加でエラーが発生しました。再度お試しください。');
    }
  };

  const deleteRepository = async (id: number) => {
    if (!confirm('Are you sure you want to delete this repository?')) return;

    try {
      const response = await fetch(`/api/repos?id=${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        onUpdate();
      } else {
        alert('リポジトリの削除に失敗しました');
      }
    } catch (error) {
      console.error('Error deleting repository:', error);
      alert('リポジトリの削除でエラーが発生しました');
    }
  };

  return (
    <div className="space-y-8">
      {/* Admin Mode Toggle */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">
            {isAdminMode ? '管理者モード' : 'チーム一覧'}
          </h2>
          {!isAdminMode ? (
            <button
              onClick={handleAdminLogin}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg shadow-purple-500/25"
            >
              管理者になる
            </button>
          ) : (
            <div className="flex items-center gap-4">
              <span className="text-sm text-green-400">
                認証済み（残り: {Math.ceil(adminService.getRemainingTime() / 60000)}分）
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors duration-200"
              >
                ログアウト
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create New Team - Only visible in admin mode */}
      {isAdminMode && (
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
            </div>
          )}
        </div>
      )}

      {/* Database & Polling Configuration - Only visible in admin mode */}
      {isAdminMode && (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Database & Polling Configuration</h2>
          <div className="space-y-6">
            {/* Database Initialization */}
            <div className="border-b border-slate-600/50 pb-4">
              <h3 className="text-lg font-medium mb-2 text-white">Database Setup</h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={initializeDatabase}
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-lg shadow-orange-500/25"
                >
                  Initialize Database
                </button>
                <span className="text-slate-400 text-sm">
                  データベーステーブルを作成します（初回のみ必要）
                </span>
              </div>
            </div>
            
            {/* Polling Configuration */}
            <div>
              <h3 className="text-lg font-medium mb-2 text-white">Polling Configuration</h3>
              <div className="flex items-center gap-4">
                <label className="text-white font-medium">ポーリング間隔:</label>
                <select
                  value={pollingInterval}
                  onChange={(e) => handlePollingIntervalChange(parseInt(e.target.value))}
                  className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  <option value={1}>1分</option>
                  <option value={2}>2分</option>
                  <option value={3}>3分</option>
                  <option value={5}>5分</option>
                  <option value={10}>10分</option>
                  <option value={15}>15分</option>
                  <option value={30}>30分</option>
                </select>
                <span className="text-slate-400 text-sm">
                  現在: {pollingInterval}分間隔でGitHubデータを取得
                </span>
              </div>
              <p className="text-slate-400 text-sm mt-2">
                短い間隔に設定するとGitHub APIの使用量が増加します。適切な間隔を選択してください。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Repository - Only visible in admin mode */}
      {isAdminMode && (
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
      )}

      {/* Teams & Repositories */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4 text-white">Teams & Repositories</h2>
        <div className="space-y-4">
          {teams.map((team) => (
            <div key={team.id} className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-lg text-white">{team.name}</h3>
                {isAdminMode && (
                  <button
                    onClick={() => deleteTeam(team.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm transition-colors duration-200"
                  >
                    Delete Team
                  </button>
                )}
              </div>
              {team.repositories.length > 0 ? (
                <ul className="space-y-1">
                  {team.repositories.map((repo) => (
                    <li key={repo.id} className="flex justify-between items-center pl-4">
                      <span className="text-sm text-slate-300">
                        {repo.owner}/{repo.name}
                      </span>
                      {isAdminMode && (
                        <button
                          onClick={() => deleteRepository(repo.id)}
                          className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors duration-200"
                        >
                          Remove
                        </button>
                      )}
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