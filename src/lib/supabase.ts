import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// During build time, provide placeholder values to avoid errors
const isDuringBuild = process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV;

const finalUrl = supabaseUrl || (isDuringBuild ? 'https://placeholder.supabase.co' : '');
const finalKey = supabaseAnonKey || (isDuringBuild ? 'placeholder-key' : '');

if (!finalUrl || !finalKey) {
  if (!isDuringBuild) {
    throw new Error('Missing Supabase environment variables');
  }
}

export const supabase = createClient<Database>(finalUrl, finalKey);

export default supabase;