-- ========================================
-- 既存のテーブルとインデックスを考慮したマイグレーションSQL
-- ========================================

-- 1. users テーブルの確認と更新
-- ========================================

-- usersテーブルが存在しない場合のみ作成
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'manager', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLSを有効化（既に有効でもエラーにならない）
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除してから作成
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Admin users can manage all users" ON public.users;

CREATE POLICY "Users can view all profiles" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Admin users can manage all users" ON public.users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- トリガー関数を作成または更新
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 既存のトリガーを削除してから作成
DROP TRIGGER IF EXISTS handle_users_updated_at ON public.users;
CREATE TRIGGER handle_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 管理者ユーザーを挿入または更新（auth.usersに存在するIDのみ）
-- 注意: この処理は管理者ユーザーがauth.usersテーブルに既に存在する場合のみ実行されます
-- まず、auth.usersテーブルで管理者ユーザーを確認してから実行してください

-- 以下のクエリで既存のauth.usersを確認:
-- SELECT id, email FROM auth.users WHERE email IN ('tatsuya.nakano@garoinc.jp', 'suzu.maruko@garoinc.jp');

-- 既存のauth.usersがある場合、手動でIDを指定してusersテーブルに挿入:
-- INSERT INTO public.users (id, email, name, role, is_active) VALUES
--   ('既存のauth.usersのID1', 'tatsuya.nakano@garoinc.jp', 'Tatsuya Nakano', 'admin', true),
--   ('既存のauth.usersのID2', 'suzu.maruko@garoinc.jp', 'Suzu Maruko', 'admin', true)
-- ON CONFLICT (email) DO UPDATE SET
--   role = EXCLUDED.role,
--   is_active = EXCLUDED.is_active,
--   updated_at = NOW();

-- 2. daily_actuals テーブルの確認と更新
-- ========================================

-- daily_actualsテーブルが存在しない場合のみ作成
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

-- RLSを有効化
ALTER TABLE public.daily_actuals ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除してから作成
DROP POLICY IF EXISTS "Users can view their own daily actuals" ON public.daily_actuals;
DROP POLICY IF EXISTS "Users can insert their own daily actuals" ON public.daily_actuals;
DROP POLICY IF EXISTS "Users can update their own daily actuals" ON public.daily_actuals;
DROP POLICY IF EXISTS "Users can delete their own daily actuals" ON public.daily_actuals;

CREATE POLICY "Users can view their own daily actuals" ON public.daily_actuals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily actuals" ON public.daily_actuals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily actuals" ON public.daily_actuals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily actuals" ON public.daily_actuals
  FOR DELETE USING (auth.uid() = user_id);

-- 既存のトリガーを削除してから作成
DROP TRIGGER IF EXISTS handle_daily_actuals_updated_at ON public.daily_actuals;
CREATE TRIGGER handle_daily_actuals_updated_at
  BEFORE UPDATE ON public.daily_actuals
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 3. インデックスの作成（既存の場合はスキップ）
-- ========================================

-- users テーブルのインデックス
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_email') THEN
    CREATE INDEX idx_users_email ON public.users(email);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_role') THEN
    CREATE INDEX idx_users_role ON public.users(role);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_active') THEN
    CREATE INDEX idx_users_active ON public.users(is_active);
  END IF;
END $$;

-- daily_actuals テーブルのインデックス
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_daily_actuals_user_id') THEN
    CREATE INDEX idx_daily_actuals_user_id ON public.daily_actuals(user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_daily_actuals_date') THEN
    CREATE INDEX idx_daily_actuals_date ON public.daily_actuals(date);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_daily_actuals_user_date') THEN
    CREATE INDEX idx_daily_actuals_user_date ON public.daily_actuals(user_id, date);
  END IF;
END $$;

-- 4. 実行結果の確認
-- ========================================
SELECT 'Migration completed successfully!' as message;