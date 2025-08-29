-- tatsuya.nakano@garoinc.jpを管理者に設定
UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = 'tatsuya.nakano@garoinc.jp';

-- ユーザープロファイルを管理者に更新（既存の場合）
UPDATE public.users 
SET role = 'admin', 
    name = 'Tatsuya Nakano',
    is_active = true,
    updated_at = NOW()
WHERE email = 'tatsuya.nakano@garoinc.jp';

-- プロファイルが存在しない場合は挿入
INSERT INTO public.users (id, email, name, role, is_active, created_at, updated_at)
SELECT 
    auth.users.id,
    'tatsuya.nakano@garoinc.jp',
    'Tatsuya Nakano',
    'admin',
    true,
    NOW(),
    NOW()
FROM auth.users 
WHERE email = 'tatsuya.nakano@garoinc.jp'
  AND NOT EXISTS (
    SELECT 1 FROM public.users WHERE email = 'tatsuya.nakano@garoinc.jp'
  );

-- 確認用クエリ
SELECT 
    u.email,
    u.name,
    u.role,
    u.is_active,
    au.email_confirmed_at
FROM public.users u
JOIN auth.users au ON u.id = au.id
WHERE u.email = 'tatsuya.nakano@garoinc.jp';