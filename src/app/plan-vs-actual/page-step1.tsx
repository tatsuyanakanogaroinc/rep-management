'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState, useEffect } from 'react';
import { format, addMonths } from 'date-fns';
import { ja } from 'date-fns/locale';
import { 
  Target, 
  TrendingUp, 
  DollarSign, 
  Users, 
  BarChart3,
  Calculator,
  ArrowUp,
  ArrowDown,
  Minus,
  Radio
} from 'lucide-react';

// 型定義（安全な形で定義）
interface MonthlyPlan {
  month: string;
  newAcquisitions: number;
  totalCustomers: number;
  churnCount: number;
  mrr: number;
  expenses: number;
  channels: ChannelPlan[];
}

interface ChannelPlan {
  name: string;
  plannedAcquisitions: number;
  plannedCpa: number;
  plannedCost: number;
}

interface ActualData {
  month: string;
  newAcquisitions: number;
  totalCustomers: number;
  churnCount: number;
  mrr: number;
  expenses: number;
  channels: ChannelActual[];
}

interface ChannelActual {
  name: string;
  actualAcquisitions: number;
  actualCpa: number;
  actualCost: number;
}

// 安全なサンプルデータ
const SAMPLE_PLAN_DATA: MonthlyPlan = {
  month: '2024-12',
  newAcquisitions: 100,
  totalCustomers: 1000,
  churnCount: 50,
  mrr: 500000,
  expenses: 300000,
  channels: [
    { name: 'オーガニック', plannedAcquisitions: 40, plannedCpa: 0, plannedCost: 0 },
    { name: '広告', plannedAcquisitions: 30, plannedCpa: 5000, plannedCost: 150000 },
    { name: 'SNS', plannedAcquisitions: 20, plannedCpa: 3000, plannedCost: 60000 },
    { name: 'リファラル', plannedAcquisitions: 10, plannedCpa: 1000, plannedCost: 10000 },
  ]
};

export default function PlanVsActualStep1Page() {
  console.log('=== PlanVsActualStep1Page rendering ===');
  
  const [selectedMonth, setSelectedMonth] = useState('2024-12');
  const [planData, setPlanData] = useState<MonthlyPlan>(SAMPLE_PLAN_DATA);
  const [actualData, setActualData] = useState<ActualData>({
    month: '2024-12',
    newAcquisitions: 0,
    totalCustomers: 0,
    churnCount: 0,
    mrr: 0,
    expenses: 0,
    channels: SAMPLE_PLAN_DATA.channels.map(ch => ({
      name: ch.name,
      actualAcquisitions: 0,
      actualCpa: 0,
      actualCost: 0,
    }))
  });

  // 月選択肢の生成（安全な形で）
  const monthOptions = [];
  for (let i = 0; i < 12; i++) {
    const date = addMonths(new Date(), -i);
    const value = format(date, 'yyyy-MM');
    const label = format(date, 'yyyy年MM月', { locale: ja });
    monthOptions.push({ value, label });
  }

  // 差異計算（安全な形で）
  const calculateVariances = () => {
    const varianceData = [
      {
        metric: '新規獲得数',
        planned: planData.newAcquisitions,
        actual: actualData.newAcquisitions,
        variance: actualData.newAcquisitions - planData.newAcquisitions,
        unit: '人'
      },
      {
        metric: 'MRR',
        planned: planData.mrr,
        actual: actualData.mrr,
        variance: actualData.mrr - planData.mrr,
        unit: '円'
      },
      {
        metric: 'チャーン数',
        planned: planData.churnCount,
        actual: actualData.churnCount,
        variance: actualData.churnCount - planData.churnCount,
        unit: '人'
      },
      {
        metric: '支出',
        planned: planData.expenses,
        actual: actualData.expenses,
        variance: actualData.expenses - planData.expenses,
        unit: '円'
      }
    ];
    
    return varianceData.filter(item => item != null); // 安全なフィルタリング
  };

  const varianceData = calculateVariances();

  const getVarianceIcon = (variance: number) => {
    if (variance > 0) return <ArrowUp className="w-4 h-4" />;
    if (variance < 0) return <ArrowDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return 'text-green-600';
    if (variance < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  // チャネル実績更新（安全な形で）
  const handleChannelActualChange = (channelName: string, field: keyof ChannelActual, value: number) => {
    console.log('Updating channel:', channelName, field, value);
    setActualData(prev => ({
      ...prev,
      channels: prev.channels
        .filter(channel => channel && channel.name) // 安全フィルタ
        .map(channel => 
          channel.name === channelName ? { ...channel, [field]: value } : channel
        )
    }));
  };

  console.log('Current data:', { planData, actualData, varianceData });

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6 p-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">予実管理（段階復元版）</h1>
            <p className="text-muted-foreground">計画と実績の比較分析</p>
          </div>

          {/* 月選択 */}
          <Card>
            <CardHeader>
              <CardTitle>対象月選択</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="月を選択" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions
                    .filter(option => option && option.value) // 安全フィルタ
                    .map((option, index) => (
                      <SelectItem key={`month-${option.value}-${index}`} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">概要</TabsTrigger>
              <TabsTrigger value="input">実績入力</TabsTrigger>
              <TabsTrigger value="analysis">詳細分析</TabsTrigger>
            </TabsList>

            {/* 概要タブ */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 差異サマリー */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      予実差異サマリー
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {varianceData
                        .filter(item => item && item.metric) // 安全フィルタ
                        .map((item, index) => (
                          <div key={`variance-${index}`} className="flex justify-between items-center p-3 border rounded">
                            <span className="font-medium">{item.metric}</span>
                            <div className="text-right">
                              <div className="font-semibold">
                                {item.actual.toLocaleString()}{item.unit}
                              </div>
                              <div className={`flex items-center gap-1 text-sm ${getVarianceColor(item.variance)}`}>
                                {getVarianceIcon(item.variance)}
                                {item.variance > 0 ? '+' : ''}{item.variance.toLocaleString()}{item.unit}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>

                {/* 計画データ表示 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      月次計画
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>新規獲得数</span>
                        <span className="font-semibold">{planData.newAcquisitions}人</span>
                      </div>
                      <div className="flex justify-between">
                        <span>MRR</span>
                        <span className="font-semibold">¥{planData.mrr.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>チャーン数</span>
                        <span className="font-semibold">{planData.churnCount}人</span>
                      </div>
                      <div className="flex justify-between">
                        <span>支出予算</span>
                        <span className="font-semibold">¥{planData.expenses.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t mt-4">
                      <h4 className="font-medium text-sm mb-3">チャネル別計画</h4>
                      <div className="space-y-2">
                        {planData.channels
                          .filter(channel => channel && channel.name) // 安全フィルタ
                          .map((channel, index) => (
                            <div key={`plan-channel-${channel.name}-${index}`} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <span className="text-sm">{channel.name}</span>
                              <div className="text-right">
                                <div className="text-sm font-medium">{channel.plannedAcquisitions}人</div>
                                <div className="text-xs text-muted-foreground">
                                  CPA: {channel.plannedCpa > 0 ? `¥${channel.plannedCpa.toLocaleString()}` : '無料'}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* 実績入力タブ */}
            <TabsContent value="input" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* チャネル別実績入力 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Radio className="w-5 h-5" />
                      チャネル別実績
                    </CardTitle>
                    <CardDescription>
                      各流入経路の実績値を入力
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {actualData.channels
                      .filter(channel => channel && channel.name) // 安全フィルタ
                      .map((channel, index) => {
                        const plannedChannel = planData.channels.find(p => p && p.name === channel.name);
                        
                        return (
                          <div key={`actual-channel-${channel.name}-${index}`} className="border rounded-lg p-4 space-y-3">
                            <h4 className="font-medium">{channel.name}</h4>
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <Label htmlFor={`${channel.name}-acquisitions`} className="text-xs">獲得数</Label>
                                <Input
                                  id={`${channel.name}-acquisitions`}
                                  type="number"
                                  value={channel.actualAcquisitions}
                                  onChange={(e) => handleChannelActualChange(channel.name, 'actualAcquisitions', parseInt(e.target.value) || 0)}
                                  placeholder="0"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  計画: {plannedChannel?.plannedAcquisitions || 0}人
                                </p>
                              </div>
                              <div>
                                <Label htmlFor={`${channel.name}-cpa`} className="text-xs">実際のCPA</Label>
                                <Input
                                  id={`${channel.name}-cpa`}
                                  type="number"
                                  value={channel.actualCpa}
                                  onChange={(e) => handleChannelActualChange(channel.name, 'actualCpa', parseInt(e.target.value) || 0)}
                                  placeholder="0"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  計画: {plannedChannel?.plannedCpa ? `¥${plannedChannel.plannedCpa.toLocaleString()}` : '無料'}
                                </p>
                              </div>
                              <div>
                                <Label htmlFor={`${channel.name}-cost`} className="text-xs">実際のコスト</Label>
                                <Input
                                  id={`${channel.name}-cost`}
                                  type="number"
                                  value={channel.actualCost}
                                  onChange={(e) => handleChannelActualChange(channel.name, 'actualCost', parseInt(e.target.value) || 0)}
                                  placeholder="0"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  計画: ¥{plannedChannel?.plannedCost.toLocaleString() || '0'}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </CardContent>
                </Card>

                {/* 基本KPI入力 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="w-5 h-5" />
                      基本実績
                    </CardTitle>
                    <CardDescription>
                      月次の基本KPI実績値を入力
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="newAcquisitions">新規獲得数</Label>
                      <Input
                        id="newAcquisitions"
                        type="number"
                        value={actualData.newAcquisitions}
                        onChange={(e) => setActualData(prev => ({
                          ...prev,
                          newAcquisitions: parseInt(e.target.value) || 0
                        }))}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="mrr">MRR</Label>
                      <Input
                        id="mrr"
                        type="number"
                        value={actualData.mrr}
                        onChange={(e) => setActualData(prev => ({
                          ...prev,
                          mrr: parseInt(e.target.value) || 0
                        }))}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="churnCount">チャーン数</Label>
                      <Input
                        id="churnCount"
                        type="number"
                        value={actualData.churnCount}
                        onChange={(e) => setActualData(prev => ({
                          ...prev,
                          churnCount: parseInt(e.target.value) || 0
                        }))}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="expenses">総支出</Label>
                      <Input
                        id="expenses"
                        type="number"
                        value={actualData.expenses}
                        onChange={(e) => setActualData(prev => ({
                          ...prev,
                          expenses: parseInt(e.target.value) || 0
                        }))}
                        placeholder="0"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* 詳細分析タブ */}
            <TabsContent value="analysis" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>詳細分析</CardTitle>
                  <CardDescription>チャネル別パフォーマンス分析</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    詳細分析機能は次のステップで追加予定
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}