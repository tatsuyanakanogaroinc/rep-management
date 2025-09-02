'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';

// 型定義
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

// チャネル別差異データの型
interface ChannelVariance {
  name: string;
  planned: {
    acquisitions: number;
    cpa: number;
    cost: number;
  };
  actual: {
    acquisitions: number;
    cpa: number;
    cost: number;
  };
  variance: {
    acquisitions: number;
    acquisitionsPercent: number;
    cpa: number;
    cpaPercent: number;
    cost: number;
    costPercent: number;
  };
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

export default function PlanVsActualStep2Page() {
  console.log('=== PlanVsActualStep2Page rendering ===');
  
  const [selectedMonth, setSelectedMonth] = useState('2024-12');
  const [planData, setPlanData] = useState<MonthlyPlan>(SAMPLE_PLAN_DATA);
  const [actualData, setActualData] = useState<ActualData>({
    month: '2024-12',
    newAcquisitions: 85,
    totalCustomers: 1020,
    churnCount: 45,
    mrr: 520000,
    expenses: 280000,
    channels: [
      { name: 'オーガニック', actualAcquisitions: 35, actualCpa: 0, actualCost: 0 },
      { name: '広告', actualAcquisitions: 25, actualCpa: 5600, actualCost: 140000 },
      { name: 'SNS', actualAcquisitions: 18, actualCpa: 3500, actualCost: 63000 },
      { name: 'リファラル', actualAcquisitions: 7, actualCpa: 1200, actualCost: 8400 },
    ]
  });

  // 月選択肢の生成
  const monthOptions = [];
  for (let i = 0; i < 12; i++) {
    const date = addMonths(new Date(), -i);
    const value = format(date, 'yyyy-MM');
    const label = format(date, 'yyyy年MM月', { locale: ja });
    monthOptions.push({ value, label });
  }

  // 差異計算
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
    
    return varianceData.filter(item => item != null);
  };

  // チャネル別差異計算（安全な実装）
  const calculateChannelVariances = (): ChannelVariance[] => {
    console.log('Calculating channel variances...');
    
    const variances = planData.channels
      .filter(plannedChannel => plannedChannel && plannedChannel.name && typeof plannedChannel.name === 'string')
      .map((plannedChannel) => {
        const actualChannel = actualData.channels.find(c => c && c.name === plannedChannel.name);
        
        if (!actualChannel) {
          console.warn('No actual data found for channel:', plannedChannel.name);
          return null;
        }

        const acquisitionsVariance = actualChannel.actualAcquisitions - plannedChannel.plannedAcquisitions;
        const acquisitionsVariancePercent = plannedChannel.plannedAcquisitions > 0 ? 
          (acquisitionsVariance / plannedChannel.plannedAcquisitions) * 100 : 0;

        const cpaVariance = actualChannel.actualCpa - plannedChannel.plannedCpa;
        const cpaVariancePercent = plannedChannel.plannedCpa > 0 ? 
          (cpaVariance / plannedChannel.plannedCpa) * 100 : 0;

        const costVariance = actualChannel.actualCost - plannedChannel.plannedCost;
        const costVariancePercent = plannedChannel.plannedCost > 0 ? 
          (costVariance / plannedChannel.plannedCost) * 100 : 0;

        return {
          name: plannedChannel.name,
          planned: {
            acquisitions: plannedChannel.plannedAcquisitions,
            cpa: plannedChannel.plannedCpa,
            cost: plannedChannel.plannedCost
          },
          actual: {
            acquisitions: actualChannel.actualAcquisitions,
            cpa: actualChannel.actualCpa,
            cost: actualChannel.actualCost
          },
          variance: {
            acquisitions: acquisitionsVariance,
            acquisitionsPercent: acquisitionsVariancePercent,
            cpa: cpaVariance,
            cpaPercent: cpaVariancePercent,
            cost: costVariance,
            costPercent: costVariancePercent
          }
        };
      })
      .filter(variance => variance !== null) as ChannelVariance[];

    console.log('Channel variances calculated:', variances);
    return variances;
  };

  const varianceData = calculateVariances();
  const channelVariances = calculateChannelVariances();

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

  // チャネル実績更新
  const handleChannelActualChange = (channelName: string, field: keyof ChannelActual, value: number) => {
    console.log('Updating channel:', channelName, field, value);
    setActualData(prev => ({
      ...prev,
      channels: prev.channels
        .filter(channel => channel && channel.name)
        .map(channel => 
          channel.name === channelName ? { ...channel, [field]: value } : channel
        )
    }));
  };

  // グラフデータの準備（安全な形で）
  const prepareChartData = () => {
    return channelVariances
      .filter(variance => variance && variance.name)
      .map(variance => ({
        name: variance.name,
        '計画獲得数': variance.planned.acquisitions,
        '実績獲得数': variance.actual.acquisitions,
        '計画CPA': variance.planned.cpa,
        '実績CPA': variance.actual.cpa,
        '計画コスト': variance.planned.cost / 1000, // 千円単位
        '実績コスト': variance.actual.cost / 1000, // 千円単位
      }));
  };

  const chartData = prepareChartData();

  console.log('Current data:', { planData, actualData, varianceData, channelVariances, chartData });

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6 p-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">予実管理（Step 2 - グラフ追加）</h1>
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
                    .filter(option => option && option.value)
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
                        .filter(item => item && item.metric)
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
                          .filter(channel => channel && channel.name)
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
                      .filter(channel => channel && channel.name)
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
              {/* チャネル別差異詳細 */}
              <Card>
                <CardHeader>
                  <CardTitle>チャネル別パフォーマンス分析</CardTitle>
                  <CardDescription>各流入経路の詳細な予実差異</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {channelVariances
                      .filter(channel => channel && channel.name)
                      .map((channel, index) => (
                        <div key={`variance-detail-${channel.name}-${index}`} className="border rounded-lg p-4">
                          <h4 className="font-semibold text-lg mb-4">{channel.name}</h4>
                        
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* 獲得数 */}
                            <div className="text-center p-3 bg-gray-50 rounded">
                              <div className="text-sm text-muted-foreground mb-1">獲得数</div>
                              <div className="text-lg font-bold">{channel.actual.acquisitions}</div>
                              <div className="text-xs text-muted-foreground">計画: {channel.planned.acquisitions}</div>
                              <div className={`text-sm font-medium mt-1 flex items-center justify-center gap-1 ${
                                getVarianceColor(channel.variance.acquisitions)
                              }`}>
                                {getVarianceIcon(channel.variance.acquisitions)}
                                {channel.variance.acquisitions > 0 ? '+' : ''}{channel.variance.acquisitions}
                                ({channel.variance.acquisitionsPercent > 0 ? '+' : ''}{channel.variance.acquisitionsPercent.toFixed(1)}%)
                              </div>
                            </div>

                            {/* CPA */}
                            <div className="text-center p-3 bg-gray-50 rounded">
                              <div className="text-sm text-muted-foreground mb-1">CPA</div>
                              <div className="text-lg font-bold">
                                {channel.actual.cpa > 0 ? `¥${channel.actual.cpa.toLocaleString()}` : '無料'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                計画: {channel.planned.cpa > 0 ? `¥${channel.planned.cpa.toLocaleString()}` : '無料'}
                              </div>
                              {channel.planned.cpa > 0 && (
                                <div className={`text-sm font-medium mt-1 flex items-center justify-center gap-1 ${
                                  getVarianceColor(-channel.variance.cpa) // CPAは低い方が良いので逆転
                                }`}>
                                  {getVarianceIcon(-channel.variance.cpa)}
                                  ¥{Math.abs(channel.variance.cpa).toLocaleString()}
                                  ({channel.variance.cpaPercent > 0 ? '+' : ''}{channel.variance.cpaPercent.toFixed(1)}%)
                                </div>
                              )}
                            </div>

                            {/* コスト */}
                            <div className="text-center p-3 bg-gray-50 rounded">
                              <div className="text-sm text-muted-foreground mb-1">コスト</div>
                              <div className="text-lg font-bold">¥{channel.actual.cost.toLocaleString()}</div>
                              <div className="text-xs text-muted-foreground">計画: ¥{channel.planned.cost.toLocaleString()}</div>
                              <div className={`text-sm font-medium mt-1 flex items-center justify-center gap-1 ${
                                getVarianceColor(-channel.variance.cost) // コストも低い方が良いので逆転
                              }`}>
                                {getVarianceIcon(-channel.variance.cost)}
                                ¥{Math.abs(channel.variance.cost).toLocaleString()}
                                ({channel.variance.costPercent > 0 ? '+' : ''}{channel.variance.costPercent.toFixed(1)}%)
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* グラフ表示 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 獲得数比較グラフ */}
                <Card>
                  <CardHeader>
                    <CardTitle>チャネル別獲得数比較</CardTitle>
                    <CardDescription>計画vs実績（棒グラフ）</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData.filter(item => item && item.name)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" fontSize={12} />
                          <YAxis fontSize={12} />
                          <Tooltip 
                            formatter={(value: number, name: string) => [
                              `${value}人`,
                              name === '計画獲得数' ? '計画獲得数' : '実績獲得数'
                            ]}
                          />
                          <Legend />
                          <Bar dataKey="計画獲得数" fill="#3b82f6" name="計画獲得数" opacity={0.8} />
                          <Bar dataKey="実績獲得数" fill="#ef4444" name="実績獲得数" opacity={0.9} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* CPA比較グラフ */}
                <Card>
                  <CardHeader>
                    <CardTitle>チャネル別CPA比較</CardTitle>
                    <CardDescription>計画vs実績（線グラフ）</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData.filter(item => item && item.name)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" fontSize={12} />
                          <YAxis fontSize={12} />
                          <Tooltip 
                            formatter={(value: number, name: string) => [
                              `¥${value.toLocaleString()}`,
                              name === '計画CPA' ? '計画CPA' : '実績CPA'
                            ]}
                          />
                          <Legend />
                          <Line type="monotone" dataKey="計画CPA" stroke="#3b82f6" strokeWidth={2} name="計画CPA" />
                          <Line type="monotone" dataKey="実績CPA" stroke="#ef4444" strokeWidth={2} name="実績CPA" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}