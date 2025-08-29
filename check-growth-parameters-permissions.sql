-- Growth Parameters テーブルの権限確認と修正

-- 1. テーブルの存在確認
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'growth_parameters'
) as table_exists;

-- 2. RLS状態の確認
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'growth_parameters') as policy_count
FROM pg_tables 
WHERE tablename = 'growth_parameters';

-- 3. 既存のポリシー確認
SELECT 
    policyname,
    cmd,
    qual,
    with_check,
    roles
FROM pg_policies 
WHERE tablename = 'growth_parameters';

-- 4. growth_parametersテーブルのRLSを一時的に無効化（開発環境のみ）
-- ALTER TABLE public.growth_parameters DISABLE ROW LEVEL SECURITY;

-- 5. 管理者向けのポリシーを作成（存在しない場合）
DO $$ 
BEGIN
    -- 既存のポリシーを削除
    DROP POLICY IF EXISTS "Admin full access" ON public.growth_parameters;
    DROP POLICY IF EXISTS "Users can view parameters" ON public.growth_parameters;
    
    -- RLSを有効化
    ALTER TABLE public.growth_parameters ENABLE ROW LEVEL SECURITY;
    
    -- 管理者は全操作可能
    CREATE POLICY "Admin full access" 
    ON public.growth_parameters
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );
    
    -- 全ユーザーはパラメータを閲覧可能
    CREATE POLICY "Users can view parameters" 
    ON public.growth_parameters
    FOR SELECT 
    TO authenticated
    USING (true);
    
    RAISE NOTICE 'Growth parameters policies created successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating policies: %', SQLERRM;
END $$;

-- 6. Targetsテーブルの権限も確認
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'targets';

-- 7. Targetsテーブルのポリシーも修正
DO $$ 
BEGIN
    -- 既存のポリシーを削除
    DROP POLICY IF EXISTS "Admin manage targets" ON public.targets;
    DROP POLICY IF EXISTS "Users can view targets" ON public.targets;
    
    -- RLSを有効化
    ALTER TABLE public.targets ENABLE ROW LEVEL SECURITY;
    
    -- 管理者は全操作可能
    CREATE POLICY "Admin manage targets" 
    ON public.targets
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );
    
    -- 全ユーザーはターゲットを閲覧可能
    CREATE POLICY "Users can view targets" 
    ON public.targets
    FOR SELECT 
    TO authenticated
    USING (true);
    
    RAISE NOTICE 'Targets policies created successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating policies: %', SQLERRM;
END $$;

-- 8. 現在のデータ確認
SELECT * FROM public.growth_parameters;
SELECT COUNT(*) as target_count FROM public.targets;
SELECT COUNT(*) as future_target_count FROM public.targets WHERE period >= '2025-09';