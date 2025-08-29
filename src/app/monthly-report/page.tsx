'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useState } from 'react';
import Link from 'next/link';
import { FileText, Download, TrendingUp, TrendingDown, Users, DollarSign, Target, Calendar, BarChart3, PieChart } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/lib/auth-context';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useDashboardWithTargets } from '@/hooks/useDashboardWithTargets';

interface MonthlyReport {
  period: string;
  revenue: number;
  newCustomers: number;
  totalCustomers: number;
  churnRate: number;
  expenses: number;
  profit: number;
  targets: {
    revenue: number;
    newCustomers: number;
    expenses: number;
  };
  channels: {
    name: string;
    acquisitions: number;
    cost: number;
    cpa: number;
  }[];
}

export default function MonthlyReportPage() {
  const { user } = useAuthContext();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return format(subMonths(now, 1), 'yyyy-MM'); // 先月をデフォルト
  });

  // 過去12ヶ月の選択肢を生成
  const generateMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 1; i <= 12; i++) {
      const date = subMonths(now, i);
      const value = format(date, 'yyyy-MM');
      const label = format(date, 'yyyy年MM月', { locale: ja });
      options.push({ value, label });
    }
    return options;
  };

  const monthOptions = generateMonthOptions();

  // ダッシュボードデータを取得（目標との比較含む）
  const { data: dashboardData, isLoading } = useDashboardWithTargets(selectedMonth, !!user);

  // 月次レポートデータの生成
  const monthlyReport: MonthlyReport | null = dashboardData ? {
    period: selectedMonth,
    revenue: dashboardData.mrr || 0,
    newCustomers: dashboardData.newAcquisitions || 0,
    totalCustomers: dashboardData.activeCustomers || 0,
    churnRate: dashboardData.churnRate || 0,
    expenses: dashboardData.totalExpenses || 0,
    profit: (dashboardData.mrr || 0) - (dashboardData.totalExpenses || 0),
    targets: {
      revenue: dashboardData.mrrTarget || 0,
      newCustomers: dashboardData.newAcquisitionsTarget || 0,
      expenses: dashboardData.monthlyExpensesTarget || 0,
    },
    channels: [
      { name: 'Google広告', acquisitions: 25, cost: 150000, cpa: 6000 },
      { name: 'Facebook広告', acquisitions: 18, cost: 108000, cpa: 6000 },
      { name: '紹介', acquisitions: 12, cost: 0, cpa: 0 },
      { name: 'オーガニック検索', acquisitions: 8, cost: 0, cpa: 0 },
      { name: 'SNS', acquisitions: 5, cost: 30000, cpa: 6000 }
    ]
  } : null;

  // レポート出力（CSVダウンロード）
  const downloadReport = () => {
    if (!monthlyReport) return;

    const csvData = [
      ['月次レポート', format(new Date(selectedMonth + '-01'), 'yyyy年MM月', { locale: ja })],
      [''],
      ['=== 主要指標 ==='],
      ['項目', '実績', '目標', '達成率'],
      ['売上', `¥${monthlyReport.revenue.toLocaleString()}`, `¥${monthlyReport.targets.revenue.toLocaleString()}`, `${Math.round((monthlyReport.revenue / monthlyReport.targets.revenue) * 100)}%`],
      ['新規顧客', `${monthlyReport.newCustomers}人`, `${monthlyReport.targets.newCustomers}人`, `${Math.round((monthlyReport.newCustomers / monthlyReport.targets.newCustomers) * 100)}%`],
      ['総顧客数', `${monthlyReport.totalCustomers}人`, '', ''],
      ['チャーン率', `${monthlyReport.churnRate}%`, '', ''],
      ['支出', `¥${monthlyReport.expenses.toLocaleString()}`, `¥${monthlyReport.targets.expenses.toLocaleString()}`, `${Math.round((monthlyReport.expenses / monthlyReport.targets.expenses) * 100)}%`],
      ['利益', `¥${monthlyReport.profit.toLocaleString()}`, '', ''],
      [''],
      ['=== チャネル別実績 ==='],
      ['チャネル', '獲得数', '広告費', 'CPA'],
      ...monthlyReport.channels.map(ch => [ch.name, `${ch.acquisitions}人`, `¥${ch.cost.toLocaleString()}`, ch.cpa > 0 ? `¥${ch.cpa.toLocaleString()}` : '無料'])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `monthly-report-${selectedMonth}.csv`;
    link.click();
  };

  const getPerformanceColor = (actual: number, target: number) => {
    const ratio = target > 0 ? actual / target : 0;
    if (ratio >= 0.9) return 'text-green-600';
    if (ratio >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressValue = (actual: number, target: number) => {
    return target > 0 ? Math.min(Math.round((actual / target) * 100), 100) : 0;
  };

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
                    月次レポート
                  </span>
                </h1>
                <p className="text-muted-foreground mt-1">
                  {format(new Date(selectedMonth + '-01'), 'yyyy年MM月', { locale: ja })}の詳細分析レポート
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
                <Button
                  onClick={downloadReport}
                  disabled={!monthlyReport}
                  variant="outline"
                  className="glass hover:bg-white/20"
                >
                  <Download className="w-4 h-4 mr-2" />
                  CSV出力
                </Button>
                <Link href="/dashboard">
                  <Button variant="outline" className="glass hover:bg-white/20">
                    ダッシュボードに戻る
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* メインコンテンツ */}
        <main className="relative z-10 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : !monthlyReport ? (
            <Card className="glass">
              <CardContent className="p-12 text-center">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">データがありません</h3>
                <p className="text-muted-foreground">
                  選択した期間のデータが見つかりません
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {/* エグゼクティブサマリー */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    エグゼクティブサマリー
                  </CardTitle>
                  <CardDescription>
                    {format(new Date(selectedMonth + '-01'), 'yyyy年MM月', { locale: ja })}の業績概要
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        ¥{monthlyReport.revenue.toLocaleString()}
                      </div>
                      <div className="text-muted-foreground">月次売上</div>
                      <div className={`text-sm ${getPerformanceColor(monthlyReport.revenue, monthlyReport.targets.revenue)}`}>
                        目標達成率: {getProgressValue(monthlyReport.revenue, monthlyReport.targets.revenue)}%
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {monthlyReport.newCustomers}人
                      </div>
                      <div className="text-muted-foreground">新規獲得</div>
                      <div className={`text-sm ${getPerformanceColor(monthlyReport.newCustomers, monthlyReport.targets.newCustomers)}`}>
                        目標達成率: {getProgressValue(monthlyReport.newCustomers, monthlyReport.targets.newCustomers)}%
                      </div>
                    </div>
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${monthlyReport.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ¥{monthlyReport.profit.toLocaleString()}
                      </div>
                      <div className="text-muted-foreground">月間利益</div>
                      <div className="text-sm text-muted-foreground">
                        利益率: {monthlyReport.revenue > 0 ? Math.round((monthlyReport.profit / monthlyReport.revenue) * 100) : 0}%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 目標達成状況 */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    目標達成状況
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>売上目標</span>
                      <span className="font-semibold">
                        ¥{monthlyReport.revenue.toLocaleString()} / ¥{monthlyReport.targets.revenue.toLocaleString()}
                      </span>
                    </div>
                    <Progress value={getProgressValue(monthlyReport.revenue, monthlyReport.targets.revenue)} className="h-3" />
                    <div className="text-sm text-muted-foreground mt-1">
                      達成率: {getProgressValue(monthlyReport.revenue, monthlyReport.targets.revenue)}%
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>新規獲得目標</span>
                      <span className="font-semibold">
                        {monthlyReport.newCustomers}人 / {monthlyReport.targets.newCustomers}人
                      </span>
                    </div>
                    <Progress value={getProgressValue(monthlyReport.newCustomers, monthlyReport.targets.newCustomers)} className="h-3" />
                    <div className="text-sm text-muted-foreground mt-1">
                      達成率: {getProgressValue(monthlyReport.newCustomers, monthlyReport.targets.newCustomers)}%
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>支出予算</span>
                      <span className="font-semibold">
                        ¥{monthlyReport.expenses.toLocaleString()} / ¥{monthlyReport.targets.expenses.toLocaleString()}
                      </span>
                    </div>
                    <Progress value={getProgressValue(monthlyReport.expenses, monthlyReport.targets.expenses)} className="h-3" />
                    <div className="text-sm text-muted-foreground mt-1">
                      使用率: {getProgressValue(monthlyReport.expenses, monthlyReport.targets.expenses)}%
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* チャネル別パフォーマンス */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    チャネル別パフォーマンス
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3">チャネル</th>
                          <th className="text-right p-3">獲得数</th>
                          <th className="text-right p-3">広告費</th>
                          <th className="text-right p-3">CPA</th>
                          <th className="text-right p-3">割合</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyReport.channels.map((channel, index) => {
                          const percentage = monthlyReport.newCustomers > 0 
                            ? Math.round((channel.acquisitions / monthlyReport.newCustomers) * 100) 
                            : 0;
                          
                          return (
                            <tr key={index} className="border-b hover:bg-gray-50/50">
                              <td className="p-3 font-medium">{channel.name}</td>
                              <td className="p-3 text-right">{channel.acquisitions}人</td>
                              <td className="p-3 text-right">¥{channel.cost.toLocaleString()}</td>
                              <td className="p-3 text-right">
                                {channel.cpa > 0 ? `¥${channel.cpa.toLocaleString()}` : '無料'}
                              </td>
                              <td className="p-3 text-right">{percentage}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* 推奨アクション */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    推奨アクション・改善提案
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {monthlyReport.revenue < monthlyReport.targets.revenue * 0.9 && (
                      <Alert>
                        <TrendingDown className="h-4 w-4" />
                        <AlertDescription>
                          <strong>売上改善:</strong> 売上目標の達成率が90%を下回っています。価格戦略の見直しや既存顧客のアップセルを検討してください。
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {monthlyReport.newCustomers < monthlyReport.targets.newCustomers * 0.8 && (
                      <Alert>
                        <Users className="h-4 w-4" />
                        <AlertDescription>
                          <strong>獲得強化:</strong> 新規獲得が目標を大きく下回っています。マーケティング施策の見直しや予算配分の最適化が必要です。
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {monthlyReport.churnRate > 10 && (
                      <Alert variant="destructive">
                        <TrendingDown className="h-4 w-4" />
                        <AlertDescription>
                          <strong>緊急対応:</strong> チャーン率が10%を超えています。顧客満足度調査とリテンション施策の実施が急務です。
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {monthlyReport.profit <= 0 && (
                      <Alert variant="destructive">
                        <DollarSign className="h-4 w-4" />
                        <AlertDescription>
                          <strong>収益改善:</strong> 月間利益がマイナスまたはゼロです。コスト削減と売上向上の両面からの対策が必要です。
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}