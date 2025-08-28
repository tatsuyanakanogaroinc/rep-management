'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuthContext } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboardWithTargets } from '@/hooks/useDashboardWithTargets';
import { ProgressCard } from '@/components/ui/progress-card';
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
  const { data: dashboardData, isLoading } = useDashboardWithTargets(selectedMonth, !!user);

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

  const progressMetrics = [
    {
      title: 'MRR',
      value: isLoading ? '¥-' : `¥${dashboardData?.mrr?.toLocaleString() || 0}`,
      target: dashboardData?.mrrTarget,
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
      target: dashboardData?.activeCustomersTarget,
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
      target: dashboardData?.newAcquisitionsTarget,
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
      target: dashboardData?.churnRateTarget,
      actual: dashboardData?.churnRate || 0,
      progress: dashboardData?.churnRateProgress || 0,
      difference: dashboardData?.churnRateDifference || 0,
      icon: '📊',
      color: 'from-orange-500 to-red-500',
      unit: 'percentage' as const,
      isInverted: true
    }
  ];

  const quickActions = [
    {
      title: '日報を入力',
      description: '今日の活動を記録',
      icon: '📝',
      href: '/daily-report',
      color: 'from-blue-500 to-purple-500'
    },
    {
      title: '月次レポート',
      description: '詳細な月次分析を表示',
      icon: '📊',
      href: '/monthly-report',
      color: 'from-green-500 to-blue-500'
    },
    {
      title: '顧客を追加',
      description: '新しい顧客情報を登録',
      icon: '👥',
      href: '/customers',
      color: 'from-purple-500 to-pink-500'
    },
    {
      title: '支出を登録',
      description: '経費・支出を記録',
      icon: '💰',
      href: '/expenses',
      color: 'from-pink-500 to-orange-500'
    },
    {
      title: 'KPI目標管理',
      description: '月次目標の設定と進捗確認',
      icon: '🎯',
      href: '/targets',
      color: 'from-orange-500 to-red-500'
    }
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* クイックアクション */}
            <div className="glass rounded-2xl p-6 shadow-soft animate-fade-in" style={{ animationDelay: '400ms' }}>
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
              
              {/* 代替ボタンも追加 */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 gap-2">
                  {quickActions.map((action) => (
                    <Link key={`btn-${action.title}`} href={action.href}>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start bg-white/80 hover:bg-white/90"
                      >
                        <span className="mr-3">{action.icon}</span>
                        {action.title}
                      </Button>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* 最新の活動 */}
            <div className="glass rounded-2xl p-6 shadow-soft animate-fade-in" style={{ animationDelay: '500ms' }}>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-foreground mb-2">最新の活動</h2>
                <p className="text-muted-foreground">システムの最新の更新情報</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-start space-x-4 p-4 rounded-xl glass">
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mt-2 shadow-glow"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">システムが初期化されました</p>
                    <p className="text-xs text-muted-foreground mt-1">今すぐ</p>
                  </div>
                </div>
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto rounded-full glass flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-muted-foreground">データの入力を開始して、<br />活動履歴を確認しましょう</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}