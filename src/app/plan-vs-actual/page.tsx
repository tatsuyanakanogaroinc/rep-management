'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuthContext } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, TrendingUp, TrendingDown, Target, BarChart3, AlertCircle, CheckCircle, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { format, subMonths } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useDashboardWithTargets } from '@/hooks/useDashboardWithTargets';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area } from 'recharts';

export default function PlanVsActualPage() {
  const { userProfile } = useAuthContext();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return format(now, 'yyyy-MM');
  });
  
  // 複数月のデータを取得
  const currentMonthData = useDashboardWithTargets(selectedMonth);
  const lastMonthData = useDashboardWithTargets(format(subMonths(new Date(selectedMonth + '-01'), 1), 'yyyy-MM'));
  const twoMonthsAgoData = useDashboardWithTargets(format(subMonths(new Date(selectedMonth + '-01'), 2), 'yyyy-MM'));

  // 月次オプション生成
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

  // 比較データの準備
  const comparisonData = [
    {
      metric: 'MRR',
      icon: '💰',
      planned: currentMonthData.data?.mrrTarget || 0,
      actual: currentMonthData.data?.mrr || 0,
      achievement: currentMonthData.data?.mrrProgress || 0,
      difference: currentMonthData.data?.mrrDifference || 0,
      unit: '円',
      format: (v: number) => `¥${v.toLocaleString()}`
    },
    {
      metric: 'アクティブ顧客数',
      icon: '👥',
      planned: currentMonthData.data?.activeCustomersTarget || 0,
      actual: currentMonthData.data?.activeCustomers || 0,
      achievement: currentMonthData.data?.activeCustomersProgress || 0,
      difference: currentMonthData.data?.activeCustomersDifference || 0,
      unit: '人',
      format: (v: number) => `${v.toLocaleString()}人`
    },
    {
      metric: '新規獲得',
      icon: '📈',
      planned: currentMonthData.data?.newAcquisitionsTarget || 0,
      actual: currentMonthData.data?.newAcquisitions || 0,
      achievement: currentMonthData.data?.newAcquisitionsProgress || 0,
      difference: currentMonthData.data?.newAcquisitionsDifference || 0,
      unit: '人',
      format: (v: number) => `${v.toLocaleString()}人`
    },
    {
      metric: 'チャーン率',
      icon: '📉',
      planned: currentMonthData.data?.churnRateTarget || 0,
      actual: currentMonthData.data?.churnRate || 0,
      achievement: currentMonthData.data?.churnRateProgress || 0,
      difference: currentMonthData.data?.churnRateDifference || 0,
      unit: '%',
      format: (v: number) => `${v}%`,
      isInverted: true
    },
    {
      metric: '月次支出',
      icon: '💸',
      planned: currentMonthData.data?.monthlyExpensesTarget || 0,
      actual: currentMonthData.data?.totalExpenses || 0,
      achievement: currentMonthData.data?.expensesProgress || 0,
      difference: currentMonthData.data?.expensesDifference || 0,
      unit: '円',
      format: (v: number) => `¥${v.toLocaleString()}`,
      isInverted: true
    }
  ];

  // トレンドデータの準備（過去3ヶ月）
  const trendData = [
    {
      month: format(subMonths(new Date(selectedMonth + '-01'), 2), 'MM月'),
      mrr: twoMonthsAgoData.data?.mrr || 0,
      mrrTarget: twoMonthsAgoData.data?.mrrTarget || 0,
      customers: twoMonthsAgoData.data?.activeCustomers || 0,
      customersTarget: twoMonthsAgoData.data?.activeCustomersTarget || 0,
    },
    {
      month: format(subMonths(new Date(selectedMonth + '-01'), 1), 'MM月'),
      mrr: lastMonthData.data?.mrr || 0,
      mrrTarget: lastMonthData.data?.mrrTarget || 0,
      customers: lastMonthData.data?.activeCustomers || 0,
      customersTarget: lastMonthData.data?.activeCustomersTarget || 0,
    },
    {
      month: format(new Date(selectedMonth + '-01'), 'MM月'),
      mrr: currentMonthData.data?.mrr || 0,
      mrrTarget: currentMonthData.data?.mrrTarget || 0,
      customers: currentMonthData.data?.activeCustomers || 0,
      customersTarget: currentMonthData.data?.activeCustomersTarget || 0,
    }
  ];

  // 達成度による色分け
  const getAchievementColor = (achievement: number, isInverted?: boolean) => {
    if (isInverted) {
      if (achievement <= 80) return 'text-green-600 bg-green-50';
      if (achievement <= 100) return 'text-yellow-600 bg-yellow-50';
      return 'text-red-600 bg-red-50';
    }
    
    if (achievement >= 100) return 'text-green-600 bg-green-50';
    if (achievement >= 80) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getProgressColor = (achievement: number, isInverted?: boolean) => {
    if (isInverted) {
      if (achievement <= 80) return 'bg-green-500';
      if (achievement <= 100) return 'bg-yellow-500';
      return 'bg-red-500';
    }
    
    if (achievement >= 100) return 'bg-green-500';
    if (achievement >= 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (currentMonthData.isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">データを読み込み中...</p>
          </div>
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
                  <BarChart3 className="w-8 h-8 text-primary" />
                  <div>
                    <h1 className="text-2xl font-bold">
                      <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        計画vs実績分析
                      </span>
                    </h1>
                    <p className="text-muted-foreground mt-1">
                      目標達成状況の詳細分析
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
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
          {/* サマリーカード */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="glass">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  全体達成率
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {Math.round(
                    (currentMonthData.data?.mrrProgress || 0) * 0.4 +
                    (currentMonthData.data?.activeCustomersProgress || 0) * 0.3 +
                    (currentMonthData.data?.newAcquisitionsProgress || 0) * 0.3
                  )}%
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  主要KPIの加重平均
                </p>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  目標超過項目
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {comparisonData.filter(d => d.achievement >= 100).length}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  / {comparisonData.length} 項目中
                </p>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  要改善項目
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {comparisonData.filter(d => d.achievement < 80).length}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  80%未満の項目
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 詳細比較テーブル */}
          <Card className="glass mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                計画vs実績 詳細比較
              </CardTitle>
              <CardDescription>
                {format(new Date(selectedMonth + '-01'), 'yyyy年MM月', { locale: ja })}の目標達成状況
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {comparisonData.map((item) => (
                  <div key={item.metric} className="border-b pb-6 last:border-0">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{item.icon}</span>
                        <h3 className="font-semibold text-lg">{item.metric}</h3>
                      </div>
                      <Badge className={getAchievementColor(item.achievement, item.isInverted)}>
                        達成率: {item.achievement}%
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div>
                        <p className="text-sm text-muted-foreground">計画</p>
                        <p className="text-xl font-semibold">{item.format(item.planned)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">実績</p>
                        <p className="text-xl font-semibold">{item.format(item.actual)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">差分</p>
                        <p className={`text-xl font-semibold ${item.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.difference >= 0 ? '+' : ''}{item.format(Math.abs(item.difference))}
                        </p>
                      </div>
                    </div>
                    
                    <div className="w-full">
                      <Progress 
                        value={Math.min(100, item.achievement)} 
                        className="h-3"
                        indicatorClassName={getProgressColor(item.achievement, item.isInverted)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* トレンドグラフ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  MRR推移
                </CardTitle>
                <CardDescription>
                  過去3ヶ月の計画vs実績
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(v) => `¥${(v / 1000000).toFixed(1)}M`} />
                      <Tooltip formatter={(v: number) => `¥${v.toLocaleString()}`} />
                      <Legend />
                      <Bar dataKey="mrr" name="実績" fill="#10b981" />
                      <Line 
                        type="monotone" 
                        dataKey="mrrTarget" 
                        name="目標" 
                        stroke="#3b82f6" 
                        strokeDasharray="5 5"
                        strokeWidth={2}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  顧客数推移
                </CardTitle>
                <CardDescription>
                  過去3ヶ月の計画vs実績
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(v: number) => `${v}人`} />
                      <Legend />
                      <Bar dataKey="customers" name="実績" fill="#8b5cf6" />
                      <Line 
                        type="monotone" 
                        dataKey="customersTarget" 
                        name="目標" 
                        stroke="#ec4899" 
                        strokeDasharray="5 5"
                        strokeWidth={2}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 改善提案 */}
          <Card className="glass mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                改善提案
              </CardTitle>
              <CardDescription>
                目標未達項目への対策案
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {comparisonData
                  .filter(item => item.achievement < 100)
                  .map((item) => (
                    <div key={item.metric} className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">{item.metric}の改善</h4>
                        <p className="text-sm text-muted-foreground">
                          {item.metric === 'MRR' && '価格戦略の見直しやアップセルの強化を検討してください。'}
                          {item.metric === 'アクティブ顧客数' && 'リテンション施策の強化と新規獲得チャネルの拡大が必要です。'}
                          {item.metric === '新規獲得' && 'マーケティング施策の見直しとコンバージョン率の改善に注力しましょう。'}
                          {item.metric === 'チャーン率' && '顧客満足度調査を実施し、離脱要因を特定して対策を講じてください。'}
                          {item.metric === '月次支出' && 'コスト構造の見直しと効率化により、予算内での運営を目指しましょう。'}
                        </p>
                      </div>
                    </div>
                  ))}
                
                {comparisonData.filter(item => item.achievement < 100).length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <p className="text-lg font-medium">すべての目標を達成しています！</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      この調子で次月も頑張りましょう。
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
}