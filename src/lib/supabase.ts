import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Supabaseプロジェクト設定（直接設定）
// 注意: これらの値が正しいかSupabaseダッシュボードで再確認してください
const FALLBACK_SUPABASE_URL = 'https://qcddtdhntrskmonjtrxe.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjZGR0ZGhudHJza21vbmp0cnhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzOTI0ODMsImV4cCI6MjA3MVE2ODQ4M30.hPuK_ZC0qA7TJ7Ef0TZ_Lr1sE3qjYelQ69rct1mh4MQ';

// Get environment variables with fallback
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY;

const isClient = typeof window !== 'undefined';

// 本番環境では詳細ログを削除
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 Supabase Debug Info:', {
    url: supabaseUrl,
    hasKey: !!supabaseAnonKey,
    isClient,
    timestamp: new Date().toISOString()
  });
}

// 無料プランでは常に設定値を使用（プレースホルダーは使わない）
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export default supabase;