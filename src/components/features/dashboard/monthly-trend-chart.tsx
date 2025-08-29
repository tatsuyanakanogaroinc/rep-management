'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, ComposedChart } from 'recharts';
import { useState } from 'react';
import { format, subMonths, addMonths } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useMonthlyTrends } from '@/hooks/useMonthlyTrends';
import { TrendingUp, Target, BarChart3, DollarSign } from 'lucide-react';

interface MonthlyTrendChartProps {
  currentMonth: string;
}

type ChartType = 'revenue' | 'customers' | 'acquisition' | 'all';

export function MonthlyTrendChart({ currentMonth }: MonthlyTrendChartProps) {
  const [chartType, setChartType] = useState<ChartType>('revenue');
  const { data, isLoading } = useMonthlyTrends(currentMonth);

  if (isLoading || !data) {
    return (
      <Card className="glass">
        <CardContent className="p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  // カスタムツールチップ
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="glass p-4 rounded-lg shadow-lg border border-gray-200">
        <p className="font-semibold text-sm mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 text-sm">
            <span style={{ color: entry.color }}>{entry.name}:</span>
            <span className="font-medium">
              {entry.name.includes('率') 
                ? `${entry.value}%`
                : entry.name.includes('円') || entry.name === 'MRR' || entry.name === '売上'
                ? `¥${entry.value.toLocaleString()}`
                : `${entry.value}${entry.name.includes('人') ? '人' : ''}`
              }
            </span>
          </div>
        ))}
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

  return (
    <Card className="glass">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="flex items-center gap-3">
            {config.icon}
            <div>
              <CardTitle className="text-lg">{config.title}</CardTitle>
              <CardDescription className="text-sm">{config.description}</CardDescription>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <Badge variant="outline" className="text-xs whitespace-nowrap">
              過去6ヶ月 + 未来6ヶ月
            </Badge>
            <Select value={chartType} onValueChange={(value) => setChartType(value as ChartType)}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">収益推移</SelectItem>
                <SelectItem value="customers">顧客数推移</SelectItem>
                <SelectItem value="acquisition">新規獲得推移</SelectItem>
                <SelectItem value="all">統合ビュー</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
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
                <Tooltip content={<CustomTooltip />} />
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
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {config.lines.map((line) => (
                  <Line
                    key={line.key}
                    type="monotone"
                    dataKey={line.key}
                    stroke={line.color}
                    strokeWidth={2}
                    strokeDasharray={line.strokeDasharray}
                    dot={{ fill: line.color, r: 4 }}
                    activeDot={{ r: 6 }}
                    name={line.name}
                  />
                ))}
                {/* 現在月を示す縦線 */}
                <Line
                  dataKey={() => null}
                  stroke="#ef4444"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

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

        {/* サマリー統計 */}
        {data.summary && (
          <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
            <h4 className="font-medium mb-3">直近6ヶ月サマリー</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">平均MRR成長率</p>
                <p className="font-semibold text-green-600">
                  +{data.summary.avgMrrGrowth}%
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">累計新規獲得</p>
                <p className="font-semibold">
                  {data.summary.totalNewCustomers}人
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">目標達成率</p>
                <p className="font-semibold text-blue-600">
                  {data.summary.avgAchievementRate}%
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">予測年間成長率</p>
                <p className="font-semibold text-purple-600">
                  +{data.summary.projectedAnnualGrowth}%
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}