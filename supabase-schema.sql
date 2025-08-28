-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('member', 'manager', 'admin')) DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Customers table
CREATE TABLE public.customers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'yearly')),
  status TEXT NOT NULL CHECK (status IN ('active', 'dormant', 'churned')) DEFAULT 'active',
  acquisition_channel TEXT NOT NULL,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  churned_at TIMESTAMP WITH TIME ZONE,
  ltv DECIMAL(10,2),
  last_login_at TIMESTAMP WITH TIME ZONE,
  invitations_sent INTEGER DEFAULT 0,
  invitations_approved INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Daily reports table
CREATE TABLE public.daily_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  date DATE NOT NULL,
  new_acquisitions INTEGER DEFAULT 0,
  churns INTEGER DEFAULT 0,
  acquisition_details JSONB DEFAULT '{}',
  activities TEXT,
  tomorrow_plan TEXT,
  customer_feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(user_id, date)
);

-- Expenses table
CREATE TABLE public.expenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  vendor TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  approved_by UUID REFERENCES public.users(id),
  receipt_url TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Targets table
CREATE TABLE public.targets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  period TEXT NOT NULL, -- e.g., "2024-Q1", "2024-01"
  metric_type TEXT NOT NULL, -- e.g., "mrr", "new_acquisitions", "churn_rate"
  target_value DECIMAL(15,2) NOT NULL,
  current_value DECIMAL(15,2) DEFAULT 0,
  unit TEXT NOT NULL, -- e.g., "currency", "count", "percentage"
  created_by UUID REFERENCES public.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(period, metric_type)
);

-- Budgets table
CREATE TABLE public.budgets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  period TEXT NOT NULL, -- e.g., "2024-Q1", "2024-01"
  category TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  spent DECIMAL(10,2) DEFAULT 0,
  remaining DECIMAL(10,2) GENERATED ALWAYS AS (amount - spent) STORED,
  created_by UUID REFERENCES public.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(period, category)
);

-- Actuals table (for storing various metrics)
CREATE TABLE public.actuals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE NOT NULL,
  metric_type TEXT NOT NULL,
  value DECIMAL(15,2) NOT NULL,
  channel TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_customers_status ON public.customers(status);
CREATE INDEX idx_customers_acquisition_channel ON public.customers(acquisition_channel);
CREATE INDEX idx_daily_reports_date ON public.daily_reports(date);
CREATE INDEX idx_daily_reports_user_id ON public.daily_reports(user_id);
CREATE INDEX idx_expenses_date ON public.expenses(date);
CREATE INDEX idx_expenses_status ON public.expenses(status);
CREATE INDEX idx_expenses_category ON public.expenses(category);
CREATE INDEX idx_targets_period ON public.targets(period);
CREATE INDEX idx_budgets_period ON public.budgets(period);
CREATE INDEX idx_actuals_date ON public.actuals(date);
CREATE INDEX idx_actuals_metric_type ON public.actuals(metric_type);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actuals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read their own data
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- All authenticated users can read customers
CREATE POLICY "All authenticated users can read customers" ON public.customers
  FOR SELECT TO authenticated USING (true);

-- Only managers and admins can modify customers
CREATE POLICY "Managers and admins can modify customers" ON public.customers
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('manager', 'admin')
    )
  );

-- Users can read/write their own daily reports
CREATE POLICY "Users can manage own daily reports" ON public.daily_reports
  FOR ALL TO authenticated USING (user_id = auth.uid());

-- All authenticated users can read daily reports
CREATE POLICY "All authenticated users can read daily reports" ON public.daily_reports
  FOR SELECT TO authenticated USING (true);

-- All authenticated users can read expenses
CREATE POLICY "All authenticated users can read expenses" ON public.expenses
  FOR SELECT TO authenticated USING (true);

-- Users can create expenses
CREATE POLICY "Users can create expenses" ON public.expenses
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

-- Users can update their own pending expenses
CREATE POLICY "Users can update own pending expenses" ON public.expenses
  FOR UPDATE TO authenticated USING (
    created_by = auth.uid() AND status = 'pending'
  );

-- Managers and admins can approve/reject expenses
CREATE POLICY "Managers can approve expenses" ON public.expenses
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('manager', 'admin')
    )
  );

-- Only managers and admins can manage targets and budgets
CREATE POLICY "Managers and admins can manage targets" ON public.targets
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('manager', 'admin')
    )
  );

CREATE POLICY "Managers and admins can manage budgets" ON public.budgets
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('manager', 'admin')
    )
  );

-- All authenticated users can read targets and budgets
CREATE POLICY "All authenticated users can read targets" ON public.targets
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "All authenticated users can read budgets" ON public.budgets
  FOR SELECT TO authenticated USING (true);

-- All authenticated users can read actuals
CREATE POLICY "All authenticated users can read actuals" ON public.actuals
  FOR SELECT TO authenticated USING (true);

-- Only managers and admins can manage actuals
CREATE POLICY "Managers and admins can manage actuals" ON public.actuals
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('manager', 'admin')
    )
  );

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'name', new.email), 'member');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_reports_updated_at BEFORE UPDATE ON public.daily_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_targets_updated_at BEFORE UPDATE ON public.targets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON public.budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_actuals_updated_at BEFORE UPDATE ON public.actuals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();