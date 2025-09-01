'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, ComposedChart } from 'recharts';
import { useState } from 'react';
import { format, subMonths, addMonths } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useMonthlyTrends } from '@/hooks/useMonthlyTrends';
import { TrendingUp, Target, BarChart3, DollarSign, Users, UserMinus, CreditCard, PieChart, Activity } from 'lucide-react';
import { ChartLoading } from '@/components/ui/loading';

interface MonthlyTrendChartProps {
  currentMonth: string;
}

type ChartType = 'revenue' | 'customers' | 'acquisition' | 'churn' | 'expenses' | 'profitability' | 'growth' | 'all';

export function MonthlyTrendChart({ currentMonth }: MonthlyTrendChartProps) {
  const [chartType, setChartType] = useState<ChartType>('revenue');
  const [selectedDataPoint, setSelectedDataPoint] = useState<any>(null);
  const [zoomDomain, setZoomDomain] = useState<[number, number] | null>(null);
  const [isAnimated, setIsAnimated] = useState(true);
  const { data, isLoading } = useMonthlyTrends(currentMonth);

  console.log('MonthlyTrendChart render:', { 
    chartType, 
    isLoading, 
    hasData: !!data, 
    dataKeys: data?.monthlyData?.length > 0 ? Object.keys(data.monthlyData[0]) : [] 
  });

  if (isLoading || !data) {
    return (
      <Card className="glass">
        <CardContent>
          <ChartLoading />
        </CardContent>
      </Card>
    );
  }

  // インタラクティブツールチップ
  const InteractiveTooltip = ({ active, payload, label, coordinate }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    const hasTargets = data.mrrTarget || data.activeCustomersTarget;

    return (
      <div className="glass p-4 rounded-lg shadow-xl border border-gray-200 min-w-64 max-w-80">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-primary" />
          <p className="font-semibold text-sm">{label}</p>
        </div>
        
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="font-medium">{entry.name}</span>
              </div>
              <span className="font-semibold text-right">
                {entry.name.includes('率') 
                  ? `${entry.value}%`
                  : entry.name.includes('円') || entry.name === 'MRR' || entry.name === '売上'
                  ? `¥${entry.value.toLocaleString()}`
                  : `${entry.value.toLocaleString()}`
                }
              </span>
            </div>
          ))}
        </div>
        
        {/* 目標との比較情報 */}
        {hasTargets && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-xs text-muted-foreground">
              <p className="font-medium mb-1">📊 目標達成状況</p>
              {data.mrrTarget && (
                <p>MRR: {Math.round((data.mrr / data.mrrTarget) * 100)}%達成</p>
              )}
              {data.activeCustomersTarget && (
                <p>顧客数: {Math.round((data.activeCustomers / data.activeCustomersTarget) * 100)}%達成</p>
              )}
            </div>
          </div>
        )}
        
        {/* インタラクティブアクション */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-muted-foreground">
            💡 クリックで詳細表示・ドラッグでズーム
          </p>
        </div>
      </div>
    );
  };

  // チャート設定
  const chartConfigs = {
    revenue: {
      title: '月次収益推移',
      description: 'MRRの実績と目標の推移',
      icon: <DollarSign className="w-5 h-5" />,
      data: data.monthlyData,
      lines: [
        { key: 'mrr', name: 'MRR実績', color: '#10b981', strokeDasharray: '0' },
        { key: 'mrrTarget', name: 'MRR目標', color: '#3b82f6', strokeDasharray: '5 5' }
      ],
      yAxisFormatter: (value: number) => `¥${(value / 1000000).toFixed(1)}M`
    },
    customers: {
      title: '顧客数推移',
      description: 'アクティブ顧客数の実績と目標',
      icon: <TrendingUp className="w-5 h-5" />,
      data: data.monthlyData,
      lines: [
        { key: 'activeCustomers', name: '顧客数実績', color: '#8b5cf6', strokeDasharray: '0' },
        { key: 'activeCustomersTarget', name: '顧客数目標', color: '#ec4899', strokeDasharray: '5 5' }
      ],
      yAxisFormatter: (value: number) => `${value}人`
    },
    acquisition: {
      title: '新規獲得推移',
      description: '月間新規顧客獲得の実績と目標',
      icon: <Target className="w-5 h-5" />,
      data: data.monthlyData,
      lines: [
        { key: 'newAcquisitions', name: '新規獲得実績', color: '#f59e0b', strokeDasharray: '0' },
        { key: 'newAcquisitionsTarget', name: '新規獲得目標', color: '#ef4444', strokeDasharray: '5 5' }
      ],
      yAxisFormatter: (value: number) => `${value}人`
    },
    churn: {
      title: 'チャーン率推移',
      description: '顧客離脱率の実績と目標',
      icon: <UserMinus className="w-5 h-5" />,
      data: data.monthlyData,
      lines: [
        { key: 'churnRate', name: 'チャーン率実績', color: '#ef4444', strokeDasharray: '0' },
        { key: 'churnRateTarget', name: 'チャーン率目標', color: '#f97316', strokeDasharray: '5 5' }
      ],
      yAxisFormatter: (value: number) => `${value}%`
    },
    expenses: {
      title: '月次支出推移',
      description: '支出実績と予算の推移',
      icon: <CreditCard className="w-5 h-5" />,
      data: data.monthlyData,
      lines: [
        { key: 'totalExpenses', name: '支出実績', color: '#dc2626', strokeDasharray: '0' },
        { key: 'monthlyExpensesTarget', name: '支出予算', color: '#ea580c', strokeDasharray: '5 5' }
      ],
      yAxisFormatter: (value: number) => `¥${(value / 1000000).toFixed(1)}M`
    },
    profitability: {
      title: '収益性推移',
      description: 'MRRと支出の比較による収益性分析',
      icon: <PieChart className="w-5 h-5" />,
      data: data.monthlyData.map(d => ({
        ...d,
        operatingProfit: d.mrr - d.totalExpenses,
        operatingMargin: d.mrr > 0 ? ((d.mrr - d.totalExpenses) / d.mrr) * 100 : 0
      })),
      lines: [
        { key: 'mrr', name: 'MRR', color: '#10b981', strokeDasharray: '0' },
        { key: 'totalExpenses', name: '支出', color: '#ef4444', strokeDasharray: '0' },
        { key: 'operatingProfit', name: '営業利益', color: '#3b82f6', strokeDasharray: '3 3' }
      ],
      yAxisFormatter: (value: number) => `¥${(value / 1000000).toFixed(1)}M`
    },
    growth: {
      title: '成長率推移',
      description: 'MRRと顧客数の月次成長率',
      icon: <Activity className="w-5 h-5" />,
      data: data.monthlyData.map((d, i) => {
        const prevMonth = i > 0 ? data.monthlyData[i - 1] : null;
        return {
          ...d,
          mrrGrowthRate: prevMonth && prevMonth.mrr > 0 
            ? ((d.mrr - prevMonth.mrr) / prevMonth.mrr) * 100 
            : 0,
          customerGrowthRate: prevMonth && prevMonth.activeCustomers > 0
            ? ((d.activeCustomers - prevMonth.activeCustomers) / prevMonth.activeCustomers) * 100
            : 0
        };
      }),
      lines: [
        { key: 'mrrGrowthRate', name: 'MRR成長率', color: '#10b981', strokeDasharray: '0' },
        { key: 'customerGrowthRate', name: '顧客数成長率', color: '#8b5cf6', strokeDasharray: '0' }
      ],
      yAxisFormatter: (value: number) => `${value.toFixed(1)}%`
    },
    all: {
      title: '総合指標推移',
      description: '主要KPIの統合ビュー',
      icon: <BarChart3 className="w-5 h-5" />,
      data: data.monthlyData,
      lines: [],
      yAxisFormatter: (value: number) => value.toString()
    }
  };

  const config = chartConfigs[chartType];
  const currentDate = new Date();
  const selectedDate = new Date(currentMonth + '-01');

  // インタラクティブ機能のハンドラー
  const handleDataPointClick = (data: any, index: number) => {
    setSelectedDataPoint({ ...data, index });
    console.log('Data point clicked:', data);
  };

  const handleZoomChange = (domain: any) => {
    if (domain && domain.left !== undefined && domain.right !== undefined) {
      setZoomDomain([domain.left, domain.right]);
    }
  };

  const resetZoom = () => {
    setZoomDomain(null);
  };

  const toggleAnimation = () => {
    setIsAnimated(!isAnimated);
  };

  console.log('Chart config:', {
    chartType,
    configTitle: config.title,
    dataLength: config.data?.length,
    lines: config.lines,
    sampleData: config.data?.slice(0, 2),
    selectedDataPoint,
    zoomDomain
  });

  return (
    <Card className="glass relative z-10">
      <CardHeader className="relative z-20">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="flex items-center gap-3">
            {config.icon}
            <div>
              <CardTitle className="text-lg">{config.title}</CardTitle>
              <CardDescription className="text-sm">{config.description}</CardDescription>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 relative">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs whitespace-nowrap">
                過去6ヶ月 + 未来6ヶ月
              </Badge>
              {zoomDomain && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={resetZoom}
                  className="text-xs h-6 px-2"
                >
                  ズームリセット
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleAnimation}
                className="text-xs h-6 px-2"
                title={isAnimated ? 'アニメーション無効' : 'アニメーション有効'}
              >
                {isAnimated ? '🎬' : '⏸️'}
              </Button>
            </div>
            <div className="relative w-full sm:w-48">
              <Select 
                value={chartType} 
                onValueChange={(value) => {
                  console.log('Chart type changed:', { from: chartType, to: value });
                  setChartType(value as ChartType);
                }}
              >
                <SelectTrigger className="w-full bg-white hover:bg-gray-50 transition-colors duration-200 cursor-pointer border-2 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20">
                  <SelectValue placeholder="チャート種別を選択" />
                </SelectTrigger>
                <SelectContent 
                  className="z-50 bg-white border-2 shadow-lg max-h-64 overflow-auto"
                  position="popper"
                  sideOffset={4}
                >
                  <SelectItem 
                    value="revenue" 
                    className="cursor-pointer hover:bg-primary/10 focus:bg-primary/10 py-3 px-4"
                  >
                    💰 収益推移
                  </SelectItem>
                  <SelectItem 
                    value="customers" 
                    className="cursor-pointer hover:bg-primary/10 focus:bg-primary/10 py-3 px-4"
                  >
                    👥 顧客数推移
                  </SelectItem>
                  <SelectItem 
                    value="acquisition" 
                    className="cursor-pointer hover:bg-primary/10 focus:bg-primary/10 py-3 px-4"
                  >
                    🎯 新規獲得推移
                  </SelectItem>
                  <SelectItem 
                    value="churn" 
                    className="cursor-pointer hover:bg-primary/10 focus:bg-primary/10 py-3 px-4"
                  >
                    📉 チャーン率推移
                  </SelectItem>
                  <SelectItem 
                    value="expenses" 
                    className="cursor-pointer hover:bg-primary/10 focus:bg-primary/10 py-3 px-4"
                  >
                    💳 支出推移
                  </SelectItem>
                  <SelectItem 
                    value="profitability" 
                    className="cursor-pointer hover:bg-primary/10 focus:bg-primary/10 py-3 px-4"
                  >
                    📊 収益性分析
                  </SelectItem>
                  <SelectItem 
                    value="growth" 
                    className="cursor-pointer hover:bg-primary/10 focus:bg-primary/10 py-3 px-4"
                  >
                    📈 成長率推移
                  </SelectItem>
                  <SelectItem 
                    value="all" 
                    className="cursor-pointer hover:bg-primary/10 focus:bg-primary/10 py-3 px-4"
                  >
                    🔄 統合ビュー
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* デバッグ情報表示 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-2 bg-gray-100 text-xs rounded">
            <strong>Debug Info:</strong> 
            Chart: {chartType}, 
            Data points: {config.data?.length || 0}, 
            Lines: {config.lines?.length || 0}
            {config.data?.length > 0 && (
              <div>Sample keys: {Object.keys(config.data[0]).join(', ')}</div>
            )}
          </div>
        )}
        
        <div className="h-64 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'all' ? (
              <ComposedChart data={config.data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    const date = new Date(value + '-01');
                    return format(date, 'M月', { locale: ja });
                  }}
                />
                <YAxis 
                  yAxisId="left"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `¥${(value / 1000000).toFixed(1)}M`}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${value}人`}
                />
                <Tooltip content={<InteractiveTooltip />} />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="mrr"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorMrr)"
                  name="MRR実績"
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="mrrTarget"
                  stroke="#3b82f6"
                  strokeDasharray="5 5"
                  dot={false}
                  name="MRR目標"
                />
                <Bar
                  yAxisId="right"
                  dataKey="newAcquisitions"
                  fill="#f59e0b"
                  opacity={0.8}
                  name="新規獲得"
                />
              </ComposedChart>
            ) : (
              <LineChart data={config.data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    const date = new Date(value + '-01');
                    return format(date, 'M月', { locale: ja });
                  }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={config.yAxisFormatter}
                />
                <Tooltip content={<InteractiveTooltip />} />
                <Legend />
                {config.lines.map((line) => {
                  console.log(`Rendering line: ${line.key} for chart: ${chartType}`, {
                    lineConfig: line,
                    dataHasKey: config.data?.[0]?.hasOwnProperty(line.key),
                    sampleValue: config.data?.[0]?.[line.key as keyof typeof config.data[0]]
                  });
                  return (
                    <Line
                      key={line.key}
                      type="monotone"
                      dataKey={line.key}
                      stroke={line.color}
                      strokeWidth={2}
                      dot={{ 
                        fill: line.color, 
                        strokeWidth: 2, 
                        r: 4,
                        cursor: 'pointer'
                      }}
                      activeDot={{ 
                        r: 6, 
                        stroke: line.color,
                        strokeWidth: 2,
                        fill: '#fff',
                        cursor: 'pointer',
                        onClick: handleDataPointClick
                      }}
                      animationDuration={isAnimated ? 1000 : 0}
                      strokeDasharray={line.strokeDasharray}
                      name={line.name}
                    />
                  );
                })}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* 選択されたデータポイントの詳細 */}
        {selectedDataPoint && (
          <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium flex items-center gap-2">
                <Activity className="w-4 h-4" />
                選択された月: {format(new Date(selectedDataPoint.month + '-01'), 'yyyy年MM月', { locale: ja })}
              </h4>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedDataPoint(null)}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              {config.lines.map(line => {
                const value = selectedDataPoint[line.key];
                if (value === undefined) return null;
                return (
                  <div key={line.key} className="text-center p-2 bg-white rounded">
                    <p className="text-muted-foreground text-xs">{line.name}</p>
                    <p className="font-semibold" style={{ color: line.color }}>
                      {config.yAxisFormatter(value)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 凡例と説明 */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-700">実績データ</span>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50">
            <div className="w-3 h-0.5 bg-blue-500 border-dashed" style={{ borderTop: '2px dashed' }}></div>
            <span className="text-gray-700">目標データ</span>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50">
            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
            <span className="text-gray-700">
              {format(selectedDate, 'yyyy年M月', { locale: ja })} 選択中
            </span>
          </div>
        </div>

        {/* 動的サマリー統計 */}
        {data.summary && (
          <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
            <h4 className="font-medium mb-3">
              {chartType === 'revenue' && '収益サマリー'}
              {chartType === 'customers' && '顧客サマリー'}
              {chartType === 'acquisition' && '獲得サマリー'}
              {chartType === 'churn' && 'チャーンサマリー'}
              {chartType === 'expenses' && '支出サマリー'}
              {chartType === 'profitability' && '収益性サマリー'}
              {chartType === 'growth' && '成長サマリー'}
              {chartType === 'all' && '総合サマリー'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              {chartType === 'revenue' && (
                <>
                  <div>
                    <p className="text-muted-foreground">平均MRR成長率</p>
                    <p className="font-semibold text-green-600">+{data.summary.avgMrrGrowth}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">現在MRR</p>
                    <p className="font-semibold">¥{config.data[config.data.length - 1]?.mrr?.toLocaleString() || 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">目標達成率</p>
                    <p className="font-semibold text-blue-600">{data.summary.avgAchievementRate}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">年間予測ARR</p>
                    <p className="font-semibold text-purple-600">¥{((config.data[config.data.length - 1]?.mrr || 0) * 12 / 1000000).toFixed(1)}M</p>
                  </div>
                </>
              )}
              {chartType === 'customers' && (
                <>
                  <div>
                    <p className="text-muted-foreground">現在顧客数</p>
                    <p className="font-semibold">{config.data[config.data.length - 1]?.activeCustomers?.toLocaleString() || 0}人</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">累計新規獲得</p>
                    <p className="font-semibold text-green-600">{data.summary.totalNewCustomers}人</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">目標達成率</p>
                    <p className="font-semibold text-blue-600">{data.summary.avgAchievementRate}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">平均顧客単価</p>
                    <p className="font-semibold">¥{Math.round((config.data[config.data.length - 1]?.mrr || 0) / Math.max(1, config.data[config.data.length - 1]?.activeCustomers || 1)).toLocaleString()}</p>
                  </div>
                </>
              )}
              {chartType === 'acquisition' && (
                <>
                  <div>
                    <p className="text-muted-foreground">累計新規獲得</p>
                    <p className="font-semibold text-green-600">{data.summary.totalNewCustomers}人</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">月平均獲得数</p>
                    <p className="font-semibold">{Math.round(data.summary.totalNewCustomers / 6)}人</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">目標達成率</p>
                    <p className="font-semibold text-blue-600">{data.summary.avgAchievementRate}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">獲得効率</p>
                    <p className="font-semibold text-purple-600">{data.summary.projectedAnnualGrowth > 0 ? '向上中' : '要改善'}</p>
                  </div>
                </>
              )}
              {(chartType === 'churn' || chartType === 'expenses' || chartType === 'profitability' || chartType === 'growth' || chartType === 'all') && (
                <>
                  <div>
                    <p className="text-muted-foreground">平均MRR成長率</p>
                    <p className="font-semibold text-green-600">+{data.summary.avgMrrGrowth}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">累計新規獲得</p>
                    <p className="font-semibold">{data.summary.totalNewCustomers}人</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">目標達成率</p>
                    <p className="font-semibold text-blue-600">{data.summary.avgAchievementRate}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">予測年間成長率</p>
                    <p className="font-semibold text-purple-600">+{data.summary.projectedAnnualGrowth}%</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
