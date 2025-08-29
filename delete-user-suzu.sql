-- Delete suzu.maruko@garoinc.jp user from database
-- This script removes both profile and auth data

-- 1. First check if user exists
SELECT 
    u.id,
    u.email,
    u.name,
    u.role,
    u.is_active,
    au.email as auth_email,
    au.created_at as auth_created
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.email = 'suzu.maruko@garoinc.jp' OR au.email = 'suzu.maruko@garoinc.jp';

-- 2. Delete from public.users table
DELETE FROM public.users 
WHERE email = 'suzu.maruko@garoinc.jp';

-- 3. Delete from auth.users table (requires admin privileges)
-- Note: This might require running in Supabase SQL Editor with admin access
DELETE FROM auth.users 
WHERE email = 'suzu.maruko@garoinc.jp';

-- 4. Verify deletion
SELECT 
    u.id,
    u.email,
    u.name,
    u.role,
    u.is_active,
    au.email as auth_email
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.email = 'suzu.maruko@garoinc.jp' OR au.email = 'suzu.maruko@garoinc.jp';

-- Should return no rows if deletion was successful