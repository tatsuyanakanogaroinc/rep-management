import { format, addMonths, subMonths, startOfMonth } from 'date-fns';

export interface PredictionData {
  metric: string;
  currentValue: number;
  predictedValue: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
  changePercent: number;
}

export interface HistoricalData {
  date: string;
  value: number;
}

// シンプルな線形回帰予測
function linearRegression(data: HistoricalData[]): { slope: number; intercept: number; r2: number } {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: data[0]?.value || 0, r2: 0 };

  const xValues = data.map((_, index) => index);
  const yValues = data.map(d => d.value);

  const sumX = xValues.reduce((a, b) => a + b, 0);
  const sumY = yValues.reduce((a, b) => a + b, 0);
  const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
  const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // R²の計算
  const yMean = sumY / n;
  const ssTotal = yValues.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
  const ssRes = yValues.reduce((sum, y, i) => {
    const predicted = slope * i + intercept;
    return sum + Math.pow(y - predicted, 2);
  }, 0);
  const r2 = ssTotal === 0 ? 1 : 1 - (ssRes / ssTotal);

  return { slope, intercept, r2: Math.max(0, r2) };
}

// 移動平均による予測
function movingAverage(data: HistoricalData[], window: number = 3): number {
  if (data.length === 0) return 0;
  if (data.length < window) return data[data.length - 1].value;
  
  const lastValues = data.slice(-window).map(d => d.value);
  return lastValues.reduce((sum, val) => sum + val, 0) / window;
}

// 季節性を考慮した予測（簡易版）
function seasonalPrediction(data: HistoricalData[], currentMonth: number): number {
  if (data.length === 0) return 0;
  
  // 同じ月のデータを抽出
  const sameMonthData = data.filter(d => {
    const month = new Date(d.date).getMonth();
    return month === currentMonth;
  });
  
  if (sameMonthData.length === 0) return data[data.length - 1].value;
  
  // 同じ月の平均値を計算
  const average = sameMonthData.reduce((sum, d) => sum + d.value, 0) / sameMonthData.length;
  
  // 全体のトレンドも考慮
  const { slope } = linearRegression(data);
  const trendAdjustment = slope * data.length;
  
  return Math.max(0, average + trendAdjustment);
}

export async function generatePredictions(
  historicalData: Record<string, HistoricalData[]>,
  currentMonth: string
): Promise<PredictionData[]> {
  const predictions: PredictionData[] = [];
  const nextMonthDate = addMonths(new Date(currentMonth + '-01'), 1);
  const nextMonth = nextMonthDate.getMonth();

  for (const [metric, data] of Object.entries(historicalData)) {
    if (data.length === 0) continue;

    const currentValue = data[data.length - 1]?.value || 0;
    
    // 複数の予測手法を組み合わせ
    const linearResult = linearRegression(data);
    const linearPrediction = linearResult.slope * data.length + linearResult.intercept;
    const movingAvgPrediction = movingAverage(data);
    const seasonalPrediction = seasonalPrediction(data, nextMonth);
    
    // 重み付き平均で最終予測値を算出
    const weights = {
      linear: Math.min(0.6, linearResult.r2), // R²が高いほど重要視
      movingAvg: 0.3,
      seasonal: 0.1
    };
    
    const totalWeight = weights.linear + weights.movingAvg + weights.seasonal;
    const predictedValue = Math.max(0,
      (linearPrediction * weights.linear + 
       movingAvgPrediction * weights.movingAvg + 
       seasonalPrediction * weights.seasonal) / totalWeight
    );

    // 信頼度の計算
    const variance = data.reduce((sum, d, i) => {
      const predicted = linearResult.slope * i + linearResult.intercept;
      return sum + Math.pow(d.value - predicted, 2);
    }, 0) / data.length;
    
    const confidence = Math.min(0.95, Math.max(0.1, 
      linearResult.r2 * 0.7 + (data.length >= 6 ? 0.3 : data.length / 6 * 0.3)
    ));

    // トレンドの判定
    const change = predictedValue - currentValue;
    const changePercent = currentValue > 0 ? (change / currentValue) * 100 : 0;
    
    let trend: 'up' | 'down' | 'stable';
    if (Math.abs(changePercent) < 5) {
      trend = 'stable';
    } else if (changePercent > 0) {
      trend = 'up';
    } else {
      trend = 'down';
    }

    predictions.push({
      metric,
      currentValue,
      predictedValue: Math.round(predictedValue * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
      trend,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100
    });
  }

  return predictions;
}

// アラート判定
export interface Alert {
  id: string;
  type: 'warning' | 'danger' | 'info';
  title: string;
  message: string;
  metric: string;
  value: number;
  threshold?: number;
  timestamp: string;
}

export function generateAlerts(
  predictions: PredictionData[],
  targets: Record<string, number> = {}
): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date().toISOString();

  predictions.forEach((prediction) => {
    const target = targets[prediction.metric];

    // 1. 大幅な変化の警告
    if (Math.abs(prediction.changePercent) > 20 && prediction.confidence > 0.5) {
      alerts.push({
        id: `change-${prediction.metric}-${Date.now()}`,
        type: prediction.trend === 'down' ? 'warning' : 'info',
        title: `${prediction.metric}の大幅な変化予測`,
        message: `来月は${Math.abs(prediction.changePercent)}%の${prediction.trend === 'up' ? '増加' : '減少'}が予測されます（信頼度: ${(prediction.confidence * 100).toFixed(0)}%）`,
        metric: prediction.metric,
        value: prediction.predictedValue,
        timestamp: now
      });
    }

    // 2. 目標との乖離警告
    if (target) {
      const targetDiff = ((prediction.predictedValue - target) / target) * 100;
      if (Math.abs(targetDiff) > 15) {
        alerts.push({
          id: `target-${prediction.metric}-${Date.now()}`,
          type: targetDiff < -15 ? 'danger' : targetDiff > 15 ? 'info' : 'warning',
          title: `${prediction.metric}の目標乖離`,
          message: `来月の予測値が目標から${Math.abs(targetDiff).toFixed(1)}%乖離しています`,
          metric: prediction.metric,
          value: prediction.predictedValue,
          threshold: target,
          timestamp: now
        });
      }
    }

    // 3. チャーン率の警告（特別処理）
    if (prediction.metric === 'churn_rate' && prediction.predictedValue > 10 && prediction.confidence > 0.6) {
      alerts.push({
        id: `churn-${Date.now()}`,
        type: 'danger',
        title: '高いチャーン率の予測',
        message: `来月のチャーン率が${prediction.predictedValue}%に達する可能性があります`,
        metric: prediction.metric,
        value: prediction.predictedValue,
        timestamp: now
      });
    }

    // 4. MRR減少の警告
    if (prediction.metric === 'mrr' && prediction.trend === 'down' && prediction.confidence > 0.5) {
      alerts.push({
        id: `mrr-decline-${Date.now()}`,
        type: 'warning',
        title: 'MRR減少の予測',
        message: `来月のMRRが${Math.abs(prediction.changePercent)}%減少する可能性があります`,
        metric: prediction.metric,
        value: prediction.predictedValue,
        timestamp: now
      });
    }
  });

  return alerts;
}