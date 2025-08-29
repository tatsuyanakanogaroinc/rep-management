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
    console.log('useAuth: Initializing...');
    let isInitializing = true;
    let mounted = true;
    
    // 初期化タイムアウト（最大3秒で完了）
    const initTimeout = setTimeout(() => {
      if (mounted && isInitializing) {
        console.log('useAuth: Init timeout, setting loading to false');
        setLoading(false);
        isInitializing = false;
      }
    }, 3000);
    
    // Get initial session with optimizations
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('useAuth: Initial session check', { session: !!session });
      if (!isInitializing || !mounted) return;
      
      setUser(session?.user ?? null);
      if (session?.user) {
        console.log('useAuth: User found, fetching profile...');
        // キャッシュチェックを簡略化
        try {
          const cachedProfile = localStorage.getItem(`profile_${session.user.id}`);
          if (cachedProfile) {
            const profile = JSON.parse(cachedProfile);
            const cacheTime = localStorage.getItem(`profile_${session.user.id}_time`);
            // 2分以内ならキャッシュを使用（短縮）
            if (cacheTime && (Date.now() - parseInt(cacheTime)) < 2 * 60 * 1000) {
              console.log('useAuth: Using cached profile');
              setUserProfile(profile);
              setLoading(false);
              clearTimeout(initTimeout);
              return;
            }
          }
        } catch (e) {
          console.warn('useAuth: Cache error, ignoring cache', e);
        }
        fetchUserProfile(session.user.id);
        clearTimeout(initTimeout);
      } else {
        console.log('useAuth: No user, setting loading to false');
        setLoading(false);
        clearTimeout(initTimeout);
      }
    }).catch(error => {
      console.error('useAuth: Error getting initial session', error);
      setLoading(false);
      clearTimeout(initTimeout);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('useAuth: Auth state changed', { event, session: !!session });
      if (!mounted) return;
      
      setUser(session?.user ?? null);
      
      if (session?.user) {
        console.log('useAuth: Auth change - fetching profile');
        await fetchUserProfile(session.user.id);
      } else {
        console.log('useAuth: Auth change - no user');
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      console.log('useAuth: Cleanup');
      isInitializing = false;
      mounted = false;
      clearTimeout(initTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string, isBackground = false) => {
    console.log(`useAuth: fetchUserProfile start`, { userId, isBackground });
    
    try {
      // より短いタイムアウト（1.5秒）でフェッチを試行
      const profilePromise = supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timeout')), 1500)
      );

      const { data, error } = await Promise.race([profilePromise, timeoutPromise]);

      if (error) {
        console.warn('useAuth: Profile fetch failed, using fallback:', error.message);
        // エラー時は常にフォールバックプロファイルを使用
        const fallbackProfile = {
          id: userId,
          email: '',
          name: 'User',
          role: 'member' as const,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setUserProfile(fallbackProfile);
      } else {
        console.log('useAuth: Profile fetched successfully');
        setUserProfile(data);
        
        // キャッシュに保存（成功時のみ）
        try {
          localStorage.setItem(`profile_${userId}`, JSON.stringify(data));
          localStorage.setItem(`profile_${userId}_time`, Date.now().toString());
        } catch (e) {
          console.warn('useAuth: Failed to cache user profile:', e);
        }
      }
    } catch (error) {
      console.warn('useAuth: Profile fetch exception, using fallback:', error);
      
      // 例外時も必ずフォールバックプロファイルを設定
      const fallbackProfile = {
        id: userId,
        email: '',
        name: 'User',
        role: 'member' as const,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setUserProfile(fallbackProfile);
    } finally {
      // バックグラウンド処理でない限り、必ずloadingをfalseに設定
      if (!isBackground) {
        console.log('useAuth: Setting loading to false');
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