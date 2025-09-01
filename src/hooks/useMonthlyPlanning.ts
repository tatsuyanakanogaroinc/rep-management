'use client';

import { useState, useMemo } from 'react';
import { format, addMonths } from 'date-fns';
import { ja } from 'date-fns/locale';

export interface MonthlyPlan {
  month: string;
  monthLabel: string;
  newAcquisitions: number;
  totalCustomers: number;
  churnCount: number;
  retainedCustomers: number;
  mrr: number;
  expenses: number;
  profit: number;
  cumulativeProfit: number;
  channels: ChannelPlan[];
  pl: PLStatement;
}

export interface ChannelPlan {
  name: string;
  plannedAcquisitions: number;
  plannedCpa: number;
  plannedCost: number;
  ratio: number;
}

export interface PLStatement {
  revenue: {
    monthlySubscription: number;
    yearlySubscription: number;
    total: number;
  };
  costs: {
    channelCosts: number;
    operatingExpenses: number;
    total: number;
  };
  grossProfit: number;
  grossMargin: number;
  netProfit: number;
  netMargin: number;
}

export interface ChannelSetting {
  name: string;
  cpa: number;
  ratio: number;
  isActive: boolean;
}

export interface PlanningParameters {
  initialAcquisitions: number;
  monthlyGrowthRate: number;
  churnRate: number;
  monthlyPrice: number;
  yearlyPrice: number;
  baseExpenses: number;
  expenseGrowthRate: number;
  planningHorizon: number;
  channels: ChannelSetting[];
}

export function useMonthlyPlanning() {
  const [parameters, setParameters] = useState<PlanningParameters>({
    initialAcquisitions: 30,
    monthlyGrowthRate: 15,
    churnRate: 8,
    monthlyPrice: 4980,
    yearlyPrice: 49800,
    baseExpenses: 300000,
    expenseGrowthRate: 5,
    planningHorizon: 12,
    channels: [
      { name: 'Google広告', cpa: 6000, ratio: 40, isActive: true },
      { name: 'Facebook広告', cpa: 7000, ratio: 30, isActive: true },
      { name: '紹介', cpa: 0, ratio: 20, isActive: true },
      { name: 'オーガニック検索', cpa: 0, ratio: 10, isActive: true }
    ]
  });

  const calculateMonthlyPlan = useMemo((): MonthlyPlan[] => {
    const plans: MonthlyPlan[] = [];
    let currentCustomers = 0;
    let cumulativeProfit = 0;
    
    const currentDate = new Date();
    const activeChannels = parameters.channels.filter(c => c.isActive);
    const totalRatio = activeChannels.reduce((sum, c) => sum + c.ratio, 0);
    
    for (let i = 0; i < parameters.planningHorizon; i++) {
      const monthDate = addMonths(currentDate, i);
      const month = format(monthDate, 'yyyy-MM');
      const monthLabel = format(monthDate, 'yyyy年MM月', { locale: ja });
      
      // 新規獲得数（成長率適用）
      const newAcquisitions = Math.round(
        parameters.initialAcquisitions * Math.pow(1 + parameters.monthlyGrowthRate / 100, i)
      );
      
      // チャーン数
      const churnCount = Math.round(currentCustomers * parameters.churnRate / 100);
      
      // 継続顧客数
      const retainedCustomers = Math.max(0, currentCustomers - churnCount);
      
      // 総顧客数更新
      currentCustomers = retainedCustomers + newAcquisitions;
      
      // MRR計算（月額:70%, 年額:30%の想定）
      const monthlyCustomers = Math.round(currentCustomers * 0.7);
      const yearlyCustomers = Math.round(currentCustomers * 0.3);
      const monthlyRevenue = monthlyCustomers * parameters.monthlyPrice;
      const yearlyRevenue = yearlyCustomers * Math.round(parameters.yearlyPrice / 12);
      const mrr = monthlyRevenue + yearlyRevenue;
      
      // 流入経路別の広告費計算
      let channelCosts = 0;
      const channelPlans: ChannelPlan[] = [];
      
      if (totalRatio > 0) {
        activeChannels.forEach(channel => {
          const channelAcquisitions = Math.round(newAcquisitions * (channel.ratio / totalRatio));
          const channelCost = channelAcquisitions * channel.cpa;
          channelCosts += channelCost;
          
          channelPlans.push({
            name: channel.name,
            plannedAcquisitions: channelAcquisitions,
            plannedCpa: channel.cpa,
            plannedCost: channelCost,
            ratio: channel.ratio
          });
        });
      }
      
      // 支出計算（基本支出 + 成長に伴う増加 + 流入経路コスト）
      const baseExpensesForMonth = Math.round(
        parameters.baseExpenses * Math.pow(1 + parameters.expenseGrowthRate / 100, i)
      );
      const expenses = baseExpensesForMonth + channelCosts;
      
      // 利益計算
      const profit = mrr - expenses;
      cumulativeProfit += profit;
      
      // PL計算
      const pl: PLStatement = {
        revenue: {
          monthlySubscription: monthlyRevenue,
          yearlySubscription: yearlyRevenue,
          total: mrr
        },
        costs: {
          channelCosts: channelCosts,
          operatingExpenses: baseExpensesForMonth,
          total: expenses
        },
        grossProfit: mrr - channelCosts,
        grossMargin: mrr > 0 ? ((mrr - channelCosts) / mrr) * 100 : 0,
        netProfit: profit,
        netMargin: mrr > 0 ? (profit / mrr) * 100 : 0
      };
      
      plans.push({
        month,
        monthLabel,
        newAcquisitions,
        totalCustomers: currentCustomers,
        churnCount,
        retainedCustomers,
        mrr,
        expenses,
        profit,
        cumulativeProfit,
        channels: channelPlans,
        pl
      });
    }
    
    return plans;
  }, [parameters]);

  const updateParameters = (newParams: Partial<PlanningParameters>) => {
    setParameters(prev => ({ ...prev, ...newParams }));
  };

  const updateChannels = (channels: ChannelSetting[]) => {
    setParameters(prev => ({ ...prev, channels }));
  };

  const getPlanForMonth = (month: string): MonthlyPlan | undefined => {
    return calculateMonthlyPlan.find(plan => plan.month === month);
  };

  return {
    parameters,
    monthlyPlans: calculateMonthlyPlan,
    updateParameters,
    updateChannels,
    getPlanForMonth
  };
}