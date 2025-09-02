-- ========================================
-- RLSポリシーの無限ループ修正SQL
-- ========================================

-- 1. 現在のポリシーをすべて削除
-- ========================================
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Admin users can manage all users" ON public.users;

-- 2. 修正されたポリシーを作成
-- ========================================

-- すべてのユーザーが全プロファイルを閲覧可能
CREATE POLICY "Users can view all profiles" ON public.users
  FOR SELECT USING (true);

-- 管理者ユーザーの判定を簡略化（無限ループ回避）
CREATE POLICY "Admin users can manage all users" ON public.users
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE email IN ('tatsuya.nakano@garoinc.jp', 'suzu.maruko@garoinc.jp')
    )
  );

-- 3. 既存のauth.usersからusersテーブルにプロファイルを同期
-- ========================================

-- 既存のauth.usersを確認
SELECT 'Existing auth.users:' as info, id, email FROM auth.users;

-- tatsuya.nakano@garoinc.jpのプロファイルを作成/更新
INSERT INTO public.users (id, email, name, role, is_active, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)) as name,
  CASE 
    WHEN au.email IN ('tatsuya.nakano@garoinc.jp', 'suzu.maruko@garoinc.jp') THEN 'admin'
    ELSE 'member'
  END as role,
  true as is_active,
  COALESCE(au.created_at, NOW()) as created_at,
  NOW() as updated_at
FROM auth.users au
WHERE au.email = 'tatsuya.nakano@garoinc.jp'
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- suzu.maruko@garoinc.jpが存在する場合は同期
INSERT INTO public.users (id, email, name, role, is_active, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)) as name,
  'admin' as role,
  true as is_active,
  COALESCE(au.created_at, NOW()) as created_at,
  NOW() as updated_at
FROM auth.users au
WHERE au.email = 'suzu.maruko@garoinc.jp'
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- 同期結果を確認
SELECT 'Users table after sync:' as info, id, email, name, role FROM public.users;

-- 完了メッセージ
SELECT 'Policy fix and user sync completed!' as message;