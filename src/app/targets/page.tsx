'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import Link from 'next/link';
import { Target, Plus, TrendingUp, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { EnhancedTargetImport } from '@/components/features/targets/enhanced-target-import';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/lib/auth-context';

interface KPITarget {
  id: string;
  period: string;
  metric_type: string;
  target_value: number;
  current_value: number;
  unit: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export default function TargetsPage() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return format(now, 'yyyy-MM');
  });
  const [showImport, setShowImport] = useState(false);

  const [newTarget, setNewTarget] = useState({
    metric_type: '',
    target_value: '',
    unit: ''
  });

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

  // KPI目標取得
  const { data: targets, isLoading } = useQuery({
    queryKey: ['targets', selectedMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('targets')
        .select('*')
        .eq('period', selectedMonth)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as KPITarget[];
    }
  });

  // 目標追加
  const addTargetMutation = useMutation({
    mutationFn: async (targetData: any) => {
      const { data, error } = await supabase
        .from('targets')
        .insert({
          period: selectedMonth,
          metric_type: targetData.metric_type,
          target_value: parseFloat(targetData.target_value),
          unit: targetData.unit,
          created_by: user?.id
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['targets'] });
      setNewTarget({ metric_type: '', target_value: '', unit: '' });
    }
  });

  const metricTypes = [
    { value: 'mrr', label: 'MRR（月次経常収益）', unit: 'currency' },
    { value: 'new_acquisitions', label: '新規獲得数', unit: 'count' },
    { value: 'churn_rate', label: 'チャーン率', unit: 'percentage' },
    { value: 'active_customers', label: 'アクティブ顧客数', unit: 'count' },
    { value: 'customer_satisfaction', label: '顧客満足度', unit: 'score' },
    { value: 'monthly_expenses', label: '月次支出', unit: 'currency' }
  ];

  const getProgressPercentage = (target: KPITarget) => {
    return Math.min(Math.round((target.current_value / target.target_value) * 100), 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 bg-green-100';
    if (percentage >= 70) return 'text-blue-600 bg-blue-100';
    if (percentage >= 50) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const formatValue = (value: number, unit: string) => {
    switch (unit) {
      case 'currency':
        return `¥${value.toLocaleString()}`;
      case 'percentage':
        return `${value}%`;
      case 'score':
        return `${value}/5.0`;
      default:
        return (value || 0).toString();
    }
  };

  const handleAddTarget = () => {
    if (newTarget.metric_type && newTarget.target_value && newTarget.unit) {
      addTargetMutation.mutate(newTarget);
    }
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
                    KPI目標管理
                  </span>
                </h1>
                <p className="text-muted-foreground mt-1">
                  {format(new Date(selectedMonth + '-01'), 'yyyy年MM月', { locale: ja })}の目標設定と進捗管理
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
                  onClick={() => setShowImport(!showImport)}
                  variant="outline"
                  className="glass hover:bg-white/20"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  {showImport ? 'インポート非表示' : 'データインポート'}
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
            {/* データインポート機能 */}
            {showImport && (
              <div className="animate-fade-in">
                <EnhancedTargetImport />
              </div>
            )}
            {/* 新しい目標追加 */}
            <Card className="glass">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Plus className="w-5 h-5" />
                  <CardTitle>新しい目標を設定</CardTitle>
                </div>
                <CardDescription>
                  {format(new Date(selectedMonth + '-01'), 'yyyy年MM月', { locale: ja })}の新しいKPI目標を設定
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label>指標タイプ</Label>
                    <Select 
                      value={newTarget.metric_type} 
                      onValueChange={(value) => {
                        const metric = metricTypes.find(m => m.value === value);
                        setNewTarget(prev => ({ 
                          ...prev, 
                          metric_type: value, 
                          unit: metric?.unit || '' 
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="指標を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {metricTypes.map((metric) => (
                          <SelectItem key={metric.value} value={metric.value}>
                            {metric.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>目標値</Label>
                    <Input
                      type="number"
                      placeholder="目標値を入力"
                      value={newTarget.target_value}
                      onChange={(e) => setNewTarget(prev => ({ ...prev, target_value: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>単位</Label>
                    <Input
                      value={newTarget.unit}
                      onChange={(e) => setNewTarget(prev => ({ ...prev, unit: e.target.value }))}
                      placeholder="単位"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={handleAddTarget}
                      disabled={!newTarget.metric_type || !newTarget.target_value || addTargetMutation.isPending}
                      className="w-full"
                    >
                      目標を追加
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 目標一覧 */}
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {targets?.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <Target className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                      目標が設定されていません
                    </h3>
                    <p className="text-muted-foreground">
                      上記フォームから新しい目標を設定してください
                    </p>
                  </div>
                ) : (
                  targets?.map((target) => {
                    const percentage = getProgressPercentage(target);
                    const metricInfo = metricTypes.find(m => m.value === target.metric_type);
                    
                    return (
                      <Card key={target.id} className="glass">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">
                              {metricInfo?.label || target.metric_type}
                            </CardTitle>
                            {percentage >= 90 ? (
                              <TrendingUp className="w-5 h-5 text-green-500" />
                            ) : percentage < 50 ? (
                              <AlertCircle className="w-5 h-5 text-red-500" />
                            ) : (
                              <Target className="w-5 h-5 text-blue-500" />
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between text-sm mb-2">
                                <span>進捗</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getProgressColor(percentage)}`}>
                                  {percentage}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">現在値</span>
                              <span className="font-semibold">
                                {formatValue(target.current_value, target.unit)}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">目標値</span>
                              <span className="font-semibold">
                                {formatValue(target.target_value, target.unit)}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">残り</span>
                              <span className="font-semibold">
                                {formatValue(Math.max(0, target.target_value - target.current_value), target.unit)}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </main>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}