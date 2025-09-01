-- 料金設定テーブルの作成
CREATE TABLE IF NOT EXISTS public.pricing_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    monthly_price NUMERIC(10, 2) NOT NULL DEFAULT 4980,
    yearly_price NUMERIC(10, 2) NOT NULL DEFAULT 49800,
    currency TEXT NOT NULL DEFAULT 'JPY',
    pricing_model TEXT NOT NULL DEFAULT 'flat' CHECK (pricing_model IN ('flat', 'per_user', 'tiered')),
    is_active BOOLEAN DEFAULT true,
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    -- 複数の料金設定が同時にアクティブにならないように制約
    UNIQUE (is_active) WHERE is_active = true
);

-- ユーザー数ベース料金テーブル（将来用）
CREATE TABLE IF NOT EXISTS public.pricing_tiers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pricing_settings_id UUID REFERENCES public.pricing_settings(id) ON DELETE CASCADE,
    min_users INTEGER NOT NULL,
    max_users INTEGER, -- NULLの場合は無制限
    monthly_price_per_user NUMERIC(10, 2),
    yearly_price_per_user NUMERIC(10, 2),
    base_price NUMERIC(10, 2) DEFAULT 0, -- 基本料金
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_pricing_settings_active ON public.pricing_settings(is_active, effective_date);
CREATE INDEX IF NOT EXISTS idx_pricing_tiers_users ON public.pricing_tiers(min_users, max_users);

-- RLSポリシーの設定
ALTER TABLE public.pricing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_tiers ENABLE ROW LEVEL SECURITY;

-- 認証されたユーザーは料金設定を閲覧可能
CREATE POLICY "Users can view pricing settings" 
ON public.pricing_settings
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Users can view pricing tiers" 
ON public.pricing_tiers
FOR SELECT 
TO authenticated
USING (true);

-- 管理者のみが料金設定を変更可能
CREATE POLICY "Admins can manage pricing settings" 
ON public.pricing_settings
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

CREATE POLICY "Admins can manage pricing tiers" 
ON public.pricing_tiers
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

-- 更新時のタイムスタンプ自動更新
CREATE TRIGGER update_pricing_settings_updated_at 
BEFORE UPDATE ON public.pricing_settings 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- 初期データの挿入
INSERT INTO public.pricing_settings (monthly_price, yearly_price, pricing_model, effective_date) 
VALUES (4980, 49800, 'flat', CURRENT_DATE)
ON CONFLICT (is_active) WHERE is_active = true DO NOTHING;

-- 料金取得用の関数
CREATE OR REPLACE FUNCTION get_current_pricing()
RETURNS TABLE (
    monthly_price NUMERIC(10, 2),
    yearly_price NUMERIC(10, 2),
    pricing_model TEXT,
    currency TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ps.monthly_price,
        ps.yearly_price,
        ps.pricing_model,
        ps.currency
    FROM public.pricing_settings ps
    WHERE ps.is_active = true
    AND ps.effective_date <= CURRENT_DATE
    ORDER BY ps.effective_date DESC
    LIMIT 1;
END;
$$;

-- 認証されたユーザーに実行権限を付与
GRANT EXECUTE ON FUNCTION get_current_pricing() TO authenticated;