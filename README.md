# HackShon

リアルタイムハッカソン進捗可視化アプリケーション

## 概要
HackShonは、ハッカソンチームの開発進捗をリアルタイムで可視化し、GitHub リポジトリの言語統計を基にチーム間の比較を行うWebアプリケーションです。

## 主な機能
- 🏁 チーム管理とリポジトリ追跡
- 📊 リアルタイム進捗チャート
- 🔍 言語別統計とメトリクス
- 👥 チーム間比較機能
- 🔐 管理者認証機能

## 技術スタック
- **フロントエンド**: React 18 + TypeScript + Vite + Tailwind CSS
- **バックエンド**: Hono + Node.js + TypeScript
- **データベース**: SQLite / PostgreSQL
- **外部API**: GitHub API (Octokit)
- **デプロイ**: Docker + Vercel 対応

## クイックスタート

### 開発環境セットアップ
```bash
# リポジトリのクローン
git clone https://github.com/te2wow/HackShon.git
cd HackShon

# 依存関係のインストール
npm install

# 環境変数の設定
export ADMIN_PASSWORD=your-admin-password

# 開発サーバーの起動
npm run dev
```

アプリケーションは http://localhost:5173 で利用できます。

### プロダクションビルド
```bash
npm run build
npm start
```

## ドキュメント
- 📖 [技術スタック詳細](./TECH_STACK.md)
- 🚀 [デプロイメントガイド](./DEPLOYMENT.md)
- 📡 [API ドキュメント](./API_DOCUMENTATION.md)

## 開発コマンド
```bash
npm run dev          # 開発サーバー起動
npm run build        # プロダクションビルド
npm run typecheck    # 型チェック
npm run lint         # コード品質チェック
npm run test         # テスト実行
```

## ライセンス
MIT License