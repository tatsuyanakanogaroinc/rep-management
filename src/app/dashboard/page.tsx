'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuthContext } from '@/lib/auth-context';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import Link from 'next/link';
import { 
  Calculator, 
  Target, 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign,
  Calendar,
  ArrowRight,
  Activity,
  Brain
} from 'lucide-react';
import { useMonthlyPlanning } from '@/hooks/useMonthlyPlanning';

export default function DashboardPage() {
  const { userProfile } = useAuthContext();
  const { getPlanForMonth } = useMonthlyPlanning();
  
  const currentDate = new Date();
  const currentMonth = format(currentDate, 'yyyy-MM');
  const currentMonthLabel = format(currentDate, 'yyyy年MM月', { locale: ja });
  
  // 現在月の計画データを取得
  const currentPlan = getPlanForMonth(currentMonth);

  const quickActions = [
    {
      title: '月次計画',
      description: '成長パラメータとシミュレーション',
      href: '/monthly-planning',
      icon: <Calculator className="w-6 h-6" />,
      color: 'from-blue-500 to-blue-600',
      badge: 'New'
    },
    {
      title: 'AI分析',
      description: '総合分析と改善提案',
      href: '/ai-analysis',
      icon: <Brain className="w-6 h-6" />,
      color: 'from-purple-500 to-purple-600',
      badge: 'New'
    },
    {
      title: '日次分析',
      description: '日次目標管理と実績追跡',
      href: '/daily-analysis',
      icon: <Calendar className="w-6 h-6" />,
      color: 'from-green-500 to-green-600',
      badge: 'New'
    },
    {
      title: '予実管理',
      description: '計画と実績の比較分析',
      href: '/plan-vs-actual',
      icon: <Target className="w-6 h-6" />,
      color: 'from-orange-500 to-orange-600'
    }
  ];

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
                    <Activity className="w-8 h-8 text-primary" />
                    <div>
                      <h1 className="text-3xl font-bold">
                        <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                          ダッシュボード
                        </span>
                      </h1>
                      <p className="text-muted-foreground mt-1">
                        SNS管理システム - {currentMonthLabel}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">ようこそ</p>
                  <p className="font-semibold">{userProfile?.name || 'ユーザー'}さん</p>
                </div>
              </div>
            </div>
          </header>

          {/* メインコンテンツ */}
          <main className="relative z-10 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            {/* 当月サマリー */}
            {currentPlan && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">{currentMonthLabel} 計画概要</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="glass">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="w-8 h-8 text-green-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">新規獲得目標</p>
                          <p className="text-2xl font-bold text-green-600">
                            {currentPlan.newAcquisitions}人
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <Users className="w-8 h-8 text-blue-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">総顧客数予測</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {currentPlan.totalCustomers}人
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-8 h-8 text-purple-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">MRR目標</p>
                          <p className="text-2xl font-bold text-purple-600">
                            ¥{currentPlan.mrr.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <Target className="w-8 h-8 text-orange-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">予想利益</p>
                          <p className={`text-2xl font-bold ${currentPlan.profit >= 0 ? 'text-orange-600' : 'text-red-600'}`}>
                            ¥{currentPlan.profit.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* クイックアクション */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">主要機能</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {quickActions.map((action, index) => (
                  <Link key={index} href={action.href}>
                    <Card className="glass hover:scale-105 transition-all duration-200 cursor-pointer h-full">
                      <CardContent className="p-6">
                        <div className="flex flex-col items-center text-center space-y-4">
                          <div className={`p-4 rounded-full bg-gradient-to-r ${action.color} text-white shadow-lg`}>
                            {action.icon}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 justify-center">
                              <h3 className="font-semibold text-lg">{action.title}</h3>
                              {action.badge && (
                                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                                  {action.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                              {action.description}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>

            {/* 最近のアクティビティ */}
            <div>
              <h2 className="text-xl font-semibold mb-4">システム状況</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      今月の状況
                    </CardTitle>
                    <CardDescription>
                      {currentMonthLabel}の進捗状況
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {currentPlan ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">計画策定</span>
                          <span className="text-green-600 font-medium">完了</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">目標設定</span>
                          <span className="text-green-600 font-medium">設定済み</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">実績入力</span>
                          <span className="text-orange-600 font-medium">進行中</span>
                        </div>
                        <div className="mt-4 pt-4 border-t">
                          <Link href="/plan-vs-actual">
                            <Button className="w-full">
                              実績を入力する
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground mb-4">月次計画が未設定です</p>
                        <Link href="/monthly-planning">
                          <Button>
                            計画を作成する
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      システム機能
                    </CardTitle>
                    <CardDescription>
                      利用可能な分析・管理機能
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">月次計画シミュレーション</span>
                        <span className="text-green-600 text-sm font-medium">稼働中</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">予実管理システム</span>
                        <span className="text-green-600 text-sm font-medium">稼働中</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">コホート分析</span>
                        <span className="text-green-600 text-sm font-medium">稼働中</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">月次レポート生成</span>
                        <span className="text-green-600 text-sm font-medium">稼働中</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">日次分析</span>
                        <span className="text-green-600 text-sm font-medium">稼働中</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">AI分析システム</span>
                        <span className="text-green-600 text-sm font-medium">稼働中</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}