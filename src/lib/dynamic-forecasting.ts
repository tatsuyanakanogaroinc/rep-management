interface HistoricalDataPoint {
  month: string;
  mrr: number;
  activeCustomers: number;
  newAcquisitions: number;
  churnRate: number;
  totalExpenses: number;
}

interface ForecastResult {
  month: string;
  predictedMrr: number;
  predictedCustomers: number;
  predictedNewAcquisitions: number;
  predictedChurnRate: number;
  predictedExpenses: number;
  confidence: number;
  scenarios: {
    optimistic: { mrr: number; customers: number };
    realistic: { mrr: number; customers: number };
    pessimistic: { mrr: number; customers: number };
  };
}

interface SeasonalFactors {
  [month: number]: {
    acquisitionMultiplier: number;
    churnMultiplier: number;
    revenueMultiplier: number;
  };
}

// 季節性要因（月別）
const SEASONAL_FACTORS: SeasonalFactors = {
  1: { acquisitionMultiplier: 1.1, churnMultiplier: 1.2, revenueMultiplier: 1.0 },  // 1月：新年効果
  2: { acquisitionMultiplier: 0.9, churnMultiplier: 1.1, revenueMultiplier: 0.95 }, // 2月：短期間
  3: { acquisitionMultiplier: 1.2, churnMultiplier: 0.9, revenueMultiplier: 1.05 }, // 3月：新期準備
  4: { acquisitionMultiplier: 1.3, churnMultiplier: 0.8, revenueMultiplier: 1.1 },  // 4月：新年度
  5: { acquisitionMultiplier: 1.0, churnMultiplier: 1.0, revenueMultiplier: 1.0 },  // 5月：通常
  6: { acquisitionMultiplier: 0.95, churnMultiplier: 1.0, revenueMultiplier: 1.0 }, // 6月：通常
  7: { acquisitionMultiplier: 0.9, churnMultiplier: 1.1, revenueMultiplier: 0.95 }, // 7月：夏期
  8: { acquisitionMultiplier: 0.8, churnMultiplier: 1.2, revenueMultiplier: 0.9 },  // 8月：夏期休暇
  9: { acquisitionMultiplier: 1.1, churnMultiplier: 0.95, revenueMultiplier: 1.05 }, // 9月：秋需要
  10: { acquisitionMultiplier: 1.2, churnMultiplier: 0.9, revenueMultiplier: 1.1 }, // 10月：下期開始
  11: { acquisionMultiplier: 1.0, churnMultiplier: 1.0, revenueMultiplier: 1.0 },  // 11月：通常
  12: { acquisitionMultiplier: 0.8, churnMultiplier: 1.3, revenueMultiplier: 0.9 }  // 12月：年末
};

// 移動平均計算
function calculateMovingAverage(data: number[], window: number): number[] {
  const result: number[] = [];
  for (let i = window - 1; i < data.length; i++) {
    const sum = data.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0);
    result.push(sum / window);
  }
  return result;
}

// 成長率計算
function calculateGrowthRate(data: number[]): number[] {
  const growthRates: number[] = [];
  for (let i = 1; i < data.length; i++) {
    const rate = data[i - 1] > 0 ? ((data[i] - data[i - 1]) / data[i - 1]) * 100 : 0;
    growthRates.push(rate);
  }
  return growthRates;
}

// 線形回帰による予測
function linearRegression(x: number[], y: number[]): { slope: number; intercept: number; r2: number } {
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // R²値の計算
  const yMean = sumY / n;
  const totalSumSquares = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
  const residualSumSquares = y.reduce((sum, yi, i) => {
    const predicted = slope * x[i] + intercept;
    return sum + Math.pow(yi - predicted, 2);
  }, 0);
  const r2 = 1 - (residualSumSquares / totalSumSquares);

  return { slope, intercept, r2: Math.max(0, Math.min(1, r2)) };
}

// 指数平滑化による予測
function exponentialSmoothing(data: number[], alpha: number = 0.3): number {
  let smoothed = data[0];
  for (let i = 1; i < data.length; i++) {
    smoothed = alpha * data[i] + (1 - alpha) * smoothed;
  }
  return smoothed;
}

// MRR予測
function forecastMRR(historicalData: HistoricalDataPoint[], months: number): number[] {
  const mrrData = historicalData.map(d => d.mrr);
  const customerData = historicalData.map(d => d.activeCustomers);
  
  // MRRの成長率分析
  const mrrGrowthRates = calculateGrowthRate(mrrData);
  const avgGrowthRate = mrrGrowthRates.reduce((a, b) => a + b, 0) / mrrGrowthRates.length;
  
  // 顧客数とMRRの相関分析
  const timeIndex = historicalData.map((_, i) => i);
  const mrrRegression = linearRegression(timeIndex, mrrData);
  
  // 最新の傾向を重視した成長率
  const recentGrowthRate = exponentialSmoothing(mrrGrowthRates, 0.4);
  const trendAdjustedGrowthRate = (avgGrowthRate * 0.3 + recentGrowthRate * 0.7) / 100;
  
  const forecasts: number[] = [];
  let lastMrr = mrrData[mrrData.length - 1];
  
  for (let i = 0; i < months; i++) {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + i + 1);
    const monthFactor = SEASONAL_FACTORS[nextMonth.getMonth() + 1]?.revenueMultiplier || 1.0;
    
    // 線形回帰による予測
    const linearPrediction = mrrRegression.slope * (historicalData.length + i) + mrrRegression.intercept;
    
    // 成長率による予測
    const growthPrediction = lastMrr * (1 + trendAdjustedGrowthRate) * monthFactor;
    
    // 信頼度に基づく重み付け
    const confidence = Math.max(0.3, mrrRegression.r2);
    const prediction = linearPrediction * confidence + growthPrediction * (1 - confidence);
    
    forecasts.push(Math.max(0, prediction));
    lastMrr = prediction;
  }
  
  return forecasts;
}

// 顧客数予測
function forecastCustomers(historicalData: HistoricalDataPoint[], months: number): number[] {
  const customerData = historicalData.map(d => d.activeCustomers);
  const acquisitionData = historicalData.map(d => d.newAcquisitions);
  const churnRateData = historicalData.map(d => d.churnRate);
  
  // トレンド分析
  const timeIndex = historicalData.map((_, i) => i);
  const customerRegression = linearRegression(timeIndex, customerData);
  
  // 新規獲得とチャーンの平均
  const avgAcquisition = acquisitionData.reduce((a, b) => a + b, 0) / acquisitionData.length;
  const avgChurnRate = churnRateData.reduce((a, b) => a + b, 0) / churnRateData.length;
  
  const forecasts: number[] = [];
  let currentCustomers = customerData[customerData.length - 1];
  
  for (let i = 0; i < months; i++) {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + i + 1);
    const acquisitionFactor = SEASONAL_FACTORS[nextMonth.getMonth() + 1]?.acquisitionMultiplier || 1.0;
    const churnFactor = SEASONAL_FACTORS[nextMonth.getMonth() + 1]?.churnMultiplier || 1.0;
    
    const predictedAcquisitions = avgAcquisition * acquisitionFactor;
    const predictedChurn = (currentCustomers * (avgChurnRate / 100)) * churnFactor;
    
    currentCustomers = Math.max(0, currentCustomers + predictedAcquisitions - predictedChurn);
    forecasts.push(Math.round(currentCustomers));
  }
  
  return forecasts;
}

// 支出予測
function forecastExpenses(historicalData: HistoricalDataPoint[], predictedMrr: number[], months: number): number[] {
  const expenseData = historicalData.map(d => d.totalExpenses);
  const mrrData = historicalData.map(d => d.mrr);
  
  // 支出とMRRの相関分析
  const expenseMrrCorrelation = linearRegression(mrrData, expenseData);
  
  // 固定費と変動費の分離
  const avgExpenseRatio = expenseData.reduce((sum, expense, i) => 
    sum + (mrrData[i] > 0 ? expense / mrrData[i] : 0), 0) / expenseData.length;
  
  // 最近の支出傾向
  const recentExpenses = expenseData.slice(-3);
  const avgRecentExpense = recentExpenses.reduce((a, b) => a + b, 0) / recentExpenses.length;
  
  const forecasts: number[] = [];
  
  for (let i = 0; i < months; i++) {
    // MRR比例モデル
    const mrrBasedExpense = predictedMrr[i] * avgExpenseRatio;
    
    // 固定費＋変動費モデル
    const baseCost = avgRecentExpense * 0.7; // 固定費70%と仮定
    const variableCost = predictedMrr[i] * 0.3; // MRRの30%を変動費
    const costBasedExpense = baseCost + variableCost;
    
    // 2つのモデルの平均
    const prediction = (mrrBasedExpense + costBasedExpense) / 2;
    forecasts.push(Math.round(prediction));
  }
  
  return forecasts;
}

// シナリオ予測
function generateScenarios(
  basePrediction: number,
  confidence: number,
  variability: number = 0.2
): { optimistic: number; realistic: number; pessimistic: number } {
  const realistic = basePrediction;
  const range = basePrediction * variability * (1 - confidence);
  
  return {
    optimistic: Math.round(basePrediction + range),
    realistic: Math.round(realistic),
    pessimistic: Math.round(Math.max(0, basePrediction - range))
  };
}

// メイン予測関数
export function generateDynamicForecast(
  historicalData: HistoricalDataPoint[],
  forecastMonths: number = 6
): ForecastResult[] {
  if (historicalData.length < 3) {
    throw new Error('予測には最低3ヶ月の履歴データが必要です');
  }

  // 各指標の予測
  const mrrForecasts = forecastMRR(historicalData, forecastMonths);
  const customerForecasts = forecastCustomers(historicalData, forecastMonths);
  const expenseForecasts = forecastExpenses(historicalData, mrrForecasts, forecastMonths);
  
  // 信頼度計算（データの一貫性と量に基づく）
  const dataQuality = Math.min(1.0, historicalData.length / 12); // 12ヶ月で最大信頼度
  const baseConfidence = 0.6 + (dataQuality * 0.3);
  
  const results: ForecastResult[] = [];
  
  for (let i = 0; i < forecastMonths; i++) {
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + i + 1);
    const month = futureDate.toISOString().slice(0, 7);
    
    // 予測の信頼度（時間が経つほど低下）
    const timeDecay = Math.max(0.3, 1 - (i * 0.1));
    const confidence = Math.round((baseConfidence * timeDecay) * 100);
    
    // チャーン率予測（簡易）
    const avgChurnRate = historicalData.reduce((sum, d) => sum + d.churnRate, 0) / historicalData.length;
    const seasonalChurnFactor = SEASONAL_FACTORS[futureDate.getMonth() + 1]?.churnMultiplier || 1.0;
    const predictedChurnRate = avgChurnRate * seasonalChurnFactor;
    
    // 新規獲得予測
    const avgAcquisition = historicalData.reduce((sum, d) => sum + d.newAcquisitions, 0) / historicalData.length;
    const seasonalAcquisitionFactor = SEASONAL_FACTORS[futureDate.getMonth() + 1]?.acquisitionMultiplier || 1.0;
    const predictedNewAcquisitions = Math.round(avgAcquisition * seasonalAcquisitionFactor);
    
    results.push({
      month,
      predictedMrr: Math.round(mrrForecasts[i]),
      predictedCustomers: customerForecasts[i],
      predictedNewAcquisitions,
      predictedChurnRate: Math.round(predictedChurnRate * 10) / 10,
      predictedExpenses: expenseForecasts[i],
      confidence,
      scenarios: {
        optimistic: {
          mrr: generateScenarios(mrrForecasts[i], confidence / 100).optimistic,
          customers: generateScenarios(customerForecasts[i], confidence / 100).optimistic
        },
        realistic: {
          mrr: generateScenarios(mrrForecasts[i], confidence / 100).realistic,
          customers: generateScenarios(customerForecasts[i], confidence / 100).realistic
        },
        pessimistic: {
          mrr: generateScenarios(mrrForecasts[i], confidence / 100).pessimistic,
          customers: generateScenarios(customerForecasts[i], confidence / 100).pessimistic
        }
      }
    });
  }
  
  return results;
}

// 予測精度の評価
export function evaluateForecastAccuracy(
  predictions: number[],
  actual: number[]
): { mape: number; rmse: number; accuracy: string } {
  if (predictions.length !== actual.length) {
    throw new Error('予測値と実績値の数が一致しません');
  }
  
  // MAPE (Mean Absolute Percentage Error)
  let mapeSum = 0;
  let rmseSum = 0;
  let validPoints = 0;
  
  for (let i = 0; i < predictions.length; i++) {
    if (actual[i] !== 0) {
      mapeSum += Math.abs((actual[i] - predictions[i]) / actual[i]);
      validPoints++;
    }
    rmseSum += Math.pow(actual[i] - predictions[i], 2);
  }
  
  const mape = validPoints > 0 ? (mapeSum / validPoints) * 100 : 0;
  const rmse = Math.sqrt(rmseSum / predictions.length);
  
  let accuracy = 'poor';
  if (mape < 10) accuracy = 'excellent';
  else if (mape < 20) accuracy = 'good';
  else if (mape < 30) accuracy = 'fair';
  
  return { mape: Math.round(mape), rmse: Math.round(rmse), accuracy };
}

// トレンド分析
export function analyzeTrends(historicalData: HistoricalDataPoint[]): {
  mrrTrend: 'increasing' | 'decreasing' | 'stable';
  customerTrend: 'increasing' | 'decreasing' | 'stable';
  churnTrend: 'increasing' | 'decreasing' | 'stable';
  momentum: 'accelerating' | 'decelerating' | 'steady';
} {
  const mrrData = historicalData.map(d => d.mrr);
  const customerData = historicalData.map(d => d.activeCustomers);
  const churnData = historicalData.map(d => d.churnRate);
  
  const mrrGrowthRates = calculateGrowthRate(mrrData);
  const customerGrowthRates = calculateGrowthRate(customerData);
  const churnGrowthRates = calculateGrowthRate(churnData);
  
  const avgMrrGrowth = mrrGrowthRates.reduce((a, b) => a + b, 0) / mrrGrowthRates.length;
  const avgCustomerGrowth = customerGrowthRates.reduce((a, b) => a + b, 0) / customerGrowthRates.length;
  const avgChurnGrowth = churnGrowthRates.reduce((a, b) => a + b, 0) / churnGrowthRates.length;
  
  // 最近の傾向（直近3ヶ月）
  const recentMrrGrowth = mrrGrowthRates.slice(-3).reduce((a, b) => a + b, 0) / 3;
  const momentum = recentMrrGrowth > avgMrrGrowth ? 'accelerating' : 
                   recentMrrGrowth < avgMrrGrowth ? 'decelerating' : 'steady';
  
  return {
    mrrTrend: avgMrrGrowth > 2 ? 'increasing' : avgMrrGrowth < -2 ? 'decreasing' : 'stable',
    customerTrend: avgCustomerGrowth > 2 ? 'increasing' : avgCustomerGrowth < -2 ? 'decreasing' : 'stable',
    churnTrend: avgChurnGrowth > 0.5 ? 'increasing' : avgChurnGrowth < -0.5 ? 'decreasing' : 'stable',
    momentum
  };
}