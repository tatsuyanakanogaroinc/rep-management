# Migration Guide

## 1. users テーブルの作成

ユーザー管理機能を使用するために、Supabaseに`users`テーブルを作成する必要があります。

### 手順

1. [Supabaseダッシュボード](https://app.supabase.com)にログイン

2. プロジェクトを選択し、SQL Editorに移動

3. 以下のSQLを実行:

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'manager', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON public.users(is_active);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Admin users can manage all users" ON public.users;

-- Create RLS policies
CREATE POLICY "Users can view all profiles" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Admin users can manage all users" ON public.users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS handle_users_updated_at ON public.users;

-- Create trigger
CREATE TRIGGER handle_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert admin users
INSERT INTO public.users (id, email, name, role, is_active) VALUES
  (gen_random_uuid(), 'tatsuya.nakano@garoinc.jp', 'Tatsuya Nakano', 'admin', true),
  (gen_random_uuid(), 'suzu.maruko@garoinc.jp', 'Suzu Maruko', 'admin', true)
ON CONFLICT (email) DO UPDATE SET
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
```

## 2. daily_actuals テーブルの作成

日次実績機能を使用するために、Supabaseに`daily_actuals`テーブルを作成する必要があります。

### 手順

1. [Supabaseダッシュボード](https://app.supabase.com)にログイン

2. プロジェクトを選択し、SQL Editorに移動

3. 以下のSQLを実行:

```sql
-- Create daily_actuals table
CREATE TABLE IF NOT EXISTS public.daily_actuals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  new_acquisitions INTEGER NOT NULL DEFAULT 0,
  revenue INTEGER NOT NULL DEFAULT 0,
  expenses INTEGER NOT NULL DEFAULT 0,
  channel_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, date)
);

-- Create indexes (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_daily_actuals_user_id ON public.daily_actuals(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_actuals_date ON public.daily_actuals(date);
CREATE INDEX IF NOT EXISTS idx_daily_actuals_user_date ON public.daily_actuals(user_id, date);

-- Enable RLS
ALTER TABLE public.daily_actuals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own daily actuals" ON public.daily_actuals;
DROP POLICY IF EXISTS "Users can insert their own daily actuals" ON public.daily_actuals;
DROP POLICY IF EXISTS "Users can update their own daily actuals" ON public.daily_actuals;
DROP POLICY IF EXISTS "Users can delete their own daily actuals" ON public.daily_actuals;

-- Create RLS policies
CREATE POLICY "Users can view their own daily actuals" ON public.daily_actuals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily actuals" ON public.daily_actuals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily actuals" ON public.daily_actuals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily actuals" ON public.daily_actuals
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS handle_daily_actuals_updated_at ON public.daily_actuals;

-- Create trigger
CREATE TRIGGER handle_daily_actuals_updated_at
  BEFORE UPDATE ON public.daily_actuals
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

4. 実行が成功したことを確認

これで日次実績機能が使用可能になります。