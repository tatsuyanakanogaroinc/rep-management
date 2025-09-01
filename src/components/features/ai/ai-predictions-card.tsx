'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAIPredictions } from '@/hooks/useAIPredictions';
import { PredictionData, Alert as AIAlert } from '@/lib/ai-predictions';
import { TrendingUp, TrendingDown, Minus, Brain, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { format, addMonths } from 'date-fns';
import { ja } from 'date-fns/locale';
import { AILoading } from '@/components/ui/loading';

interface AIPredictionsCardProps {
  currentMonth: string;
}

export function AIPredictionsCard({ currentMonth }: AIPredictionsCardProps) {
  const { data: aiData, isLoading, error } = useAIPredictions(currentMonth);
  const [showDetails, setShowDetails] = useState(false);

  if (isLoading) {
    return (
      <Card className="glass">
        <CardContent>
          <AILoading />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="glass">
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              AI分析でエラーが発生しました
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!aiData) return null;

  const { predictions, alerts } = aiData;
  const nextMonth = format(addMonths(new Date(currentMonth + '-01'), 1), 'yyyy年MM月', { locale: ja });

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-blue-100 text-blue-800';
    if (confidence >= 0.4) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'danger':
        return <AlertCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const formatMetricName = (metric: string) => {
    const names: Record<string, string> = {
      mrr: 'MRR',
      active_customers: '有料会員数',
      new_acquisitions: '新規獲得',
      churn_rate: 'チャーン率',
      monthly_expenses: '月次支出'
    };
    return names[metric] || metric;
  };

  const formatValue = (metric: string, value: number) => {
    switch (metric) {
      case 'mrr':
      case 'monthly_expenses':
        return `¥${value.toLocaleString()}`;
      case 'churn_rate':
        return `${value}%`;
      default:
        return (value || 0).toString();
    }
  };

  return (
    <Card className="glass">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <CardTitle>AI予測分析</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? '簡単表示' : '詳細表示'}
          </Button>
        </div>
        <CardDescription>
          {nextMonth}の業績予測とアラート
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* アラート表示 */}
        {alerts.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              重要なアラート ({alerts.length}件)
            </h4>
            <div className="space-y-2">
              {alerts.slice(0, showDetails ? alerts.length : 3).map((alert) => (
                <Alert
                  key={alert.id}
                  variant={alert.type === 'danger' ? 'destructive' : 'default'}
                  className="py-2"
                >
                  <div className="flex items-start gap-2">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <div className="font-medium text-sm">{alert.title}</div>
                      <div className="text-sm opacity-90">{alert.message}</div>
                    </div>
                  </div>
                </Alert>
              ))}
              {!showDetails && alerts.length > 3 && (
                <p className="text-sm text-muted-foreground text-center">
                  他{alerts.length - 3}件のアラート（詳細表示で確認）
                </p>
              )}
            </div>
          </div>
        )}

        {/* 予測データ表示 */}
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            {nextMonth}の予測
          </h4>
          <div className="grid gap-3">
            {predictions.slice(0, showDetails ? predictions.length : 4).map((prediction) => (
              <div
                key={prediction.metric}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/50 rounded-lg border gap-3"
              >
                <div className="flex items-center gap-3">
                  {getTrendIcon(prediction.trend)}
                  <div>
                    <div className="font-medium text-sm">
                      {formatMetricName(prediction.metric)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      現在: {formatValue(prediction.metric, prediction.currentValue)}
                    </div>
                  </div>
                </div>
                <div className="text-right sm:text-right text-left">
                  <div className="font-semibold text-lg">
                    {formatValue(prediction.metric, prediction.predictedValue)}
                  </div>
                  <div className="flex items-center gap-2 text-xs mt-1 justify-end sm:justify-end justify-start">
                    <span className={`font-medium ${prediction.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {prediction.changePercent >= 0 ? '+' : ''}{prediction.changePercent.toFixed(1)}%
                    </span>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${getConfidenceColor(prediction.confidence)}`}
                    >
                      信頼度{Math.round(prediction.confidence * 100)}%
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 信頼度についての説明 */}
        <div className="text-xs text-muted-foreground bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-lg border">
          <div className="flex items-start gap-2">
            <Brain className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium mb-2 text-gray-800">AI予測について</p>
              <ul className="space-y-1">
                <li>• 過去6ヶ月のデータを基に線形回帰・移動平均・季節性を考慮</li>
                <li>• 信頼度は予測の確実性を表し、データが多いほど高精度</li>
                <li>• 外部要因（市場変化など）は含まれていません</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}