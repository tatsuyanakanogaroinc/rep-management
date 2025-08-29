import { format, addMonths } from 'date-fns';

interface GrowthParametersInput {
  initial_acquisitions: number;
  monthly_growth_rate: number;
  monthly_price: number;
  yearly_price: number;
  churn_rate: number;
}

interface TargetRecord {
  period: string;
  metric_type: string;
  target_value: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export function generateTargetsFromParameters(parameters: GrowthParametersInput): TargetRecord[] {
  const targets: TargetRecord[] = [];
  const now = new Date().toISOString();
  
  // 開始月: 2025年9月
  const startDate = new Date('2025-09-01');
  
  // 計算期間: 12ヶ月（1年間）に制限
  const months = 12;
  
  // 初期値
  let cumulativeCustomers = 0;
  let previousMonthCustomers = 0;
  
  // 数値の上限設定（データベースのinteger型の最大値を考慮）
  const MAX_CUSTOMERS = 1000000; // 100万人
  const MAX_MRR = 2147483647; // PostgreSQLのinteger型の最大値
  const MAX_ACQUISITIONS = 100000; // 10万人/月
  
  for (let i = 0; i < months; i++) {
    const currentDate = addMonths(startDate, i);
    const period = format(currentDate, 'yyyy-MM');
    
    // 成長率を段階的に減衰させる（成長の持続可能性を考慮）
    const decayFactor = Math.pow(0.95, i); // 月ごとに5%ずつ成長率を減衰
    const adjustedGrowthRate = parameters.monthly_growth_rate * decayFactor;
    
    // 新規獲得数の計算（成長率を適用、上限設定）
    const rawNewAcquisitions = parameters.initial_acquisitions * Math.pow(1 + adjustedGrowthRate / 100, i);
    const newAcquisitions = Math.min(MAX_ACQUISITIONS, Math.round(rawNewAcquisitions));
    
    // チャーン数の計算（前月の顧客数にチャーン率を適用）
    const churnCount = Math.round(previousMonthCustomers * (parameters.churn_rate / 100));
    
    // アクティブ顧客数の計算（上限設定）
    cumulativeCustomers = Math.min(MAX_CUSTOMERS, Math.max(0, cumulativeCustomers + newAcquisitions - churnCount));
    
    // MRRの計算（月額顧客70%、年額顧客30%と仮定）
    const monthlyCustomers = Math.round(cumulativeCustomers * 0.7);
    const yearlyCustomers = Math.round(cumulativeCustomers * 0.3);
    const rawMrr = monthlyCustomers * parameters.monthly_price + 
                   yearlyCustomers * Math.round(parameters.yearly_price / 12);
    const mrr = Math.min(MAX_MRR, rawMrr);
    
    // 支出予算の計算（売上に応じたスケーリング）
    const baseExpenses = 800000; // 基本固定費
    const variableExpenses = mrr * 0.4; // 売上の40%を変動費として
    const monthlyExpenses = Math.min(MAX_MRR, Math.round(baseExpenses + variableExpenses));
    
    // デバッグログ
    console.log(`Month ${i + 1} (${period}):`, {
      newAcquisitions,
      cumulativeCustomers,
      mrr,
      monthlyExpenses,
      adjustedGrowthRate: adjustedGrowthRate.toFixed(2) + '%'
    });
    
    // ターゲットレコードを追加（数値が安全な範囲内であることを確認）
    targets.push({
      period,
      metric_type: 'new_acquisitions',
      target_value: Math.min(newAcquisitions, MAX_MRR),
      created_at: now,
      updated_at: now,
      is_active: true
    });
    
    targets.push({
      period,
      metric_type: 'active_customers',
      target_value: Math.min(cumulativeCustomers, MAX_MRR),
      created_at: now,
      updated_at: now,
      is_active: true
    });
    
    targets.push({
      period,
      metric_type: 'mrr',
      target_value: Math.min(mrr, MAX_MRR),
      created_at: now,
      updated_at: now,
      is_active: true
    });
    
    targets.push({
      period,
      metric_type: 'monthly_expenses',
      target_value: Math.min(monthlyExpenses, MAX_MRR),
      created_at: now,
      updated_at: now,
      is_active: true
    });
    
    targets.push({
      period,
      metric_type: 'churn_rate',
      target_value: Math.min(parameters.churn_rate, 100),
      created_at: now,
      updated_at: now,
      is_active: true
    });
    
    // 次の月のために現在の顧客数を保存
    previousMonthCustomers = cumulativeCustomers;
  }
  
  return targets;
}

// 月次成長シミュレーション関数
export function simulateGrowth(parameters: GrowthParametersInput, months: number = 12) {
  const simulation = [];
  let cumulativeCustomers = 0;
  let cumulativeMRR = 0;
  let cumulativeExpenses = 0;
  let previousMonthCustomers = 0;
  
  for (let i = 0; i < months; i++) {
    // 新規獲得数
    const newAcquisitions = Math.round(
      parameters.initial_acquisitions * Math.pow(1 + parameters.monthly_growth_rate / 100, i)
    );
    
    // チャーン数
    const churnCount = Math.round(previousMonthCustomers * (parameters.churn_rate / 100));
    
    // アクティブ顧客数
    cumulativeCustomers = Math.max(0, cumulativeCustomers + newAcquisitions - churnCount);
    
    // MRR計算
    const monthlyCustomers = Math.round(cumulativeCustomers * 0.7);
    const yearlyCustomers = Math.round(cumulativeCustomers * 0.3);
    const mrr = monthlyCustomers * parameters.monthly_price + 
                yearlyCustomers * Math.round(parameters.yearly_price / 12);
    
    cumulativeMRR = mrr;
    
    // 支出計算
    const monthlyExpenses = Math.round(800000 + mrr * 0.4);
    cumulativeExpenses = monthlyExpenses;
    
    // 営業利益
    const operatingProfit = mrr - monthlyExpenses;
    const operatingMargin = mrr > 0 ? (operatingProfit / mrr) * 100 : -100;
    
    simulation.push({
      month: i + 1,
      period: format(addMonths(new Date('2025-09-01'), i), 'yyyy-MM'),
      newAcquisitions,
      churnCount,
      activeCustomers: cumulativeCustomers,
      mrr: cumulativeMRR,
      monthlyExpenses: cumulativeExpenses,
      operatingProfit,
      operatingMargin: Math.round(operatingMargin * 100) / 100,
      customerGrowthRate: i > 0 ? ((cumulativeCustomers / previousMonthCustomers - 1) * 100) : 0
    });
    
    previousMonthCustomers = cumulativeCustomers;
  }
  
  return simulation;
}

// パラメータの妥当性チェック
export function validateParameters(parameters: GrowthParametersInput): string[] {
  const errors = [];
  
  if (parameters.initial_acquisitions <= 0) {
    errors.push('初月新規獲得数は1以上である必要があります');
  }
  
  if (parameters.monthly_growth_rate < 0 || parameters.monthly_growth_rate > 1000) {
    errors.push('月次成長率は0%から1000%の範囲で設定してください');
  }
  
  if (parameters.monthly_price <= 0) {
    errors.push('月額料金は0円より大きい必要があります');
  }
  
  if (parameters.yearly_price <= 0) {
    errors.push('年額料金は0円より大きい必要があります');
  }
  
  if (parameters.churn_rate < 0 || parameters.churn_rate > 100) {
    errors.push('チャーン率は0%から100%の範囲で設定してください');
  }
  
  // 年額料金が月額料金の妥当な範囲かチェック
  const monthlyEquivalent = parameters.yearly_price / 12;
  if (monthlyEquivalent > parameters.monthly_price) {
    errors.push('年額料金の月割り金額が月額料金より高くなっています');
  }
  
  return errors;
}