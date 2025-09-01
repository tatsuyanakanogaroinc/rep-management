'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState } from 'react';
import Link from 'next/link';
import { Target, Plus, TrendingUp, BarChart3, AlertCircle, CheckCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/lib/auth-context';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface ChannelTarget {
  id: string;
  channel_name: string;
  target_type: string;
  target_value: number;
  unit: string;
  period: string;
  cpa_target: number | null;
  conversion_rate_target: number | null;
  description: string;
  is_active: boolean;
  created_at: string;
}

interface ChannelPerformance {
  channel_name: string;
  acquisitions: number;
  cost: number;
  cpa: number;
  conversion_rate: number;
}

export default function ChannelsPage() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return format(now, 'yyyy-MM');
  });
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showNewTarget, setShowNewTarget] = useState(false);

  const [newTarget, setNewTarget] = useState({
    channel_name: '',
    target_type: 'acquisition',
    target_value: '',
    cpa_target: '',
    conversion_rate_target: '',
    description: ''
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

  // チャネル目標取得
  const { data: channelTargets, isLoading: targetsLoading } = useQuery({
    queryKey: ['channel-targets', selectedMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('channel_targets')
        .select('*')
        .eq('period', selectedMonth)
        .eq('is_active', true)
        .order('channel_name', { ascending: true });
      
      if (error) throw error;
      return data as ChannelTarget[];
    }
  });

  // チャネル実績取得（模擬データ - 実際のトラッキング実装後は実データに置き換え）
  const { data: channelPerformance, isLoading: performanceLoading } = useQuery({
    queryKey: ['channel-performance', selectedMonth],
    queryFn: async () => {
      // 実際のトラッキングデータが実装されるまでの模擬データ
      const mockData: ChannelPerformance[] = [
        { channel_name: 'Google広告', acquisitions: 25, cost: 150000, cpa: 6000, conversion_rate: 2.5 },
        { channel_name: 'Facebook広告', acquisitions: 18, cost: 108000, cpa: 6000, conversion_rate: 1.8 },
        { channel_name: '紹介', acquisitions: 12, cost: 0, cpa: 0, conversion_rate: 15.0 },
        { channel_name: 'オーガニック検索', acquisitions: 8, cost: 0, cpa: 0, conversion_rate: 3.2 },
        { channel_name: 'SNS', acquisitions: 5, cost: 30000, cpa: 6000, conversion_rate: 1.2 }
      ];
      return mockData;
    }
  });

  // 目標追加
  const addTargetMutation = useMutation({
    mutationFn: async (targetData: any) => {
      const { data, error } = await supabase
        .from('channel_targets')
        .insert({
          channel_name: targetData.channel_name,
          target_type: targetData.target_type,
          target_value: parseFloat(targetData.target_value),
          unit: getUnit(targetData.target_type),
          period: selectedMonth,
          cpa_target: targetData.cpa_target ? parseFloat(targetData.cpa_target) : null,
          conversion_rate_target: targetData.conversion_rate_target ? parseFloat(targetData.conversion_rate_target) : null,
          description: targetData.description,
          created_by: user?.id
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel-targets'] });
      setNewTarget({
        channel_name: '',
        target_type: 'acquisition',
        target_value: '',
        cpa_target: '',
        conversion_rate_target: '',
        description: ''
      });
      setShowNewTarget(false);
      setSuccess('チャネル目標を追加しました');
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : '目標の追加に失敗しました');
      setTimeout(() => setError(null), 5000);
    }
  });

  const channelTypes = [
    'Google広告',
    'Facebook広告',
    'Instagram広告',
    'Twitter広告',
    'LinkedIn広告',
    'YouTube広告',
    '紹介',
    'オーガニック検索',
    'SNS',
    'メール',
    'その他'
  ];

  const targetTypes = [
    { value: 'acquisition', label: '獲得数', unit: '人' },
    { value: 'cost', label: '広告費', unit: '円' },
    { value: 'cpa', label: 'CPA', unit: '円' },
    { value: 'conversion_rate', label: '転換率', unit: '%' }
  ];

  const getUnit = (targetType: string) => {
    const type = targetTypes.find(t => t.value === targetType);
    return type?.unit || '';
  };

  const getProgress = (target: ChannelTarget, performance: ChannelPerformance | undefined) => {
    if (!performance) return 0;
    
    switch (target.target_type) {
      case 'acquisition':
        return Math.min(Math.round((performance.acquisitions / target.target_value) * 100), 100);
      case 'cost':
        return Math.min(Math.round((performance.cost / target.target_value) * 100), 100);
      case 'cpa':
        return target.target_value > 0 ? Math.min(Math.round((target.target_value / performance.cpa) * 100), 100) : 0;
      case 'conversion_rate':
        return Math.min(Math.round((performance.conversion_rate / target.target_value) * 100), 100);
      default:
        return 0;
    }
  };

  const getActualValue = (target: ChannelTarget, performance: ChannelPerformance | undefined) => {
    if (!performance) return 0;
    
    switch (target.target_type) {
      case 'acquisition':
        return performance.acquisitions;
      case 'cost':
        return performance.cost;
      case 'cpa':
        return performance.cpa;
      case 'conversion_rate':
        return performance.conversion_rate;
      default:
        return 0;
    }
  };

  const formatValue = (value: number, unit: string) => {
    switch (unit) {
      case '円':
        return `¥${value.toLocaleString()}`;
      case '%':
        return `${value.toFixed(1)}%`;
      default:
        return value.toString();
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return 'text-green-600 bg-green-100';
    if (progress >= 70) return 'text-blue-600 bg-blue-100';
    if (progress >= 50) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
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
                    流入経路管理
                  </span>
                </h1>
                <p className="text-muted-foreground mt-1">
                  {format(new Date(selectedMonth + '-01'), 'yyyy年MM月', { locale: ja })}のチャネル別目標と実績
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
                  onClick={() => setShowNewTarget(!showNewTarget)}
                  className="glass bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  新しい目標
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
            {/* 成功・エラーメッセージ */}
            {success && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* 新しい目標追加フォーム */}
            {showNewTarget && (
              <Card className="glass animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    新しいチャネル目標を設定
                  </CardTitle>
                  <CardDescription>
                    {format(new Date(selectedMonth + '-01'), 'yyyy年MM月', { locale: ja })}のチャネル別目標を設定
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label>チャネル名</Label>
                      <Select
                        value={newTarget.channel_name}
                        onValueChange={(value) => setNewTarget(prev => ({ ...prev, channel_name: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="チャネルを選択" />
                        </SelectTrigger>
                        <SelectContent>
                          {channelTypes.map((channel) => (
                            <SelectItem key={channel} value={channel}>
                              {channel}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>目標タイプ</Label>
                      <Select
                        value={newTarget.target_type}
                        onValueChange={(value) => setNewTarget(prev => ({ ...prev, target_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {targetTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
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
                      <Label>CPA目標（円）</Label>
                      <Input
                        type="number"
                        placeholder="CPA目標（任意）"
                        value={newTarget.cpa_target}
                        onChange={(e) => setNewTarget(prev => ({ ...prev, cpa_target: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>転換率目標（%）</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="転換率目標（任意）"
                        value={newTarget.conversion_rate_target}
                        onChange={(e) => setNewTarget(prev => ({ ...prev, conversion_rate_target: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>説明</Label>
                      <Input
                        placeholder="目標の説明（任意）"
                        value={newTarget.description}
                        onChange={(e) => setNewTarget(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <Button
                      onClick={() => addTargetMutation.mutate(newTarget)}
                      disabled={!newTarget.channel_name || !newTarget.target_value || addTargetMutation.isPending}
                      className="bg-gradient-to-r from-primary to-accent"
                    >
                      {addTargetMutation.isPending ? '追加中...' : '目標を追加'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowNewTarget(false)}
                    >
                      キャンセル
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* チャネル別実績一覧 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {targetsLoading || performanceLoading ? (
                <div className="col-span-full flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : channelTargets?.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <Target className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                    チャネル目標が設定されていません
                  </h3>
                  <p className="text-muted-foreground">
                    「新しい目標」ボタンから目標を設定してください
                  </p>
                </div>
              ) : (
                channelTargets?.map((target) => {
                  const performance = channelPerformance?.find(p => p.channel_name === target.channel_name);
                  const progress = getProgress(target, performance);
                  const actualValue = getActualValue(target, performance);
                  
                  return (
                    <Card key={target.id} className="glass">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            {target.channel_name}
                          </CardTitle>
                          {progress >= 90 ? (
                            <TrendingUp className="w-5 h-5 text-green-500" />
                          ) : progress < 50 ? (
                            <AlertCircle className="w-5 h-5 text-red-500" />
                          ) : (
                            <BarChart3 className="w-5 h-5 text-blue-500" />
                          )}
                        </div>
                        <CardDescription>
                          {targetTypes.find(t => t.value === target.target_type)?.label}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span>進捗</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getProgressColor(progress)}`}>
                                {progress}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">現在値</span>
                              <span className="font-semibold">
                                {formatValue(actualValue, target.unit)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">目標値</span>
                              <span className="font-semibold">
                                {formatValue(target.target_value, target.unit)}
                              </span>
                            </div>
                            {performance && (
                              <>
                                {target.cpa_target && performance.cpa > 0 && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">CPA</span>
                                    <span className={`font-semibold ${performance.cpa <= target.cpa_target ? 'text-green-600' : 'text-red-600'}`}>
                                      {formatValue(performance.cpa, '円')} 
                                      <span className="text-xs ml-1">
                                        (目標: {formatValue(target.cpa_target, '円')})
                                      </span>
                                    </span>
                                  </div>
                                )}
                                {target.conversion_rate_target && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">転換率</span>
                                    <span className={`font-semibold ${performance.conversion_rate >= target.conversion_rate_target ? 'text-green-600' : 'text-red-600'}`}>
                                      {formatValue(performance.conversion_rate, '%')}
                                      <span className="text-xs ml-1">
                                        (目標: {formatValue(target.conversion_rate_target, '%')})
                                      </span>
                                    </span>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                          {target.description && (
                            <div className="text-xs text-muted-foreground pt-2 border-t">
                              {target.description}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>

            {/* チャネル別サマリー */}
            {channelPerformance && channelPerformance.length > 0 && (
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    チャネル別実績サマリー
                  </CardTitle>
                  <CardDescription>
                    {format(new Date(selectedMonth + '-01'), 'yyyy年MM月', { locale: ja })}の全チャネル実績
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">チャネル</th>
                          <th className="text-right p-2">獲得数</th>
                          <th className="text-right p-2">広告費</th>
                          <th className="text-right p-2">CPA</th>
                          <th className="text-right p-2">転換率</th>
                        </tr>
                      </thead>
                      <tbody>
                        {channelPerformance.map((perf) => (
                          <tr key={perf.channel_name} className="border-b">
                            <td className="p-2 font-medium">{perf.channel_name}</td>
                            <td className="p-2 text-right">{perf.acquisitions}人</td>
                            <td className="p-2 text-right">{formatValue(perf.cost, '円')}</td>
                            <td className="p-2 text-right">{perf.cpa > 0 ? formatValue(perf.cpa, '円') : '-'}</td>
                            <td className="p-2 text-right">{formatValue(perf.conversion_rate, '%')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}