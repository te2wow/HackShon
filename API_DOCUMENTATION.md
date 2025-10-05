# HackShon API Documentation

## 概要
このドキュメントでは、HackShonアプリケーションのREST APIエンドポイントについて説明します。

## ベースURL
```
http://localhost:3000/api
```

## エンドポイント一覧

### 管理者認証 API

#### POST /api/admin/auth
管理者認証を行います。

**リクエストボディ:**
```json
{
  "password": "string"
}
```

**レスポンス:**
- 成功 (200):
```json
{
  "success": true
}
```
- エラー (400):
```json
{
  "error": "Password is required"
}
```
- エラー (401):
```json
{
  "error": "Invalid password"
}
```
- エラー (500):
```json
{
  "error": "Server configuration error"
}
```

---

### チーム管理 API

#### GET /api/teams
全チームの一覧を取得します。

**レスポンス:**
```json
[
  {
    "id": 1,
    "name": "Team Alpha",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

#### GET /api/teams/:id
指定されたIDのチーム詳細を取得します。

**パラメータ:**
- `id`: チームID (整数)

**レスポンス:**
- 成功 (200):
```json
{
  "id": 1,
  "name": "Team Alpha",
  "created_at": "2024-01-01T00:00:00.000Z",
  "repositories": [
    {
      "id": 1,
      "name": "example-repo",
      "owner": "example-user",
      "teamId": 1
    }
  ]
}
```
- エラー (404):
```json
{
  "error": "Team not found"
}
```

#### POST /api/teams
新しいチームを作成します。

**リクエストボディ:**
```json
{
  "name": "string"
}
```

**レスポンス:**
- 成功 (201):
```json
{
  "id": 1,
  "name": "Team Alpha",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```
- エラー (400):
```json
{
  "error": "Team name is required"
}
```
- エラー (400):
```json
{
  "error": "Team name already exists"
}
```

#### PUT /api/teams/:id
チーム名を更新します。

**パラメータ:**
- `id`: チームID (整数)

**リクエストボディ:**
```json
{
  "name": "string"
}
```

**レスポンス:**
- 成功 (200):
```json
{
  "id": 1,
  "name": "Updated Team Name",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```
- エラー (400):
```json
{
  "error": "Team name is required"
}
```
- エラー (404):
```json
{
  "error": "Team not found"
}
```

#### DELETE /api/teams/:id
チームを削除します。

**パラメータ:**
- `id`: チームID (整数)

**レスポンス:**
- 成功 (200):
```json
{
  "message": "Team deleted successfully"
}
```
- エラー (404):
```json
{
  "error": "Team not found"
}
```

---

### メトリクス API

#### GET /api/metrics
チームまたはリポジトリのメトリクスを取得します。

**クエリパラメータ:**
- `teamId`: チームID (整数) - チーム全体のメトリクスを取得
- `repositoryId`: リポジトリID (整数) - 特定リポジトリのメトリクスを取得
- `limit`: 取得件数の上限 (整数, オプション)

**注意:** `teamId` または `repositoryId` のいずれかが必須です。

**レスポンス:**
```json
[
  {
    "id": 1,
    "repositoryId": 1,
    "language": "TypeScript",
    "bytes": 12345,
    "lines": 500,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
]
```

**エラー (400):**
```json
{
  "error": "teamId or repositoryId is required"
}
```

#### GET /api/metrics/chart/:teamId
チーム用のチャートデータを取得します。

**パラメータ:**
- `teamId`: チームID (整数)

**レスポンス:**
- 成功 (200):
```json
{
  "teamId": 1,
  "teamName": "Team Alpha",
  "data": [
    {
      "timestamp": "2024-01-01T00:00:00.000Z",
      "languages": {
        "TypeScript": {
          "bytes": 12345,
          "lines": 500
        },
        "JavaScript": {
          "bytes": 8901,
          "lines": 300
        }
      },
      "total": {
        "bytes": 21246,
        "lines": 800
      }
    }
  ]
}
```
- エラー (404):
```json
{
  "error": "Team not found"
}
```

---

### GitHub API

#### GET /api/github/languages/:owner/:repo
GitHubリポジトリの言語統計を取得します。

**パラメータ:**
- `owner`: リポジトリオーナー (文字列)
- `repo`: リポジトリ名 (文字列)

**レスポンス:**
- 成功 (200):
```json
{
  "TypeScript": 12345,
  "JavaScript": 8901,
  "CSS": 2456
}
```
- エラー (500):
```json
{
  "error": "Failed to fetch language data"
}
```

---

## データ型定義

### ChartData
```typescript
interface ChartData {
  teamId: number;
  teamName: string;
  data: Array<{
    timestamp: string;
    languages: Record<string, {
      bytes: number;
      lines: number;
    }>;
    total: {
      bytes: number;
      lines: number;
    };
  }>;
}
```

### Team
```typescript
interface Team {
  id: number;
  name: string;
  created_at: string;
}
```

### Repository
```typescript
interface Repository {
  id: number;
  name: string;
  owner: string;
  teamId: number;
}
```

### Metric
```typescript
interface Metric {
  id: number;
  repositoryId: number;
  language: string;
  bytes: number;
  lines: number;
  timestamp: string;
}
```

## エラーハンドリング

APIは以下のHTTPステータスコードを使用します:
- `200 OK`: 成功
- `201 Created`: リソース作成成功
- `400 Bad Request`: リクエストエラー
- `401 Unauthorized`: 認証エラー
- `404 Not Found`: リソースが見つからない
- `500 Internal Server Error`: サーバーエラー

エラーレスポンスは以下の形式で返されます:
```json
{
  "error": "エラーメッセージ"
}
```