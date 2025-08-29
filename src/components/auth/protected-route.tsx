'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/lib/auth-context';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'member' | 'manager' | 'admin';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, userProfile, loading } = useAuthContext();
  const router = useRouter();
  const [forceReady, setForceReady] = useState(false);

  // 強制的にローディングを終了するタイマー
  useEffect(() => {
    const forceTimeout = setTimeout(() => {
      if (loading) {
        console.log('ProtectedRoute: Force timeout after 4 seconds, ending loading');
        setForceReady(true);
      }
    }, 4000);
    
    return () => clearTimeout(forceTimeout);
  }, [loading]);

  useEffect(() => {
    console.log('ProtectedRoute: State check', { loading, user: !!user, userProfile: !!userProfile, requiredRole, forceReady });
    
    const isReady = !loading || forceReady;
    
    if (isReady) {
      if (!user) {
        console.log('ProtectedRoute: No user, redirecting to login');
        router.push('/login');
        return;
      }

      // プロファイルの必要性をチェック
      if (requiredRole && user && !userProfile) {
        console.log('ProtectedRoute: Required role but no profile, continuing with basic access');
        // 基本的なアクセスは許可し、ロール制限のみ後で適用
      }

      if (requiredRole && userProfile?.role) {
        console.log('ProtectedRoute: Checking role', { userRole: userProfile.role, requiredRole });
        const roleHierarchy = { member: 1, manager: 2, admin: 3 };
        const userRoleLevel = roleHierarchy[userProfile.role];
        const requiredRoleLevel = roleHierarchy[requiredRole];

        if (userRoleLevel < requiredRoleLevel) {
          console.log('ProtectedRoute: Insufficient role, redirecting to dashboard');
          router.push('/dashboard');
          return;
        }
      }
    }
  }, [user, userProfile, loading, requiredRole, router, forceReady]);

  // ローディング中の場合のみ表示（最適化されたローダー）
  if (loading && !forceReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-gray-200"></div>
            <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">
            {forceReady ? '準備中です...' : 'システムを読み込んでいます...'}
          </p>
          <div className="mt-2 flex justify-center space-x-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requiredRole && userProfile?.role) {
    const roleHierarchy = { member: 1, manager: 2, admin: 3 };
    const userRoleLevel = roleHierarchy[userProfile.role];
    const requiredRoleLevel = roleHierarchy[requiredRole];

    if (userRoleLevel < requiredRoleLevel) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-red-600">このページにアクセスする権限がありません。</p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}