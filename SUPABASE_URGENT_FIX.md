# 🚨 Supabase接続エラーの緊急対応

## 現在の問題
- `nykqhkilrhoavelihllqw.supabase.co` への DNS解決エラー
- `Failed to fetch` エラー
- ログインができない状態

## 📋 確認すべき項目

### 1. Supabaseプロジェクトの状態確認

1. **Supabaseダッシュボードにアクセス**
   ```
   https://supabase.com/dashboard
   ```

2. **プロジェクトが存在するか確認**
   - プロジェクト一覧に `rep-management` があるか
   - プロジェクトが停止・削除されていないか

3. **プロジェクト設定を確認**
   - Settings → General → Reference ID
   - Settings → API → URL and Keys

### 2. 正しい設定値の取得

**Settings → API** で以下を確認：

- **Project URL**: `https://xxxxx.supabase.co`
- **Anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 3. 設定値の更新

現在のコードで使用している値：
```
URL: https://nykqhkilrhoavelillqw.supabase.co
Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55a3Foa2lscmhvYXZlbGlsbHF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzOGM4NTEsImV4cCI6MjA3MVE1OTg1MX0.lDFxOGnFhq_DyTDfqYr6TBFiOeaKXP5LoMVE1kLXQ1Q
```

**これらが正しいか確認してください！**

## 🔧 対処法

### 対処法1: プロジェクトが存在する場合

正しい URL と Key を確認して報告してください：
```
正しい URL: https://xxxxx.supabase.co
正しい Key: eyJhbGci...
```

### 対処法2: プロジェクトが存在しない場合

新しいSupabaseプロジェクトを作成する必要があります：

1. **新規プロジェクト作成**
   - Organization: Personal（または既存）
   - Name: `sns-management`
   - Database Password: 強力なパスワードを設定
   - Region: Northeast Asia (Tokyo) - ap-northeast-1

2. **データベーススキーマの再構築**
   - `supabase-schema.sql` を SQL Editor で実行

3. **新しい設定値を報告**

### 対処法3: 一時的な代替案

Firebase や他の BaaS への移行も可能ですが、データベース構造の変更が必要です。

## 📞 次のアクション

以下の情報を確認して報告してください：

1. **Supabaseダッシュボードでプロジェクトは見えますか？**
2. **見える場合、正しい URL は何ですか？**
3. **プロジェクトの状態は「Active」ですか？**
4. **無料プランの制限に達していませんか？**

この情報があれば、即座に修正できます！