import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// 無料プラン対応：環境変数が利用できない場合の直接設定
const FALLBACK_SUPABASE_URL = 'https://nykqhkilrhoavelihllqw.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55a3Foa2lscmhvYXZlbGlsbHF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzOGM4NTEsImV4cCI6MjA3MTk1OTg1MX0.lDFxOGnFhq_DyTDfqYr6TBFiOeaKXP5LoMVE1kLXQ1Q';

// Get environment variables with fallback
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY;

const isClient = typeof window !== 'undefined';

// 開発環境でのみデバッグログを表示
if (process.env.NODE_ENV === 'development') {
  console.log('Supabase Config:', {
    url: supabaseUrl.substring(0, 30) + '...',
    hasKey: !!supabaseAnonKey,
    isClient
  });
}

// 無料プランでは常に設定値を使用（プレースホルダーは使わない）
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export default supabase;