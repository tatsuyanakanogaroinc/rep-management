-- スプレッドシートのデータをベースに目標値とKPIを更新

-- 2025年1月の目標データを挿入/更新
INSERT INTO targets (metric_type, target_value, unit, period, description, is_active) VALUES
-- 顧客獲得関連
('new_acquisitions', 150, '人', '2025-01', '月間新規顧客獲得目標', true),
('active_customers', 450, '人', '2025-01', '月末アクティブ顧客数目標', true),
('churn_rate', 3.5, '%', '2025-01', '月次チャーン率目標（3.5%以下）', true),

-- 収益関連
('mrr', 2205000, '円', '2025-01', '月次経常収益目標（MRR）', true),
('arr', 26460000, '円', '2025-01', '年間経常収益目標（ARR）', true),
('monthly_expenses', 850000, '円', '2025-01', '月次費用目標', true),

-- マーケティング関連
('customer_acquisition_cost', 5500, '円', '2025-01', '顧客獲得コスト目標（CAC）', true),
('marketing_budget', 825000, '円', '2025-01', '月間マーケティング予算', true),
('ltv_cac_ratio', 4.5, '倍', '2025-01', 'LTV/CAC比率目標', true),

-- 転換率関連
('trial_conversion_rate', 18, '%', '2025-01', 'トライアル転換率目標', true),
('invitation_acceptance_rate', 35, '%', '2025-01', '招待受諾率目標', true),
('yearly_plan_ratio', 25, '%', '2025-01', '年額プラン比率目標', true)

ON CONFLICT (metric_type, period) DO UPDATE SET
  target_value = EXCLUDED.target_value,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

-- チャネル別目標を設定（2025年1月）
INSERT INTO channel_targets (channel_name, target_type, target_value, unit, period, cpa_target, conversion_rate_target, description, is_active) VALUES
-- Google広告
('Google広告', 'acquisition', 45, '人', '2025-01', 6000, 2.8, 'Google広告経由の新規獲得目標', true),
('Google広告', 'budget', 270000, '円', '2025-01', 6000, 2.8, 'Google広告の月間予算', true),

-- Facebook広告
('Facebook広告', 'acquisition', 38, '人', '2025-01', 5500, 2.5, 'Facebook広告経由の新規獲得目標', true),
('Facebook広告', 'budget', 209000, '円', '2025-01', 5500, 2.5, 'Facebook広告の月間予算', true),

-- Instagram広告
('Instagram広告', 'acquisition', 30, '人', '2025-01', 5000, 2.2, 'Instagram広告経由の新規獲得目標', true),
('Instagram広告', 'budget', 150000, '円', '2025-01', 5000, 2.2, 'Instagram広告の月間予算', true),

-- 紹介
('紹介', 'acquisition', 22, '人', '2025-01', 0, 15.0, '紹介経由の新規獲得目標', true),
('紹介', 'budget', 0, '円', '2025-01', 0, 15.0, '紹介の月間予算（コスト無し）', true),

-- オーガニック検索
('オーガニック検索', 'acquisition', 15, '人', '2025-01', 0, 3.5, 'オーガニック検索経由の新規獲得目標', true),
('オーガニック検索', 'budget', 0, '円', '2025-01', 0, 3.5, 'オーガニック検索の月間予算（コスト無し）', true)

ON CONFLICT (channel_name, target_type, period) DO UPDATE SET
  target_value = EXCLUDED.target_value,
  cpa_target = EXCLUDED.cpa_target,
  conversion_rate_target = EXCLUDED.conversion_rate_target,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

-- サービス設定値をスプレッドシートベースに更新
INSERT INTO service_settings (setting_key, setting_value, setting_type, category, description) VALUES
-- 価格設定
('monthly_plan_price', '4980', 'number', 'pricing', '月額プラン料金（円）'),
('yearly_plan_price', '49800', 'number', 'pricing', '年額プラン料金（円）'),

-- 成長パラメータ
('target_new_customers_monthly', '150', 'number', 'growth', '月間新規顧客獲得目標'),
('trial_conversion_rate', '0.18', 'number', 'growth', 'トライアル→有料転換率（18%）'),
('monthly_churn_rate', '0.035', 'number', 'retention', '月次チャーン率目標（3.5%）'),
('yearly_churn_rate', '0.20', 'number', 'retention', '年次チャーン率'),

-- 招待システム
('invitation_slots_per_user', '5', 'number', 'growth', 'ユーザーあたりの招待枠数'),
('invitation_send_rate', '0.8', 'number', 'growth', '招待送信率'),
('invitation_acceptance_rate', '0.35', 'number', 'growth', '招待受諾率（35%）'),

-- プラン配分
('yearly_plan_ratio', '0.25', 'number', 'pricing', '年額プラン比率目標（25%）'),

-- マーケティング効率
('target_cac', '5500', 'number', 'marketing', '目標顧客獲得コスト'),
('target_ltv', '24750', 'number', 'marketing', '目標顧客生涯価値'),
('marketing_budget_monthly', '825000', 'number', 'marketing', '月間マーケティング予算'),

-- チャネル配分比率
('google_ads_ratio', '0.30', 'number', 'channels', 'Google広告の獲得比率'),
('facebook_ads_ratio', '0.25', 'number', 'channels', 'Facebook広告の獲得比率'),
('instagram_ads_ratio', '0.20', 'number', 'channels', 'Instagram広告の獲得比率'),
('referral_ratio', '0.15', 'number', 'channels', '紹介の獲得比率'),
('organic_ratio', '0.10', 'number', 'channels', 'オーガニック検索の獲得比率')

ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

-- 成長パラメータテーブルに詳細な設定を挿入
INSERT INTO growth_parameters (parameter_name, parameter_value, unit, category, description, period, is_active) VALUES
-- 顧客獲得関連
('monthly_new_customers', 150, '人', 'acquisition', '月間新規顧客獲得目標', 'monthly', true),
('trial_users_needed', 833, '人', 'acquisition', '目標達成に必要なトライアル数（150÷0.18）', 'monthly', true),
('invitation_conversion', 35, '%', 'acquisition', '招待からの転換率', 'monthly', true),

-- 収益関連
('monthly_revenue_target', 2205000, '円', 'revenue', '月次収益目標', 'monthly', true),
('arpu_monthly', 4980, '円', 'revenue', '月額プランの単価', 'monthly', true),
('arpu_yearly', 4150, '円', 'revenue', '年額プラン月割り単価', 'monthly', true),

-- ユニットエコノミクス
('customer_ltv', 24750, '円', 'unit_economics', '顧客生涯価値', 'monthly', true),
('payback_period', 4.5, 'ヶ月', 'unit_economics', '投資回収期間', 'monthly', true),
('gross_margin', 85, '%', 'unit_economics', '粗利率', 'monthly', true),

-- チャーン・リテンション
('monthly_churn_target', 3.5, '%', 'retention', '月次チャーン率目標', 'monthly', true),
('customer_retention_12m', 65, '%', 'retention', '12ヶ月後リテンション率', 'yearly', true),

-- マーケティング効率
('total_marketing_budget', 825000, '円', 'marketing', '月間マーケティング予算総額', 'monthly', true),
('cac_blended', 5500, '円', 'marketing', 'ブレンデッドCAC', 'monthly', true),
('ltv_cac_ratio_target', 4.5, '倍', 'marketing', 'LTV/CAC比率目標', 'monthly', true)

ON CONFLICT (parameter_name, period) DO UPDATE SET
  parameter_value = EXCLUDED.parameter_value,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

-- ユニットエコノミクスの基準値を設定
INSERT INTO unit_economics (
  period, 
  customer_acquisition_cost, 
  customer_lifetime_value, 
  ltv_cac_ratio, 
  payback_period_months,
  monthly_churn_rate, 
  annual_churn_rate,
  average_revenue_per_user,
  gross_margin_percent
) VALUES (
  '2025-01',
  5500, -- CAC
  24750, -- LTV
  4.5, -- LTV/CAC ratio
  4.5, -- Payback period (months)
  3.5, -- Monthly churn rate (%)
  30.0, -- Annual churn rate (%)
  4900, -- ARPU (weighted average)
  85.0 -- Gross margin (%)
)
ON CONFLICT (period) DO UPDATE SET
  customer_acquisition_cost = EXCLUDED.customer_acquisition_cost,
  customer_lifetime_value = EXCLUDED.customer_lifetime_value,
  ltv_cac_ratio = EXCLUDED.ltv_cac_ratio,
  payback_period_months = EXCLUDED.payback_period_months,
  monthly_churn_rate = EXCLUDED.monthly_churn_rate,
  annual_churn_rate = EXCLUDED.annual_churn_rate,
  average_revenue_per_user = EXCLUDED.average_revenue_per_user,
  gross_margin_percent = EXCLUDED.gross_margin_percent,
  updated_at = timezone('utc'::text, now());