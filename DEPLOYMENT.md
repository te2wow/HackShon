# HackShon - デプロイメントガイド

## 概要
このドキュメントでは、HackShonアプリケーションのデプロイ方法について説明します。

## デプロイメント方法

### 1. Vercel デプロイ (推奨)

#### 前提条件
- Vercel アカウント
- GitHub リポジトリとの連携

#### 環境変数の設定
Vercel ダッシュボードで以下の環境変数を設定してください:

```
ADMIN_PASSWORD=your-admin-password
GITHUB_TOKEN=your-github-token (オプション)
DATABASE_URL=your-database-url (PostgreSQL使用時)
```

#### デプロイ手順
1. Vercel ダッシュボードでプロジェクトをインポート
2. ビルド設定は自動検出されます (`vercel.json` に基づく)
3. 環境変数を設定
4. デプロイ実行

#### 設定ファイル
`vercel.json`:
```json
{
  "buildCommand": "npm run vercel-build",
  "outputDirectory": "dist"
}
```

---

### 2. Docker デプロイ

#### Docker イメージのビルド
```bash
docker build -t hackshon .
```

#### コンテナの実行
```bash
docker run -p 3000:3000 \
  -e ADMIN_PASSWORD=your-admin-password \
  -e GITHUB_TOKEN=your-github-token \
  hackshon
```

#### Docker Compose (推奨)
`docker-compose.yml`:
```yaml
version: '3.8'
services:
  hackshon:
    build: .
    ports:
      - "3000:3000"
    environment:
      - ADMIN_PASSWORD=your-admin-password
      - GITHUB_TOKEN=your-github-token
      - NODE_ENV=production
    volumes:
      - ./data:/app/data
```

実行:
```bash
docker-compose up -d
```

---

### 3. 手動デプロイ

#### 前提条件
- Node.js 20 以上
- npm

#### デプロイ手順
```bash
# 1. リポジトリのクローン
git clone https://github.com/te2wow/HackShon.git
cd HackShon

# 2. 依存関係のインストール
npm ci

# 3. プロダクションビルド
npm run build

# 4. 環境変数の設定
export ADMIN_PASSWORD=your-admin-password
export GITHUB_TOKEN=your-github-token
export NODE_ENV=production

# 5. アプリケーションの起動
npm start
```

---

## 環境変数

### 必須環境変数
| 変数名 | 説明 | 例 |
|--------|------|----| 
| `ADMIN_PASSWORD` | 管理者認証用パスワード | `secure-admin-pass` |

### オプション環境変数
| 変数名 | 説明 | デフォルト値 |
|--------|------|-------------|
| `GITHUB_TOKEN` | GitHub API アクセストークン | なし |
| `DATABASE_URL` | PostgreSQL接続URL | SQLite使用 |
| `PORT` | サーバーポート | `3000` |
| `NODE_ENV` | 実行環境 | `development` |

---

## データベース設定

### SQLite (デフォルト)
- 自動でファイルベースDBが作成されます
- データファイル: `hackshon.db`

### PostgreSQL (オプション)
環境変数 `DATABASE_URL` を設定:
```
DATABASE_URL=postgresql://username:password@localhost:5432/hackshon
```

---

## SSL/HTTPS 設定

### Vercel
- 自動でSSL証明書が発行されます

### 手動デプロイ
リバースプロキシ (Nginx等) の設定例:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## モニタリングとログ

### ログ出力
アプリケーションログは標準出力に出力されます:
```bash
# ログの確認
docker logs hackshon

# リアルタイムログ
docker logs -f hackshon
```

### ヘルスチェック
```bash
# アプリケーションの稼働確認
curl http://localhost:3000/api/teams
```

---

## パフォーマンス最適化

### プロダクション設定
- `NODE_ENV=production` を設定
- 静的ファイルの圧縮
- データベース接続プールの設定

### スケーリング
- 複数インスタンスでの実行
- ロードバランサーの設定
- データベースの分離

---

## トラブルシューティング

### よくある問題

#### 1. ビルドエラー
```bash
# 依存関係の再インストール
rm -rf node_modules package-lock.json
npm install
```

#### 2. データベース接続エラー
- 環境変数 `DATABASE_URL` の確認
- データベースサーバーの稼働状況確認

#### 3. 管理者認証エラー
- 環境変数 `ADMIN_PASSWORD` の設定確認

### ログレベル
```bash
# デバッグログの有効化
export DEBUG=hackshon:*
```

---

## セキュリティ考慮事項

### 本番環境での注意点
1. 強力な管理者パスワードの設定
2. GitHub トークンの適切な権限設定
3. データベースアクセスの制限
4. ファイアウォール設定
5. 定期的なセキュリティアップデート

### 推奨設定
```bash
# 強力なパスワード生成例
openssl rand -base64 32
```

---

## バックアップとリストア

### SQLite データベース
```bash
# バックアップ
cp hackshon.db hackshon.db.backup

# リストア
cp hackshon.db.backup hackshon.db
```

### PostgreSQL
```bash
# バックアップ
pg_dump hackshon > backup.sql

# リストア
psql hackshon < backup.sql
```