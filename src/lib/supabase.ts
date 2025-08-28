import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if we're in build phase (no VERCEL_ENV means local build, CI=true means Vercel build)
const isBuildPhase = process.env.CI === 'true' || process.env.NODE_ENV === 'production';

const finalUrl = supabaseUrl || 'https://placeholder.supabase.co';
const finalKey = supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDcwNDAzMDcsImV4cCI6MTk2MjYxNjMwN30.placeholder';

// Only throw error during runtime if environment variables are missing
if (!supabaseUrl && !isBuildPhase && typeof window !== 'undefined') {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(finalUrl, finalKey);

export default supabase;