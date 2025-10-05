# HackShon - 技術スタックドキュメント

## 概要
リアルタイムハッカソン進捗可視化アプリケーション

## アーキテクチャ

### フロントエンド
- **フレームワーク**: React 18.2.0
- **ビルドツール**: Vite 5.0.10
- **言語**: TypeScript 5.3.3
- **スタイリング**: Tailwind CSS 3.4.0
- **チャート**: Chart.js 4.4.1 + react-chartjs-2 5.2.0

### バックエンド
- **フレームワーク**: Hono 4.0.0
- **ランタイム**: Node.js 20 (Alpine)
- **言語**: TypeScript 5.3.3
- **開発サーバー**: @hono/node-server 1.4.1

### データベース
- **プライマリDB**: SQLite3 5.1.7 (better-sqlite3 12.4.1)
- **代替サポート**: PostgreSQL 8.16.3

### 外部サービス連携
- **GitHub API**: Octokit 3.1.2
- **HTTP クライアント**: node-fetch 3.3.2

## 開発ツール

### テスト
- **テストフレームワーク**: Jest 30.2.0
- **環境**: jest-environment-jsdom 30.2.0
- **React テスト**: @testing-library/react 16.3.0
- **APIテスト**: supertest 7.1.4

### 静的解析・品質管理
- **リンター**: ESLint 8.56.0
- **TypeScript パーサー**: @typescript-eslint/* 6.15.0

### ビルド・デプロイ
- **開発ツール**: tsx 4.6.2 (TypeScript実行)
- **並行実行**: concurrently 8.2.2
- **コンテナ**: Docker (Node.js 20-alpine ベース)
- **ホスティング**: Vercel対応

## プロジェクト構成

```
src/
├── client/           # フロントエンド (React + Vite)
│   ├── components/   # Reactコンポーネント
│   ├── hooks/        # カスタムフック
│   └── services/     # APIクライアント
├── server/           # バックエンド (Hono)
│   ├── db/          # データベース層
│   ├── routes/      # APIルート
│   ├── services/    # ビジネスロジック
│   └── store/       # データストア
└── shared/          # 共通型定義
```

## 開発・運用

### 開発コマンド
```bash
npm run dev          # フル開発サーバー起動
npm run dev:server   # バックエンドのみ
npm run dev:client   # フロントエンドのみ
npm run typecheck    # 型チェック
npm run lint         # コード品質チェック
npm run test         # テスト実行
```

### プロダクションビルド
```bash
npm run build        # 本番ビルド
npm start           # 本番サーバー起動
```

## アーキテクチャ図

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser                                  │
├─────────────────────────────────────────────────────────────────┤
│  React Frontend (Vite)                                          │
│  ├── Components (TeamManager, ProgressChart, etc.)              │
│  ├── Services (adminService, pollingService)                    │
│  └── Hooks (useLocalStorage)                                    │
└─────────────────────┬───────────────────────────────────────────┘
                      │ HTTP/WebSocket
┌─────────────────────▼───────────────────────────────────────────┐
│  Hono Server                                                    │
│  ├── Routes (/api/admin, /api/github, /api/metrics)            │
│  ├── Services (githubService, githubPoller)                    │
│  ├── Store (dataStore, persistentStore)                        │
│  └── EventEmitter (Real-time updates)                          │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│  Data Layer                                                     │
│  ├── SQLite (Primary) / PostgreSQL (Alternative)               │
│  └── JSON Store (Persistent data)                              │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│  External Services                                              │
│  └── GitHub API (Octokit)                                      │
└─────────────────────────────────────────────────────────────────┘
```

## 特徴

### モダンスタック
- ES Module 対応
- TypeScript フルサポート
- React 18 の最新機能活用

### スケーラビリティ
- Hono の軽量・高性能
- SQLite での簡単セットアップ
- PostgreSQL への移行可能性

### 開発体験
- Hot reload 対応
- TypeScript による型安全性
- 包括的なテストスイート