# PostgreSQL Database Setup 🚀

## ✅ PostgreSQL接続完了済み

HackShonはPostgreSQL接続に対応済みです！

### 環境変数設定

`.env` ファイルを作成して設定：

```env
# GitHub API Token (required)
GITHUB_TOKEN=your_github_personal_access_token

# PostgreSQL Database URL (required)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.abwforxdveptyxwdpygz.supabase.co:5432/postgres

# Server Port (optional)
PORT=3000
```

### セットアップ手順

1. **`.env` ファイル作成**
   ```bash
   cp .env.example .env
   ```

2. **環境変数設定**
   - `GITHUB_TOKEN`: GitHub Personal Access Token
   - `DATABASE_URL`: 提供されたPostgreSQL接続文字列

3. **サーバー起動**
   ```bash
   npm run dev
   ```

4. **自動テーブル作成**
   初回起動時に自動でテーブルが作成されます：
   - `teams` - チーム情報
   - `repositories` - リポジトリ情報  
   - `metrics` - コードメトリクス

### 対応済み機能

- ✅ PostgreSQL接続
- ✅ 自動テーブル作成  
- ✅ GitHub URL登録
- ✅ リアルタイム更新
- ✅ 5分間隔ポーリング
- ✅ 時間間隔フィルタリング

### 推奨無料データベース

| サービス | DB容量 | 接続数 | 特徴 |
|---------|--------|---------|------|
| **Supabase** ⭐ | 500MB | 60 | PostgreSQL, 日本リージョン |
| **PlanetScale** | 5GB | 1,000 | MySQL, ブランチ機能 |
| **Railway** | 1GB | 100 | デプロイ一体型 |
| **Neon** | 3GB | 100 | PostgreSQL 専用 |

使い方詳細は README.md をご覧ください！