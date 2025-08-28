import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if we're in build phase
const isBuildPhase = process.env.CI === 'true' || process.env.VERCEL_ENV === 'preview' || process.env.VERCEL_ENV === 'production';
const isClient = typeof window !== 'undefined';

if (process.env.NODE_ENV === 'development') {
  console.log('Supabase config:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    isBuildPhase,
    isClient,
    url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'undefined'
  });
}

// Use placeholder values during build phase
const finalUrl = supabaseUrl || 'https://placeholder.supabase.co';
const finalKey = supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDcwNDAzMDcsImV4cCI6MTk2MjYxNjMwN30.placeholder';

// Validate environment variables in client runtime
if (isClient && !isBuildPhase) {
  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    console.error('Supabase URL is missing or using placeholder value');
    throw new Error('Supabase configuration error: Missing or invalid NEXT_PUBLIC_SUPABASE_URL');
  }
  if (!supabaseAnonKey || supabaseAnonKey.includes('placeholder')) {
    console.error('Supabase Anon Key is missing or using placeholder value');
    throw new Error('Supabase configuration error: Missing or invalid NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
}

export const supabase = createClient<Database>(finalUrl, finalKey);

export default supabase;