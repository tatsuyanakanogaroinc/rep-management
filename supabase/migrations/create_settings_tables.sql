-- Service Settings テーブル
CREATE TABLE IF NOT EXISTS service_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value text NOT NULL,
  setting_type text NOT NULL CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
  category text NOT NULL,
  description text,
  created_by uuid REFERENCES users(id),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Growth Parameters テーブル
CREATE TABLE IF NOT EXISTS growth_parameters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parameter_name text NOT NULL,
  parameter_value numeric NOT NULL,
  unit text,
  category text NOT NULL,
  description text,
  period text, -- 'monthly', 'quarterly', 'yearly' etc
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES users(id),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Channel Targets テーブル
CREATE TABLE IF NOT EXISTS channel_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_name text NOT NULL,
  target_type text NOT NULL, -- 'acquisition', 'cost', 'conversion_rate' etc
  target_value numeric NOT NULL,
  unit text,
  period text NOT NULL, -- 'YYYY-MM'
  cpa_target numeric, -- Cost Per Acquisition target
  conversion_rate_target numeric,
  description text,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES users(id),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(channel_name, target_type, period)
);

-- Service Plans テーブル
CREATE TABLE IF NOT EXISTS service_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name text NOT NULL,
  plan_type text NOT NULL, -- 'monthly', 'yearly'
  price numeric NOT NULL,
  currency text DEFAULT 'JPY',
  features jsonb,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES users(id),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Cohort Analysis テーブル
CREATE TABLE IF NOT EXISTS cohort_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_period text NOT NULL, -- 'YYYY-MM'
  customer_count integer NOT NULL,
  retention_month_1 numeric,
  retention_month_2 numeric,
  retention_month_3 numeric,
  retention_month_6 numeric,
  retention_month_12 numeric,
  ltv numeric, -- Customer Lifetime Value
  created_by uuid REFERENCES users(id),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(cohort_period)
);

-- Unit Economics テーブル
CREATE TABLE IF NOT EXISTS unit_economics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period text NOT NULL, -- 'YYYY-MM'
  customer_acquisition_cost numeric,
  customer_lifetime_value numeric,
  ltv_cac_ratio numeric,
  payback_period_months numeric,
  monthly_churn_rate numeric,
  annual_churn_rate numeric,
  average_revenue_per_user numeric,
  gross_margin_percent numeric,
  created_by uuid REFERENCES users(id),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(period)
);

-- デフォルトのサービス設定を挿入
INSERT INTO service_settings (setting_key, setting_value, setting_type, category, description) VALUES
('monthly_plan_price', '4980', 'number', 'pricing', '月額プラン料金（円）'),
('yearly_plan_price', '49800', 'number', 'pricing', '年額プラン料金（円）'),
('invitation_slots_per_user', '5', 'number', 'growth', 'ユーザーあたりの招待枠数'),
('invitation_send_rate', '0.8', 'number', 'growth', '招待送信率'),
('invitation_acceptance_rate', '0.3', 'number', 'growth', '招待受諾率'),
('trial_conversion_rate', '0.15', 'number', 'growth', 'トライアル→有料転換率'),
('monthly_churn_rate', '0.05', 'number', 'retention', '月次チャーン率'),
('yearly_churn_rate', '0.20', 'number', 'retention', '年次チャーン率')
ON CONFLICT (setting_key) DO NOTHING;

-- デフォルトのサービスプランを挿入
INSERT INTO service_plans (plan_name, plan_type, price, features) VALUES
('月額プラン', 'monthly', 4980, '{"features": ["基本機能", "月次レポート", "サポート"]}'),
('年額プラン', 'yearly', 49800, '{"features": ["基本機能", "月次レポート", "年次レポート", "優先サポート", "割引価格"]}')
ON CONFLICT DO NOTHING;

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_service_settings_category ON service_settings(category);
CREATE INDEX IF NOT EXISTS idx_growth_parameters_category ON growth_parameters(category);
CREATE INDEX IF NOT EXISTS idx_channel_targets_period ON channel_targets(period);
CREATE INDEX IF NOT EXISTS idx_channel_targets_channel ON channel_targets(channel_name);
CREATE INDEX IF NOT EXISTS idx_cohort_analysis_period ON cohort_analysis(cohort_period);
CREATE INDEX IF NOT EXISTS idx_unit_economics_period ON unit_economics(period);

-- RLS有効化
ALTER TABLE service_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_economics ENABLE ROW LEVEL SECURITY;

-- RLSポリシー作成（全テーブル共通で認証ユーザーのみアクセス可能）
CREATE POLICY "Users can view service settings" ON service_settings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert service settings" ON service_settings FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update service settings" ON service_settings FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete service settings" ON service_settings FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view growth parameters" ON growth_parameters FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert growth parameters" ON growth_parameters FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update growth parameters" ON growth_parameters FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete growth parameters" ON growth_parameters FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view channel targets" ON channel_targets FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert channel targets" ON channel_targets FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update channel targets" ON channel_targets FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete channel targets" ON channel_targets FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view service plans" ON service_plans FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert service plans" ON service_plans FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update service plans" ON service_plans FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete service plans" ON service_plans FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view cohort analysis" ON cohort_analysis FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert cohort analysis" ON cohort_analysis FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update cohort analysis" ON cohort_analysis FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete cohort analysis" ON cohort_analysis FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view unit economics" ON unit_economics FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert unit economics" ON unit_economics FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update unit economics" ON unit_economics FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete unit economics" ON unit_economics FOR DELETE USING (auth.role() = 'authenticated');