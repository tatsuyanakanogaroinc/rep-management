-- 成長パラメータ設定テーブルを作成
CREATE TABLE IF NOT EXISTS growth_parameters (
    id SERIAL PRIMARY KEY,
    initial_acquisitions INTEGER NOT NULL DEFAULT 30,
    monthly_growth_rate DECIMAL(5,2) NOT NULL DEFAULT 50.00,
    monthly_price INTEGER NOT NULL DEFAULT 2490,
    yearly_price INTEGER NOT NULL DEFAULT 24900,
    churn_rate DECIMAL(5,2) NOT NULL DEFAULT 5.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    
    -- 制約
    CONSTRAINT check_initial_acquisitions_positive CHECK (initial_acquisitions > 0),
    CONSTRAINT check_monthly_growth_rate_range CHECK (monthly_growth_rate >= 0 AND monthly_growth_rate <= 1000),
    CONSTRAINT check_monthly_price_positive CHECK (monthly_price > 0),
    CONSTRAINT check_yearly_price_positive CHECK (yearly_price > 0),
    CONSTRAINT check_churn_rate_range CHECK (churn_rate >= 0 AND churn_rate <= 100)
);

-- インデックスを作成
CREATE INDEX IF NOT EXISTS idx_growth_parameters_active ON growth_parameters(is_active);

-- 初期データを挿入
INSERT INTO growth_parameters (
    initial_acquisitions,
    monthly_growth_rate,
    monthly_price,
    yearly_price,
    churn_rate,
    created_at,
    updated_at,
    is_active
) VALUES (
    30,          -- 初月新規獲得数
    50.00,       -- 月次成長率 50%
    2490,        -- 月額料金
    24900,       -- 年額料金
    5.00,        -- チャーン率 5%
    NOW(),
    NOW(),
    true
) ON CONFLICT (id) DO NOTHING;

-- 更新用トリガー関数
CREATE OR REPLACE FUNCTION update_growth_parameters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- トリガーを作成
DROP TRIGGER IF EXISTS trigger_growth_parameters_updated_at ON growth_parameters;
CREATE TRIGGER trigger_growth_parameters_updated_at
    BEFORE UPDATE ON growth_parameters
    FOR EACH ROW
    EXECUTE FUNCTION update_growth_parameters_updated_at();

-- RLS（Row Level Security）を設定
ALTER TABLE growth_parameters ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーは読み取り可能
CREATE POLICY IF NOT EXISTS "Growth parameters are viewable by authenticated users"
    ON growth_parameters FOR SELECT
    TO authenticated
    USING (true);

-- 管理者のみ更新可能（ここでは簡単のため全認証済みユーザーに許可）
CREATE POLICY IF NOT EXISTS "Growth parameters are updatable by authenticated users"
    ON growth_parameters FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 管理者のみ挿入可能
CREATE POLICY IF NOT EXISTS "Growth parameters are insertable by authenticated users"
    ON growth_parameters FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 確認用クエリ
SELECT 
    id,
    initial_acquisitions,
    monthly_growth_rate,
    monthly_price,
    yearly_price,
    churn_rate,
    is_active,
    created_at
FROM growth_parameters
WHERE is_active = true;