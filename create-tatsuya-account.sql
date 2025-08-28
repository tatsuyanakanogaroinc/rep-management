-- 中野達也さん専用アカウント作成手順
-- Email: tatsuya.nakano@garoinc.jp
-- Password: Garo0122

-- 手順1: Supabaseダッシュボードでユーザー作成
-- 1. https://supabase.com/dashboard にアクセス
-- 2. プロジェクト選択 > Authentication > Users
-- 3. "Add user" をクリック
-- 4. Email: tatsuya.nakano@garoinc.jp
-- 5. Password: Garo0122
-- 6. "Add user" で作成

-- 手順2: 作成後、以下SQLをSQL Editorで実行
-- (実際に作成されたユーザーのUUIDに置き換えてください)

-- ユーザーのUUIDを確認するには:
-- SELECT id, email FROM auth.users WHERE email = 'tatsuya.nakano@garoinc.jp';

-- UUIDを確認後、以下のINSERT文のUUIDを置き換えて実行:
INSERT INTO users (id, email, name, role, created_at) VALUES
('実際のUUID', 'tatsuya.nakano@garoinc.jp', '中野達也', 'admin', now());

-- 確認用SQL:
SELECT u.id, u.email, up.name, up.role, up.created_at 
FROM auth.users u 
LEFT JOIN users up ON u.id = up.id 
WHERE u.email = 'tatsuya.nakano@garoinc.jp';