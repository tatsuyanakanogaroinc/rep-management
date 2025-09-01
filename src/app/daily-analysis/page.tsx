'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState, useEffect } from 'react';
import { format, getDaysInMonth, subDays, addDays } from 'date-fns';
import { ja } from 'date-fns/locale';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  Calendar, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Lightbulb, 
  Users, 
  DollarSign,
  Activity,
  Clock,
  ArrowRight,
  Brain,
  Zap,
  BarChart3
} from 'lucide-react';
import { useMonthlyPlanning } from '@/hooks/useMonthlyPlanning';
import { useAuthContext } from '@/lib/auth-context';
import { saveDailyActual, getDailyActuals, getDailyActual } from '@/lib/daily-actuals';
import { DailyActual as DBDailyActual } from '@/types/database';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface DailyActual {
  date: string;
  newAcquisitions: number;
  revenue: number;
  expenses: number;
  channelData: {
    [channelName: string]: {
      acquisitions: number;
      cost: number;
    };
  };
}

export default function DailyAnalysisPage() {
  const { getPlanForMonth } = useMonthlyPlanning();
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return format(now, 'yyyy-MM');
  });
  
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return format(now, 'yyyy-MM-dd');
  });

  // 日次実績データをSupabaseから取得
  const { data: dailyActuals = [], isLoading: isDailyLoading } = useQuery({
    queryKey: ['daily-actuals', user?.id, selectedMonth],
    queryFn: () => user ? getDailyActuals(user.id, selectedMonth) : Promise.resolve([]),
    enabled: !!user
  });
  
  // 選択日の実績データ
  const { data: currentActual } = useQuery({
    queryKey: ['daily-actual', user?.id, selectedDate],
    queryFn: () => user ? getDailyActual(user.id, selectedDate) : Promise.resolve(null),
    enabled: !!user
  });

  // 日次実績をRecord形式に変換
  const dailyActualsMap = dailyActuals.reduce((acc, daily) => {
    acc[daily.date] = {
      date: daily.date,
      newAcquisitions: daily.new_acquisitions,
      revenue: daily.revenue,
      expenses: daily.expenses,
      channelData: daily.channel_data
    };
    return acc;
  }, {} as Record<string, DailyActual>);
  
  // 日次実績入力フォーム
  const [dailyForm, setDailyForm] = useState({
    newAcquisitions: '',
    revenue: '',
    expenses: '',
    channels: {} as Record<string, { acquisitions: string; cost: string }>
  });

  // 過去12ヶ月の選択肢を生成
  const generateMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = subDays(now, i * 30);
      const value = format(date, 'yyyy-MM');
      const label = format(date, 'yyyy年MM月', { locale: ja });
      options.push({ value, label });
    }
    return options;
  };

  // 選択月の日付リストを生成
  const generateDateOptions = () => {
    const year = parseInt(selectedMonth.split('-')[0]);
    const month = parseInt(selectedMonth.split('-')[1]);
    const daysInMonth = getDaysInMonth(new Date(year, month - 1));
    const options = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const value = format(date, 'yyyy-MM-dd');
      const label = format(date, 'MM月dd日(E)', { locale: ja });
      options.push({ value, label });
    }
    return options;
  };

  const monthOptions = generateMonthOptions();
  const dateOptions = generateDateOptions();
  const selectedPlan = getPlanForMonth(selectedMonth);
  
  // 日次目標の計算
  const getDailyTargets = () => {
    if (!selectedPlan) return null;
    
    const year = parseInt(selectedMonth.split('-')[0]);
    const month = parseInt(selectedMonth.split('-')[1]);
    const daysInMonth = getDaysInMonth(new Date(year, month - 1));
    
    return {
      dailyNewAcquisitions: Math.ceil(selectedPlan.newAcquisitions / daysInMonth),
      dailyRevenue: Math.ceil(selectedPlan.mrr / daysInMonth),
      dailyExpenses: Math.ceil(selectedPlan.expenses / daysInMonth),
      daysInMonth,
      channels: selectedPlan.channels?.map(ch => ({
        ...ch,
        dailyTarget: Math.ceil((selectedPlan.newAcquisitions * (ch.trafficRatio / 100)) / daysInMonth),
        dailyBudget: Math.ceil(ch.budget / daysInMonth)
      })) || []
    };
  };

  const dailyTargets = getDailyTargets();

  // 月間累計実績の計算
  const getMonthlyAccumulated = () => {
    if (!selectedPlan) return null;
    
    const year = parseInt(selectedMonth.split('-')[0]);
    const month = parseInt(selectedMonth.split('-')[1]);
    const selectedDay = parseInt(selectedDate.split('-')[2]);
    
    let totalAcquisitions = 0;
    let totalRevenue = 0;
    let totalExpenses = 0;
    const channelTotals: Record<string, { acquisitions: number; cost: number }> = {};
    
    // 1日から選択日まで累計
    for (let day = 1; day <= selectedDay; day++) {
      const date = format(new Date(year, month - 1, day), 'yyyy-MM-dd');
      const dayActual = dailyActualsMap[date];
      if (dayActual) {
        totalAcquisitions += dayActual.newAcquisitions;
        totalRevenue += dayActual.revenue;
        totalExpenses += dayActual.expenses;
        
        Object.entries(dayActual.channelData).forEach(([channel, data]) => {
          if (!channelTotals[channel]) {
            channelTotals[channel] = { acquisitions: 0, cost: 0 };
          }
          channelTotals[channel].acquisitions += data.acquisitions;
          channelTotals[channel].cost += data.cost;
        });
      }
    }
    
    // 目標に対する進捗
    const targetToDate = {
      acquisitions: dailyTargets!.dailyNewAcquisitions * selectedDay,
      revenue: dailyTargets!.dailyRevenue * selectedDay,
      expenses: dailyTargets!.dailyExpenses * selectedDay
    };
    
    return {
      actual: {
        acquisitions: totalAcquisitions,
        revenue: totalRevenue,
        expenses: totalExpenses,
        channels: channelTotals
      },
      target: targetToDate,
      achievement: {
        acquisitions: targetToDate.acquisitions > 0 ? (totalAcquisitions / targetToDate.acquisitions) * 100 : 0,
        revenue: targetToDate.revenue > 0 ? (totalRevenue / targetToDate.revenue) * 100 : 0,
        expenses: targetToDate.expenses > 0 ? (totalExpenses / targetToDate.expenses) * 100 : 0
      }
    };
  };

  const monthlyAccumulated = getMonthlyAccumulated();

  // 日次実績保存のミューテーション
  const saveDailyMutation = useMutation({
    mutationFn: saveDailyActual,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-actuals'] });
      queryClient.invalidateQueries({ queryKey: ['daily-actual'] });
      
      // フォームリセット
      setDailyForm({
        newAcquisitions: '',
        revenue: '',
        expenses: '',
        channels: {}
      });
    }
  });

  // 日次実績入力
  const handleDailySubmit = () => {
    const channelData = Object.entries(dailyForm.channels).reduce((acc, [channel, data]) => {
      acc[channel] = {
        acquisitions: parseInt(data.acquisitions) || 0,
        cost: parseInt(data.cost) || 0
      };
      return acc;
    }, {} as Record<string, { acquisitions: number; cost: number }>);

    saveDailyMutation.mutate({
      date: selectedDate,
      newAcquisitions: parseInt(dailyForm.newAcquisitions) || 0,
      revenue: parseInt(dailyForm.revenue) || 0,
      expenses: parseInt(dailyForm.expenses) || 0,
      channelData
    });
  };

  // AI分析機能
  const getDailyAIAnalysis = () => {
    if (!dailyTargets || !monthlyAccumulated) return null;
    
    const analysis = {
      urgency: 'medium' as 'low' | 'medium' | 'high',
      status: 'warning' as 'good' | 'warning' | 'critical',
      recommendations: [] as string[],
      todayActions: [] as string[],
      channelInsights: [] as string[]
    };
    
    const selectedDay = parseInt(selectedDate.split('-')[2]);
    const remainingDays = dailyTargets.daysInMonth - selectedDay;
    const acquisitionShortfall = selectedPlan!.newAcquisitions - monthlyAccumulated.actual.acquisitions;
    
    // 緊急度判定
    if (remainingDays <= 5 && monthlyAccumulated.achievement.acquisitions < 80) {
      analysis.urgency = 'high';
      analysis.status = 'critical';
      analysis.recommendations.push(
        `残り${remainingDays}日で${acquisitionShortfall}人の獲得が必要`,
        '広告予算を緊急増額（50%アップ）',
        '全チャネルでの集中投下'
      );
    } else if (remainingDays <= 10 && monthlyAccumulated.achievement.acquisitions < 70) {
      analysis.urgency = 'high';
      analysis.status = 'warning';
      analysis.recommendations.push(
        `1日平均${Math.ceil(acquisitionShortfall / remainingDays)}人の獲得が必要`,
        '広告予算の30%増額',
        'コンバージョン率改善施策の即実行'
      );
    }
    
    // 今日のアクション
    if (currentActual) {
      const todayTarget = dailyTargets.dailyNewAcquisitions;
      const todayActual = currentActual.newAcquisitions;
      
      if (todayActual < todayTarget) {
        analysis.todayActions.push(
          '広告キャンペーンの入札調整',
          'SNS投稿の追加実施',
          'リターゲティング設定の確認'
        );
      } else {
        analysis.todayActions.push(
          '現在の施策を継続',
          '明日に向けた予算配分調整',
          '成功要因の分析・記録'
        );
      }
    } else {
      analysis.todayActions.push(
        '今日の実績を早急に入力',
        '広告パフォーマンスの確認',
        'コンバージョン状況のモニタリング'
      );
    }
    
    // チャネル別インサイト
    dailyTargets.channels.forEach(channel => {
      const channelActual = currentActual?.channelData[channel.name];
      if (channelActual) {
        const actualCpa = channelActual.cost > 0 ? channelActual.cost / Math.max(1, channelActual.acquisitions) : 0;
        if (actualCpa > (channel.targetCpa || 0) * 1.2) {
          analysis.channelInsights.push(
            `${channel.name}: CPA超過 - ターゲティング見直し推奨`
          );
        }
      }
    });
    
    return analysis;
  };

  const aiAnalysis = getDailyAIAnalysis();

  // 日次進捗グラフ用データ生成
  const generateDailyProgressData = () => {
    if (!dailyTargets) return [];
    
    const year = parseInt(selectedMonth.split('-')[0]);
    const month = parseInt(selectedMonth.split('-')[1]);
    const daysInMonth = getDaysInMonth(new Date(year, month - 1));
    const selectedDay = parseInt(selectedDate.split('-')[2]);
    
    const data = [];
    let cumulativeTarget = 0;
    let cumulativeActual = 0;
    
    for (let day = 1; day <= Math.min(selectedDay, daysInMonth); day++) {
      const date = format(new Date(year, month - 1, day), 'yyyy-MM-dd');
      const dayActual = dailyActualsMap[date];
      
      cumulativeTarget += dailyTargets.dailyNewAcquisitions;
      cumulativeActual += dayActual?.newAcquisitions || 0;
      
      data.push({
        day: `${day}日`,
        date,
        target: cumulativeTarget,
        actual: cumulativeActual,
        dailyTarget: dailyTargets.dailyNewAcquisitions,
        dailyActual: dayActual?.newAcquisitions || 0
      });
    }
    
    return data;
  };

  // チャネル別パフォーマンスデータ
  const generateChannelPerformanceData = () => {
    if (!dailyTargets?.channels || !currentActual) return [];
    
    return dailyTargets.channels.map(channel => {
      const actual = currentActual.channelData[channel.name];
      const achievement = actual ? (actual.acquisitions / channel.dailyTarget) * 100 : 0;
      const actualCpa = actual && actual.acquisitions > 0 ? actual.cost / actual.acquisitions : 0;
      
      return {
        name: channel.name,
        target: channel.dailyTarget,
        actual: actual?.acquisitions || 0,
        achievement: Math.round(achievement),
        targetCpa: channel.targetCpa || 0,
        actualCpa: Math.round(actualCpa),
        budget: channel.dailyBudget,
        spent: actual?.cost || 0
      };
    });
  };

  const progressData = generateDailyProgressData();
  const channelData = generateChannelPerformanceData();

  // チャート用カラー
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

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
                    <Calendar className="w-8 h-8 text-primary" />
                    <div>
                      <h1 className="text-3xl font-bold">
                        <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                          日次分析
                        </span>
                      </h1>
                      <p className="text-muted-foreground mt-1">
                        日次目標管理と実績追跡
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-48 glass hover:bg-white/20">
                      <SelectValue placeholder="月を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {monthOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedDate} onValueChange={setSelectedDate}>
                    <SelectTrigger className="w-40 glass hover:bg-white/20">
                      <SelectValue placeholder="日付を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {dateOptions.map((option) => (
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
            {!selectedPlan ? (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  選択した月の計画データがありません。月次計画を作成してください。
                </AlertDescription>
              </Alert>
            ) : (
              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview" className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    概要
                  </TabsTrigger>
                  <TabsTrigger value="input" className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    実績入力
                  </TabsTrigger>
                  <TabsTrigger value="progress" className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    進捗分析
                  </TabsTrigger>
                  <TabsTrigger value="ai-action" className="flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    AI分析
                  </TabsTrigger>
                </TabsList>

                {/* 概要タブ */}
                <TabsContent value="overview" className="space-y-6">
                  {/* 日次目標概要 */}
                  <Card className="glass">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        {format(new Date(selectedDate), 'MM月dd日(E)', { locale: ja })}の目標
                      </CardTitle>
                      <CardDescription>
                        月次目標を日次にブレイクダウンした目標値
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center p-6 border rounded-lg bg-gradient-to-br from-blue-50 to-blue-100">
                          <Users className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                          <div className="text-3xl font-bold text-blue-600 mb-2">
                            {dailyTargets?.dailyNewAcquisitions || 0}人
                          </div>
                          <div className="text-sm text-muted-foreground">新規獲得目標</div>
                          <div className="text-xs text-blue-600 mt-1">
                            月間: {selectedPlan.newAcquisitions}人
                          </div>
                        </div>
                        <div className="text-center p-6 border rounded-lg bg-gradient-to-br from-green-50 to-green-100">
                          <DollarSign className="w-12 h-12 text-green-500 mx-auto mb-3" />
                          <div className="text-3xl font-bold text-green-600 mb-2">
                            ¥{dailyTargets?.dailyRevenue.toLocaleString() || 0}
                          </div>
                          <div className="text-sm text-muted-foreground">日次売上目標</div>
                          <div className="text-xs text-green-600 mt-1">
                            月間: ¥{selectedPlan.mrr.toLocaleString()}
                          </div>
                        </div>
                        <div className="text-center p-6 border rounded-lg bg-gradient-to-br from-purple-50 to-purple-100">
                          <Activity className="w-12 h-12 text-purple-500 mx-auto mb-3" />
                          <div className="text-3xl font-bold text-purple-600 mb-2">
                            ¥{dailyTargets?.dailyExpenses.toLocaleString() || 0}
                          </div>
                          <div className="text-sm text-muted-foreground">日次支出予算</div>
                          <div className="text-xs text-purple-600 mt-1">
                            月間: ¥{selectedPlan.expenses.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 今日の実績サマリー */}
                  <Card className="glass">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        今日の実績サマリー
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {currentActual ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="text-center p-4 border rounded-lg">
                            <div className="text-2xl font-bold mb-2">
                              {currentActual.newAcquisitions}人
                            </div>
                            <div className="text-sm text-muted-foreground mb-2">新規獲得実績</div>
                            <Badge className={
                              currentActual.newAcquisitions >= (dailyTargets?.dailyNewAcquisitions || 0) ? 
                              'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }>
                              {currentActual.newAcquisitions >= (dailyTargets?.dailyNewAcquisitions || 0) ? '目標達成' : '目標未達'}
                            </Badge>
                          </div>
                          <div className="text-center p-4 border rounded-lg">
                            <div className="text-2xl font-bold mb-2">
                              ¥{currentActual.revenue.toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground mb-2">売上実績</div>
                            <Badge className={
                              currentActual.revenue >= (dailyTargets?.dailyRevenue || 0) ? 
                              'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }>
                              {currentActual.revenue >= (dailyTargets?.dailyRevenue || 0) ? '目標達成' : '目標未達'}
                            </Badge>
                          </div>
                          <div className="text-center p-4 border rounded-lg">
                            <div className="text-2xl font-bold mb-2">
                              ¥{currentActual.expenses.toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground mb-2">支出実績</div>
                            <Badge className={
                              currentActual.expenses <= (dailyTargets?.dailyExpenses || 0) ? 
                              'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }>
                              {currentActual.expenses <= (dailyTargets?.dailyExpenses || 0) ? '予算内' : '予算超過'}
                            </Badge>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium mb-2">実績未入力</h3>
                          <p className="text-muted-foreground">
                            今日の実績を入力してください
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* 実績入力タブ */}
                <TabsContent value="input" className="space-y-6">
                  <Card className="glass">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        実績入力
                      </CardTitle>
                      <CardDescription>
                        {format(new Date(selectedDate), 'MM月dd日(E)', { locale: ja })}の実績を入力してください
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div>
                          <Label htmlFor="newAcquisitions">新規獲得数</Label>
                          <Input
                            id="newAcquisitions"
                            type="number"
                            placeholder="0"
                            value={dailyForm.newAcquisitions}
                            onChange={(e) => setDailyForm({...dailyForm, newAcquisitions: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="revenue">日次売上</Label>
                          <Input
                            id="revenue"
                            type="number"
                            placeholder="0"
                            value={dailyForm.revenue}
                            onChange={(e) => setDailyForm({...dailyForm, revenue: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="expenses">日次支出</Label>
                          <Input
                            id="expenses"
                            type="number"
                            placeholder="0"
                            value={dailyForm.expenses}
                            onChange={(e) => setDailyForm({...dailyForm, expenses: e.target.value})}
                          />
                        </div>
                      </div>

                      {/* チャネル別実績入力 */}
                      {dailyTargets?.channels && dailyTargets.channels.length > 0 && (
                        <div className="mb-6">
                          <h3 className="font-semibold mb-4">チャネル別実績</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {dailyTargets.channels.map((channel) => (
                              <div key={channel.name} className="border rounded-lg p-4">
                                <h4 className="font-medium mb-3">{channel.name}</h4>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <Label>獲得数</Label>
                                    <Input
                                      type="number"
                                      placeholder="0"
                                      value={dailyForm.channels[channel.name]?.acquisitions || ''}
                                      onChange={(e) => setDailyForm({
                                        ...dailyForm,
                                        channels: {
                                          ...dailyForm.channels,
                                          [channel.name]: {
                                            ...dailyForm.channels[channel.name],
                                            acquisitions: e.target.value
                                          }
                                        }
                                      })}
                                    />
                                    <div className="text-xs text-muted-foreground mt-1">
                                      目標: {channel.dailyTarget}人
                                    </div>
                                  </div>
                                  <div>
                                    <Label>広告費</Label>
                                    <Input
                                      type="number"
                                      placeholder="0"
                                      value={dailyForm.channels[channel.name]?.cost || ''}
                                      onChange={(e) => setDailyForm({
                                        ...dailyForm,
                                        channels: {
                                          ...dailyForm.channels,
                                          [channel.name]: {
                                            ...dailyForm.channels[channel.name],
                                            cost: e.target.value
                                          }
                                        }
                                      })}
                                    />
                                    <div className="text-xs text-muted-foreground mt-1">
                                      予算: ¥{channel.dailyBudget.toLocaleString()}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <Button 
                        onClick={handleDailySubmit} 
                        className="w-full"
                        disabled={saveDailyMutation.isPending}
                      >
                        {saveDailyMutation.isPending ? '保存中...' : '実績を保存'}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* 進捗分析タブ */}
                <TabsContent value="progress" className="space-y-6">
                  {/* 日次進捗グラフ */}
                  <Card className="glass">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        日次進捗推移
                      </CardTitle>
                      <CardDescription>
                        月初からの累計目標vs実績
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={progressData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="day" />
                            <YAxis />
                            <Tooltip 
                              formatter={(value, name) => [
                                `${value}人`, 
                                name === 'target' ? '累計目標' : '累計実績'
                              ]}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="target" 
                              stroke="#3b82f6" 
                              strokeDasharray="5 5"
                              name="累計目標"
                            />
                            <Line 
                              type="monotone" 
                              dataKey="actual" 
                              stroke="#10b981" 
                              strokeWidth={2}
                              name="累計実績"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 月間累計進捗 */}
                  {monthlyAccumulated && (
                    <Card className="glass">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="w-5 h-5" />
                          月間累計進捗
                        </CardTitle>
                        <CardDescription>
                          {format(new Date(selectedDate), 'MM月dd日', { locale: ja })}時点での月次目標に対する進捗
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {/* 新規獲得進捗 */}
                          <div>
                            <div className="flex justify-between mb-2">
                              <span>新規獲得進捗</span>
                              <span className="font-semibold">
                                {monthlyAccumulated.actual.acquisitions}人 / {selectedPlan.newAcquisitions}人
                              </span>
                            </div>
                            <Progress value={Math.min(monthlyAccumulated.achievement.acquisitions, 100)} className="h-4" />
                            <div className="text-sm text-muted-foreground mt-1">
                              達成率: {Math.round(monthlyAccumulated.achievement.acquisitions)}%
                            </div>
                          </div>

                          {/* 売上進捗 */}
                          <div>
                            <div className="flex justify-between mb-2">
                              <span>売上進捗</span>
                              <span className="font-semibold">
                                ¥{monthlyAccumulated.actual.revenue.toLocaleString()} / ¥{selectedPlan.mrr.toLocaleString()}
                              </span>
                            </div>
                            <Progress value={Math.min(monthlyAccumulated.achievement.revenue, 100)} className="h-4" />
                            <div className="text-sm text-muted-foreground mt-1">
                              達成率: {Math.round(monthlyAccumulated.achievement.revenue)}%
                            </div>
                          </div>

                          {/* 支出進捗 */}
                          <div>
                            <div className="flex justify-between mb-2">
                              <span>支出使用率</span>
                              <span className="font-semibold">
                                ¥{monthlyAccumulated.actual.expenses.toLocaleString()} / ¥{selectedPlan.expenses.toLocaleString()}
                              </span>
                            </div>
                            <Progress value={Math.min(monthlyAccumulated.achievement.expenses, 100)} className="h-4" />
                            <div className="text-sm text-muted-foreground mt-1">
                              使用率: {Math.round(monthlyAccumulated.achievement.expenses)}%
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* チャネル別パフォーマンス */}
                  {channelData.length > 0 && (
                    <Card className="glass">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="w-5 h-5" />
                          チャネル別パフォーマンス
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* 獲得数比較チャート */}
                          <div>
                            <h3 className="font-medium mb-3">獲得数比較</h3>
                            <div className="h-64">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={channelData}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="name" />
                                  <YAxis />
                                  <Tooltip />
                                  <Bar dataKey="target" fill="#e5e7eb" name="目標" />
                                  <Bar dataKey="actual" fill="#3b82f6" name="実績" />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          {/* CPA比較チャート */}
                          <div>
                            <h3 className="font-medium mb-3">CPA比較</h3>
                            <div className="h-64">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={channelData.filter(d => d.targetCpa > 0)}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="name" />
                                  <YAxis />
                                  <Tooltip formatter={(value) => [`¥${value.toLocaleString()}`, '']} />
                                  <Bar dataKey="targetCpa" fill="#fbbf24" name="目標CPA" />
                                  <Bar dataKey="actualCpa" fill="#f59e0b" name="実際CPA" />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* AI分析タブ */}
                <TabsContent value="ai-action" className="space-y-6">
                  {/* AI分析とアクション */}
                  {aiAnalysis && (
                    <Card className="glass">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Brain className="w-5 h-5" />
                          AI分析 & 今日のアクション
                        </CardTitle>
                        <CardDescription>
                          現在の進捗に基づく分析と具体的改善策
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {/* 緊急度表示 */}
                          <div className={`p-4 rounded-lg border-l-4 ${
                            aiAnalysis.urgency === 'high' ? 'border-red-500 bg-red-50' :
                            aiAnalysis.urgency === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                            'border-green-500 bg-green-50'
                          }`}>
                            <div className="flex items-center gap-2 mb-2">
                              {aiAnalysis.urgency === 'high' ? <AlertTriangle className="w-5 h-5 text-red-600" /> :
                               aiAnalysis.urgency === 'medium' ? <Info className="w-5 h-5 text-yellow-600" /> :
                               <CheckCircle className="w-5 h-5 text-green-600" />}
                              <h3 className="font-semibold">
                                分析状況: {aiAnalysis.urgency === 'high' ? '緊急対応必要' :
                                         aiAnalysis.urgency === 'medium' ? '注意が必要' :
                                         '順調'}
                              </h3>
                            </div>
                          </div>

                          {/* 改善提案 */}
                          {aiAnalysis.recommendations.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <Lightbulb className="w-4 h-4" />
                                改善提案
                              </h4>
                              <div className="space-y-2">
                                {aiAnalysis.recommendations.map((rec, index) => (
                                  <div key={index} className="flex items-start gap-3 p-3 bg-white/50 rounded-lg border">
                                    <ArrowRight className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm">{rec}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 今日のアクション */}
                          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border">
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <Zap className="w-4 h-4" />
                              今日実行すべきアクション
                            </h4>
                            <div className="space-y-2">
                              {aiAnalysis.todayActions.map((action, index) => (
                                <div key={index} className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                  {action}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* チャネル別インサイト */}
                          {aiAnalysis.channelInsights.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <Activity className="w-4 h-4" />
                                チャネル別インサイト
                              </h4>
                              <div className="space-y-2">
                                {aiAnalysis.channelInsights.map((insight, index) => (
                                  <div key={index} className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                                    <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-amber-800">{insight}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </main>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}