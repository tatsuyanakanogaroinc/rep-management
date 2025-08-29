-- 確実にターゲットデータを設定するスクリプト

-- まず既存のターゲットデータを確認
SELECT COUNT(*) as existing_targets_count FROM targets WHERE period >= '2025-09';

-- targetsテーブルが存在するか確認
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE  table_schema = 'public'
   AND    table_name   = 'targets'
);

-- 既存の2025年以降のデータを削除
DELETE FROM targets WHERE period >= '2025-09';

-- 2025年9月から開始する目標データを確実に挿入
INSERT INTO targets (period, metric_type, target_value, created_at, updated_at, is_active) VALUES
-- 2025年9月
('2025-09', 'mrr', 69720, NOW(), NOW(), true),
('2025-09', 'active_customers', 28, NOW(), NOW(), true),
('2025-09', 'new_acquisitions', 30, NOW(), NOW(), true),
('2025-09', 'churn_rate', 5.0, NOW(), NOW(), true),
('2025-09', 'monthly_expenses', 845000, NOW(), NOW(), true),

-- 2025年10月
('2025-10', 'mrr', 107070, NOW(), NOW(), true),
('2025-10', 'active_customers', 43, NOW(), NOW(), true),
('2025-10', 'new_acquisitions', 45, NOW(), NOW(), true),
('2025-10', 'churn_rate', 5.0, NOW(), NOW(), true),
('2025-10', 'monthly_expenses', 910000, NOW(), NOW(), true),

-- 2025年11月
('2025-11', 'mrr', 161850, NOW(), NOW(), true),
('2025-11', 'active_customers', 65, NOW(), NOW(), true),
('2025-11', 'new_acquisitions', 68, NOW(), NOW(), true),
('2025-11', 'churn_rate', 5.0, NOW(), NOW(), true),
('2025-11', 'monthly_expenses', 946000, NOW(), NOW(), true),

-- 2025年12月
('2025-12', 'mrr', 241530, NOW(), NOW(), true),
('2025-12', 'active_customers', 97, NOW(), NOW(), true),
('2025-12', 'new_acquisitions', 102, NOW(), NOW(), true),
('2025-12', 'churn_rate', 5.0, NOW(), NOW(), true),
('2025-12', 'monthly_expenses', 1036000, NOW(), NOW(), true),

-- 2026年1月
('2026-01', 'mrr', 361050, NOW(), NOW(), true),
('2026-01', 'active_customers', 145, NOW(), NOW(), true),
('2026-01', 'new_acquisitions', 153, NOW(), NOW(), true),
('2026-01', 'churn_rate', 5.0, NOW(), NOW(), true),
('2026-01', 'monthly_expenses', 1117000, NOW(), NOW(), true),

-- 2026年2月
('2026-02', 'mrr', 542820, NOW(), NOW(), true),
('2026-02', 'active_customers', 218, NOW(), NOW(), true),
('2026-02', 'new_acquisitions', 230, NOW(), NOW(), true),
('2026-02', 'churn_rate', 5.0, NOW(), NOW(), true),
('2026-02', 'monthly_expenses', 1235000, NOW(), NOW(), true),

-- 2026年3月
('2026-03', 'mrr', 816720, NOW(), NOW(), true),
('2026-03', 'active_customers', 328, NOW(), NOW(), true),
('2026-03', 'new_acquisitions', 345, NOW(), NOW(), true),
('2026-03', 'churn_rate', 5.0, NOW(), NOW(), true),
('2026-03', 'monthly_expenses', 1454000, NOW(), NOW(), true),

-- 2026年4月
('2026-04', 'mrr', 1225080, NOW(), NOW(), true),
('2026-04', 'active_customers', 492, NOW(), NOW(), true),
('2026-04', 'new_acquisitions', 518, NOW(), NOW(), true),
('2026-04', 'churn_rate', 5.0, NOW(), NOW(), true),
('2026-04', 'monthly_expenses', 1722000, NOW(), NOW(), true),

-- 2026年5月
('2026-05', 'mrr', 1837620, NOW(), NOW(), true),
('2026-05', 'active_customers', 738, NOW(), NOW(), true),
('2026-05', 'new_acquisitions', 777, NOW(), NOW(), true),
('2026-05', 'churn_rate', 5.0, NOW(), NOW(), true),
('2026-05', 'monthly_expenses', 2120000, NOW(), NOW(), true),

-- 2026年6月
('2026-06', 'mrr', 2758920, NOW(), NOW(), true),
('2026-06', 'active_customers', 1108, NOW(), NOW(), true),
('2026-06', 'new_acquisitions', 1166, NOW(), NOW(), true),
('2026-06', 'churn_rate', 5.0, NOW(), NOW(), true),
('2026-06', 'monthly_expenses', 2763000, NOW(), NOW(), true),

-- 2026年7月
('2026-07', 'mrr', 4138380, NOW(), NOW(), true),
('2026-07', 'active_customers', 1662, NOW(), NOW(), true),
('2026-07', 'new_acquisitions', 1749, NOW(), NOW(), true),
('2026-07', 'churn_rate', 5.0, NOW(), NOW(), true),
('2026-07', 'monthly_expenses', 3666000, NOW(), NOW(), true),

-- 2026年8月
('2026-08', 'mrr', 6207570, NOW(), NOW(), true),
('2026-08', 'active_customers', 2493, NOW(), NOW(), true),
('2026-08', 'new_acquisitions', 2624, NOW(), NOW(), true),
('2026-08', 'churn_rate', 5.0, NOW(), NOW(), true),
('2026-08', 'monthly_expenses', 5018000, NOW(), NOW(), true);

-- 確認クエリ
SELECT 
    period,
    COUNT(*) as metrics_count,
    array_agg(DISTINCT metric_type ORDER BY metric_type) as available_metrics,
    MAX(CASE WHEN metric_type = 'mrr' THEN target_value END) as mrr_target,
    MAX(CASE WHEN metric_type = 'active_customers' THEN target_value END) as customers_target,
    MAX(CASE WHEN metric_type = 'new_acquisitions' THEN target_value END) as acquisitions_target
FROM targets 
WHERE period BETWEEN '2025-09' AND '2026-08'
  AND is_active = true
GROUP BY period
ORDER BY period;

-- 全期間のMRR目標値一覧
SELECT 
    period,
    target_value as mrr_target
FROM targets 
WHERE metric_type = 'mrr' 
  AND period BETWEEN '2025-09' AND '2026-08'
  AND is_active = true
ORDER BY period;