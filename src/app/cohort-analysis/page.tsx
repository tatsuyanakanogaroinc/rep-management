'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Users, TrendingDown, TrendingUp, RefreshCw, Calendar, BarChart3 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/lib/auth-context';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ja } from 'date-fns/locale';

interface CohortData {
  id: string;
  cohort_period: string;
  customer_count: number;
  retention_month_1: number | null;
  retention_month_2: number | null;
  retention_month_3: number | null;
  retention_month_6: number | null;
  retention_month_12: number | null;
  ltv: number | null;
}

interface CustomerData {
  id: string;
  registered_at: string;
  status: string;
  churned_at: string | null;
  plan_type: string;
}

export default function CohortAnalysisPage() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const now = new Date();
    return format(subMonths(now, 1), 'yyyy-MM'); // 先月をデフォルト
  });
  const [isGenerating, setIsGenerating] = useState(false);

  // 過去12ヶ月の選択肢を生成
  const generatePeriodOptions = () => {
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

  const periodOptions = generatePeriodOptions();

  // コホートデータ取得（顧客データから動的計算）
  const { data: cohortData, isLoading } = useQuery({
    queryKey: ['cohort-analysis', selectedPeriod],
    queryFn: async () => {
      // 顧客データを取得してコホート分析を計算
      const { data: customers, error } = await supabase
        .from('customers')
        .select('id, registered_at, churned_at, status, plan_type');
      
      if (error) throw error;
      if (!customers || customers.length === 0) return null;

      // 指定期間の顧客をフィルタ
      const periodStart = startOfMonth(new Date(selectedPeriod + '-01'));
      const periodEnd = endOfMonth(periodStart);
      
      const cohortCustomers = customers.filter(customer => {
        const registeredAt = new Date(customer.registered_at);
        return registeredAt >= periodStart && registeredAt <= periodEnd;
      });

      if (cohortCustomers.length === 0) return null;

      // 基本的なコホートデータを作成
      const cohortData: CohortData = {
        id: selectedPeriod,
        cohort_period: selectedPeriod,
        customer_count: cohortCustomers.length,
        retention_month_1: cohortCustomers.filter(c => c.status === 'active').length / cohortCustomers.length * 100,
        retention_month_2: null,
        retention_month_3: null,
        retention_month_6: null,
        retention_month_12: null,
        ltv: cohortCustomers.filter(c => c.plan_type === 'monthly').length * 5000 + 
             cohortCustomers.filter(c => c.plan_type === 'yearly').length * 50000
      };

      return cohortData;
    }
  });

  // コホート分析生成
  const generateCohortMutation = useMutation({
    mutationFn: async (period: string) => {
      setIsGenerating(true);
      
      // 該当月の顧客データを取得
      const cohortStart = startOfMonth(new Date(period + '-01'));
      const cohortEnd = endOfMonth(cohortStart);
      
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('id, registered_at, status, churned_at, plan_type')
        .gte('registered_at', cohortStart.toISOString())
        .lte('registered_at', cohortEnd.toISOString());
      
      if (customersError) throw customersError;
      
      const cohortCustomers = customers as CustomerData[];
      const totalCustomers = cohortCustomers.length;
      
      if (totalCustomers === 0) {
        throw new Error('選択した期間に新規顧客がいません');
      }
      
      // 各月のリテンション率を計算
      const calculateRetention = (monthsAfter: number) => {
        const targetMonth = startOfMonth(new Date(cohortStart.getFullYear(), cohortStart.getMonth() + monthsAfter, 1));
        const activeCustomers = cohortCustomers.filter(customer => {
          if (customer.status === 'churned' && customer.churned_at) {
            const churnDate = new Date(customer.churned_at);
            return churnDate > targetMonth;
          }
          return customer.status === 'active';
        }).length;
        
        return Math.round((activeCustomers / totalCustomers) * 100);
      };
      
      // LTV計算（簡易版）
      const monthlyRevenue = cohortCustomers.reduce((sum, customer) => {
        if (customer.plan_type === 'monthly') return sum + 4980;
        if (customer.plan_type === 'yearly') return sum + 4150; // 年額を月割り
        return sum;
      }, 0);
      
      const avgLTV = totalCustomers > 0 ? Math.round(monthlyRevenue / totalCustomers * 12) : 0; // 簡易的に12ヶ月分
      
      const cohortAnalysis = {
        cohort_period: period,
        customer_count: totalCustomers,
        retention_month_1: calculateRetention(1),
        retention_month_2: calculateRetention(2),
        retention_month_3: calculateRetention(3),
        retention_month_6: calculateRetention(6),
        retention_month_12: calculateRetention(12),
        ltv: avgLTV,
        created_by: user?.id
      };
      
      // メモリ内で計算したデータを返す
      return cohortAnalysis;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cohort-analysis'] });
      setIsGenerating(false);
    },
    onError: (error) => {
      console.error('Cohort analysis generation failed:', error);
      setIsGenerating(false);
    }
  });

  // 複数期間のコホートデータ比較用
  const { data: comparisonData } = useQuery({
    queryKey: ['cohort-comparison'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cohort_analysis')
        .select('*')
        .order('cohort_period', { ascending: false })
        .limit(6); // 過去6期間
      
      if (error) throw error;
      return data as CohortData[];
    }
  });

  const retentionMetrics = useMemo(() => {
    if (!cohortData) return null;
    
    return [
      { period: '1ヶ月後', value: cohortData.retention_month_1, color: 'from-blue-500 to-blue-600' },
      { period: '2ヶ月後', value: cohortData.retention_month_2, color: 'from-green-500 to-green-600' },
      { period: '3ヶ月後', value: cohortData.retention_month_3, color: 'from-yellow-500 to-yellow-600' },
      { period: '6ヶ月後', value: cohortData.retention_month_6, color: 'from-orange-500 to-orange-600' },
      { period: '12ヶ月後', value: cohortData.retention_month_12, color: 'from-red-500 to-red-600' }
    ].filter(metric => metric.value !== null);
  }, [cohortData]);

  const getRetentionTrend = (currentValue: number | null, comparisonValue: number | null) => {
    if (!currentValue || !comparisonValue) return null;
    const diff = currentValue - comparisonValue;
    return {
      value: Math.abs(diff),
      isPositive: diff > 0,
      percentage: Math.round(Math.abs(diff / comparisonValue) * 100)
    };
  };

  return (
    <ProtectedRoute>
      <AppLayout>
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
                    コホート分析
                  </span>
                </h1>
                <p className="text-muted-foreground mt-1">
                  {format(new Date(selectedPeriod + '-01'), 'yyyy年MM月', { locale: ja })}新規顧客のリテンション分析
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-48 glass hover:bg-white/20">
                    <SelectValue placeholder="期間を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {periodOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => generateCohortMutation.mutate(selectedPeriod)}
                  disabled={isGenerating || generateCohortMutation.isPending}
                  className="glass bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                >
                  {isGenerating || generateCohortMutation.isPending ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <BarChart3 className="w-4 h-4 mr-2" />
                  )}
                  分析実行
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
          <div className="space-y-8">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : !cohortData ? (
              <Card className="glass">
                <CardContent className="p-12 text-center">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">コホート分析データがありません</h3>
                  <p className="text-muted-foreground mb-6">
                    選択した期間のコホート分析を実行してください
                  </p>
                  <Button
                    onClick={() => generateCohortMutation.mutate(selectedPeriod)}
                    disabled={isGenerating || generateCohortMutation.isPending}
                    className="bg-gradient-to-r from-primary to-accent"
                  >
                    {isGenerating || generateCohortMutation.isPending ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <BarChart3 className="w-4 h-4 mr-2" />
                    )}
                    コホート分析を実行
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* コホートサマリー */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="glass">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        新規顧客数
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{cohortData.customer_count.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {format(new Date(selectedPeriod + '-01'), 'yyyy年MM月', { locale: ja })}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        1ヶ月後リテンション
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-600">
                        {cohortData.retention_month_1 || 0}%
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {Math.round((cohortData.retention_month_1 || 0) * cohortData.customer_count / 100)}人が継続
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        推定LTV
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600">
                        ¥{(cohortData.ltv || 0).toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        顧客生涯価値（推定）
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* リテンション率推移 */}
                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingDown className="w-5 h-5" />
                      リテンション率推移
                    </CardTitle>
                    <CardDescription>
                      {format(new Date(selectedPeriod + '-01'), 'yyyy年MM月', { locale: ja })}の新規顧客の継続率
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      {retentionMetrics?.map((metric, index) => (
                        <div key={metric.period} className="text-center">
                          <div className="mb-2">
                            <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-r ${metric.color} flex items-center justify-center text-white font-bold text-lg`}>
                              {metric.value}%
                            </div>
                          </div>
                          <div className="text-sm font-medium">{metric.period}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {Math.round((metric.value || 0) * cohortData.customer_count / 100)}人
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* リテンション率の棒グラフ */}
                    <div className="mt-8 space-y-3">
                      {retentionMetrics?.map((metric, index) => (
                        <div key={metric.period}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{metric.period}</span>
                            <span className="font-semibold">{metric.value}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className={`bg-gradient-to-r ${metric.color} h-3 rounded-full transition-all duration-500`}
                              style={{ width: `${metric.value}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* 比較分析 */}
                {comparisonData && comparisonData.length > 1 && (
                  <Card className="glass">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        期間別比較
                      </CardTitle>
                      <CardDescription>
                        過去のコホートとの比較分析
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-3">コホート期間</th>
                              <th className="text-right p-3">新規顧客数</th>
                              <th className="text-right p-3">1ヶ月</th>
                              <th className="text-right p-3">2ヶ月</th>
                              <th className="text-right p-3">3ヶ月</th>
                              <th className="text-right p-3">6ヶ月</th>
                              <th className="text-right p-3">推定LTV</th>
                            </tr>
                          </thead>
                          <tbody>
                            {comparisonData.map((cohort) => (
                              <tr key={cohort.id} className="border-b hover:bg-gray-50/50">
                                <td className="p-3 font-medium">
                                  {format(new Date(cohort.cohort_period + '-01'), 'yyyy年MM月', { locale: ja })}
                                </td>
                                <td className="p-3 text-right">{cohort.customer_count}人</td>
                                <td className="p-3 text-right">{cohort.retention_month_1 || '-'}%</td>
                                <td className="p-3 text-right">{cohort.retention_month_2 || '-'}%</td>
                                <td className="p-3 text-right">{cohort.retention_month_3 || '-'}%</td>
                                <td className="p-3 text-right">{cohort.retention_month_6 || '-'}%</td>
                                <td className="p-3 text-right">¥{(cohort.ltv || 0).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* インサイトと推奨アクション */}
                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      分析インサイト
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">リテンション分析</h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-start gap-2">
                            <span className="text-blue-600 font-bold">•</span>
                            1ヶ月後リテンション率: {cohortData.retention_month_1 || 0}%
                            {(cohortData.retention_month_1 || 0) > 80 ? ' (優秀)' : (cohortData.retention_month_1 || 0) > 60 ? ' (良好)' : ' (改善の余地あり)'}
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-green-600 font-bold">•</span>
                            長期リテンション（6ヶ月後）: {cohortData.retention_month_6 || 0}%
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-purple-600 font-bold">•</span>
                            推定LTV: ¥{(cohortData.ltv || 0).toLocaleString()}
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-3">推奨アクション</h4>
                        <ul className="space-y-2 text-sm">
                          {(cohortData.retention_month_1 || 0) < 70 && (
                            <li className="flex items-start gap-2">
                              <span className="text-red-600 font-bold">•</span>
                              初回体験の改善でリテンション率向上を図る
                            </li>
                          )}
                          {(cohortData.retention_month_3 || 0) < 50 && (
                            <li className="flex items-start gap-2">
                              <span className="text-orange-600 font-bold">•</span>
                              3ヶ月以内のエンゲージメント強化施策が必要
                            </li>
                          )}
                          <li className="flex items-start gap-2">
                            <span className="text-blue-600 font-bold">•</span>
                            定期的なコホート分析で傾向を監視
                          </li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </main>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}