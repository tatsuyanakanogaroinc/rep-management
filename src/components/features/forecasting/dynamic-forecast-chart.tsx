'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LineChart, 
  Line, 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Brain,
  AlertTriangle,
  Info,
  Calendar,
  BarChart3
} from 'lucide-react';
import { generateDynamicForecast, analyzeTrends } from '@/lib/dynamic-forecasting';
import { useState, useMemo } from 'react';
import { format, addMonths } from 'date-fns';
import { ja } from 'date-fns/locale';

interface DynamicForecastChartProps {
  historicalData: Array<{
    month: string;
    mrr: number;
    activeCustomers: number;
    newAcquisitions: number;
    churnRate: number;
    totalExpenses: number;
  }>;
  currentMonth: string;
}

export function DynamicForecastChart({ historicalData, currentMonth }: DynamicForecastChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<'mrr' | 'customers' | 'expenses'>('mrr');
  const [forecastMonths, setForecastMonths] = useState(6);
  const [showScenarios, setShowScenarios] = useState(false);

  // 予測データの生成
  const { forecasts, trends, chartData } = useMemo(() => {
    if (historicalData.length < 3) {
      return { forecasts: [], trends: null, chartData: [] };
    }

    try {
      const forecasts = generateDynamicForecast(historicalData, forecastMonths);
      const trends = analyzeTrends(historicalData);
      
      // チャート用データの準備
      const chartData = [
        // 履歴データ
        ...historicalData.map(d => ({
          month: format(new Date(d.month + '-01'), 'MM月', { locale: ja }),
          fullMonth: d.month,
          mrr: d.mrr,
          customers: d.activeCustomers,
          expenses: d.totalExpenses,
          type: 'historical' as const
        })),
        // 予測データ
        ...forecasts.map(f => ({
          month: format(new Date(f.month + '-01'), 'MM月', { locale: ja }),
          fullMonth: f.month,
          mrr: f.predictedMrr,
          customers: f.predictedCustomers,
          expenses: f.predictedExpenses,
          type: 'forecast' as const,
          confidence: f.confidence,
          scenarios: f.scenarios
        }))
      ];
      
      return { forecasts, trends, chartData };
    } catch (error) {
      console.error('Forecast generation error:', error);
      return { forecasts: [], trends: null, chartData: [] };
    }
  }, [historicalData, forecastMonths]);

  // メトリクス設定
  const metricConfig = {
    mrr: {
      label: 'MRR',
      key: 'mrr',
      color: '#10b981',
      formatter: (value: number) => `¥${value.toLocaleString()}`,
      unit: '円'
    },
    customers: {
      label: 'アクティブ顧客数',
      key: 'customers', 
      color: '#8b5cf6',
      formatter: (value: number) => `${value}人`,
      unit: '人'
    },
    expenses: {
      label: '月次支出',
      key: 'expenses',
      color: '#ef4444',
      formatter: (value: number) => `¥${value.toLocaleString()}`,
      unit: '円'
    }
  };

  const currentConfig = metricConfig[selectedMetric];

  // トレンドアイコンの取得
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'decreasing': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getMomentumIcon = (momentum: string) => {
    switch (momentum) {
      case 'accelerating': return '🚀';
      case 'decelerating': return '⚠️';
      default: return '📈';
    }
  };

  // カスタムツールチップ
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    const isHistorical = data.type === 'historical';

    return (
      <div className="glass p-4 rounded-lg shadow-lg border border-gray-200">
        <p className="font-semibold text-sm mb-2">
          {label} {!isHistorical && `(予測)`}
        </p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 text-sm">
            <span style={{ color: entry.color }}>{entry.name}:</span>
            <span className="font-medium">
              {currentConfig.formatter(entry.value)}
            </span>
          </div>
        ))}
        {!isHistorical && data.confidence && (
          <div className="mt-2 pt-2 border-t">
            <span className="text-xs text-muted-foreground">
              信頼度: {data.confidence}%
            </span>
          </div>
        )}
      </div>
    );
  };

  if (historicalData.length < 3) {
    return (
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            動的予測モデル
          </CardTitle>
          <CardDescription>
            実績データを基に将来を予測
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
            <p className="text-lg font-medium mb-2">データ不足</p>
            <p className="text-sm text-muted-foreground">
              予測には最低3ヶ月の履歴データが必要です。<br />
              現在のデータ: {historicalData.length}ヶ月
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              動的予測モデル
            </CardTitle>
            <CardDescription>
              AIによる将来予測とトレンド分析
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-3">
            <Select
              value={forecastMonths.toString()}
              onValueChange={(value) => setForecastMonths(parseInt(value))}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3ヶ月</SelectItem>
                <SelectItem value="6">6ヶ月</SelectItem>
                <SelectItem value="12">12ヶ月</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowScenarios(!showScenarios)}
            >
              {showScenarios ? 'シンプル表示' : 'シナリオ表示'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* トレンド分析サマリー */}
        {trends && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                {getTrendIcon(trends.mrrTrend)}
                <span className="text-sm font-medium">MRR傾向</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {trends.mrrTrend === 'increasing' ? '成長中' : 
                 trends.mrrTrend === 'decreasing' ? '低下中' : '安定'}
              </p>
            </div>
            
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                {getTrendIcon(trends.customerTrend)}
                <span className="text-sm font-medium">顧客数傾向</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {trends.customerTrend === 'increasing' ? '拡大中' : 
                 trends.customerTrend === 'decreasing' ? '減少中' : '安定'}
              </p>
            </div>
            
            <div className="p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                {getTrendIcon(trends.churnTrend)}
                <span className="text-sm font-medium">チャーン傾向</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {trends.churnTrend === 'increasing' ? '悪化中' : 
                 trends.churnTrend === 'decreasing' ? '改善中' : '安定'}
              </p>
            </div>
            
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{getMomentumIcon(trends.momentum)}</span>
                <span className="text-sm font-medium">成長の勢い</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {trends.momentum === 'accelerating' ? '加速中' : 
                 trends.momentum === 'decelerating' ? '減速中' : '一定'}
              </p>
            </div>
          </div>
        )}

        {/* メトリクス選択 */}
        <Tabs value={selectedMetric} onValueChange={(value) => setSelectedMetric(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="mrr">MRR予測</TabsTrigger>
            <TabsTrigger value="customers">顧客数予測</TabsTrigger>
            <TabsTrigger value="expenses">支出予測</TabsTrigger>
          </TabsList>
          
          <TabsContent value={selectedMetric} className="mt-6">
            {/* 予測チャート */}
            <div className="h-80 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                {showScenarios ? (
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => 
                      currentConfig.key === 'mrr' || currentConfig.key === 'expenses' ? 
                      `¥${(value / 1000000).toFixed(1)}M` : 
                      `${value}`
                    } />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    
                    {/* 履歴データ */}
                    <Area
                      dataKey={currentConfig.key}
                      stroke={currentConfig.color}
                      fill={currentConfig.color}
                      fillOpacity={0.3}
                      name={`${currentConfig.label}（実績）`}
                    />
                    
                    {/* 予測シナリオ */}
                    <Area
                      dataKey={`scenarios.optimistic.${currentConfig.key === 'mrr' ? 'mrr' : 'customers'}`}
                      stroke="#22c55e"
                      fill="#22c55e"
                      fillOpacity={0.1}
                      name="楽観シナリオ"
                      connectNulls={false}
                    />
                    <Area
                      dataKey={`scenarios.pessimistic.${currentConfig.key === 'mrr' ? 'mrr' : 'customers'}`}
                      stroke="#ef4444"
                      fill="#ef4444"
                      fillOpacity={0.1}
                      name="悲観シナリオ"
                      connectNulls={false}
                    />
                    
                    <ReferenceLine x={historicalData.length - 1} stroke="#666" strokeDasharray="2 2" />
                  </AreaChart>
                ) : (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => 
                      currentConfig.key === 'mrr' || currentConfig.key === 'expenses' ? 
                      `¥${(value / 1000000).toFixed(1)}M` : 
                      `${value}`
                    } />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    
                    <Line
                      type="monotone"
                      dataKey={currentConfig.key}
                      stroke={currentConfig.color}
                      strokeWidth={2}
                      dot={{ fill: currentConfig.color, strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                      name={currentConfig.label}
                    />
                    
                    <ReferenceLine 
                      x={format(new Date(currentMonth + '-01'), 'MM月', { locale: ja })} 
                      stroke="#666" 
                      strokeDasharray="2 2" 
                      label="現在"
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* 予測サマリー */}
            {forecasts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    3ヶ月後予測
                  </h4>
                  <p className="text-2xl font-bold text-green-700">
                    {currentConfig.formatter(
                      selectedMetric === 'mrr' ? forecasts[2]?.predictedMrr || 0 :
                      selectedMetric === 'customers' ? forecasts[2]?.predictedCustomers || 0 :
                      forecasts[2]?.predictedExpenses || 0
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    信頼度: {forecasts[2]?.confidence || 0}%
                  </p>
                </div>
                
                <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    6ヶ月後予測
                  </h4>
                  <p className="text-2xl font-bold text-blue-700">
                    {currentConfig.formatter(
                      selectedMetric === 'mrr' ? forecasts[5]?.predictedMrr || 0 :
                      selectedMetric === 'customers' ? forecasts[5]?.predictedCustomers || 0 :
                      forecasts[5]?.predictedExpenses || 0
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    信頼度: {forecasts[5]?.confidence || 0}%
                  </p>
                </div>
                
                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    予測精度
                  </h4>
                  <p className="text-lg font-bold text-purple-700">
                    {trends?.mrrTrend === 'increasing' ? '高' : 
                     trends?.mrrTrend === 'stable' ? '中' : '低'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    データ品質: {historicalData.length >= 12 ? '優良' : 
                               historicalData.length >= 6 ? '良好' : '普通'}
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* 注意事項 */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-gray-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-800 mb-1">予測について</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• 予測は過去のデータと季節性要因を基に計算されています</li>
                <li>• 外部要因（市場変化、競合動向等）は考慮されていません</li>
                <li>• 予測期間が長いほど信頼度は低下します</li>
                <li>• 定期的にデータを更新して予測精度を向上させてください</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}