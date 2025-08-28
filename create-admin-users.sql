-- 社内メンバー用のアカウント作成SQL
-- Supabaseダッシュボードで実行してください

-- 1. 管理者アカウント
-- メールアドレス: admin@company.com
-- パスワード: Admin123!
-- 以下をSupabaseのAuthentication > Users で手動追加

-- 2. マネージャーアカウント  
-- メールアドレス: manager@company.com
-- パスワード: Manager123!

-- 3. メンバーアカウント
-- メールアドレス: member@company.com  
-- パスワード: Member123!

-- ユーザー追加後、以下のSQLをSupabase SQL Editorで実行
-- (UUIDは実際に作成されたユーザーのauth.usersのidに置き換えてください)

INSERT INTO users (id, email, name, role, created_at) VALUES
-- 管理者（UUIDを実際の値に置き換える）
('00000000-0000-0000-0000-000000000001', 'admin@company.com', '管理者', 'admin', now()),
-- マネージャー（UUIDを実際の値に置き換える）
('00000000-0000-0000-0000-000000000002', 'manager@company.com', 'マネージャー', 'manager', now()),
-- メンバー（UUIDを実際の値に置き換える）  
('00000000-0000-0000-0000-000000000003', 'member@company.com', 'メンバー', 'member', now());

-- 手順:
-- 1. Supabase Dashboard > Authentication > Users で上記メールアドレスのユーザーを手動作成
-- 2. 作成されたユーザーのUUIDをコピー
-- 3. 上記SQLのUUIDを実際の値に置き換えて実行