'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuthContext } from '@/lib/auth-context';
import { AppLayout } from '@/components/layout/app-layout';
import { PageLoading } from '@/components/ui/loading';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboardWithTargets } from '@/hooks/useDashboardWithTargets';
import { ProgressCard } from '@/components/ui/progress-card';
import { AIPredictionsCard } from '@/components/features/ai/ai-predictions-card';
import { MonthlyTrendChart } from '@/components/features/dashboard/monthly-trend-chart';
import { QuickInputWidget } from '@/components/features/dashboard/quick-input-widget';
import { useState } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Target, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const { user, userProfile } = useAuthContext();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return format(now, 'yyyy-MM');
  });

  // 認証されている場合のみデータを取得
  const { data: dashboardData, isLoading, error } = useDashboardWithTargets(selectedMonth, !!user && !!userProfile);

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
      value: isLoading ? '-' : String(dashboardData?.activeCustomers || 0),
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
      value: isLoading ? '-' : String(dashboardData?.newAcquisitions || 0),
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

  // 月次目標の達成状況を計算
  const getTargetStatus = (actual: number, target: number, isInverted: boolean = false) => {
    const percentage = target > 0 ? (actual / target) * 100 : 0;
    if (isInverted) {
      if (percentage <= 100) return { status: 'good', color: 'text-green-600', bgColor: 'bg-green-50' };
      if (percentage <= 120) return { status: 'warning', color: 'text-orange-600', bgColor: 'bg-orange-50' };
      return { status: 'danger', color: 'text-red-600', bgColor: 'bg-red-50' };
    } else {
      if (percentage >= 90) return { status: 'good', color: 'text-green-600', bgColor: 'bg-green-50' };
      if (percentage >= 70) return { status: 'warning', color: 'text-orange-600', bgColor: 'bg-orange-50' };
      return { status: 'danger', color: 'text-red-600', bgColor: 'bg-red-50' };
    }
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="relative min-h-screen overflow-hidden">
          {/* 背景グラデーション */}
          <div className="absolute inset-0 gradient-mesh opacity-10" />
        
        {/* ページヘッダー */}
        <header className="relative z-10 bg-white/80 border-b border-gray-100">
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
              </div>
            </div>
          </div>
        </header>

        {/* メインコンテンツ */}
        <main className="relative z-10 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* データ読み込み中 */}
          {isLoading && (
            <PageLoading message={`${format(new Date(selectedMonth + '-01'), 'yyyy年MM月', { locale: ja })}のデータを取得しています`} />
          )}

          {!isLoading && (
            <div className="space-y-8">
              {/* 当月の実績サマリー */}
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  {format(new Date(selectedMonth + '-01'), 'yyyy年MM月', { locale: ja })}の実績
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {progressMetrics.map((metric) => {
                    const targetStatus = getTargetStatus(metric.actual, metric.target || 0, metric.isInverted);
                    return (
                      <Card key={metric.title} className="relative overflow-hidden">
                        <div className={`absolute top-0 right-0 w-20 h-20 ${targetStatus.bgColor} rounded-bl-full opacity-20`} />
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <span className="text-2xl">{metric.icon}</span>
                            <span className={`text-sm font-medium ${targetStatus.color}`}>
                              {metric.progress}%
                            </span>
                          </div>
                          <CardTitle className="text-sm text-muted-foreground">{metric.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold">{metric.value}</p>
                          <div className="mt-2 space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">目標</span>
                              <span className="font-medium">
                                {metric.unit === 'currency' ? `¥${metric.target?.toLocaleString()}` :
                                 metric.unit === 'percentage' ? `${metric.target}%` : metric.target}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">差異</span>
                              <span className={`font-medium ${metric.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {metric.difference >= 0 ? '+' : ''}{metric.difference}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* 支出状況 */}
              {dashboardData?.monthlyExpensesTarget && (
                <Card className="mb-8">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">月次支出状況</CardTitle>
                      <span className={`text-sm font-medium ${
                        dashboardData.expensesProgress <= 80 ? 'text-green-600' :
                        dashboardData.expensesProgress <= 100 ? 'text-orange-600' : 'text-red-600'
                      }`}>
                        予算の{dashboardData.expensesProgress}%使用
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold">¥{dashboardData.totalExpenses.toLocaleString()}</span>
                      <span className="text-sm text-muted-foreground">/ ¥{dashboardData.monthlyExpensesTarget.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          dashboardData.expensesProgress <= 80 ? 'bg-green-500' :
                          dashboardData.expensesProgress <= 100 ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(100, dashboardData.expensesProgress)}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 月次推移グラフ */}
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  月次推移と計画
                </h2>
                <Card>
                  <CardContent className="p-6">
                    <MonthlyTrendChart currentMonth={selectedMonth} />
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* クイック入力 */}
                <div>
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    クイック入力
                  </h2>
                  <QuickInputWidget currentMonth={selectedMonth} />
                </div>

                {/* AI予測 */}
                <div>
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    AI予測・インサイト
                  </h2>
                  <AIPredictionsCard currentMonth={selectedMonth} />
                </div>
              </div>
            </div>
          )}
        </main>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}