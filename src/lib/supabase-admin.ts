import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// サーバーサイド専用の管理者クライアント
function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined');
  }

  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined');
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// サーバーサイドでのみ使用可能
let supabaseAdmin: ReturnType<typeof createSupabaseAdmin> | null = null;

export function getSupabaseAdmin() {
  // クライアントサイドでの使用を防ぐ
  if (typeof window !== 'undefined') {
    throw new Error('Supabase admin client can only be used on the server side');
  }

  if (!supabaseAdmin) {
    supabaseAdmin = createSupabaseAdmin();
  }

  return supabaseAdmin;
}