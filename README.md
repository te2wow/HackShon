# HackShon - Real-time Hackathon Progress Visualization

ハッカソンの進捗をリアルタイムで可視化するWebアプリケーションです。GitHubリポジトリのコード量を追跡し、チーム間の比較を行います。

## 📊 主な機能

- **リアルタイム進捗追跡**: GitHubリポジトリのコード量を自動収集
- **チーム比較**: 複数チームの進捗を同時に比較表示
- **言語別分析**: プログラミング言語ごとの詳細分析
- **管理者機能**: チーム・リポジトリの管理、手動データ更新

## 🏗️ アーキテクチャ

### データ収集
- **GitHub Actions**: 5分間隔で自動実行されるメトリクス収集
- **PostgreSQL**: 時系列データの永続化
- **Rate Limit対応**: 単一プロセスによる効率的なAPI使用

### フロントエンド
- **React + TypeScript**: モダンなUIフレームワーク
- **Chart.js**: インタラクティブなグラフ表示
- **Tailwind CSS**: レスポンシブデザイン
- **軽量ポーリング**: 30秒間隔でのデータ更新

## 🚀 セットアップ

### 1. 環境変数設定

```bash
cp .env.example .env
```

```.env
DATABASE_URL=postgresql://user:password@localhost:5432/hackshon
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxx
ADMIN_PASSWORD=your-admin-password
```

### 2. 依存関係インストール

```bash
npm install
```

### 3. データベース初期化

```bash
npm run db:init
```

### 4. 開発サーバー起動

```bash
npm run dev
```

アプリケーションは http://localhost:5173 で利用できます。

## 🔧 GitHub Actions設定

本格運用にはGitHub Actionsでの自動データ収集が必要です。

詳細な設定手順: [GitHub Actions Setup Guide](./docs/GITHUB_ACTIONS_SETUP.md)

### 必要なSecrets:
- `DATABASE_URL`: データベース接続URL
- `PERSONAL_GITHUB_TOKEN`: GitHub API アクセストークン

## 📝 使用方法

### 1. チーム登録
1. 管理者でログイン
2. "Manage Teams" タブでチーム追加
3. 各チームにGitHubリポジトリを紐付け

### 2. 進捗確認
1. "Individual" タブで個別チームの詳細確認
2. "Compare Teams" タブで複数チーム比較
3. 時間範囲フィルターで期間指定

### 3. 管理機能
- リアルタイムデータ更新
- 手動データ取得
- チーム・リポジトリ管理

## 🧪 テスト実行

```bash
# 全テスト実行
npm test

# カバレッジ付きテスト
npm run test:coverage

# テスト監視モード
npm run test:watch
```

## 📦 デプロイ

### Vercel (推奨)

1. GitHub連携でリポジトリをインポート
2. 環境変数を設定:
   - `DATABASE_URL`
   - `GITHUB_TOKEN` (Personal Access Token)
   - `ADMIN_PASSWORD`
3. 自動デプロイ開始

### 手動ビルド

```bash
npm run build
npm start
```

## 🔒 セキュリティ

- 管理者認証による機能制限
- 環境変数による秘密情報管理
- プライベートリポジトリ除外
- Rate Limit対応

## 📈 パフォーマンス最適化

- GitHub Actions による集中データ収集
- クライアント側軽量ポーリング
- データベースインデックス最適化
- 重複データ防止機構

## 🛠️ 技術スタック

### Backend
- **Node.js + TypeScript**
- **Hono** (Web Framework)
- **PostgreSQL** (Database)
- **Octokit** (GitHub API)

### Frontend
- **React 18 + TypeScript**
- **Vite** (Build Tool)
- **Chart.js + react-chartjs-2**
- **Tailwind CSS**

### DevOps
- **GitHub Actions** (CI/CD)
- **Vercel** (Hosting)
- **Jest** (Testing)

## ライセンス
MIT License