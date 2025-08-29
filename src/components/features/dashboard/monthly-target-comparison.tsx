'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Target, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useDashboardWithTargets } from '@/hooks/useDashboardWithTargets';

interface MonthlyTargetComparisonProps {
  selectedMonth: string;
}

interface MetricComparison {
  label: string;
  actual: number;
  target: number;
  unit: string;
  progress: number;
  difference: number;
  status: 'excellent' | 'good' | 'warning' | 'danger';
  isInverted?: boolean;
}

export function MonthlyTargetComparison({ selectedMonth }: MonthlyTargetComparisonProps) {
  const { data, isLoading } = useDashboardWithTargets(selectedMonth, true);

  if (isLoading || !data) {
    return (
      <Card className="glass">
        <CardContent className="p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  const getStatus = (progress: number, isInverted: boolean = false): MetricComparison['status'] => {
    if (isInverted) {
      if (progress >= 120) return 'danger';
      if (progress >= 100) return 'warning';
      if (progress >= 80) return 'good';
      return 'excellent';
    } else {
      if (progress >= 100) return 'excellent';
      if (progress >= 80) return 'good';
      if (progress >= 50) return 'warning';
      return 'danger';
    }
  };

  const getStatusColor = (status: MetricComparison['status']) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'danger': return 'text-red-600 bg-red-50';
    }
  };

  const getStatusIcon = (status: MetricComparison['status']) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="w-4 h-4" />;
      case 'good': return <TrendingUp className="w-4 h-4" />;
      case 'warning': return <AlertCircle className="w-4 h-4" />;
      case 'danger': return <XCircle className="w-4 h-4" />;
    }
  };

  const metrics: MetricComparison[] = [
    {
      label: 'MRR（月次経常収益）',
      actual: data.mrr,
      target: data.mrrTarget || 0,
      unit: '円',
      progress: data.mrrProgress,
      difference: data.mrrDifference,
      status: getStatus(data.mrrProgress)
    },
    {
      label: '新規顧客獲得',
      actual: data.newAcquisitions,
      target: data.newAcquisitionsTarget || 0,
      unit: '人',
      progress: data.newAcquisitionsProgress,
      difference: data.newAcquisitionsDifference,
      status: getStatus(data.newAcquisitionsProgress)
    },
    {
      label: 'アクティブ顧客数',
      actual: data.activeCustomers,
      target: data.activeCustomersTarget || 0,
      unit: '人',
      progress: data.activeCustomersProgress,
      difference: data.activeCustomersDifference,
      status: getStatus(data.activeCustomersProgress)
    },
    {
      label: 'チャーン率',
      actual: data.churnRate,
      target: data.churnRateTarget || 0,
      unit: '%',
      progress: data.churnRateProgress,
      difference: data.churnRateDifference,
      status: getStatus(data.churnRateProgress, true),
      isInverted: true
    },
    {
      label: '月次費用',
      actual: data.totalExpenses,
      target: data.monthlyExpensesTarget || 0,
      unit: '円',
      progress: data.expensesProgress,
      difference: data.expensesDifference,
      status: getStatus(data.expensesProgress, true),
      isInverted: true
    }
  ];

  const formatValue = (value: number, unit: string) => {
    if (unit === '円') {
      return `¥${value.toLocaleString()}`;
    }
    if (unit === '%') {
      return `${value}%`;
    }
    return `${value}${unit}`;
  };

  const getDifferenceDisplay = (diff: number, unit: string, isInverted: boolean = false) => {
    const formattedDiff = formatValue(Math.abs(diff), unit);
    const isPositive = diff > 0;
    
    if (isInverted) {
      return {
        text: isPositive ? `目標より${formattedDiff}超過` : `目標より${formattedDiff}削減`,
        color: isPositive ? 'text-red-600' : 'text-green-600',
        icon: isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />
      };
    } else {
      return {
        text: isPositive ? `目標より${formattedDiff}上回る` : `目標より${formattedDiff}不足`,
        color: isPositive ? 'text-green-600' : 'text-red-600',
        icon: isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />
      };
    }
  };

  return (
    <Card className="glass">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>月次目標との詳細比較</CardTitle>
            <CardDescription>スプレッドシートベースの目標値との実績比較</CardDescription>
          </div>
          <Badge variant="outline" className="text-sm">
            {selectedMonth.replace('-', '年') + '月'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {metrics.map((metric) => {
            const diffDisplay = getDifferenceDisplay(metric.difference, metric.unit, metric.isInverted);
            
            return (
              <div key={metric.label} className="p-4 rounded-lg bg-white/50 space-y-3">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium">{metric.label}</h4>
                  <Badge className={getStatusColor(metric.status)}>
                    <span className="flex items-center gap-1">
                      {getStatusIcon(metric.status)}
                      {metric.status === 'excellent' && '目標達成'}
                      {metric.status === 'good' && '順調'}
                      {metric.status === 'warning' && '要注意'}
                      {metric.status === 'danger' && '要改善'}
                    </span>
                  </Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">実績</p>
                    <p className="font-semibold">{formatValue(metric.actual, metric.unit)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">目標</p>
                    <p className="font-semibold flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      {formatValue(metric.target, metric.unit)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">差異</p>
                    <p className={`font-semibold flex items-center gap-1 ${diffDisplay.color}`}>
                      {diffDisplay.icon}
                      {diffDisplay.text}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>達成率</span>
                    <span>{metric.progress}%</span>
                  </div>
                  <Progress 
                    value={Math.min(metric.progress, 150)} 
                    className="h-2"
                  />
                </div>
              </div>
            );
          })}
        </div>
        
        {/* 総合評価 */}
        <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
          <h4 className="font-medium mb-2">総合評価</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">目標達成項目</p>
              <p className="font-semibold text-green-600">
                {metrics.filter(m => m.status === 'excellent' || m.status === 'good').length} / {metrics.length}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">要改善項目</p>
              <p className="font-semibold text-red-600">
                {metrics.filter(m => m.status === 'danger').length} 項目
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}