-- Fix User Deletion RLS Policies
-- This script ensures admins can properly delete users

-- 1. Check current RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'users';

-- 2. Drop existing restrictive policies for users table
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;

-- 3. Create comprehensive RLS policies for users table
-- Allow all users to view profiles
CREATE POLICY "Users can view all profiles" ON public.users
    FOR SELECT USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Allow admins to insert users
CREATE POLICY "Admins can insert users" ON public.users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Allow admins to delete users (THIS IS THE KEY POLICY)
CREATE POLICY "Admins can delete users" ON public.users
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 4. Ensure RLS is enabled but not overly restrictive
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 5. Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT USAGE ON SEQUENCE users_id_seq TO authenticated;

-- 6. Test deletion capability for admin users
-- This query should return the admin user's details
SELECT 
    u.id,
    u.email,
    u.role,
    u.is_active,
    'Can delete: ' || CASE 
        WHEN u.role = 'admin' THEN 'YES' 
        ELSE 'NO' 
    END as deletion_permission
FROM public.users u
WHERE u.role = 'admin';

-- 7. Verify RLS policies are correctly applied
SELECT 
    policyname,
    cmd,
    permissive,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY cmd, policyname;

-- 8. Alternative: Temporarily disable RLS for testing (ONLY FOR DEBUGGING)
-- CAUTION: Only run this if you want to test without RLS
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 9. Check if there are any conflicting triggers or constraints
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users';

-- 10. Verify current user's permissions
SELECT 
    current_user as current_db_user,
    session_user as session_db_user,
    auth.uid() as supabase_user_id;