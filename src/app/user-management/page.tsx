'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuthContext } from '@/lib/auth-context';
import { UserCreationForm } from '@/components/features/user-management/user-creation-form';
import { UserList } from '@/components/features/user-management/user-list';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Shield, UserPlus, Settings, ArrowLeft, Trash2, UserMinus } from 'lucide-react';
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
      <AppLayout>
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
          <div className="space-y-8">
            
            {/* ユーザー作成フォーム */}
            <div className="animate-fade-in">
              <UserCreationForm />
            </div>

            {/* システム統計 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
              <Card className="glass">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">総ユーザー数</p>
                      <p className="text-2xl font-bold">{userListData?.users?.length || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Shield className="h-8 w-8 text-red-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">管理者</p>
                      <p className="text-2xl font-bold">
                        {userListData?.users?.filter(u => u.role === 'admin').length || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Settings className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">マネージャー</p>
                      <p className="text-2xl font-bold">
                        {userListData?.users?.filter(u => u.role === 'manager').length || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">メンバー</p>
                      <p className="text-2xl font-bold">
                        {userListData?.users?.filter(u => u.role === 'member').length || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ユーザー一覧 */}
            <div className="animate-fade-in" style={{ animationDelay: '400ms' }}>
              <UserList 
                users={userListData?.users || []} 
                isLoading={isLoading} 
              />
            </div>

            {/* 重要な注意事項 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in" style={{ animationDelay: '600ms' }}>
              <Alert>
                <UserPlus className="h-4 w-4" />
                <AlertDescription>
                  <strong>ユーザー作成に関する注意:</strong><br />
                  • 生成されたパスワードは一度しか表示されません<br />
                  • ユーザーには安全な方法で認証情報を伝達してください<br />
                  • 初回ログイン後のパスワード変更を推奨します
                </AlertDescription>
              </Alert>
              
              <Alert>
                <Trash2 className="h-4 w-4" />
                <AlertDescription>
                  <strong>ユーザー削除に関する注意:</strong><br />
                  • <UserMinus className="w-3 h-3 inline mx-1" />無効化: アカウントを一時的に無効にします<br />
                  • <Trash2 className="w-3 h-3 inline mx-1" />削除: ユーザーデータを完全に削除します<br />
                  • 削除操作は取り消すことができません
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </main>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}