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
import { format, addMonths, subMonths } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useDailyReportData } from './hooks/useDailyReportData';
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
  Radio,
  Download,
  Calendar,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Eye,
  Lightbulb
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';

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

interface MonthlyTrend {
  month: string;
  monthLabel: string;
  newAcquisitions: number;
  mrr: number;
  totalCost: number;
  averageCpa: number;
}

interface BusinessInsight {
  type: 'success' | 'warning' | 'danger';
  title: string;
  description: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
}

// 複数月のサンプルデータ
const generateMultiMonthData = () => {
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const date = subMonths(new Date(), i);
    const monthKey = format(date, 'yyyy-MM');
    const monthLabel = format(date, 'yyyy年MM月', { locale: ja });
    
    const baseAcquisitions = 100;
    const actualAcquisitions = 85 + Math.floor(Math.random() * 30) - 15;
    
    months.push({
      month: monthKey,
      monthLabel,
      plan: {
        month: monthKey,
        newAcquisitions: baseAcquisitions,
        totalCustomers: 1000 + (i * 50),
        churnCount: 50,
        mrr: 500000 + (i * 10000),
        expenses: 300000,
        channels: [
          { name: 'オーガニック', plannedAcquisitions: 40, plannedCpa: 0, plannedCost: 0 },
          { name: '広告', plannedAcquisitions: 30, plannedCpa: 5000, plannedCost: 150000 },
          { name: 'SNS', plannedAcquisitions: 20, plannedCpa: 3000, plannedCost: 60000 },
          { name: 'リファラル', plannedAcquisitions: 10, plannedCpa: 1000, plannedCost: 10000 },
        ]
      },
      actual: {
        month: monthKey,
        newAcquisitions: actualAcquisitions,
        totalCustomers: 1020 + (i * 45),
        churnCount: 45 + Math.floor(Math.random() * 10) - 5,
        mrr: 520000 + (i * 8000) + Math.floor(Math.random() * 40000) - 20000,
        expenses: 280000 + Math.floor(Math.random() * 40000) - 20000,
        channels: [
          { name: 'オーガニック', actualAcquisitions: Math.max(0, 35 + Math.floor(Math.random() * 10) - 5), actualCpa: 0, actualCost: 0 },
          { name: '広告', actualAcquisitions: Math.max(0, 25 + Math.floor(Math.random() * 8) - 4), actualCpa: 5600 + Math.floor(Math.random() * 1000) - 500, actualCost: 140000 + Math.floor(Math.random() * 20000) - 10000 },
          { name: 'SNS', actualAcquisitions: Math.max(0, 18 + Math.floor(Math.random() * 6) - 3), actualCpa: 3500 + Math.floor(Math.random() * 800) - 400, actualCost: 63000 + Math.floor(Math.random() * 15000) - 7500 },
          { name: 'リファラル', actualAcquisitions: Math.max(0, 7 + Math.floor(Math.random() * 4) - 2), actualCpa: 1200 + Math.floor(Math.random() * 300) - 150, actualCost: 8400 + Math.floor(Math.random() * 2000) - 1000 },
        ]
      }
    });
  }
  return months;
};

const MULTI_MONTH_DATA = generateMultiMonthData();

export default function PlanVsActualExecutivePage() {
  console.log('=== PlanVsActualExecutivePage rendering ===');
  
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [multiMonthData] = useState(MULTI_MONTH_DATA);
  const [planData, setPlanData] = useState<MonthlyPlan>(
    multiMonthData.find(m => m.month === selectedMonth)?.plan || MULTI_MONTH_DATA[0].plan
  );
  const [actualData, setActualData] = useState<ActualData>(
    multiMonthData.find(m => m.month === selectedMonth)?.actual || MULTI_MONTH_DATA[0].actual
  );

  // 日次レポートデータを取得
  const { monthlyAggregate, loading: dailyReportLoading, error: dailyReportError, mapChannelNames } = useDailyReportData(selectedMonth);

  // 選択月が変更された時にデータを更新
  useEffect(() => {
    const monthData = multiMonthData.find(m => m.month === selectedMonth);
    if (monthData) {
      setPlanData(monthData.plan);
      
      // 日次レポートデータがある場合は実データに反映、ない場合はサンプルデータを使用
      if (monthlyAggregate && mapChannelNames) {
        const realChannelData = mapChannelNames();
        setActualData({
          ...monthData.actual,
          newAcquisitions: monthlyAggregate.totalAcquisitions,
          churnCount: monthlyAggregate.totalChurns,
          channels: realChannelData
        });
      } else {
        setActualData(monthData.actual);
      }
    }
  }, [selectedMonth, multiMonthData, monthlyAggregate, mapChannelNames]);

  // 月選択肢の生成
  const monthOptions = multiMonthData
    .filter(data => data && data.month)
    .map(data => ({
      value: data.month,
      label: data.monthLabel
    }));

  // ビジネスインサイト生成
  const generateBusinessInsights = (): BusinessInsight[] => {
    const insights: BusinessInsight[] = [];
    
    const acquisitionVariance = actualData.newAcquisitions - planData.newAcquisitions;
    const acquisitionVariancePercent = planData.newAcquisitions > 0 ? (acquisitionVariance / planData.newAcquisitions) * 100 : 0;
    
    const mrrVariance = actualData.mrr - planData.mrr;
    const mrrVariancePercent = planData.mrr > 0 ? (mrrVariance / planData.mrr) * 100 : 0;
    
    const expenseVariance = actualData.expenses - planData.expenses;
    const expenseVariancePercent = planData.expenses > 0 ? (expenseVariance / planData.expenses) * 100 : 0;

    // 獲得数分析
    if (acquisitionVariancePercent < -10) {
      insights.push({
        type: 'danger',
        title: '新規獲得が目標を大幅に下回っています',
        description: `目標から${Math.abs(acquisitionVariancePercent).toFixed(1)}%（${Math.abs(acquisitionVariance)}人）下回っています`,
        action: 'マーケティング戦略の見直しとチャネル強化が必要です',
        priority: 'high'
      });
    } else if (acquisitionVariancePercent > 10) {
      insights.push({
        type: 'success',
        title: '新規獲得が目標を上回っています',
        description: `目標を${acquisitionVariancePercent.toFixed(1)}%（${acquisitionVariance}人）上回っています`,
        action: 'この好調なチャネルへの投資拡大を検討してください',
        priority: 'medium'
      });
    }

    // MRR分析
    if (mrrVariancePercent < -5) {
      insights.push({
        type: 'warning',
        title: 'MRRが目標を下回っています',
        description: `目標から${Math.abs(mrrVariancePercent).toFixed(1)}%（¥${Math.abs(mrrVariance).toLocaleString()}）下回っています`,
        action: '既存顧客の単価向上またはチャーン率改善が必要です',
        priority: 'high'
      });
    }

    // コスト分析
    if (expenseVariancePercent > 15) {
      insights.push({
        type: 'warning',
        title: '支出が予算を大幅に超過しています',
        description: `予算を${expenseVariancePercent.toFixed(1)}%（¥${expenseVariance.toLocaleString()}）超過しています`,
        action: 'コスト効率の低いチャネルの見直しが必要です',
        priority: 'high'
      });
    }

    // チャネル別分析
    const channelVariances = calculateChannelVariances();
    channelVariances.forEach(channel => {
      if (channel.variance.acquisitionsPercent < -20) {
        insights.push({
          type: 'danger',
          title: `${channel.name}チャネルの獲得数が大幅減少`,
          description: `目標から${Math.abs(channel.variance.acquisitionsPercent).toFixed(1)}%下回っています`,
          action: `${channel.name}チャネルの改善または代替チャネルの検討が必要です`,
          priority: 'high'
        });
      }
    });

    return insights.slice(0, 5); // 最大5つまで
  };

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

  // チャネル別差異計算
  const calculateChannelVariances = (): ChannelVariance[] => {
    const variances = planData.channels
      .filter(plannedChannel => plannedChannel && plannedChannel.name && typeof plannedChannel.name === 'string')
      .map((plannedChannel) => {
        const actualChannel = actualData.channels.find(c => c && c.name === plannedChannel.name);
        
        if (!actualChannel) {
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

    return variances;
  };

  // トレンドデータの準備
  const prepareTrendData = (): MonthlyTrend[] => {
    return multiMonthData
      .filter(data => data && data.month && data.actual)
      .map(data => {
        const totalCost = data.actual.channels
          .filter(ch => ch && typeof ch.actualCost === 'number')
          .reduce((sum, ch) => sum + ch.actualCost, 0);
        
        const totalAcquisitions = data.actual.channels
          .filter(ch => ch && typeof ch.actualAcquisitions === 'number')
          .reduce((sum, ch) => sum + ch.actualAcquisitions, 0);
        
        const averageCpa = totalAcquisitions > 0 ? totalCost / totalAcquisitions : 0;

        return {
          month: data.month,
          monthLabel: data.monthLabel.replace('年', '/').replace('月', ''),
          newAcquisitions: data.actual.newAcquisitions,
          mrr: data.actual.mrr,
          totalCost,
          averageCpa
        };
      });
  };

  const varianceData = calculateVariances();
  const channelVariances = calculateChannelVariances();
  const trendData = prepareTrendData();
  const businessInsights = generateBusinessInsights();

  // KPIカードの状態決定
  const getKpiStatus = (variance: number, isReversed = false) => {
    const effectiveVariance = isReversed ? -variance : variance;
    if (effectiveVariance > 5) return 'success';
    if (effectiveVariance < -5) return 'danger';
    return 'warning';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'danger': return <XCircle className="w-5 h-5 text-red-600" />;
      default: return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'border-green-200 bg-green-50';
      case 'danger': return 'border-red-200 bg-red-50';
      default: return 'border-yellow-200 bg-yellow-50';
    }
  };

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
    setActualData(prev => ({
      ...prev,
      channels: prev.channels
        .filter(channel => channel && channel.name)
        .map(channel => 
          channel.name === channelName ? { ...channel, [field]: value } : channel
        )
    }));
  };

  // グラフデータの準備
  const prepareChartData = () => {
    return channelVariances
      .filter(variance => variance && variance.name)
      .map(variance => ({
        name: variance.name,
        '計画': variance.planned.acquisitions,
        '実績': variance.actual.acquisitions,
        '達成率': variance.planned.acquisitions > 0 ? 
          Math.round((variance.actual.acquisitions / variance.planned.acquisitions) * 100) : 0,
      }));
  };

  // パフォーマンス円グラフデータ
  const preparePieData = () => {
    const totalActual = channelVariances.reduce((sum, ch) => sum + ch.actual.acquisitions, 0);
    return channelVariances
      .filter(variance => variance && variance.name && variance.actual.acquisitions > 0)
      .map(variance => ({
        name: variance.name,
        value: variance.actual.acquisitions,
        percentage: totalActual > 0 ? Math.round((variance.actual.acquisitions / totalActual) * 100) : 0
      }));
  };

  // データエクスポート機能
  const exportData = () => {
    const exportData = {
      month: selectedMonth,
      summary: varianceData,
      channels: channelVariances,
      insights: businessInsights,
      trends: trendData
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `executive-report-${selectedMonth}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const chartData = prepareChartData();
  const pieData = preparePieData();
  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6 p-6">
          {/* ヘッダー */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">経営ダッシュボード</h1>
              <p className="text-muted-foreground">
                予実管理と戦略的意思決定支援
                {monthlyAggregate && (
                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                    実データ連携中
                  </span>
                )}
                {dailyReportLoading && (
                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    データ読み込み中...
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-3">
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
              <Button onClick={exportData} variant="outline" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                レポート出力
              </Button>
            </div>
          </div>

          {/* エグゼクティブサマリー */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {varianceData
              .filter(item => item && item.metric)
              .map((item, index) => {
                const variancePercent = item.planned > 0 ? (item.variance / item.planned) * 100 : 0;
                const status = getKpiStatus(variancePercent, item.metric === 'チャーン数' || item.metric === '支出');
                
                return (
                  <Card key={`kpi-${index}`} className={`${getStatusColor(status)} border-2`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">{item.metric}</span>
                        {getStatusIcon(status)}
                      </div>
                      <div className="space-y-1">
                        <div className="text-2xl font-bold">
                          {item.actual.toLocaleString()}<span className="text-sm font-normal ml-1">{item.unit}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <span className="text-gray-500">目標: {item.planned.toLocaleString()}{item.unit}</span>
                        </div>
                        <div className={`flex items-center gap-1 text-sm font-medium ${getVarianceColor(item.variance)}`}>
                          {getVarianceIcon(item.variance)}
                          {item.variance > 0 ? '+' : ''}{item.variance.toLocaleString()}{item.unit}
                          <span className="ml-1">({variancePercent > 0 ? '+' : ''}{variancePercent.toFixed(1)}%)</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>

          {/* ビジネスインサイト */}
          {businessInsights.length > 0 && (
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-blue-600" />
                  戦略的インサイト
                </CardTitle>
                <CardDescription>データに基づく経営判断支援</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {businessInsights
                    .filter(insight => insight && insight.title)
                    .map((insight, index) => (
                      <div key={`insight-${index}`} className={`p-4 rounded-lg border-l-4 ${
                        insight.type === 'success' ? 'border-l-green-500 bg-green-50' :
                        insight.type === 'danger' ? 'border-l-red-500 bg-red-50' :
                        'border-l-yellow-500 bg-yellow-50'
                      }`}>
                        <div className="flex items-start gap-3">
                          {insight.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" /> :
                           insight.type === 'danger' ? <XCircle className="w-5 h-5 text-red-600 mt-0.5" /> :
                           <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />}
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                            <p className="text-sm text-gray-700 mt-1">{insight.description}</p>
                            <p className="text-sm font-medium text-gray-800 mt-2 bg-white px-3 py-1 rounded border">
                              💡 {insight.action}
                            </p>
                          </div>
                          <Badge variant={insight.priority === 'high' ? 'destructive' : 'secondary'}>
                            {insight.priority === 'high' ? '緊急' : '重要'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">概要</TabsTrigger>
              <TabsTrigger value="channels">チャネル分析</TabsTrigger>
              <TabsTrigger value="trends">トレンド</TabsTrigger>
              <TabsTrigger value="input">データ入力</TabsTrigger>
            </TabsList>

            {/* 概要タブ */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* メインKPIグラフ */}
                <Card>
                  <CardHeader>
                    <CardTitle>目標達成状況</CardTitle>
                    <CardDescription>計画値に対する達成率</CardDescription>
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
                              name === '達成率' ? `${value}%` : `${value}人`,
                              name === '達成率' ? '達成率' : name
                            ]}
                          />
                          <Legend />
                          <Bar dataKey="計画" fill="#94a3b8" name="目標" opacity={0.7} />
                          <Bar dataKey="実績" fill="#3b82f6" name="実績" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* チャネル構成円グラフ */}
                <Card>
                  <CardHeader>
                    <CardTitle>チャネル別獲得構成</CardTitle>
                    <CardDescription>実績ベースの流入構成比</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData.filter(item => item && item.name)}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={120}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: number) => [`${value}人`, '獲得数']}
                            labelFormatter={(label) => `${label}チャネル`}
                          />
                          <Legend 
                            formatter={(value, entry) => {
                              const data = pieData.find(item => item.name === value);
                              return `${value} (${data?.percentage || 0}%)`;
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* チャネル分析タブ */}
            <TabsContent value="channels" className="space-y-6">
              {/* チャネル別パフォーマンス詳細 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
                {channelVariances
                  .filter(channel => channel && channel.name)
                  .map((channel, index) => {
                    const roi = channel.actual.cost > 0 ? 
                      ((channel.actual.acquisitions * 5000 - channel.actual.cost) / channel.actual.cost) * 100 : 0; // 仮のLTV=5000円
                    const efficiency = channel.planned.acquisitions > 0 ? 
                      (channel.actual.acquisitions / channel.planned.acquisitions) * 100 : 0;
                    
                    return (
                      <Card key={`channel-detail-${channel.name}-${index}`} className={`${
                        efficiency >= 100 ? 'border-green-200 bg-green-50' :
                        efficiency >= 80 ? 'border-yellow-200 bg-yellow-50' :
                        'border-red-200 bg-red-50'
                      } border-2`}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center justify-between">
                            {channel.name}
                            <Badge variant={efficiency >= 100 ? 'default' : efficiency >= 80 ? 'secondary' : 'destructive'}>
                              {efficiency.toFixed(0)}%
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <div className="text-gray-500">実績獲得</div>
                              <div className="font-bold text-lg">{channel.actual.acquisitions}人</div>
                            </div>
                            <div>
                              <div className="text-gray-500">目標獲得</div>
                              <div className="font-medium">{channel.planned.acquisitions}人</div>
                            </div>
                            <div>
                              <div className="text-gray-500">実績CPA</div>
                              <div className="font-bold">
                                {channel.actual.cpa > 0 ? `¥${channel.actual.cpa.toLocaleString()}` : '無料'}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-500">投資コスト</div>
                              <div className="font-medium">¥{(channel.actual.cost / 1000).toFixed(0)}k</div>
                            </div>
                          </div>
                          
                          {channel.actual.cost > 0 && (
                            <div className="pt-2 border-t">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">推定ROI</span>
                                <span className={`text-sm font-bold ${roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {roi > 0 ? '+' : ''}{roi.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>

              {/* チャネル比較グラフ */}
              <Card>
                <CardHeader>
                  <CardTitle>チャネル別パフォーマンス比較</CardTitle>
                  <CardDescription>目標達成状況の視覚化</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.filter(item => item && item.name)} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" fontSize={14} />
                        <YAxis fontSize={12} />
                        <Tooltip 
                          formatter={(value: number, name: string) => [
                            name === '達成率' ? `${value}%` : `${value}人`,
                            name === '達成率' ? '目標達成率' : name
                          ]}
                        />
                        <Legend />
                        <Bar dataKey="計画" fill="#94a3b8" name="目標" opacity={0.6} />
                        <Bar dataKey="実績" fill="#3b82f6" name="実績" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* トレンド分析タブ */}
            <TabsContent value="trends" className="space-y-6">
              {/* トレンド概要 */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardContent className="p-4 text-center">
                    <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-sm text-blue-700 mb-1">6ヶ月平均獲得数</div>
                    <div className="text-2xl font-bold text-blue-900">
                      {Math.round(trendData.reduce((sum, d) => sum + d.newAcquisitions, 0) / trendData.length)}人
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <CardContent className="p-4 text-center">
                    <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="text-sm text-green-700 mb-1">6ヶ月平均MRR</div>
                    <div className="text-2xl font-bold text-green-900">
                      ¥{Math.round(trendData.reduce((sum, d) => sum + d.mrr, 0) / trendData.length / 1000)}k
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <CardContent className="p-4 text-center">
                    <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-sm text-purple-700 mb-1">6ヶ月平均コスト</div>
                    <div className="text-2xl font-bold text-purple-900">
                      ¥{Math.round(trendData.reduce((sum, d) => sum + d.totalCost, 0) / trendData.length / 1000)}k
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                  <CardContent className="p-4 text-center">
                    <Calculator className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                    <div className="text-sm text-orange-700 mb-1">6ヶ月平均CPA</div>
                    <div className="text-2xl font-bold text-orange-900">
                      ¥{Math.round(trendData.reduce((sum, d) => sum + d.averageCpa, 0) / trendData.length / 1000)}k
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* トレンドグラフ */}
              <Card>
                <CardHeader>
                  <CardTitle>6ヶ月トレンド分析</CardTitle>
                  <CardDescription>ビジネス成長の軌跡</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData.filter(item => item && item.month)}>
                        <defs>
                          <linearGradient id="acquisitionGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                          </linearGradient>
                          <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="monthLabel" 
                          fontSize={12}
                          tick={{ fill: '#64748b' }}
                        />
                        <YAxis yAxisId="left" orientation="left" fontSize={12} tick={{ fill: '#64748b' }} />
                        <YAxis yAxisId="right" orientation="right" fontSize={12} tick={{ fill: '#64748b' }} />
                        <Tooltip 
                          labelFormatter={(label) => `${label}`}
                          formatter={(value: number, name: string) => [
                            name === 'newAcquisitions' ? `${value}人` : `¥${(value / 1000).toFixed(0)}k`,
                            name === 'newAcquisitions' ? '新規獲得数' : 'MRR'
                          ]}
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Legend />
                        <Area 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="newAcquisitions" 
                          stroke="#3b82f6" 
                          fill="url(#acquisitionGradient)"
                          strokeWidth={3}
                          name="新規獲得数"
                        />
                        <Area 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="mrr" 
                          stroke="#10b981" 
                          fill="url(#mrrGradient)"
                          strokeWidth={3}
                          name="MRR"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* チャネル分析タブ */}
            <TabsContent value="channels" className="space-y-6">
              {/* チャネル効率分析 */}
              <Card>
                <CardHeader>
                  <CardTitle>チャネル効率ランキング</CardTitle>
                  <CardDescription>ROIと達成率による評価</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {channelVariances
                      .filter(channel => channel && channel.name)
                      .map((channel, index) => {
                        const efficiency = channel.planned.acquisitions > 0 ? 
                          (channel.actual.acquisitions / channel.planned.acquisitions) * 100 : 0;
                        const roi = channel.actual.cost > 0 ? 
                          ((channel.actual.acquisitions * 5000 - channel.actual.cost) / channel.actual.cost) * 100 : 0;
                        
                        return (
                          <div key={`efficiency-${channel.name}-${index}`} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className={`w-3 h-3 rounded-full ${
                                efficiency >= 100 ? 'bg-green-500' :
                                efficiency >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                              }`} />
                              <div>
                                <div className="font-semibold">{channel.name}</div>
                                <div className="text-sm text-gray-500">
                                  {channel.actual.acquisitions}人獲得 / 目標{channel.planned.acquisitions}人
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-6">
                              <div className="text-right">
                                <div className="text-sm text-gray-500">達成率</div>
                                <div className={`font-bold ${
                                  efficiency >= 100 ? 'text-green-600' :
                                  efficiency >= 80 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {efficiency.toFixed(0)}%
                                </div>
                              </div>
                              
                              {channel.actual.cost > 0 && (
                                <div className="text-right">
                                  <div className="text-sm text-gray-500">推定ROI</div>
                                  <div className={`font-bold ${roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {roi > 0 ? '+' : ''}{roi.toFixed(0)}%
                                  </div>
                                </div>
                              )}
                              
                              <div className="text-right">
                                <div className="text-sm text-gray-500">実績CPA</div>
                                <div className="font-bold">
                                  {channel.actual.cpa > 0 ? `¥${(channel.actual.cpa / 1000).toFixed(0)}k` : '無料'}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>

              {/* チャネル比較グラフ */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>獲得数 vs コスト効率</CardTitle>
                    <CardDescription>チャネル別投資効率</CardDescription>
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
                              name
                            ]}
                          />
                          <Legend />
                          <Bar dataKey="計画" fill="#e2e8f0" name="目標" opacity={0.7} />
                          <Bar dataKey="実績" fill="#3b82f6" name="実績" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>チャネル獲得構成</CardTitle>
                    <CardDescription>実績ベースの流入比率</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData.filter(item => item && item.name)}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: number, name: string, props: any) => [
                              `${value}人 (${props.payload.percentage}%)`,
                              '獲得数'
                            ]}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* トレンドタブ */}
            <TabsContent value="trends" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>ビジネス成長トレンド</CardTitle>
                  <CardDescription>過去6ヶ月の成長軌跡と予測</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData.filter(item => item && item.month)}>
                        <defs>
                          <linearGradient id="acquisitionTrend" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                          </linearGradient>
                          <linearGradient id="mrrTrend" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="monthLabel" 
                          fontSize={12}
                          tick={{ fill: '#64748b' }}
                        />
                        <YAxis yAxisId="left" orientation="left" fontSize={12} tick={{ fill: '#64748b' }} />
                        <YAxis yAxisId="right" orientation="right" fontSize={12} tick={{ fill: '#64748b' }} />
                        <Tooltip 
                          labelFormatter={(label) => `${label}`}
                          formatter={(value: number, name: string) => [
                            name === 'newAcquisitions' ? `${value}人` : `¥${(value / 1000).toFixed(0)}k`,
                            name === 'newAcquisitions' ? '新規獲得数' : 'MRR'
                          ]}
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Legend />
                        <Area 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="newAcquisitions" 
                          stroke="#3b82f6" 
                          fill="url(#acquisitionTrend)"
                          strokeWidth={3}
                          name="新規獲得数"
                        />
                        <Area 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="mrr" 
                          stroke="#10b981" 
                          fill="url(#mrrTrend)"
                          strokeWidth={3}
                          name="MRR"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* データ入力タブ */}
            <TabsContent value="input" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 基本KPI入力 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="w-5 h-5" />
                      基本実績入力
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
                        className="text-lg font-semibold"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        目標: {planData.newAcquisitions}人
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="mrr">MRR（月次継続収益）</Label>
                      <Input
                        id="mrr"
                        type="number"
                        value={actualData.mrr}
                        onChange={(e) => setActualData(prev => ({
                          ...prev,
                          mrr: parseInt(e.target.value) || 0
                        }))}
                        placeholder="0"
                        className="text-lg font-semibold"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        目標: ¥{planData.mrr.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="churnCount">解約数</Label>
                      <Input
                        id="churnCount"
                        type="number"
                        value={actualData.churnCount}
                        onChange={(e) => setActualData(prev => ({
                          ...prev,
                          churnCount: parseInt(e.target.value) || 0
                        }))}
                        placeholder="0"
                        className="text-lg font-semibold"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        目標: {planData.churnCount}人
                      </p>
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
                        className="text-lg font-semibold"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        予算: ¥{planData.expenses.toLocaleString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>

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
                        const efficiency = plannedChannel && plannedChannel.plannedAcquisitions > 0 ? 
                          (channel.actualAcquisitions / plannedChannel.plannedAcquisitions) * 100 : 0;
                        
                        return (
                          <div key={`actual-channel-${channel.name}-${index}`} className={`border rounded-lg p-4 space-y-3 ${
                            efficiency >= 100 ? 'border-green-200 bg-green-50' :
                            efficiency >= 80 ? 'border-yellow-200 bg-yellow-50' :
                            'border-red-200 bg-red-50'
                          }`}>
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{channel.name}</h4>
                              <Badge variant={efficiency >= 100 ? 'default' : efficiency >= 80 ? 'secondary' : 'destructive'}>
                                {efficiency.toFixed(0)}%
                              </Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <Label htmlFor={`${channel.name}-acquisitions`} className="text-xs">獲得数</Label>
                                <Input
                                  id={`${channel.name}-acquisitions`}
                                  type="number"
                                  value={channel.actualAcquisitions}
                                  onChange={(e) => handleChannelActualChange(channel.name, 'actualAcquisitions', parseInt(e.target.value) || 0)}
                                  placeholder="0"
                                  className="font-semibold"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  目標: {plannedChannel?.plannedAcquisitions || 0}人
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
                                  className="font-semibold"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  目標: {plannedChannel?.plannedCpa ? `¥${plannedChannel.plannedCpa.toLocaleString()}` : '無料'}
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
                                  className="font-semibold"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  予算: ¥{plannedChannel?.plannedCost.toLocaleString() || '0'}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
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