import React, { useState } from 'react';

interface AdminPasswordModalProps {
  isOpen: boolean;
  onSubmit: (password: string) => void;
  onCancel: () => void;
}

export default function AdminPasswordModal({ isOpen, onSubmit, onCancel }: AdminPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    
    setIsLoading(true);
    try {
      onSubmit(password);
    } finally {
      setIsLoading(false);
      setPassword('');
    }
  };

  const handleCancel = () => {
    setPassword('');
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold mb-4 text-white">管理者認証</h2>
        <p className="text-slate-300 mb-6">
          新しいチームを作成するには管理者パスワードが必要です。
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="管理者パスワードを入力"
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              disabled={isLoading}
              autoFocus
            />
          </div>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors duration-200 disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={!password.trim() || isLoading}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                password.trim() && !isLoading
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600'
                  : 'bg-slate-600/50 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isLoading ? '認証中...' : '確認'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}