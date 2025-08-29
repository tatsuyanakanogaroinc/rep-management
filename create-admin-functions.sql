-- Create Admin Functions for User Management
-- These functions bypass RLS for admin operations

-- 1. Create function to delete users with admin privileges
CREATE OR REPLACE FUNCTION admin_delete_user(target_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to run with elevated privileges
AS $$
DECLARE
    current_user_role TEXT;
    deleted_user RECORD;
    result JSON;
BEGIN
    -- Check if the current user is an admin
    SELECT role INTO current_user_role 
    FROM public.users 
    WHERE id = auth.uid();
    
    IF current_user_role != 'admin' THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    -- Get user info before deletion for logging
    SELECT * INTO deleted_user
    FROM public.users 
    WHERE id = target_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found: %', target_user_id;
    END IF;
    
    -- Perform the deletion (bypasses RLS due to SECURITY DEFINER)
    DELETE FROM public.users WHERE id = target_user_id;
    
    -- Check if deletion was successful
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Failed to delete user: %', target_user_id;
    END IF;
    
    -- Return success result
    result := json_build_object(
        'success', true,
        'message', 'User deleted successfully',
        'deleted_user', row_to_json(deleted_user),
        'deleted_by', auth.uid()
    );
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Return error result
        result := json_build_object(
            'success', false,
            'error', SQLERRM,
            'target_user_id', target_user_id
        );
        RETURN result;
END;
$$;

-- 2. Create function to get user details with admin privileges
CREATE OR REPLACE FUNCTION admin_get_user(target_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_role TEXT;
    target_user RECORD;
    result JSON;
BEGIN
    -- Check if the current user is an admin
    SELECT role INTO current_user_role 
    FROM public.users 
    WHERE id = auth.uid();
    
    IF current_user_role != 'admin' THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    -- Get user details
    SELECT * INTO target_user
    FROM public.users 
    WHERE id = target_user_id;
    
    IF NOT FOUND THEN
        result := json_build_object(
            'success', false,
            'error', 'User not found'
        );
    ELSE
        result := json_build_object(
            'success', true,
            'user', row_to_json(target_user)
        );
    END IF;
    
    RETURN result;
END;
$$;

-- 3. Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION admin_delete_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_get_user(UUID) TO authenticated;

-- 4. Create a function to list all users for admins
CREATE OR REPLACE FUNCTION admin_list_users()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_role TEXT;
    users_list JSON;
BEGIN
    -- Check if the current user is an admin
    SELECT role INTO current_user_role 
    FROM public.users 
    WHERE id = auth.uid();
    
    IF current_user_role != 'admin' THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    -- Get all users
    SELECT json_agg(row_to_json(u)) INTO users_list
    FROM (
        SELECT id, email, name, role, is_active, created_at, updated_at
        FROM public.users 
        ORDER BY created_at DESC
    ) u;
    
    RETURN json_build_object(
        'success', true,
        'users', COALESCE(users_list, '[]'::json),
        'count', (SELECT COUNT(*) FROM public.users)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION admin_list_users() TO authenticated;

-- 5. Test the functions (run these to verify they work)
-- Test admin delete function
SELECT admin_delete_user('00000000-0000-0000-0000-000000000000'); -- This will fail safely

-- Test admin list users function  
SELECT admin_list_users();

-- 6. Create logging table for admin actions (optional but recommended)
CREATE TABLE IF NOT EXISTS admin_audit_log (
    id SERIAL PRIMARY KEY,
    admin_user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    target_user_id UUID,
    target_email TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON admin_audit_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

GRANT SELECT, INSERT ON admin_audit_log TO authenticated;