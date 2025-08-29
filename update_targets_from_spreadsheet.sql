-- 目標・予算設定シートからのデータを反映
-- 既存のデータを削除して新しい目標値を挿入

DELETE FROM targets WHERE period >= '2025-09';

-- 2025年9月から2026年10月までの目標値
INSERT INTO targets (period, metric_type, target_value, created_at, updated_at, is_active) VALUES
-- 2025年9月
('2025-09', 'mrr', 69720, NOW(), NOW(), true),
('2025-09', 'active_customers', 28, NOW(), NOW(), true),
('2025-09', 'new_acquisitions', 30, NOW(), NOW(), true),
('2025-09', 'monthly_expenses', 845000, NOW(), NOW(), true),

-- 2025年10月
('2025-10', 'mrr', 107070, NOW(), NOW(), true),
('2025-10', 'active_customers', 43, NOW(), NOW(), true),
('2025-10', 'new_acquisitions', 45, NOW(), NOW(), true),
('2025-10', 'monthly_expenses', 910000, NOW(), NOW(), true),

-- 2025年11月
('2025-11', 'mrr', 161850, NOW(), NOW(), true),
('2025-11', 'active_customers', 65, NOW(), NOW(), true),
('2025-11', 'new_acquisitions', 68, NOW(), NOW(), true),
('2025-11', 'monthly_expenses', 946000, NOW(), NOW(), true),

-- 2025年12月
('2025-12', 'mrr', 241530, NOW(), NOW(), true),
('2025-12', 'active_customers', 97, NOW(), NOW(), true),
('2025-12', 'new_acquisitions', 102, NOW(), NOW(), true),
('2025-12', 'monthly_expenses', 1036000, NOW(), NOW(), true),

-- 2026年1月
('2026-01', 'mrr', 361050, NOW(), NOW(), true),
('2026-01', 'active_customers', 145, NOW(), NOW(), true),
('2026-01', 'new_acquisitions', 153, NOW(), NOW(), true),
('2026-01', 'monthly_expenses', 1117000, NOW(), NOW(), true),

-- 2026年2月
('2026-02', 'mrr', 542820, NOW(), NOW(), true),
('2026-02', 'active_customers', 218, NOW(), NOW(), true),
('2026-02', 'new_acquisitions', 230, NOW(), NOW(), true),
('2026-02', 'monthly_expenses', 1235000, NOW(), NOW(), true),

-- 2026年3月
('2026-03', 'mrr', 816720, NOW(), NOW(), true),
('2026-03', 'active_customers', 328, NOW(), NOW(), true),
('2026-03', 'new_acquisitions', 345, NOW(), NOW(), true),
('2026-03', 'monthly_expenses', 1454000, NOW(), NOW(), true),

-- 2026年4月
('2026-04', 'mrr', 1225080, NOW(), NOW(), true),
('2026-04', 'active_customers', 492, NOW(), NOW(), true),
('2026-04', 'new_acquisitions', 518, NOW(), NOW(), true),
('2026-04', 'monthly_expenses', 1722000, NOW(), NOW(), true),

-- 2026年5月
('2026-05', 'mrr', 1837620, NOW(), NOW(), true),
('2026-05', 'active_customers', 738, NOW(), NOW(), true),
('2026-05', 'new_acquisitions', 777, NOW(), NOW(), true),
('2026-05', 'monthly_expenses', 2120000, NOW(), NOW(), true),

-- 2026年6月
('2026-06', 'mrr', 2758920, NOW(), NOW(), true),
('2026-06', 'active_customers', 1108, NOW(), NOW(), true),
('2026-06', 'new_acquisitions', 1166, NOW(), NOW(), true),
('2026-06', 'monthly_expenses', 2763000, NOW(), NOW(), true),

-- 2026年7月
('2026-07', 'mrr', 4138380, NOW(), NOW(), true),
('2026-07', 'active_customers', 1662, NOW(), NOW(), true),
('2026-07', 'new_acquisitions', 1749, NOW(), NOW(), true),
('2026-07', 'monthly_expenses', 3666000, NOW(), NOW(), true),

-- 2026年8月
('2026-08', 'mrr', 6207570, NOW(), NOW(), true),
('2026-08', 'active_customers', 2493, NOW(), NOW(), true),
('2026-08', 'new_acquisitions', 2624, NOW(), NOW(), true),
('2026-08', 'monthly_expenses', 5018000, NOW(), NOW(), true),

-- 2026年9月
('2026-09', 'mrr', 9310110, NOW(), NOW(), true),
('2026-09', 'active_customers', 3739, NOW(), NOW(), true),
('2026-09', 'new_acquisitions', 3936, NOW(), NOW(), true),
('2026-09', 'monthly_expenses', 7086000, NOW(), NOW(), true),

-- 2026年10月
('2026-10', 'mrr', 13966410, NOW(), NOW(), true),
('2026-10', 'active_customers', 5609, NOW(), NOW(), true),
('2026-10', 'new_acquisitions', 5904, NOW(), NOW(), true),
('2026-10', 'monthly_expenses', 10130000, NOW(), NOW(), true);

-- 2026年11月以降の継続データ（一部のみ）
INSERT INTO targets (period, metric_type, target_value, created_at, updated_at, is_active) VALUES
-- 2026年11月
('2026-11', 'mrr', 22051440, NOW(), NOW(), true),
('2026-11', 'active_customers', 51656, NOW(), NOW(), true),
('2026-11', 'new_acquisitions', 8856, NOW(), NOW(), true),

-- 2026年12月
('2026-12', 'mrr', 173032590, NOW(), NOW(), true),
('2026-12', 'active_customers', 54770, NOW(), NOW(), true),
('2026-12', 'new_acquisitions', 69491, NOW(), NOW(), true),

-- 2027年1月
('2027-01', 'mrr', 173144640, NOW(), NOW(), true),
('2027-01', 'active_customers', 112404, NOW(), NOW(), true),
('2027-01', 'new_acquisitions', 69536, NOW(), NOW(), true);

-- 成長パラメータ設定テーブルを作成（存在しない場合）
CREATE TABLE IF NOT EXISTS growth_parameters (
    id SERIAL PRIMARY KEY,
    initial_acquisitions INTEGER NOT NULL DEFAULT 30,
    monthly_growth_rate DECIMAL(5,2) NOT NULL DEFAULT 50.00,
    monthly_price INTEGER NOT NULL DEFAULT 2490,
    yearly_price INTEGER NOT NULL DEFAULT 24900,
    churn_rate DECIMAL(5,2) NOT NULL DEFAULT 5.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- 初期パラメータを挿入
INSERT INTO growth_parameters (initial_acquisitions, monthly_growth_rate, monthly_price, yearly_price, churn_rate)
VALUES (30, 50.00, 2490, 24900, 5.00)
ON CONFLICT (id) DO UPDATE SET
    initial_acquisitions = EXCLUDED.initial_acquisitions,
    monthly_growth_rate = EXCLUDED.monthly_growth_rate,
    updated_at = NOW();

-- 確認用クエリ
SELECT 
    period,
    metric_type,
    target_value,
    is_active
FROM targets 
WHERE period >= '2025-09' 
ORDER BY period, metric_type;