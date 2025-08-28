import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if we're in build phase (server-side during build)
const isBuildPhase = typeof window === 'undefined' && (
  process.env.CI === 'true' || 
  process.env.NODE_ENV === 'production' ||
  process.env.VERCEL_ENV === 'preview' ||
  process.env.VERCEL_ENV === 'production'
);

const isClient = typeof window !== 'undefined';

// Debug logging for development
console.log('Supabase Environment Debug:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  isBuildPhase,
  isClient,
  NODE_ENV: process.env.NODE_ENV,
  VERCEL_ENV: process.env.VERCEL_ENV,
  url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING',
  key: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'MISSING'
});

// For build phase, use placeholder values to prevent build errors
let finalUrl = supabaseUrl;
let finalKey = supabaseAnonKey;

if (isBuildPhase && (!supabaseUrl || !supabaseAnonKey)) {
  console.warn('Using placeholder values during build phase');
  finalUrl = 'https://placeholder.supabase.co';
  finalKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDcwNDAzMDcsImV4cCI6MTk2MjYxNjMwN30.placeholder';
} else if (isClient) {
  // Validate environment variables on client side
  if (!supabaseUrl) {
    console.error('NEXT_PUBLIC_SUPABASE_URL is not defined');
    throw new Error('環境変数 NEXT_PUBLIC_SUPABASE_URL が設定されていません。Vercelダッシュボードで設定してください。');
  }
  if (!supabaseAnonKey) {
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined');
    throw new Error('環境変数 NEXT_PUBLIC_SUPABASE_ANON_KEY が設定されていません。Vercelダッシュボードで設定してください。');
  }
  if (supabaseUrl.includes('placeholder')) {
    console.error('Supabase URL is still using placeholder value');
    throw new Error('環境変数が正しく設定されていません。Vercelで再デプロイしてください。');
  }
}

export const supabase = createClient<Database>(finalUrl!, finalKey!);

export default supabase;