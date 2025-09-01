'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { useAuthContext } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Save,
  Calculator,
  ArrowUp,
  ArrowDown,
  Minus,
  Radio
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import { useMonthlyPlanning, type MonthlyPlan, type ChannelPlan } from '@/hooks/useMonthlyPlanning';
import { useDailyActuals } from '@/hooks/useDailyActuals';

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

interface VarianceData {
  metric: string;
  planned: number;
  actual: number;
  variance: number;
  variancePercent: number;
  unit: string;
}

export default function PlanVsActualPage() {
  const { userProfile } = useAuthContext();
  const { getPlanForMonth } = useMonthlyPlanning();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return format(now, 'yyyy-MM');
  });
  const { monthlyTotals: actualFromDaily } = useDailyActuals(selectedMonth);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // 月次計画データを取得
  const planData = getPlanForMonth(selectedMonth) || {
    month: selectedMonth,
    monthLabel: format(new Date(selectedMonth + '-01'), 'yyyy年MM月', { locale: ja }),
    newAcquisitions: 0,
    totalCustomers: 0,
    churnCount: 0,
    retainedCustomers: 0,
    mrr: 0,
    expenses: 0,
    profit: 0,
    cumulativeProfit: 0,
    channels: [],
    pl: {
      revenue: { monthlySubscription: 0, yearlySubscription: 0, total: 0 },
      costs: { channelCosts: 0, operatingExpenses: 0, total: 0 },
      grossProfit: 0,
      grossMargin: 0,
      netProfit: 0,
      netMargin: 0
    }
  } as MonthlyPlan;

  // 実績データ（日次データから計算または手動入力）
  const [actualData, setActualData] = useState<ActualData>(() => ({
    month: selectedMonth,
    newAcquisitions: actualFromDaily.newAcquisitions || 0,
    totalCustomers: 0,
    churnCount: 0,
    mrr: actualFromDaily.revenue || 0,
    expenses: actualFromDaily.expenses || 0,
    channels: planData.channels.map(channel => ({
      name: channel.name,
      actualAcquisitions: actualFromDaily.channels[channel.name]?.acquisitions || 0,
      actualCpa: actualFromDaily.channels[channel.name]?.acquisitions > 0 ? 
        actualFromDaily.channels[channel.name].cost / actualFromDaily.channels[channel.name].acquisitions : 0,
      actualCost: actualFromDaily.channels[channel.name]?.cost || 0
    }))
  }));

  // 日次データまたは月変更時に実績データを更新
  useEffect(() => {
    setActualData(prev => ({
      ...prev,
      month: selectedMonth,
      newAcquisitions: actualFromDaily.newAcquisitions || prev.newAcquisitions,
      mrr: actualFromDaily.revenue || prev.mrr,
      expenses: actualFromDaily.expenses || prev.expenses,
      channels: planData.channels.map(channel => {
        const existingChannel = prev.channels.find(c => c.name === channel.name);
        const dailyChannel = actualFromDaily.channels[channel.name];
        
        if (dailyChannel) {
          return {
            name: channel.name,
            actualAcquisitions: dailyChannel.acquisitions,
            actualCpa: dailyChannel.acquisitions > 0 ? dailyChannel.cost / dailyChannel.acquisitions : 0,
            actualCost: dailyChannel.cost
          };
        }
        
        return existingChannel || {
          name: channel.name,
          actualAcquisitions: 0,
          actualCpa: 0,
          actualCost: 0
        };
      })
    }));
  }, [selectedMonth, planData.channels, actualFromDaily]);

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

  // 差分計算
  const calculateVariance = (): VarianceData[] => {
    const variances: VarianceData[] = [
      {
        metric: '新規獲得',
        planned: planData.newAcquisitions,
        actual: actualData.newAcquisitions,
        variance: actualData.newAcquisitions - planData.newAcquisitions,
        variancePercent: planData.newAcquisitions > 0 ? 
          ((actualData.newAcquisitions - planData.newAcquisitions) / planData.newAcquisitions) * 100 : 0,
        unit: '人'
      },
      {
        metric: '総顧客数',
        planned: planData.totalCustomers,
        actual: actualData.totalCustomers,
        variance: actualData.totalCustomers - planData.totalCustomers,
        variancePercent: planData.totalCustomers > 0 ? 
          ((actualData.totalCustomers - planData.totalCustomers) / planData.totalCustomers) * 100 : 0,
        unit: '人'
      },
      {
        metric: 'チャーン数',
        planned: planData.churnCount,
        actual: actualData.churnCount,
        variance: actualData.churnCount - planData.churnCount,
        variancePercent: planData.churnCount > 0 ? 
          ((actualData.churnCount - planData.churnCount) / planData.churnCount) * 100 : 0,
        unit: '人'
      },
      {
        metric: 'MRR',
        planned: planData.mrr,
        actual: actualData.mrr,
        variance: actualData.mrr - planData.mrr,
        variancePercent: planData.mrr > 0 ? 
          ((actualData.mrr - planData.mrr) / planData.mrr) * 100 : 0,
        unit: '円'
      },
      {
        metric: '支出',
        planned: planData.expenses,
        actual: actualData.expenses,
        variance: actualData.expenses - planData.expenses,
        variancePercent: planData.expenses > 0 ? 
          ((actualData.expenses - planData.expenses) / planData.expenses) * 100 : 0,
        unit: '円'
      },
      {
        metric: '利益',
        planned: planData.profit,
        actual: actualData.mrr - actualData.expenses,
        variance: (actualData.mrr - actualData.expenses) - planData.profit,
        variancePercent: planData.profit !== 0 ? 
          (((actualData.mrr - actualData.expenses) - planData.profit) / Math.abs(planData.profit)) * 100 : 0,
        unit: '円'
      }
    ];

    return variances;
  };

  const varianceData = calculateVariance();

  // 実績データ更新
  const handleActualChange = (field: keyof ActualData, value: number) => {
    setActualData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // チャネル実績更新
  const handleChannelActualChange = (channelName: string, field: keyof ChannelActual, value: number) => {
    setActualData(prev => ({
      ...prev,
      channels: prev.channels.map(channel => 
        channel.name === channelName ? { ...channel, [field]: value } : channel
      )
    }));
  };

  // チャネル別CPA差異計算
  const calculateChannelVariances = () => {
    return planData.channels.map((plannedChannel) => {
      const actualChannel = actualData.channels.find(c => c.name === plannedChannel.name);
      if (!actualChannel) return null;

      const cpaVariance = actualChannel.actualCpa - plannedChannel.plannedCpa;
      const cpaVariancePercent = plannedChannel.plannedCpa > 0 ? 
        (cpaVariance / plannedChannel.plannedCpa) * 100 : 0;
      const acquisitionVariance = actualChannel.actualAcquisitions - plannedChannel.plannedAcquisitions;
      const acquisitionVariancePercent = plannedChannel.plannedAcquisitions > 0 ? 
        (acquisitionVariance / plannedChannel.plannedAcquisitions) * 100 : 0;
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
          acquisitions: acquisitionVariance,
          acquisitionsPercent: acquisitionVariancePercent,
          cpa: cpaVariance,
          cpaPercent: cpaVariancePercent,
          cost: costVariance,
          costPercent: costVariancePercent
        }
      };
    }).filter(Boolean);
  };

  const channelVariances = calculateChannelVariances();

  // 実績データ保存
  const handleSaveActuals = async () => {
    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      // TODO: 実際のデータベース保存処理
      await new Promise(resolve => setTimeout(resolve, 1000)); // 模擬的な保存処理
      setSuccessMessage('実績データを保存しました！');
    } catch (error) {
      console.error('Save error:', error);
      setErrorMessage('実績データの保存中にエラーが発生しました');
    } finally {
      setIsSaving(false);
    }
  };

  // メッセージを3秒後に消す
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
        setErrorMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  // 差分の表示色を決定
  const getVarianceColor = (variance: number, isInverted: boolean = false) => {
    if (variance === 0) return 'text-gray-600';
    const isPositive = isInverted ? variance < 0 : variance > 0;
    return isPositive ? 'text-green-600' : 'text-red-600';
  };

  // 差分アイコンを決定
  const getVarianceIcon = (variance: number, isInverted: boolean = false) => {
    if (variance === 0) return <Minus className="w-4 h-4" />;
    const isPositive = isInverted ? variance < 0 : variance > 0;
    return isPositive ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

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
                  <Target className="w-8 h-8 text-primary" />
                  <div>
                    <h1 className="text-2xl font-bold">
                      <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        予実管理
                      </span>
                    </h1>
                    <p className="text-muted-foreground mt-1">
                      月次計画と実績の比較分析
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
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
              </div>
            </div>
          </div>
        </header>

        {/* メッセージ */}
        {successMessage && (
          <Alert className="m-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        {errorMessage && (
          <Alert variant="destructive" className="m-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* メインコンテンツ */}
        <main className="relative z-10 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="overview" className="space-y-8">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">予実対比</TabsTrigger>
              <TabsTrigger value="input">実績入力</TabsTrigger>
              <TabsTrigger value="channels">チャネル別分析</TabsTrigger>
            </TabsList>

            {/* 予実対比タブ */}
            <TabsContent value="overview" className="space-y-6">
              {/* サマリーカード */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {planData.newAcquisitions}
                      </div>
                      <p className="text-sm text-muted-foreground">計画新規獲得</p>
                      <div className="text-lg font-semibold mt-2">
                        {actualData.newAcquisitions}
                      </div>
                      <p className="text-xs text-muted-foreground">実績</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        ¥{planData.mrr.toLocaleString()}
                      </div>
                      <p className="text-sm text-muted-foreground">計画MRR</p>
                      <div className="text-lg font-semibold mt-2">
                        ¥{actualData.mrr.toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground">実績</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        ¥{planData.profit.toLocaleString()}
                      </div>
                      <p className="text-sm text-muted-foreground">計画利益</p>
                      <div className="text-lg font-semibold mt-2">
                        ¥{(actualData.mrr - actualData.expenses).toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground">実績</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 予実対比表 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    予実対比詳細
                  </CardTitle>
                  <CardDescription>
                    {format(new Date(selectedMonth + '-01'), 'yyyy年MM月', { locale: ja })}の計画vs実績
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3">項目</th>
                          <th className="text-right p-3">計画</th>
                          <th className="text-right p-3">実績</th>
                          <th className="text-right p-3">差分</th>
                          <th className="text-right p-3">差分率</th>
                        </tr>
                      </thead>
                      <tbody>
                        {varianceData.map((item) => (
                          <tr key={item.metric} className="border-b hover:bg-gray-50">
                            <td className="p-3 font-medium">{item.metric}</td>
                            <td className="p-3 text-right">
                              {item.unit === '円' ? `¥${item.planned.toLocaleString()}` : `${item.planned}${item.unit}`}
                            </td>
                            <td className="p-3 text-right">
                              {item.unit === '円' ? `¥${item.actual.toLocaleString()}` : `${item.actual}${item.unit}`}
                            </td>
                            <td className={`p-3 text-right ${getVarianceColor(item.variance, item.metric === 'チャーン数' || item.metric === '支出')}`}>
                              <div className="flex items-center justify-end gap-1">
                                {getVarianceIcon(item.variance, item.metric === 'チャーン数' || item.metric === '支出')}
                                {item.unit === '円' ? `¥${Math.abs(item.variance).toLocaleString()}` : `${Math.abs(item.variance)}${item.unit}`}
                              </div>
                            </td>
                            <td className={`p-3 text-right font-semibold ${getVarianceColor(item.variance, item.metric === 'チャーン数' || item.metric === '支出')}`}>
                              {item.variancePercent > 0 ? '+' : ''}{item.variancePercent.toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* 予実グラフ */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>主要指標の予実対比</CardTitle>
                    <CardDescription>
                      計画値と実績値の比較（棒グラフ）
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={varianceData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="metric" fontSize={12} />
                          <YAxis 
                            fontSize={12}
                            tickFormatter={(value) => {
                              if (value >= 1000000) return `¥${(value / 1000000).toFixed(1)}M`;
                              if (value >= 1000) return `¥${(value / 1000).toFixed(0)}k`;
                              return value.toString();
                            }}
                          />
                          <Tooltip 
                            formatter={(value: number, name: string, props: any) => {
                              const unit = props.payload.unit;
                              const formattedValue = unit === '円' ? `¥${value.toLocaleString()}` : `${value}${unit}`;
                              return [formattedValue, name === 'planned' ? '計画' : '実績'];
                            }}
                          />
                          <Legend />
                          <Bar dataKey="planned" fill="#3b82f6" name="計画" opacity={0.8} />
                          <Bar dataKey="actual" fill="#10b981" name="実績" opacity={0.9} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>達成率の視覚化</CardTitle>
                    <CardDescription>
                      各指標の目標達成状況（ドーナツチャート風）
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {varianceData.map((item) => {
                        const achievementRate = item.planned > 0 ? (item.actual / item.planned) * 100 : 0;
                        const isInverted = item.metric === 'チャーン数' || item.metric === '支出';
                        const displayRate = isInverted ? Math.max(0, 200 - achievementRate) : achievementRate;
                        
                        return (
                          <div key={item.metric} className="text-center p-4 border rounded-lg">
                            <div className="relative w-20 h-20 mx-auto mb-3">
                              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                                <circle
                                  cx="50"
                                  cy="50"
                                  r="40"
                                  stroke="currentColor"
                                  strokeWidth="8"
                                  fill="transparent"
                                  className="text-gray-200"
                                />
                                <circle
                                  cx="50"
                                  cy="50"
                                  r="40"
                                  stroke="currentColor"
                                  strokeWidth="8"
                                  fill="transparent"
                                  strokeDasharray={`${Math.min(100, displayRate) * 2.51} 251`}
                                  className={displayRate >= 100 ? "text-green-500" : displayRate >= 80 ? "text-yellow-500" : "text-red-500"}
                                />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-sm font-bold">
                                  {Math.round(achievementRate)}%
                                </span>
                              </div>
                            </div>
                            <h4 className="font-medium text-sm">{item.metric}</h4>
                            <p className="text-xs text-muted-foreground">
                              {item.unit === '円' ? `¥${item.actual.toLocaleString()}` : `${item.actual}${item.unit}`} / 
                              {item.unit === '円' ? `¥${item.planned.toLocaleString()}` : `${item.planned}${item.unit}`}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* 実績入力タブ */}
            <TabsContent value="input" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 基本実績入力 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="w-5 h-5" />
                      基本実績入力
                    </CardTitle>
                    <CardDescription>
                      {format(new Date(selectedMonth + '-01'), 'yyyy年MM月', { locale: ja })}の実績値を入力
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="newAcquisitions">新規獲得数</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="newAcquisitions"
                          type="number"
                          value={actualData.newAcquisitions}
                          onChange={(e) => handleActualChange('newAcquisitions', parseInt(e.target.value) || 0)}
                          placeholder="実際の新規獲得数"
                        />
                        <span className="text-sm text-muted-foreground">人</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        計画: {planData.newAcquisitions}人
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="totalCustomers">総顧客数</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="totalCustomers"
                          type="number"
                          value={actualData.totalCustomers}
                          onChange={(e) => handleActualChange('totalCustomers', parseInt(e.target.value) || 0)}
                          placeholder="月末時点の総顧客数"
                        />
                        <span className="text-sm text-muted-foreground">人</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        計画: {planData.totalCustomers}人
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="churnCount">チャーン数</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="churnCount"
                          type="number"
                          value={actualData.churnCount}
                          onChange={(e) => handleActualChange('churnCount', parseInt(e.target.value) || 0)}
                          placeholder="解約した顧客数"
                        />
                        <span className="text-sm text-muted-foreground">人</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        計画: {planData.churnCount}人
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="mrr">MRR</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="mrr"
                          type="number"
                          value={actualData.mrr}
                          onChange={(e) => handleActualChange('mrr', parseInt(e.target.value) || 0)}
                          placeholder="月次経常収益"
                        />
                        <span className="text-sm text-muted-foreground">円</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        計画: ¥{planData.mrr.toLocaleString()}
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="expenses">総支出</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="expenses"
                          type="number"
                          value={actualData.expenses}
                          onChange={(e) => handleActualChange('expenses', parseInt(e.target.value) || 0)}
                          placeholder="月間総支出"
                        />
                        <span className="text-sm text-muted-foreground">円</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        計画: ¥{planData.expenses.toLocaleString()}
                      </p>
                    </div>

                    <Button 
                      onClick={handleSaveActuals}
                      disabled={isSaving}
                      className="w-full mt-6"
                    >
                      {isSaving ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      実績データを保存
                    </Button>
                  </CardContent>
                </Card>

                {/* 計画データ表示 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      月次計画データ
                    </CardTitle>
                    <CardDescription>
                      {format(new Date(selectedMonth + '-01'), 'yyyy年MM月', { locale: ja })}の計画値
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">新規獲得</span>
                          <span className="font-medium">{planData.newAcquisitions}人</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">総顧客数</span>
                          <span className="font-medium">{planData.totalCustomers}人</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">チャーン</span>
                          <span className="font-medium">{planData.churnCount}人</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">MRR</span>
                          <span className="font-medium">¥{planData.mrr.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">支出</span>
                          <span className="font-medium">¥{planData.expenses.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">利益</span>
                          <span className="font-medium">¥{planData.profit.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="font-medium text-sm mb-3">チャネル別計画</h4>
                      <div className="space-y-2">
                        {planData.channels.map((channel, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span className="text-sm">{channel.name}</span>
                            <div className="text-right">
                              <div className="text-sm font-medium">{channel.plannedAcquisitions}人</div>
                              <div className="text-xs text-muted-foreground">
                                CPA: {channel.plannedCpa > 0 ? `¥${channel.plannedCpa.toLocaleString()}` : '無料'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                コスト: ¥{channel.plannedCost.toLocaleString()}
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
                    {actualData.channels.map((channel) => {
                      const plannedChannel = planData.channels.find(p => p.name === channel.name);
                      
                      return (
                        <div key={channel.name} className="border rounded-lg p-4 space-y-3">
                          <h4 className="font-medium">{channel.name}</h4>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <Label className="text-xs">獲得数</Label>
                              <Input
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
                              <Label className="text-xs">実際のCPA</Label>
                              <Input
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
                              <Label className="text-xs">実際のコスト</Label>
                              <Input
                                type="number"
                                value={channel.actualCost}
                                onChange={(e) => handleChannelActualChange(channel.name, 'actualCost', parseInt(e.target.value) || 0)}
                                placeholder="0"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                計画: {plannedChannel?.plannedCost ? `¥${plannedChannel.plannedCost.toLocaleString()}` : '¥0'}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* 自動計算フィールド */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="w-5 h-5" />
                      自動計算
                    </CardTitle>
                    <CardDescription>
                      チャネル実績から自動計算される値
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium mb-3">チャネル実績サマリー</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>総獲得数</span>
                          <span className="font-medium">
                            {actualData.channels.reduce((sum, c) => sum + c.actualAcquisitions, 0)}人
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>総広告費</span>
                          <span className="font-medium">
                            ¥{actualData.channels.reduce((sum, c) => sum + c.actualCost, 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>平均CPA</span>
                          <span className="font-medium">
                            ¥{(() => {
                              const totalAcquisitions = actualData.channels.reduce((sum, c) => sum + c.actualAcquisitions, 0);
                              const totalCost = actualData.channels.reduce((sum, c) => sum + c.actualCost, 0);
                              return totalAcquisitions > 0 ? Math.round(totalCost / totalAcquisitions).toLocaleString() : '0';
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        チャネル別の実績を入力すると、全体の実績値に自動反映する機能は今後追加予定です。
                        現在は基本実績とチャネル実績を個別に入力してください。
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* チャネル別分析タブ */}
            <TabsContent value="channels" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Radio className="w-5 h-5" />
                    チャネル別予実分析
                  </CardTitle>
                  <CardDescription>
                    各流入経路の詳細な予実対比
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {channelVariances.map((channel, index) => (
                      channel && (
                        <div key={index} className="border rounded-lg p-4">
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
                            <div className="text-lg font-bold">¥{channel.actual.cpa.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">計画: ¥{channel.planned.cpa.toLocaleString()}</div>
                            <div className={`text-sm font-medium mt-1 flex items-center justify-center gap-1 ${
                              getVarianceColor(channel.variance.cpa, true)
                            }`}>
                              {getVarianceIcon(channel.variance.cpa, true)}
                              ¥{Math.abs(channel.variance.cpa).toLocaleString()}
                              ({channel.variance.cpaPercent > 0 ? '+' : ''}{channel.variance.cpaPercent.toFixed(1)}%)
                            </div>
                          </div>

                          {/* コスト */}
                          <div className="text-center p-3 bg-gray-50 rounded">
                            <div className="text-sm text-muted-foreground mb-1">総コスト</div>
                            <div className="text-lg font-bold">¥{channel.actual.cost.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">計画: ¥{channel.planned.cost.toLocaleString()}</div>
                            <div className={`text-sm font-medium mt-1 flex items-center justify-center gap-1 ${
                              getVarianceColor(channel.variance.cost, true)
                            }`}>
                              {getVarianceIcon(channel.variance.cost, true)}
                              ¥{Math.abs(channel.variance.cost).toLocaleString()}
                              ({channel.variance.costPercent > 0 ? '+' : ''}{channel.variance.costPercent.toFixed(1)}%)
                            </div>
                          </div>
                        </div>
                        </div>
                      )
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* チャネル別パフォーマンスグラフ */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>チャネル別CPA比較</CardTitle>
                    <CardDescription>
                      各流入経路の計画CPA vs 実績CPA（棒グラフ）
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={channelVariances}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" fontSize={12} />
                          <YAxis 
                            fontSize={12}
                            tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`}
                          />
                          <Tooltip 
                            formatter={(value: number, name: string) => [
                              `¥${value.toLocaleString()}`,
                              name === 'planned.cpa' ? '計画CPA' : '実績CPA'
                            ]}
                          />
                          <Legend />
                          <Bar dataKey="planned.cpa" fill="#3b82f6" name="計画CPA" opacity={0.8} />
                          <Bar dataKey="actual.cpa" fill="#ef4444" name="実績CPA" opacity={0.9} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>チャネル別獲得推移</CardTitle>
                    <CardDescription>
                      各流入経路の獲得数トレンド（折れ線グラフ）
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={channelVariances}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" fontSize={12} />
                          <YAxis fontSize={12} />
                          <Tooltip 
                            formatter={(value: number, name: string) => [
                              `${value}人`,
                              name === 'planned.acquisitions' ? '計画獲得数' : '実績獲得数'
                            ]}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="planned.acquisitions" 
                            stroke="#8b5cf6" 
                            strokeWidth={4}
                            strokeDasharray="8 4"
                            name="計画獲得数"
                            dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 8 }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="actual.acquisitions" 
                            stroke="#10b981" 
                            strokeWidth={4}
                            name="実績獲得数"
                            dot={{ fill: '#10b981', strokeWidth: 2, r: 8 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}