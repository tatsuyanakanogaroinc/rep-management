interface MetricData {
  metric: string;
  planned: number;
  actual: number;
  achievement: number;
  difference: number;
  unit: string;
  isInverted?: boolean;
}

interface HistoricalData {
  month: string;
  mrr: number;
  activeCustomers: number;
  newAcquisitions: number;
  churnRate: number;
  totalExpenses: number;
  mrrTarget: number;
  activeCustomersTarget: number;
  newAcquisitionsTarget: number;
  churnRateTarget: number;
  monthlyExpensesTarget: number;
}

interface AnalysisResult {
  severity: 'critical' | 'warning' | 'info' | 'success';
  category: 'revenue' | 'customers' | 'acquisition' | 'churn' | 'expenses' | 'overall';
  issue: string;
  impact: string;
  rootCauses: string[];
  recommendations: string[];
  priority: number; // 1-5, 5 being highest priority
  timeframe: 'immediate' | 'short' | 'medium' | 'long';
  confidence: number; // 0-100%
}

// メトリクスの重要度定義
const METRIC_WEIGHTS = {
  mrr: 0.35,
  activeCustomers: 0.25,
  newAcquisitions: 0.20,
  churnRate: 0.15,
  totalExpenses: 0.05
};

// 乖離分析のメイン関数
export function analyzeVariances(
  currentMetrics: MetricData[],
  historicalData?: HistoricalData[]
): AnalysisResult[] {
  const analyses: AnalysisResult[] = [];
  
  // 各メトリクスを個別分析
  for (const metric of currentMetrics) {
    const analysis = analyzeMetricVariance(metric, historicalData);
    if (analysis) {
      analyses.push(analysis);
    }
  }
  
  // 全体的なパフォーマンス分析
  const overallAnalysis = analyzeOverallPerformance(currentMetrics);
  analyses.push(...overallAnalysis);
  
  // 相関分析（メトリクス間の関係性）
  const correlationAnalysis = analyzeMetricCorrelations(currentMetrics);
  analyses.push(...correlationAnalysis);
  
  // 優先度でソート
  return analyses.sort((a, b) => b.priority - a.priority);
}

// 個別メトリクス分析
function analyzeMetricVariance(
  metric: MetricData,
  historicalData?: HistoricalData[]
): AnalysisResult | null {
  const achievementThreshold = metric.isInverted ? 120 : 80;
  const criticalThreshold = metric.isInverted ? 150 : 60;
  
  if (metric.isInverted ? 
      metric.achievement <= achievementThreshold : 
      metric.achievement >= achievementThreshold
  ) {
    return null; // 問題なし
  }
  
  const severity = metric.isInverted ?
    (metric.achievement >= criticalThreshold ? 'critical' : 'warning') :
    (metric.achievement <= criticalThreshold ? 'critical' : 'warning');
  
  switch (metric.metric) {
    case 'MRR':
      return analyzeMRRVariance(metric, severity, historicalData);
    case 'アクティブ顧客数':
      return analyzeCustomerVariance(metric, severity, historicalData);
    case '新規獲得':
      return analyzeAcquisitionVariance(metric, severity, historicalData);
    case 'チャーン率':
      return analyzeChurnVariance(metric, severity, historicalData);
    case '月次支出':
      return analyzeExpenseVariance(metric, severity, historicalData);
    default:
      return null;
  }
}

// MRR分析
function analyzeMRRVariance(
  metric: MetricData,
  severity: 'critical' | 'warning',
  historicalData?: HistoricalData[]
): AnalysisResult {
  const shortfall = metric.planned - metric.actual;
  const shortfallPercentage = Math.abs(metric.achievement - 100);
  
  const rootCauses = [];
  const recommendations = [];
  
  if (shortfallPercentage > 30) {
    rootCauses.push('計画と実績の大幅な乖離');
    recommendations.push('価格戦略の見直し');
    recommendations.push('既存顧客のアップセル強化');
  }
  
  if (shortfallPercentage > 20) {
    rootCauses.push('新規顧客獲得の不足');
    recommendations.push('マーケティング予算の再配分検討');
    recommendations.push('顧客獲得チャネルの多様化');
  }
  
  rootCauses.push('プラン変更や解約の影響');
  recommendations.push('顧客満足度調査の実施');
  recommendations.push('リテンション施策の強化');
  
  return {
    severity,
    category: 'revenue',
    issue: `MRRが目標を${shortfallPercentage.toFixed(1)}%下回っています`,
    impact: `月次売上が¥${shortfall.toLocaleString()}不足。年間では¥${(shortfall * 12).toLocaleString()}の影響`,
    rootCauses,
    recommendations,
    priority: severity === 'critical' ? 5 : 4,
    timeframe: severity === 'critical' ? 'immediate' : 'short',
    confidence: 85
  };
}

// 顧客数分析
function analyzeCustomerVariance(
  metric: MetricData,
  severity: 'critical' | 'warning',
  historicalData?: HistoricalData[]
): AnalysisResult {
  const shortfall = metric.planned - metric.actual;
  const shortfallPercentage = Math.abs(metric.achievement - 100);
  
  const rootCauses = [];
  const recommendations = [];
  
  if (shortfallPercentage > 25) {
    rootCauses.push('新規獲得の大幅な遅れ');
    rootCauses.push('予想以上のチャーン発生');
    recommendations.push('緊急の顧客獲得キャンペーン実施');
    recommendations.push('解約防止施策の即座実行');
  } else {
    rootCauses.push('マーケティング効率の低下');
    rootCauses.push('競合他社の影響');
    recommendations.push('マーケティングチャネルの見直し');
    recommendations.push('競合分析と差別化戦略');
  }
  
  recommendations.push('リファラルプログラムの強化');
  recommendations.push('オンボーディングプロセスの改善');
  
  return {
    severity,
    category: 'customers',
    issue: `アクティブ顧客数が目標を${shortfall}人(${shortfallPercentage.toFixed(1)}%)下回っています`,
    impact: `顧客基盤の成長が計画より遅れています。将来の収益成長に影響`,
    rootCauses,
    recommendations,
    priority: severity === 'critical' ? 4 : 3,
    timeframe: 'short',
    confidence: 80
  };
}

// 新規獲得分析
function analyzeAcquisitionVariance(
  metric: MetricData,
  severity: 'critical' | 'warning',
  historicalData?: HistoricalData[]
): AnalysisResult {
  const shortfall = metric.planned - metric.actual;
  const shortfallPercentage = Math.abs(metric.achievement - 100);
  
  const rootCauses = [
    'マーケティングキャンペーンの効果不足',
    'コンバージョン率の低下',
    'リードの質の問題'
  ];
  
  const recommendations = [
    'マーケティングROIの分析と最適化',
    'ランディングページの改善',
    'セールスプロセスの見直し',
    'リードスコアリングの導入'
  ];
  
  if (shortfallPercentage > 30) {
    rootCauses.unshift('マーケティング予算の不足');
    recommendations.unshift('追加マーケティング予算の確保');
  }
  
  return {
    severity,
    category: 'acquisition',
    issue: `新規獲得が目標を${shortfall}人(${shortfallPercentage.toFixed(1)}%)下回っています`,
    impact: `顧客獲得ペースが遅れており、将来の成長目標達成が困難`,
    rootCauses,
    recommendations,
    priority: severity === 'critical' ? 4 : 3,
    timeframe: 'medium',
    confidence: 75
  };
}

// チャーン率分析
function analyzeChurnVariance(
  metric: MetricData,
  severity: 'critical' | 'warning',
  historicalData?: HistoricalData[]
): AnalysisResult {
  const excess = metric.actual - metric.planned;
  const excessPercentage = Math.abs(metric.achievement - 100);
  
  const rootCauses = [
    '顧客満足度の低下',
    'プロダクトの価値提供不足',
    '競合他社への流出',
    'サポート品質の問題'
  ];
  
  const recommendations = [
    '緊急顧客満足度調査の実施',
    'ハイリスク顧客の特定と対策',
    'プロダクト改善の優先度見直し',
    'カスタマーサクセスチームの強化'
  ];
  
  if (excess > 2) {
    rootCauses.unshift('深刻な顧客体験の問題');
    recommendations.unshift('経営陣による緊急対策会議');
  }
  
  return {
    severity: excess > 2 ? 'critical' : severity,
    category: 'churn',
    issue: `チャーン率が目標を${excess.toFixed(1)}ポイント上回っています`,
    impact: `顧客離脱が計画より多く、収益成長を阻害。月次で約${Math.round(excess * (metric.planned * 10))}人の追加離脱`,
    rootCauses,
    recommendations,
    priority: excess > 2 ? 5 : 4,
    timeframe: 'immediate',
    confidence: 90
  };
}

// 支出分析
function analyzeExpenseVariance(
  metric: MetricData,
  severity: 'critical' | 'warning',
  historicalData?: HistoricalData[]
): AnalysisResult {
  const excess = metric.actual - metric.planned;
  const excessPercentage = metric.achievement - 100;
  
  const rootCauses = [
    '予算管理の不備',
    '予期しない支出の発生',
    'コスト効率の悪化'
  ];
  
  const recommendations = [
    '支出項目の詳細分析',
    '予算承認プロセスの見直し',
    'ベンダーとの契約条件再交渉',
    '不要な支出の削減'
  ];
  
  if (excessPercentage > 20) {
    rootCauses.unshift('重大な予算オーバー');
    recommendations.unshift('緊急支出削減計画の策定');
  }
  
  return {
    severity,
    category: 'expenses',
    issue: `支出が予算を¥${excess.toLocaleString()}(${excessPercentage.toFixed(1)}%)超過しています`,
    impact: `キャッシュフローへの影響。年間で¥${(excess * 12).toLocaleString()}の予算超過リスク`,
    rootCauses,
    recommendations,
    priority: excessPercentage > 20 ? 4 : 3,
    timeframe: 'short',
    confidence: 85
  };
}

// 全体パフォーマンス分析
function analyzeOverallPerformance(metrics: MetricData[]): AnalysisResult[] {
  const results: AnalysisResult[] = [];
  
  // 重要メトリクスの加重平均達成率
  let weightedAchievement = 0;
  let totalWeight = 0;
  
  for (const metric of metrics) {
    const weight = getMetricWeight(metric.metric);
    if (weight > 0) {
      const adjustedAchievement = metric.isInverted ? 
        (200 - metric.achievement) : metric.achievement;
      weightedAchievement += adjustedAchievement * weight;
      totalWeight += weight;
    }
  }
  
  const overallAchievement = totalWeight > 0 ? weightedAchievement / totalWeight : 0;
  
  if (overallAchievement < 70) {
    results.push({
      severity: 'critical',
      category: 'overall',
      issue: '複数の主要指標で大幅な未達成',
      impact: '事業の根本的な見直しが必要な状況',
      rootCauses: [
        '市場環境の変化',
        '戦略の有効性不足',
        'リソース配分の問題',
        '組織能力の不足'
      ],
      recommendations: [
        '事業戦略の根本的見直し',
        '市場・競合分析の実施',
        'リソース再配分の検討',
        '経営陣による緊急対策会議'
      ],
      priority: 5,
      timeframe: 'immediate',
      confidence: 95
    });
  } else if (overallAchievement < 85) {
    results.push({
      severity: 'warning',
      category: 'overall',
      issue: '全体的なパフォーマンスの低下',
      impact: '目標達成に向けた軌道修正が必要',
      rootCauses: [
        '実行力の不足',
        'KPI設定の妥当性',
        'チーム間の連携不足'
      ],
      recommendations: [
        'アクションプランの見直し',
        '進捗管理の強化',
        'チーム間コミュニケーションの改善'
      ],
      priority: 3,
      timeframe: 'short',
      confidence: 80
    });
  }
  
  return results;
}

// メトリクス間の相関分析
function analyzeMetricCorrelations(metrics: MetricData[]): AnalysisResult[] {
  const results: AnalysisResult[] = [];
  
  const mrrMetric = metrics.find(m => m.metric === 'MRR');
  const customerMetric = metrics.find(m => m.metric === 'アクティブ顧客数');
  const acquisitionMetric = metrics.find(m => m.metric === '新規獲得');
  const churnMetric = metrics.find(m => m.metric === 'チャーン率');
  
  // MRRと顧客数の関係分析
  if (mrrMetric && customerMetric) {
    const mrrAchievement = mrrMetric.achievement;
    const customerAchievement = customerMetric.achievement;
    
    if (Math.abs(mrrAchievement - customerAchievement) > 20) {
      results.push({
        severity: 'info',
        category: 'overall',
        issue: 'MRRと顧客数の成長率に乖離',
        impact: customerAchievement > mrrAchievement ? 
          'ARPU（顧客単価）が低下している可能性' : 
          '高価値顧客の獲得が進んでいる可能性',
        rootCauses: customerAchievement > mrrAchievement ? [
          '低価格プランへのダウングレード',
          '新規顧客の単価低下',
          '既存顧客の利用減少'
        ] : [
          'アップセルの成功',
          '高価値顧客の獲得',
          '価格最適化の効果'
        ],
        recommendations: customerAchievement > mrrAchievement ? [
          'ARPU分析の実施',
          'アップセル機会の特定',
          '価格戦略の見直し'
        ] : [
          '成功要因の分析と横展開',
          'さらなる高価値顧客獲得',
          '成功事例の文書化'
        ],
        priority: 2,
        timeframe: 'medium',
        confidence: 70
      });
    }
  }
  
  return results;
}

// メトリクスの重要度取得
function getMetricWeight(metricName: string): number {
  switch (metricName) {
    case 'MRR': return METRIC_WEIGHTS.mrr;
    case 'アクティブ顧客数': return METRIC_WEIGHTS.activeCustomers;
    case '新規獲得': return METRIC_WEIGHTS.newAcquisitions;
    case 'チャーン率': return METRIC_WEIGHTS.churnRate;
    case '月次支出': return METRIC_WEIGHTS.totalExpenses;
    default: return 0;
  }
}

// 改善提案の優先度付け
export function prioritizeRecommendations(analyses: AnalysisResult[]): AnalysisResult[] {
  return analyses
    .filter(a => a.severity === 'critical' || a.severity === 'warning')
    .sort((a, b) => {
      // 重要度（severity）でソート
      const severityOrder = { critical: 3, warning: 2, info: 1, success: 0 };
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;
      
      // 優先度でソート
      const priorityDiff = b.priority - a.priority;
      if (priorityDiff !== 0) return priorityDiff;
      
      // 信頼度でソート
      return b.confidence - a.confidence;
    })
    .slice(0, 10); // 上位10件まで
}

// 分析結果のサマリー生成
export function generateAnalysisSummary(analyses: AnalysisResult[]): {
  overallStatus: 'excellent' | 'good' | 'concerning' | 'critical';
  criticalIssues: number;
  topPriority: string;
  keyRecommendation: string;
} {
  const criticalCount = analyses.filter(a => a.severity === 'critical').length;
  const warningCount = analyses.filter(a => a.severity === 'warning').length;
  
  let overallStatus: 'excellent' | 'good' | 'concerning' | 'critical';
  if (criticalCount > 2) overallStatus = 'critical';
  else if (criticalCount > 0 || warningCount > 3) overallStatus = 'concerning';
  else if (warningCount > 0) overallStatus = 'good';
  else overallStatus = 'excellent';
  
  const topPriorityAnalysis = analyses.find(a => a.severity === 'critical') || analyses[0];
  const topPriority = topPriorityAnalysis?.issue || '特に問題は検出されませんでした';
  const keyRecommendation = topPriorityAnalysis?.recommendations[0] || 'current performance を維持してください';
  
  return {
    overallStatus,
    criticalIssues: criticalCount,
    topPriority,
    keyRecommendation
  };
}