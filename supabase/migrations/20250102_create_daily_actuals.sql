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

-- Create indexes
CREATE INDEX idx_daily_actuals_user_id ON public.daily_actuals(user_id);
CREATE INDEX idx_daily_actuals_date ON public.daily_actuals(date);
CREATE INDEX idx_daily_actuals_user_date ON public.daily_actuals(user_id, date);

-- Enable RLS
ALTER TABLE public.daily_actuals ENABLE ROW LEVEL SECURITY;

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

CREATE TRIGGER handle_daily_actuals_updated_at
  BEFORE UPDATE ON public.daily_actuals
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();