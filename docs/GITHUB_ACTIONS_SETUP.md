# GitHub Actions Setup Guide

## Required Secrets

GitHub ActionsでメトリクスCollectionを実行するために、以下のSecretsを設定する必要があります。

### 1. DATABASE_URL

データベース接続用のURLです。

#### ローカル開発の場合:
```
postgresql://username:password@localhost:5432/hackshon
```

#### Supabase/Vercel Postgres の場合:
```
postgresql://user:password@db.xyz.supabase.co:5432/postgres
```

#### Planetscale の場合:
```
mysql://user:password@region.connect.psdb.cloud/database?sslaccept=strict
```

### 2. PERSONAL_GITHUB_TOKEN

GitHub APIアクセス用のPersonal Access Tokenです。
(注: `GITHUB_TOKEN`は予約済みのため使用できません)

#### 設定方法:
1. GitHub Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. 必要な権限:
   - `public_repo` (パブリックリポジトリへの読み取りアクセス)
   - または `repo` (プライベートリポジトリも含む場合)

## Secrets設定手順

### Repository Secrets設定:

1. GitHubリポジトリページで **Settings** タブを開く
2. 左サイドバーの **Secrets and variables** → **Actions** をクリック
3. **New repository secret** をクリック
4. 以下のSecretsを1つずつ追加:

#### DATABASE_URL
- **Name**: `DATABASE_URL`
- **Secret**: `postgresql://user:password@host:port/database`

#### PERSONAL_GITHUB_TOKEN (Personal Access Token)
- **Name**: `PERSONAL_GITHUB_TOKEN`
- **Secret**: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## Vercel環境変数からの取得方法

既にVercelで環境変数を設定している場合:

1. Vercel Dashboard → Project → Settings → Environment Variables
2. `DATABASE_URL` の値をコピー
3. GitHub Secretsに同じ値を設定

## セキュリティ考慮事項

- ✅ Secretsは暗号化されて保存されます
- ✅ ログには表示されません (`***` でマスクされます)
- ✅ Pull Requestからはアクセスできません
- ❌ Environment変数として直接設定しないでください

## テスト実行

設定後、以下でテストできます:

1. GitHub Repository → Actions タブ
2. "Collect Repository Metrics" ワークフローを選択
3. "Run workflow" → "Run workflow" でマニュアル実行
4. ログを確認してエラーがないか確認

## トラブルシューティング

### エラー: "DATABASE_URL environment variable is not set"
- GitHub SecretsでDATABASE_URLが正しく設定されているか確認
- Secret名に typo がないか確認

### エラー: "GITHUB_TOKEN environment variable is not set"
- Personal Access Tokenが正しく設定されているか確認
- Secret名が `PERSONAL_GITHUB_TOKEN` になっているか確認
- Token権限に `public_repo` または `repo` が含まれているか確認

### エラー: "getaddrinfo ENOTFOUND"
- DATABASE_URLのhost名が正しいか確認
- ネットワークアクセス制限がないか確認

### エラー: "Authentication failed"
- データベースのユーザー名・パスワードが正しいか確認
- SSL設定が必要な場合は `?ssl=true` を追加

## Workflow 手動実行

定期実行を待たずにテストしたい場合:

1. Actions タブ → "Collect Repository Metrics"
2. "Run workflow" ボタンをクリック
3. ブランチを選択 (通常は main)
4. "Run workflow" で実行開始

## GitHub Actions スケジュール実行の制限事項

### スケジュール頻度の制限
- **最小間隔**: 5分間隔は設定可能だが、実際の実行は不安定
- **推奨間隔**: 10分以上が安定
- **高負荷時**: GitHubが実行を遅延させる場合がある

### 実行が遅延/スキップされる条件
- **リポジトリの非アクティブ**: 60日間プッシュがないと停止
- **フォークリポジトリ**: 制限が厳しい
- **高負荷時間**: 平日昼間（UTC）は遅延しやすい

### 対策
1. **手動実行**: `workflow_dispatch`で即座にテスト
2. **webhook**: より確実なリアルタイム実行
3. **外部cron**: VPS/クラウドサービスの利用
4. **監視**: Actions タブで実行履歴を確認

### 実行確認方法
1. Repository → Actions タブ
2. "Collect Repository Metrics" ワークフロー選択
3. 実行履歴とログを確認
4. 失敗時はエラーメッセージを確認