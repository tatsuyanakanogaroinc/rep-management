-- Emergency User Deletion Script
-- Use this to manually delete problematic users

-- 1. First, let's see the current user we want to delete
SELECT 
    id,
    email,
    name,
    role,
    is_active,
    created_at
FROM public.users 
WHERE email = 'suzu.maruko@garoinc.jp';

-- 2. Check current RLS policies that might be preventing deletion
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users' AND cmd = 'DELETE';

-- 3. TEMPORARILY disable RLS for emergency deletion
-- WARNING: This removes security temporarily
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 4. Perform the deletion
DELETE FROM public.users 
WHERE email = 'suzu.maruko@garoinc.jp';

-- 5. Verify deletion worked
SELECT 
    COUNT(*) as remaining_users_with_email
FROM public.users 
WHERE email = 'suzu.maruko@garoinc.jp';

-- 6. IMPORTANT: Re-enable RLS immediately after deletion
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 7. Verify RLS is back on
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'users';

-- 8. List all users to confirm the deletion
SELECT 
    id,
    email,
    name,
    role,
    is_active
FROM public.users 
ORDER BY created_at DESC;

-- Alternative approach: Create a one-time admin function
CREATE OR REPLACE FUNCTION emergency_delete_user(target_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_count INTEGER;
    target_id UUID;
BEGIN
    -- Find the user
    SELECT id INTO target_id 
    FROM public.users 
    WHERE email = target_email;
    
    IF target_id IS NULL THEN
        RETURN 'User not found: ' || target_email;
    END IF;
    
    -- Temporarily disable RLS
    ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
    
    -- Delete the user
    DELETE FROM public.users WHERE id = target_id;
    
    -- Re-enable RLS
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
    
    -- Check if deletion worked
    SELECT COUNT(*) INTO user_count 
    FROM public.users 
    WHERE id = target_id;
    
    IF user_count = 0 THEN
        RETURN 'SUCCESS: User ' || target_email || ' deleted successfully';
    ELSE
        RETURN 'FAILED: User ' || target_email || ' still exists after deletion attempt';
    END IF;
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION emergency_delete_user(TEXT) TO authenticated;

-- Use the emergency function
SELECT emergency_delete_user('suzu.maruko@garoinc.jp');

-- Clean up the emergency function after use
DROP FUNCTION IF EXISTS emergency_delete_user(TEXT);