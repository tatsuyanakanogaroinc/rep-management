-- スプレッドシートベースの月次目標データを一括登録
-- 2025年1月〜12月の目標設定

-- 月次目標を一括削除して再作成（重複防止）
DELETE FROM targets WHERE period BETWEEN '2025-01' AND '2025-12';

-- 2025年1月の目標
INSERT INTO targets (metric_type, target_value, unit, period, description, is_active) VALUES
('new_acquisitions', 150, '人', '2025-01', '月間新規顧客獲得目標', true),
('active_customers', 450, '人', '2025-01', '月末アクティブ顧客数目標', true),
('churn_rate', 3.5, '%', '2025-01', '月次チャーン率目標（3.5%以下）', true),
('mrr', 2205000, '円', '2025-01', '月次経常収益目標（MRR）', true),
('monthly_expenses', 850000, '円', '2025-01', '月次費用目標', true),
('customer_acquisition_cost', 5500, '円', '2025-01', '顧客獲得コスト目標（CAC）', true),
('marketing_budget', 825000, '円', '2025-01', '月間マーケティング予算', true);

-- 2025年2月の目標
INSERT INTO targets (metric_type, target_value, unit, period, description, is_active) VALUES
('new_acquisitions', 165, '人', '2025-02', '月間新規顧客獲得目標（前月比110%）', true),
('active_customers', 600, '人', '2025-02', '月末アクティブ顧客数目標', true),
('churn_rate', 3.4, '%', '2025-02', '月次チャーン率目標（3.4%以下）', true),
('mrr', 2940000, '円', '2025-02', '月次経常収益目標（MRR）', true),
('monthly_expenses', 900000, '円', '2025-02', '月次費用目標', true),
('customer_acquisition_cost', 5450, '円', '2025-02', '顧客獲得コスト目標（CAC）', true),
('marketing_budget', 900000, '円', '2025-02', '月間マーケティング予算', true);

-- 2025年3月の目標
INSERT INTO targets (metric_type, target_value, unit, period, description, is_active) VALUES
('new_acquisitions', 180, '人', '2025-03', '月間新規顧客獲得目標', true),
('active_customers', 750, '人', '2025-03', '月末アクティブ顧客数目標', true),
('churn_rate', 3.3, '%', '2025-03', '月次チャーン率目標（3.3%以下）', true),
('mrr', 3675000, '円', '2025-03', '月次経常収益目標（MRR）', true),
('monthly_expenses', 950000, '円', '2025-03', '月次費用目標', true),
('customer_acquisition_cost', 5400, '円', '2025-03', '顧客獲得コスト目標（CAC）', true),
('marketing_budget', 972000, '円', '2025-03', '月間マーケティング予算', true);

-- 2025年4月の目標
INSERT INTO targets (metric_type, target_value, unit, period, description, is_active) VALUES
('new_acquisitions', 200, '人', '2025-04', '月間新規顧客獲得目標', true),
('active_customers', 900, '人', '2025-04', '月末アクティブ顧客数目標', true),
('churn_rate', 3.2, '%', '2025-04', '月次チャーン率目標（3.2%以下）', true),
('mrr', 4410000, '円', '2025-04', '月次経常収益目標（MRR）', true),
('monthly_expenses', 1000000, '円', '2025-04', '月次費用目標', true),
('customer_acquisition_cost', 5350, '円', '2025-04', '顧客獲得コスト目標（CAC）', true),
('marketing_budget', 1070000, '円', '2025-04', '月間マーケティング予算', true);

-- 2025年5月の目標
INSERT INTO targets (metric_type, target_value, unit, period, description, is_active) VALUES
('new_acquisitions', 220, '人', '2025-05', '月間新規顧客獲得目標', true),
('active_customers', 1050, '人', '2025-05', '月末アクティブ顧客数目標', true),
('churn_rate', 3.1, '%', '2025-05', '月次チャーン率目標（3.1%以下）', true),
('mrr', 5145000, '円', '2025-05', '月次経常収益目標（MRR）', true),
('monthly_expenses', 1100000, '円', '2025-05', '月次費用目標', true),
('customer_acquisition_cost', 5300, '円', '2025-05', '顧客獲得コスト目標（CAC）', true),
('marketing_budget', 1166000, '円', '2025-05', '月間マーケティング予算', true);

-- 2025年6月の目標
INSERT INTO targets (metric_type, target_value, unit, period, description, is_active) VALUES
('new_acquisitions', 240, '人', '2025-06', '月間新規顧客獲得目標', true),
('active_customers', 1200, '人', '2025-06', '月末アクティブ顧客数目標', true),
('churn_rate', 3.0, '%', '2025-06', '月次チャーン率目標（3.0%以下）', true),
('mrr', 5880000, '円', '2025-06', '月次経常収益目標（MRR）', true),
('monthly_expenses', 1200000, '円', '2025-06', '月次費用目標', true),
('customer_acquisition_cost', 5250, '円', '2025-06', '顧客獲得コスト目標（CAC）', true),
('marketing_budget', 1260000, '円', '2025-06', '月間マーケティング予算', true);

-- 2025年7月の目標
INSERT INTO targets (metric_type, target_value, unit, period, description, is_active) VALUES
('new_acquisitions', 260, '人', '2025-07', '月間新規顧客獲得目標', true),
('active_customers', 1350, '人', '2025-07', '月末アクティブ顧客数目標', true),
('churn_rate', 2.9, '%', '2025-07', '月次チャーン率目標（2.9%以下）', true),
('mrr', 6615000, '円', '2025-07', '月次経常収益目標（MRR）', true),
('monthly_expenses', 1300000, '円', '2025-07', '月次費用目標', true),
('customer_acquisition_cost', 5200, '円', '2025-07', '顧客獲得コスト目標（CAC）', true),
('marketing_budget', 1352000, '円', '2025-07', '月間マーケティング予算', true);

-- 2025年8月の目標
INSERT INTO targets (metric_type, target_value, unit, period, description, is_active) VALUES
('new_acquisitions', 280, '人', '2025-08', '月間新規顧客獲得目標', true),
('active_customers', 1500, '人', '2025-08', '月末アクティブ顧客数目標', true),
('churn_rate', 2.8, '%', '2025-08', '月次チャーン率目標（2.8%以下）', true),
('mrr', 7350000, '円', '2025-08', '月次経常収益目標（MRR）', true),
('monthly_expenses', 1400000, '円', '2025-08', '月次費用目標', true),
('customer_acquisition_cost', 5150, '円', '2025-08', '顧客獲得コスト目標（CAC）', true),
('marketing_budget', 1442000, '円', '2025-08', '月間マーケティング予算', true);

-- 2025年9月の目標
INSERT INTO targets (metric_type, target_value, unit, period, description, is_active) VALUES
('new_acquisitions', 300, '人', '2025-09', '月間新規顧客獲得目標', true),
('active_customers', 1650, '人', '2025-09', '月末アクティブ顧客数目標', true),
('churn_rate', 2.7, '%', '2025-09', '月次チャーン率目標（2.7%以下）', true),
('mrr', 8085000, '円', '2025-09', '月次経常収益目標（MRR）', true),
('monthly_expenses', 1500000, '円', '2025-09', '月次費用目標', true),
('customer_acquisition_cost', 5100, '円', '2025-09', '顧客獲得コスト目標（CAC）', true),
('marketing_budget', 1530000, '円', '2025-09', '月間マーケティング予算', true);

-- 2025年10月の目標
INSERT INTO targets (metric_type, target_value, unit, period, description, is_active) VALUES
('new_acquisitions', 320, '人', '2025-10', '月間新規顧客獲得目標', true),
('active_customers', 1800, '人', '2025-10', '月末アクティブ顧客数目標', true),
('churn_rate', 2.6, '%', '2025-10', '月次チャーン率目標（2.6%以下）', true),
('mrr', 8820000, '円', '2025-10', '月次経常収益目標（MRR）', true),
('monthly_expenses', 1600000, '円', '2025-10', '月次費用目標', true),
('customer_acquisition_cost', 5050, '円', '2025-10', '顧客獲得コスト目標（CAC）', true),
('marketing_budget', 1616000, '円', '2025-10', '月間マーケティング予算', true);

-- 2025年11月の目標
INSERT INTO targets (metric_type, target_value, unit, period, description, is_active) VALUES
('new_acquisitions', 340, '人', '2025-11', '月間新規顧客獲得目標', true),
('active_customers', 1950, '人', '2025-11', '月末アクティブ顧客数目標', true),
('churn_rate', 2.5, '%', '2025-11', '月次チャーン率目標（2.5%以下）', true),
('mrr', 9555000, '円', '2025-11', '月次経常収益目標（MRR）', true),
('monthly_expenses', 1700000, '円', '2025-11', '月次費用目標', true),
('customer_acquisition_cost', 5000, '円', '2025-11', '顧客獲得コスト目標（CAC）', true),
('marketing_budget', 1700000, '円', '2025-11', '月間マーケティング予算', true);

-- 2025年12月の目標
INSERT INTO targets (metric_type, target_value, unit, period, description, is_active) VALUES
('new_acquisitions', 360, '人', '2025-12', '月間新規顧客獲得目標', true),
('active_customers', 2100, '人', '2025-12', '月末アクティブ顧客数目標', true),
('churn_rate', 2.5, '%', '2025-12', '月次チャーン率目標（2.5%以下）', true),
('mrr', 10290000, '円', '2025-12', '月次経常収益目標（MRR）', true),
('monthly_expenses', 1800000, '円', '2025-12', '月次費用目標', true),
('customer_acquisition_cost', 4950, '円', '2025-12', '顧客獲得コスト目標（CAC）', true),
('marketing_budget', 1782000, '円', '2025-12', '月間マーケティング予算', true);

-- チャネル別目標も月次で登録（2025年1月〜3月のサンプル）
-- 2025年1月
DELETE FROM channel_targets WHERE period = '2025-01';
INSERT INTO channel_targets (channel_name, target_type, target_value, unit, period, cpa_target, conversion_rate_target, description, is_active) VALUES
('Google広告', 'acquisition', 45, '人', '2025-01', 6000, 2.8, 'Google広告経由の新規獲得目標', true),
('Facebook広告', 'acquisition', 38, '人', '2025-01', 5500, 2.5, 'Facebook広告経由の新規獲得目標', true),
('Instagram広告', 'acquisition', 30, '人', '2025-01', 5000, 2.2, 'Instagram広告経由の新規獲得目標', true),
('紹介', 'acquisition', 22, '人', '2025-01', 0, 15.0, '紹介経由の新規獲得目標', true),
('オーガニック検索', 'acquisition', 15, '人', '2025-01', 0, 3.5, 'オーガニック検索経由の新規獲得目標', true);

-- 2025年2月（成長率を反映）
DELETE FROM channel_targets WHERE period = '2025-02';
INSERT INTO channel_targets (channel_name, target_type, target_value, unit, period, cpa_target, conversion_rate_target, description, is_active) VALUES
('Google広告', 'acquisition', 50, '人', '2025-02', 5900, 2.9, 'Google広告経由の新規獲得目標', true),
('Facebook広告', 'acquisition', 41, '人', '2025-02', 5400, 2.6, 'Facebook広告経由の新規獲得目標', true),
('Instagram広告', 'acquisition', 33, '人', '2025-02', 4900, 2.3, 'Instagram広告経由の新規獲得目標', true),
('紹介', 'acquisition', 25, '人', '2025-02', 0, 15.5, '紹介経由の新規獲得目標', true),
('オーガニック検索', 'acquisition', 16, '人', '2025-02', 0, 3.6, 'オーガニック検索経由の新規獲得目標', true);

-- 2025年3月
DELETE FROM channel_targets WHERE period = '2025-03';
INSERT INTO channel_targets (channel_name, target_type, target_value, unit, period, cpa_target, conversion_rate_target, description, is_active) VALUES
('Google広告', 'acquisition', 54, '人', '2025-03', 5800, 3.0, 'Google広告経由の新規獲得目標', true),
('Facebook広告', 'acquisition', 45, '人', '2025-03', 5300, 2.7, 'Facebook広告経由の新規獲得目標', true),
('Instagram広告', 'acquisition', 36, '人', '2025-03', 4800, 2.4, 'Instagram広告経由の新規獲得目標', true),
('紹介', 'acquisition', 27, '人', '2025-03', 0, 16.0, '紹介経由の新規獲得目標', true),
('オーガニック検索', 'acquisition', 18, '人', '2025-03', 0, 3.7, 'オーガニック検索経由の新規獲得目標', true);