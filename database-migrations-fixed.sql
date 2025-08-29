-- SNS Management System Database Migration (Fixed Version)
-- Fixes for missing tables and columns

-- 1. Fix users table - ensure is_active column exists
DO $$ 
BEGIN
    -- Check if is_active column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'is_active') THEN
        ALTER TABLE public.users ADD COLUMN is_active boolean DEFAULT true;
        UPDATE public.users SET is_active = true WHERE is_active IS NULL;
    END IF;
END $$;

-- 2. Check if growth_parameters table exists and drop if needed
DROP TABLE IF EXISTS public.growth_parameters CASCADE;

-- 3. Create growth_parameters table with correct structure
CREATE TABLE public.growth_parameters (
    id SERIAL PRIMARY KEY,
    initial_acquisitions INTEGER NOT NULL DEFAULT 30,
    monthly_growth_rate DECIMAL(5,2) NOT NULL DEFAULT 50.00,
    monthly_price INTEGER NOT NULL DEFAULT 2490,
    yearly_price INTEGER NOT NULL DEFAULT 24900,
    churn_rate DECIMAL(5,2) NOT NULL DEFAULT 5.00,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default growth parameters
INSERT INTO public.growth_parameters (
    initial_acquisitions,
    monthly_growth_rate,
    monthly_price,
    yearly_price,
    churn_rate,
    is_active
) VALUES (30, 50.00, 2490, 24900, 5.00, true);

-- 4. Check if targets table exists and drop if needed
DROP TABLE IF EXISTS public.targets CASCADE;

-- 5. Create targets table
CREATE TABLE public.targets (
    id SERIAL PRIMARY KEY,
    period VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    metric_type VARCHAR(50) NOT NULL,
    target_value DECIMAL(12,2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(period, metric_type)
);

-- Insert default target data from spreadsheet
INSERT INTO public.targets (period, metric_type, target_value, is_active) VALUES
-- 2025-09
('2025-09', 'mrr', 69720, true),
('2025-09', 'active_customers', 28, true),
('2025-09', 'new_acquisitions', 30, true),
('2025-09', 'churn_rate', 5.0, true),
('2025-09', 'monthly_expenses', 845000, true),

-- 2025-10
('2025-10', 'mrr', 107070, true),
('2025-10', 'active_customers', 43, true),
('2025-10', 'new_acquisitions', 45, true),
('2025-10', 'churn_rate', 5.0, true),
('2025-10', 'monthly_expenses', 910000, true),

-- 2025-11
('2025-11', 'mrr', 161850, true),
('2025-11', 'active_customers', 65, true),
('2025-11', 'new_acquisitions', 68, true),
('2025-11', 'churn_rate', 5.0, true),
('2025-11', 'monthly_expenses', 946000, true),

-- 2025-12
('2025-12', 'mrr', 241530, true),
('2025-12', 'active_customers', 97, true),
('2025-12', 'new_acquisitions', 102, true),
('2025-12', 'churn_rate', 5.0, true),
('2025-12', 'monthly_expenses', 1036000, true),

-- 2026-01
('2026-01', 'mrr', 361050, true),
('2026-01', 'active_customers', 145, true),
('2026-01', 'new_acquisitions', 153, true),
('2026-01', 'churn_rate', 5.0, true),
('2026-01', 'monthly_expenses', 1117000, true),

-- 2026-02
('2026-02', 'mrr', 542820, true),
('2026-02', 'active_customers', 218, true),
('2026-02', 'new_acquisitions', 230, true),
('2026-02', 'churn_rate', 5.0, true),
('2026-02', 'monthly_expenses', 1235000, true),

-- 2026-03
('2026-03', 'mrr', 816720, true),
('2026-03', 'active_customers', 328, true),
('2026-03', 'new_acquisitions', 345, true),
('2026-03', 'churn_rate', 5.0, true),
('2026-03', 'monthly_expenses', 1454000, true),

-- 2026-04
('2026-04', 'mrr', 1225080, true),
('2026-04', 'active_customers', 492, true),
('2026-04', 'new_acquisitions', 518, true),
('2026-04', 'churn_rate', 5.0, true),
('2026-04', 'monthly_expenses', 1722000, true),

-- 2026-05
('2026-05', 'mrr', 1837620, true),
('2026-05', 'active_customers', 738, true),
('2026-05', 'new_acquisitions', 777, true),
('2026-05', 'churn_rate', 5.0, true),
('2026-05', 'monthly_expenses', 2120000, true),

-- 2026-06
('2026-06', 'mrr', 2758920, true),
('2026-06', 'active_customers', 1108, true),
('2026-06', 'new_acquisitions', 1166, true),
('2026-06', 'churn_rate', 5.0, true),
('2026-06', 'monthly_expenses', 2763000, true),

-- 2026-07
('2026-07', 'mrr', 4138380, true),
('2026-07', 'active_customers', 1662, true),
('2026-07', 'new_acquisitions', 1749, true),
('2026-07', 'churn_rate', 5.0, true),
('2026-07', 'monthly_expenses', 3666000, true),

-- 2026-08
('2026-08', 'mrr', 6207570, true),
('2026-08', 'active_customers', 2493, true),
('2026-08', 'new_acquisitions', 2624, true),
('2026-08', 'churn_rate', 5.0, true),
('2026-08', 'monthly_expenses', 5018000, true);

-- 6. Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.targets ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for users table
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
CREATE POLICY "Users can view all profiles" ON public.users
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
CREATE POLICY "Admins can insert users" ON public.users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 8. Create RLS policies for growth_parameters table
DROP POLICY IF EXISTS "Users can view growth parameters" ON public.growth_parameters;
CREATE POLICY "Users can view growth parameters" ON public.growth_parameters
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can modify growth parameters" ON public.growth_parameters;
CREATE POLICY "Admins can modify growth parameters" ON public.growth_parameters
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 9. Create RLS policies for targets table
DROP POLICY IF EXISTS "Users can view targets" ON public.targets;
CREATE POLICY "Users can view targets" ON public.targets
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can modify targets" ON public.targets;
CREATE POLICY "Admins can modify targets" ON public.targets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 10. Fix tatsuya.nakano@garoinc.jp user to be admin
UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = 'tatsuya.nakano@garoinc.jp';

UPDATE public.users 
SET role = 'admin', 
    name = 'Tatsuya Nakano',
    is_active = true,
    updated_at = NOW()
WHERE email = 'tatsuya.nakano@garoinc.jp';

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

-- 11. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_targets_period ON public.targets(period);
CREATE INDEX IF NOT EXISTS idx_targets_metric_type ON public.targets(metric_type);
CREATE INDEX IF NOT EXISTS idx_targets_period_metric ON public.targets(period, metric_type);

-- 12. Verification queries
SELECT 'users table' as table_name, 
       COUNT(*) as row_count,
       COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count
FROM public.users

UNION ALL

SELECT 'growth_parameters table' as table_name,
       COUNT(*) as row_count,
       COUNT(CASE WHEN is_active = true THEN 1 END) as active_count
FROM public.growth_parameters

UNION ALL

SELECT 'targets table' as table_name,
       COUNT(*) as row_count,
       COUNT(DISTINCT period) as unique_periods
FROM public.targets;

-- Check specific user
SELECT 
    u.email,
    u.name,
    u.role,
    u.is_active,
    au.email_confirmed_at
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.email = 'tatsuya.nakano@garoinc.jp';