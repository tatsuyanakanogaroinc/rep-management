'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type UserProfile = Database['public']['Tables']['users']['Row'];

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isInitializing = true;
    
    // Get initial session with optimizations
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isInitializing) return;
      
      setUser(session?.user ?? null);
      if (session?.user) {
        // キャッシュから先にプロファイルをチェック
        const cachedProfile = localStorage.getItem(`profile_${session.user.id}`);
        if (cachedProfile) {
          try {
            const profile = JSON.parse(cachedProfile);
            const cacheTime = localStorage.getItem(`profile_${session.user.id}_time`);
            // 5分以内なら キャッシュを使用
            if (cacheTime && (Date.now() - parseInt(cacheTime)) < 5 * 60 * 1000) {
              setUserProfile(profile);
              setLoading(false);
              // バックグラウンドで最新データを取得
              fetchUserProfile(session.user.id, true);
              return;
            }
          } catch (e) {
            // キャッシュが壊れている場合は削除
            localStorage.removeItem(`profile_${session.user.id}`);
            localStorage.removeItem(`profile_${session.user.id}_time`);
          }
        }
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isInitializing) {
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setUserProfile(null);
          setLoading(false);
        }
      }
    });

    return () => {
      isInitializing = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string, isBackground = false) => {
    try {
      // ユーザープロファイルを並列取得し、タイムアウトを設定
      const profilePromise = supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      // 3秒でタイムアウト（高速化）
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timeout')), 3000)
      );

      const { data, error } = await Promise.race([profilePromise, timeoutPromise]);

      if (error) {
        console.error('Error fetching user profile:', error);
        // プロファイルエラーでもログイン状態は有効
        if (!isBackground) {
          setUserProfile(null);
        }
      } else {
        setUserProfile(data);
        
        // キャッシュに保存（成功時のみ）
        try {
          localStorage.setItem(`profile_${userId}`, JSON.stringify(data));
          localStorage.setItem(`profile_${userId}_time`, Date.now().toString());
        } catch (e) {
          console.warn('Failed to cache user profile:', e);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // タイムアウトやエラーでもログイン状態は維持
      if (!isBackground) {
        setUserProfile(null);
      }
    } finally {
      if (!isBackground) {
        setLoading(false);
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setUserProfile(null);
    }
    return { error };
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: new Error('No user logged in') };

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (!error && data) {
      setUserProfile(data);
    }

    return { data, error };
  };

  return {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };
}