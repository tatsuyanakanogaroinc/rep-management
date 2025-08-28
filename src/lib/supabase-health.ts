import { supabase } from './supabase';

export async function testSupabaseConnection(): Promise<{
  success: boolean;
  error?: string;
  url?: string;
}> {
  try {
    // Test if Supabase client can make a simple query
    const { data, error } = await supabase.from('users').select('id').limit(1);
    
    if (error) {
      console.error('Supabase connection test failed:', error);
      return {
        success: false,
        error: error.message,
        url: process.env.NEXT_PUBLIC_SUPABASE_URL
      };
    }

    return {
      success: true,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL
    };
  } catch (error) {
    console.error('Supabase connection test caught error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      url: process.env.NEXT_PUBLIC_SUPABASE_URL
    };
  }
}

export function getSupabaseConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    isConfigured: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  };
}