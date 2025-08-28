# 🔑 アカウント作成手順

## 中野達也さん用アカウント作成

### 📋 アカウント情報
- **Email**: `tatsuya.nakano@garoinc.jp`
- **Password**: `Garo0122`
- **権限**: 管理者 (admin)

---

## 🚀 作成手順

### ステップ1: Supabaseダッシュボードでユーザー作成

1. **Supabaseダッシュボードにアクセス**
   ```
   https://supabase.com/dashboard
   ```

2. **プロジェクトを選択**
   - `rep-management` プロジェクトを選択

3. **Authenticationに移動**
   - 左サイドメニューで「**Authentication**」をクリック
   - 「**Users**」タブを選択

4. **新しいユーザーを追加**
   - 「**Add user**」ボタンをクリック
   - 以下の情報を入力：
     - **Email**: `tatsuya.nakano@garoinc.jp`
     - **Password**: `Garo0122`
     - **Email confirmed**: ✅ チェックを入れる
   - 「**Add user**」ボタンをクリックして作成

### ステップ2: UUIDの確認

1. **作成されたユーザーを確認**
   - Users一覧で `tatsuya.nakano@garoinc.jp` を探す
   - ユーザーの **UUID**（ID）をコピー

### ステップ3: プロファイル情報の設定

1. **SQL Editorに移動**
   - 左サイドメニューで「**SQL Editor**」をクリック
   - 「**New query**」をクリック

2. **以下のSQLを実行**
   ```sql
   -- UUIDをステップ2でコピーした実際の値に置き換えてください
   INSERT INTO users (id, email, name, role, created_at) VALUES
   ('ここに実際のUUIDを入力', 'tatsuya.nakano@garoinc.jp', '中野達也', 'admin', now());
   ```

3. **実行確認**
   ```sql
   -- 正しく作成されたかチェック
   SELECT u.id, u.email, up.name, up.role, up.created_at 
   FROM auth.users u 
   LEFT JOIN users up ON u.id = up.id 
   WHERE u.email = 'tatsuya.nakano@garoinc.jp';
   ```

### ステップ4: 動作確認

1. **サイトでログインテスト**
   - デプロイされたサイトの `/login` ページにアクセス
   - Email: `tatsuya.nakano@garoinc.jp`
   - Password: `Garo0122`
   - ログインボタンをクリック

2. **ダッシュボードアクセス確認**
   - ログイン成功後、ダッシュボードにリダイレクトされることを確認
   - 管理者権限でアクセスできることを確認

---

## 🔍 トラブルシューティング

### ログインできない場合

1. **ブラウザのコンソール確認**
   - F12を押してDeveloper Toolsを開く
   - Console タブでエラーメッセージを確認

2. **環境変数確認**
   - `/debug` ページでSupabase接続状況を確認

3. **Supabaseのログ確認**
   - Supabase Dashboard > Logs でエラーログを確認

### よくある問題

- **Email not confirmed**: Authentication > Users でEmail confirmedにチェックが入っているか確認
- **Profile not found**: users テーブルにプロファイルが正しく作成されているか確認
- **Wrong UUID**: auth.users のUUIDとusers テーブルのIDが一致しているか確認

---

## 📞 サポート

問題が解決しない場合は、以下の情報を含めてお問い合わせください：
- エラーメッセージの詳細
- ブラウザのコンソールログ
- 実行したSQL文