'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuthContext } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboardWithTargets } from '@/hooks/useDashboardWithTargets';
import { ProgressCard } from '@/components/ui/progress-card';
import { AIPredictionsCard } from '@/components/features/ai/ai-predictions-card';
import { MonthlyTargetComparison } from '@/components/features/dashboard/monthly-target-comparison';
import { MonthlyTrendChart } from '@/components/features/dashboard/monthly-trend-chart';
import { QuickInputWidget } from '@/components/features/dashboard/quick-input-widget';
import Link from 'next/link';
import { useState } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ja } from 'date-fns/locale';

export default function DashboardPage() {
  const { user, userProfile, signOut } = useAuthContext();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return format(now, 'yyyy-MM');
  });

  // 認証されている場合のみデータを取得
  const { data: dashboardData, isLoading, error } = useDashboardWithTargets(selectedMonth, !!user && !!userProfile);

  const handleSignOut = async () => {
    await signOut();
  };

  // 過去12ヶ月の選択肢を生成
  const generateMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = format(date, 'yyyy-MM');
      const label = format(date, 'yyyy年MM月', { locale: ja });
      options.push({ value, label });
    }
    return options;
  };

  const monthOptions = generateMonthOptions();

  // スプレッドシートベースの目標値との差異を表示
  const progressMetrics = [
    {
      title: 'MRR',
      value: isLoading ? '¥-' : `¥${dashboardData?.mrr?.toLocaleString() || 0}`,
      target: dashboardData?.mrrTarget, // スプレッドシート目標: ¥2,205,000
      actual: dashboardData?.mrr || 0,
      progress: dashboardData?.mrrProgress || 0,
      difference: dashboardData?.mrrDifference || 0,
      change: dashboardData?.mrrChange || '+0%',
      icon: '💰',
      color: 'from-green-500 to-emerald-500',
      unit: 'currency' as const
    },
    {
      title: '有料会員数',
      value: isLoading ? '-' : (dashboardData?.activeCustomers || 0).toString(),
      target: dashboardData?.activeCustomersTarget, // スプレッドシート目標: 450人
      actual: dashboardData?.activeCustomers || 0,
      progress: dashboardData?.activeCustomersProgress || 0,
      difference: dashboardData?.activeCustomersDifference || 0,
      change: dashboardData?.activeCustomersChange || '+0',
      icon: '👥',
      color: 'from-blue-500 to-cyan-500',
      unit: 'count' as const
    },
    {
      title: '新規獲得',
      value: isLoading ? '-' : (dashboardData?.newAcquisitions || 0).toString(),
      target: dashboardData?.newAcquisitionsTarget, // スプレッドシート目標: 150人
      actual: dashboardData?.newAcquisitions || 0,
      progress: dashboardData?.newAcquisitionsProgress || 0,
      difference: dashboardData?.newAcquisitionsDifference || 0,
      icon: '📈',
      color: 'from-purple-500 to-violet-500',
      unit: 'count' as const
    },
    {
      title: 'チャーン率',
      value: isLoading ? '-%' : `${dashboardData?.churnRate || 0}%`,
      target: dashboardData?.churnRateTarget, // スプレッドシート目標: 3.5%
      actual: dashboardData?.churnRate || 0,
      progress: dashboardData?.churnRateProgress || 0,
      difference: dashboardData?.churnRateDifference || 0,
      icon: '📊',
      color: 'from-orange-500 to-red-500',
      unit: 'percentage' as const,
      isInverted: true
    }
  ];

  // よく使う機能を厳選して表示（管理者には追加機能を表示）
  const quickActions = [
    {
      title: '計画vs実績分析',
      description: '目標達成状況の詳細分析',
      icon: '📊',
      href: '/plan-vs-actual',
      color: 'from-blue-500 to-purple-500'
    },
    {
      title: '日報を入力',
      description: '今日の活動を記録',
      icon: '📝',
      href: '/daily-report',
      color: 'from-green-500 to-blue-500'
    },
    {
      title: '月次レポート',
      description: '詳細な月次分析を表示',
      icon: '📈',
      href: '/monthly-report',
      color: 'from-purple-500 to-pink-500'
    },
    {
      title: '計画シミュレーション',
      description: '事業計画と予算配分の最適化',
      icon: '🚀',
      href: '/planning',
      color: 'from-orange-500 to-red-500'
    },
    {
      title: '目標管理',
      description: '月次目標の設定と進捗確認',
      icon: '🎯',
      href: '/targets',
      color: 'from-teal-500 to-green-500'
    },
    ...(userProfile?.role === 'admin' ? [
      {
        title: 'ユーザー管理',
        description: '新規ユーザーの作成と管理',
        icon: '👥',
        href: '/user-management',
        color: 'from-indigo-500 to-purple-500'
      },
      {
        title: '成長パラメータ設定',
        description: '事業成長の基本パラメータ設定',
        icon: '📈',
        href: '/settings/growth-parameters',
        color: 'from-teal-500 to-green-500'
      }
    ] : [])
  ];

  return (
    <ProtectedRoute>
      <div className="relative min-h-screen overflow-hidden">
        {/* 背景グラデーション */}
        <div className="absolute inset-0 gradient-mesh opacity-10" />
        
        {/* ヘッダー */}
        <header className="relative z-10 glass border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="animate-fade-in">
                <h1 className="text-2xl font-bold">
                  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    ダッシュボード
                  </span>
                </h1>
                <p className="text-muted-foreground mt-1">
                  {format(new Date(selectedMonth + '-01'), 'yyyy年MM月', { locale: ja })}のビジネス状況
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-48 glass hover:bg-white/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="glass rounded-xl px-4 py-2 text-right">
                  <p className="text-sm font-medium text-foreground">
                    {userProfile?.name || user?.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {userProfile?.role}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleSignOut}
                  className="glass hover:bg-white/20 transition-all duration-200"
                >
                  ログアウト
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* メインコンテンツ */}
        <main className="relative z-10 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* データ読み込み中またはエラー時の表示 */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="relative mb-4">
                  <div className="w-8 h-8 rounded-full border-2 border-gray-200"></div>
                  <div className="absolute top-0 left-0 w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                </div>
                <p className="text-sm text-muted-foreground">データを読み込んでいます...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-8 p-4 bg-orange-50 border border-orange-200 rounded-xl">
              <div className="flex items-center">
                <div className="text-orange-500 mr-3">⚠️</div>
                <div>
                  <h3 className="font-medium text-orange-800">データの読み込みに問題があります</h3>
                  <p className="text-sm text-orange-600">基本的なデータを表示しています。しばらく待ってから再度お試しください。</p>
                </div>
              </div>
            </div>
          )}

          {/* データが利用可能または読み込み中でも基本レイアウトを表示 */}
          {!isLoading && (
            <>
          {/* メトリクスカード */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {progressMetrics.map((metric, index) => (
              <div 
                key={metric.title}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <ProgressCard
                  title={metric.title}
                  value={metric.value}
                  target={metric.target}
                  actual={metric.actual}
                  progress={metric.progress}
                  difference={metric.difference}
                  change={metric.change}
                  icon={metric.icon}
                  color={metric.color}
                  unit={metric.unit}
                  isInverted={metric.isInverted}
                />
              </div>
            ))}
          </div>

          {/* 支出メトリクス */}
          {dashboardData?.monthlyExpensesTarget && (
            <div className="mb-8">
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    💰 月次支出管理
                  </CardTitle>
                  <CardDescription>
                    予算との比較と支出状況
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ProgressCard
                      title="月次支出"
                      value={`¥${dashboardData.totalExpenses.toLocaleString()}`}
                      target={dashboardData.monthlyExpensesTarget}
                      actual={dashboardData.totalExpenses}
                      progress={dashboardData.expensesProgress}
                      difference={dashboardData.expensesDifference}
                      icon="💸"
                      color="from-red-500 to-pink-500"
                      unit="currency"
                      isInverted={true}
                    />
                    <div className="flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl mb-2">
                          {dashboardData.expensesProgress <= 80 ? '✅' : 
                           dashboardData.expensesProgress <= 100 ? '⚠️' : '🚨'}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {dashboardData.expensesProgress <= 80 ? '予算内で順調' : 
                           dashboardData.expensesProgress <= 100 ? '予算上限に注意' : '予算超過'}
                        </p>
                        <p className="text-lg font-semibold mt-2">
                          予算残り: ¥{Math.max(0, (dashboardData.monthlyExpensesTarget || 0) - dashboardData.totalExpenses).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* クイック入力とチャート */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* クイック入力ウィジェット */}
            <div className="lg:col-span-1 animate-fade-in" style={{ animationDelay: '300ms' }}>
              <QuickInputWidget currentMonth={selectedMonth} />
            </div>
            
            {/* 月次推移グラフ */}
            <div className="lg:col-span-2 animate-fade-in" style={{ animationDelay: '350ms' }}>
              <MonthlyTrendChart currentMonth={selectedMonth} />
            </div>
          </div>

          {/* 月次目標との比較 */}
          <div className="mb-8 animate-fade-in" style={{ animationDelay: '400ms' }}>
            <MonthlyTargetComparison selectedMonth={selectedMonth} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* クイックアクション */}
            <div className="glass rounded-2xl p-6 shadow-soft animate-fade-in" style={{ animationDelay: '500ms' }}>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-foreground mb-2">クイックアクション</h2>
                <p className="text-muted-foreground">よく使う機能にすぐアクセス</p>
              </div>
              <div className="space-y-3">
                {quickActions.map((action, index) => (
                  <Link 
                    key={action.title} 
                    href={action.href}
                    className="block no-underline"
                  >
                    <div className="group p-4 rounded-xl glass hover:bg-white/50 transition-all duration-200 cursor-pointer relative z-10 border border-transparent hover:border-primary/20">
                      <div className="flex items-center space-x-4">
                        <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r ${action.color} text-white text-xl shadow-lg group-hover:scale-105 transition-transform duration-200`}>
                          {action.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                            {action.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {action.description}
                          </p>
                        </div>
                        <div className="ml-auto">
                          <svg className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* AI予測とアラート */}
            <div className="animate-fade-in" style={{ animationDelay: '600ms' }}>
              <AIPredictionsCard currentMonth={selectedMonth} />
            </div>
          </div>
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}