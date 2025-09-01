-- 定期支出テーブルの作成
CREATE TABLE IF NOT EXISTS public.recurring_expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    description TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    category TEXT NOT NULL,
    day_of_month INTEGER NOT NULL CHECK (day_of_month >= 1 AND day_of_month <= 28),
    is_active BOOLEAN DEFAULT true,
    last_processed_month TEXT, -- YYYY-MM形式で最後に処理した月を記録
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_is_active ON public.recurring_expenses(is_active);
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_day_of_month ON public.recurring_expenses(day_of_month);

-- RLSポリシーの設定
ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;

-- 認証されたユーザーは閲覧可能
CREATE POLICY "Users can view recurring expenses" 
ON public.recurring_expenses
FOR SELECT 
TO authenticated
USING (true);

-- 管理者とマネージャーは全操作可能
CREATE POLICY "Admins and managers can manage recurring expenses" 
ON public.recurring_expenses
FOR ALL 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'manager')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'manager')
    )
);

-- 更新時のタイムスタンプ自動更新
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_recurring_expenses_updated_at 
BEFORE UPDATE ON public.recurring_expenses 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- サンプルデータの挿入（必要に応じて）
/*
INSERT INTO public.recurring_expenses (description, amount, category, day_of_month) VALUES
    ('AWS/サーバー費用', 50000, 'infrastructure', 1),
    ('Google Workspace', 1500, 'tools', 1),
    ('Slack', 3000, 'tools', 1),
    ('Adobe Creative Cloud', 6000, 'tools', 10),
    ('オフィス賃料', 150000, 'office', 25);
*/