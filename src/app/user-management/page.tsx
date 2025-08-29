'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuthContext } from '@/lib/auth-context';
import { UserCreationForm } from '@/components/features/user-management/user-creation-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Shield, UserPlus, Settings, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getUserList } from '@/lib/user-management';
import { useQuery } from '@tanstack/react-query';

export default function UserManagementPage() {
  const { userProfile } = useAuthContext();
  
  // 管理者権限チェック
  const isAdmin = userProfile?.role === 'admin';

  // ユーザーリスト取得
  const { data: userListData, isLoading } = useQuery({
    queryKey: ['user-list'],
    queryFn: getUserList,
    enabled: isAdmin
  });

  if (!isAdmin) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <Shield className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h1 className="text-xl font-semibold mb-2">アクセス権限がありません</h1>
              <p className="text-muted-foreground mb-6">
                この機能は管理者のみがアクセスできます。
              </p>
              <Link href="/dashboard">
                <Button>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  ダッシュボードに戻る
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-10" />
        
        {/* ヘッダー */}
        <header className="relative z-10 glass border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="animate-fade-in">
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-primary" />
                  <div>
                    <h1 className="text-2xl font-bold">
                      <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        ユーザー管理
                      </span>
                    </h1>
                    <p className="text-muted-foreground mt-1">
                      新規ユーザーの作成と管理
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="px-3 py-1">
                  <Shield className="w-4 h-4 mr-1" />
                  管理者権限
                </Badge>
                <Link href="/dashboard">
                  <Button variant="outline" className="glass hover:bg-white/20">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    ダッシュボードに戻る
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* メインコンテンツ */}
        <main className="relative z-10 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* 左側: ユーザー作成フォーム */}
            <div className="lg:col-span-2">
              <div className="animate-fade-in">
                <UserCreationForm />
              </div>
            </div>

            {/* 右側: 既存ユーザー一覧と統計 */}
            <div className="space-y-6">
              {/* 統計情報 */}
              <Card className="glass animate-fade-in" style={{ animationDelay: '200ms' }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    システム統計
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">総ユーザー数</span>
                        <span className="font-semibold">{userListData?.users?.length || 0}人</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">管理者</span>
                        <span className="font-semibold">
                          {userListData?.users?.filter(u => u.role === 'admin').length || 0}人
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">マネージャー</span>
                        <span className="font-semibold">
                          {userListData?.users?.filter(u => u.role === 'manager').length || 0}人
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">メンバー</span>
                        <span className="font-semibold">
                          {userListData?.users?.filter(u => u.role === 'member').length || 0}人
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 既存ユーザー一覧 */}
              <Card className="glass animate-fade-in" style={{ animationDelay: '400ms' }}>
                <CardHeader>
                  <CardTitle>最近のユーザー</CardTitle>
                  <CardDescription>直近5人の登録ユーザー</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                            <div className="flex-1">
                              <div className="h-4 bg-gray-200 rounded mb-1"></div>
                              <div className="h-3 bg-gray-200 rounded w-20"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : userListData?.users && userListData.users.length > 0 ? (
                    <div className="space-y-3">
                      {userListData.users.slice(0, 5).map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-white/50">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white text-sm font-semibold">
                              {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{user.name || user.email.split('@')[0]}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                          <Badge 
                            variant={user.role === 'admin' ? 'default' : 'outline'}
                            className="text-xs"
                          >
                            {user.role === 'admin' ? '管理者' : 
                             user.role === 'manager' ? 'マネージャー' : 'メンバー'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-6">
                      ユーザーが見つかりません
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* 重要な注意事項 */}
              <Alert className="animate-fade-in" style={{ animationDelay: '600ms' }}>
                <UserPlus className="h-4 w-4" />
                <AlertDescription>
                  <strong>セキュリティに関する注意:</strong><br />
                  • 生成されたパスワードは一度しか表示されません<br />
                  • ユーザーには安全な方法で認証情報を伝達してください<br />
                  • 初回ログイン後のパスワード変更を推奨します
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}