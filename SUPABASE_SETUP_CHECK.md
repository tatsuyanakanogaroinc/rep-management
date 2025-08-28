# 🔍 Supabase設定確認チェックリスト

## 現在の状況
- ✅ URL: https://nykqhkilrhoavelillqw.supabase.co
- ✅ API Key: 提供済み
- ❌ 401 Unauthorized エラーが発生

## 確認すべき項目

### 1. データベーススキーマの確認

**Supabase Dashboard → SQL Editor** で以下を実行してください：

```sql
-- テーブルが存在するか確認
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

### 2. users テーブルの確認

```sql
-- users テーブルの構造確認
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users';
```

### 3. RLS（Row Level Security）の状態確認

```sql
-- RLS設定の確認
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  hasoids
FROM pg_tables 
WHERE schemaname = 'public';
```

### 4. 認証設定の確認

**Authentication → Settings** で以下を確認：
- ✅ Enable email confirmations: OFF（テスト用）
- ✅ Enable phone confirmations: OFF
- ✅ Enable custom SMTP: 設定不要

### 5. API設定の確認

**Settings → API** で以下を確認：
- ✅ Project URL が正しいか
- ✅ Anon key が正しいか
- ✅ Service role key があるか

### 6. プロジェクト状態の確認

**Settings → General** で以下を確認：
- ✅ Project status: Active
- ✅ Subscription: Free tier または有効なプラン
- ✅ Database password が設定されているか

## 初期設定が必要な場合

もしテーブルが存在しない場合、以下のSQLを実行：

```sql
-- 既存のテーブル確認後、必要に応じて実行
-- 詳細は supabase-schema.sql を参照
```

## トラブルシューティング

### ケース1: テーブルが存在しない
→ `supabase-schema.sql` を実行してください

### ケース2: RLSが有効だが、ポリシーが設定されていない
→ 認証なしでのアクセスができない状態

### ケース3: APIキーの権限不足
→ Service Role キーを確認

### ケース4: プロジェクトが一時停止
→ プロジェクトの再アクティベート

---

**上記の確認結果を教えてください！**