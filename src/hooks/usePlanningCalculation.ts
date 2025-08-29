import { useMemo } from 'react';

interface PlanningParams {
  targetNewCustomers: number;
  conversionRate: number;
  monthlyPrice: number;
  yearlyPrice: number;
  yearlyRatio: number;
  churnRate: number;
}

interface ChannelMix {
  [key: string]: number;
}

interface ChannelCPA {
  [key: string]: number;
}

interface ChannelResult {
  name: string;
  percentage: number;
  customers: number;
  cpa: number;
  budget: number;
  roi: number;
  ltv: number;
}

interface PlanningResult {
  monthlyNewCustomers: number;
  trialUsers: number;
  yearlyRevenue: number;
  monthlyRevenue: number;
  totalCustomers: number;
  channelBreakdown: ChannelResult[];
  totalMarketingBudget: number;
  customerAcquisitionCost: number;
  ltv: number;
  ltvCacRatio: number;
  paybackPeriod: number;
  projectedGrowth: {
    month3: number;
    month6: number;
    month12: number;
  };
}

export function usePlanningCalculation(
  params: PlanningParams,
  channelMix: ChannelMix,
  channelCPA: ChannelCPA
): PlanningResult {
  return useMemo(() => {
    const {
      targetNewCustomers,
      conversionRate,
      monthlyPrice,
      yearlyPrice,
      yearlyRatio,
      churnRate
    } = params;

    // トライアルユーザー数計算（スプレッドシートベース: 18%転換率）
    const trialUsers = Math.round(targetNewCustomers / (conversionRate / 100));

    // 年次・月次顧客の内訳（スプレッドシートベース: 年額25%）
    const yearlyCustomers = Math.round(targetNewCustomers * (yearlyRatio / 100));
    const monthlyOnlyCustomers = targetNewCustomers - yearlyCustomers;

    // 収益計算（スプレッドシートベース: 月額4,980円、年額49,800円）
    const monthlyRevenue = 
      (monthlyOnlyCustomers * monthlyPrice) + 
      (yearlyCustomers * (yearlyPrice / 12));
    
    const yearlyRevenue = monthlyRevenue * 12;

    // チャーンを考慮した累計顧客数（スプレッドシートベース: 3.5%チャーン率）
    const monthlyChurnRate = churnRate / 100;
    const totalCustomers = monthlyChurnRate > 0 
      ? Math.round(targetNewCustomers / monthlyChurnRate) 
      : targetNewCustomers * 12;

    // チャネル別計算
    const channelBreakdown: ChannelResult[] = Object.entries(channelMix).map(([channel, percentage]) => {
      const customers = Math.round(targetNewCustomers * percentage / 100);
      const cpa = channelCPA[channel] || 0;
      const budget = customers * cpa;
      
      // LTV計算（簡易版）
      const avgMonthlyRevenuePerCustomer = targetNewCustomers > 0 ? monthlyRevenue / targetNewCustomers : 0;
      const ltv = monthlyChurnRate > 0 ? avgMonthlyRevenuePerCustomer / monthlyChurnRate : avgMonthlyRevenuePerCustomer * 12;
      
      // ROI計算
      const roi = cpa > 0 ? (ltv / cpa) * 100 : 0;

      return {
        name: getChannelName(channel),
        percentage,
        customers,
        cpa,
        budget,
        roi,
        ltv
      };
    });

    const totalMarketingBudget = channelBreakdown.reduce((sum, ch) => sum + ch.budget, 0);
    const customerAcquisitionCost = targetNewCustomers > 0 ? totalMarketingBudget / targetNewCustomers : 0;
    
    // LTV/CAC比率
    const avgLTV = targetNewCustomers > 0 
      ? (monthlyChurnRate > 0 
        ? (monthlyRevenue * 12 / targetNewCustomers / monthlyChurnRate) 
        : (monthlyRevenue * 12 / targetNewCustomers))
      : 0;
    const ltvCacRatio = customerAcquisitionCost > 0 && avgLTV > 0 ? avgLTV / customerAcquisitionCost : 0;
    
    // ペイバック期間（月）
    const avgMonthlyRevenuePerCustomer = targetNewCustomers > 0 ? monthlyRevenue / targetNewCustomers : 0;
    const paybackPeriod = customerAcquisitionCost > 0 && avgMonthlyRevenuePerCustomer > 0 
      ? customerAcquisitionCost / avgMonthlyRevenuePerCustomer 
      : 0;

    // 成長予測
    const projectedGrowth = {
      month3: Math.round(targetNewCustomers * 3 * (1 - monthlyChurnRate * 1.5)),
      month6: Math.round(targetNewCustomers * 6 * (1 - monthlyChurnRate * 3)),
      month12: Math.round(targetNewCustomers * 12 * (1 - monthlyChurnRate * 6))
    };

    return {
      monthlyNewCustomers: targetNewCustomers,
      trialUsers,
      yearlyRevenue,
      monthlyRevenue,
      totalCustomers,
      channelBreakdown,
      totalMarketingBudget,
      customerAcquisitionCost,
      ltv: avgLTV,
      ltvCacRatio,
      paybackPeriod,
      projectedGrowth
    };
  }, [params, channelMix, channelCPA]);
}

function getChannelName(key: string): string {
  const names: Record<string, string> = {
    google: 'Google広告',
    facebook: 'Facebook広告',
    instagram: 'Instagram広告',
    twitter: 'Twitter広告',
    linkedin: 'LinkedIn広告',
    youtube: 'YouTube広告',
    referral: '紹介',
    organic: 'オーガニック検索',
    email: 'メールマーケティング',
    sns: 'SNS',
    others: 'その他'
  };
  return names[key] || key;
}