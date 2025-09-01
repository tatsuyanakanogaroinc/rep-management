'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuthContext } from '@/lib/auth-context';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function UsersSettingsPage() {
  const { userProfile } = useAuthContext();
  
  // 管理者権限チェック
  const isAdmin = userProfile?.role === 'admin';

  if (!isAdmin) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
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
                      システムユーザーの権限管理
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="px-3 py-1">
                  <Users className="w-4 h-4 mr-1" />
                  管理者権限
                </Badge>
              </div>
            </div>
          </div>
        </header>

        {/* メインコンテンツ */}
        <main className="relative z-10 max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <Card className="glass">
            <CardHeader>
              <CardTitle>ユーザー管理機能</CardTitle>
              <CardDescription>
                このページは既存の<Link href="/user-management" className="text-primary underline">ユーザー管理</Link>ページにリダイレクトされます
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <p className="text-muted-foreground">
                  ユーザー管理機能は専用ページで提供されています。
                </p>
                <Link href="/user-management">
                  <Button className="w-full">
                    <Users className="w-4 h-4 mr-2" />
                    ユーザー管理ページへ移動
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}