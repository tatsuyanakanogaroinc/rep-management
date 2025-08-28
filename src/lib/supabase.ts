import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Supabaseプロジェクト設定（直接設定）
// 注意: これらの値が正しいかSupabaseダッシュボードで再確認してください
const FALLBACK_SUPABASE_URL = 'https://nykqhkilrhoavelillqw.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55a3Foa2lscmhvYXZlbGlsbHF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzODM4NTEsImV4cCI6MjA3MVE1OTg1MX0.lDFxOGnFhq_DyTDfqYr6TBFiOeaKXP5LoMVE1kLXQ1Q';

// Get environment variables with fallback
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY;

const isClient = typeof window !== 'undefined';

// デバッグ情報を常に表示（問題解決まで）
console.log('🔍 Supabase Debug Info:', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey,
  keyPrefix: supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'MISSING',
  keySuffix: supabaseAnonKey ? '...' + supabaseAnonKey.substring(supabaseAnonKey.length - 20) : 'MISSING',
  isClient,
  timestamp: new Date().toISOString()
});

//詳細なAPI接続テスト
if (typeof window !== 'undefined') {
  // REST API テスト
  fetch(supabaseUrl + '/rest/v1/', {
    method: 'GET',
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json'
    }
  }).then(response => {
    console.log('🔗 Supabase REST API Test:', {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText,
      url: supabaseUrl + '/rest/v1/'
    });
    return response.text();
  }).then(text => {
    console.log('📄 REST API Response:', text);
  }).catch(error => {
    console.error('❌ Supabase REST API Test Failed:', {
      error: error.message,
      url: supabaseUrl + '/rest/v1/'
    });
  });

  // Auth API テスト
  fetch(supabaseUrl + '/auth/v1/', {
    method: 'GET',
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json'
    }
  }).then(response => {
    console.log('🔐 Supabase Auth API Test:', {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText,
      url: supabaseUrl + '/auth/v1/'
    });
  }).catch(error => {
    console.error('❌ Supabase Auth API Test Failed:', {
      error: error.message,
      url: supabaseUrl + '/auth/v1/'
    });
  });
}

// 無料プランでは常に設定値を使用（プレースホルダーは使わない）
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export default supabase;