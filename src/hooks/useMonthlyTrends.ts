import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/lib/auth-context';
import { format, subMonths, addMonths, startOfMonth, endOfMonth } from 'date-fns';

interface MonthlyDataPoint {
  month: string;
  mrr: number;
  mrrTarget: number;
  activeCustomers: number;
  activeCustomersTarget: number;
  newAcquisitions: number;
  newAcquisitionsTarget: number;
  churnRate: number;
  churnRateTarget: number;
  totalExpenses: number;
  monthlyExpensesTarget: number;
  isFuture: boolean;
  isCurrentMonth: boolean;
}

interface TrendSummary {
  avgMrrGrowth: number;
  totalNewCustomers: number;
  avgAchievementRate: number;
  projectedAnnualGrowth: number;
}

interface MonthlyTrendsData {
  monthlyData: MonthlyDataPoint[];
  summary: TrendSummary;
}

export function useMonthlyTrends(currentMonth: string, enabled: boolean = true) {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: ['monthly-trends', currentMonth],
    enabled: enabled && !!user,
    staleTime: 3 * 60 * 1000, // 3分間キャッシュ
    retry: 1, // 失敗時1回のみリトライ
    queryFn: async (): Promise<MonthlyTrendsData> => {
      console.log('MonthlyTrends: Fetching data for', currentMonth);
      const startTime = performance.now();
      const currentDate = new Date(currentMonth + '-01');
      
      // 過去6ヶ月から未来6ヶ月までの範囲を設定
      const startDate = subMonths(currentDate, 6);
      const endDate = addMonths(currentDate, 6);
      
      // 月のリストを生成
      const months: string[] = [];
      let monthIterator = new Date(startDate);
      while (monthIterator <= endDate) {
        months.push(format(monthIterator, 'yyyy-MM'));
        monthIterator = addMonths(monthIterator, 1);
      }

      try {
        // 7秒でタイムアウト
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Monthly trends fetch timeout')), 7000)
        );

        // 並列でデータ取得
        const [targetsResult, actualDataResults] = await Promise.race([
          Promise.all([
          // 全期間の目標データを取得
          supabase
            .from('targets')
            .select('*')
            .in('period', months)
            .eq('is_active', true),
          
          // 各月の実績データを並列取得
          Promise.all(
            months.map(async (month) => {
              const monthStart = startOfMonth(new Date(month + '-01'));
              const monthEnd = endOfMonth(monthStart);
              
              const [
                { data: customersData },
                { data: expensesData }
              ] = await Promise.all([
                supabase
                  .from('customers')
                  .select('id, registered_at, status, churned_at, plan_type')
                  .lte('registered_at', monthEnd.toISOString()),
                
                supabase
                  .from('expenses')
                  .select('amount')
                  .gte('date', format(monthStart, 'yyyy-MM-dd'))
                  .lte('date', format(monthEnd, 'yyyy-MM-dd'))
              ]);

              return { month, customersData: customersData || [], expensesData: expensesData || [] };
            })
          )
          ]),
          timeout
        ]);

        const { data: targetsData } = targetsResult;
        const targets = targetsData || [];
        
        console.log('MonthlyTrends: Targets data received:', {
          count: targets.length,
          periods: [...new Set(targets.map(t => t.period))].sort(),
          metrics: [...new Set(targets.map(t => t.metric_type))],
          sampleTargets: targets.slice(0, 5)
        });

        // 目標データをマップ化
        const targetsByMonth = targets.reduce((acc, target) => {
          if (!acc[target.period]) acc[target.period] = {};
          acc[target.period][target.metric_type] = target.target_value;
          return acc;
        }, {} as Record<string, Record<string, number>>);
        
        console.log('MonthlyTrends: Targets by month:', targetsByMonth);

        // フォールバック用のデフォルトターゲットデータ（スプレッドシートの値）
        const fallbackTargets: Record<string, Record<string, number>> = {
          '2025-09': { mrr: 69720, active_customers: 28, new_acquisitions: 30, churn_rate: 5.0, monthly_expenses: 845000 },
          '2025-10': { mrr: 107070, active_customers: 43, new_acquisitions: 45, churn_rate: 5.0, monthly_expenses: 910000 },
          '2025-11': { mrr: 161850, active_customers: 65, new_acquisitions: 68, churn_rate: 5.0, monthly_expenses: 946000 },
          '2025-12': { mrr: 241530, active_customers: 97, new_acquisitions: 102, churn_rate: 5.0, monthly_expenses: 1036000 },
          '2026-01': { mrr: 361050, active_customers: 145, new_acquisitions: 153, churn_rate: 5.0, monthly_expenses: 1117000 },
          '2026-02': { mrr: 542820, active_customers: 218, new_acquisitions: 230, churn_rate: 5.0, monthly_expenses: 1235000 },
          '2026-03': { mrr: 816720, active_customers: 328, new_acquisitions: 345, churn_rate: 5.0, monthly_expenses: 1454000 },
          '2026-04': { mrr: 1225080, active_customers: 492, new_acquisitions: 518, churn_rate: 5.0, monthly_expenses: 1722000 },
          '2026-05': { mrr: 1837620, active_customers: 738, new_acquisitions: 777, churn_rate: 5.0, monthly_expenses: 2120000 },
          '2026-06': { mrr: 2758920, active_customers: 1108, new_acquisitions: 1166, churn_rate: 5.0, monthly_expenses: 2763000 },
          '2026-07': { mrr: 4138380, active_customers: 1662, new_acquisitions: 1749, churn_rate: 5.0, monthly_expenses: 3666000 },
          '2026-08': { mrr: 6207570, active_customers: 2493, new_acquisitions: 2624, churn_rate: 5.0, monthly_expenses: 5018000 }
        };

        // ターゲットデータが存在しない場合はフォールバックを使用
        const mergedTargetsByMonth = { ...fallbackTargets, ...targetsByMonth };
        console.log('MonthlyTrends: Merged targets (with fallback):', mergedTargetsByMonth);

        // 月次データを構築
        const monthlyData: MonthlyDataPoint[] = actualDataResults.map(({ month, customersData, expensesData }) => {
          const monthDate = new Date(month + '-01');
          const monthStart = startOfMonth(monthDate);
          const monthEnd = endOfMonth(monthDate);
          const isFuture = monthDate > new Date();
          const isCurrentMonth = month === currentMonth;

          // 実績計算（過去・現在のみ）
          let mrr = 0;
          let activeCustomers = 0;
          let newAcquisitions = 0;
          let churnRate = 0;
          let totalExpenses = 0;

          if (!isFuture) {
            // アクティブ顧客数（月末時点）
            activeCustomers = customersData.filter(c => {
              const registeredAt = new Date(c.registered_at);
              const isRegisteredBeforeEnd = registeredAt <= monthEnd;
              
              if (c.status === 'churned' && c.churned_at) {
                const churnedAt = new Date(c.churned_at);
                return isRegisteredBeforeEnd && churnedAt > monthEnd;
              }
              
              return isRegisteredBeforeEnd && c.status === 'active';
            }).length;

            // MRR計算
            const activeCustomersList = customersData.filter(c => {
              const registeredAt = new Date(c.registered_at);
              const isRegisteredBeforeEnd = registeredAt <= monthEnd;
              
              if (c.status === 'churned' && c.churned_at) {
                const churnedAt = new Date(c.churned_at);
                return isRegisteredBeforeEnd && churnedAt > monthEnd;
              }
              
              return isRegisteredBeforeEnd && c.status === 'active';
            });

            mrr = activeCustomersList.reduce((sum, customer) => {
              if (customer.plan_type === 'monthly') return sum + 4980;
              if (customer.plan_type === 'yearly') return sum + 4150; // 年額を月割り
              return sum;
            }, 0);

            // 新規獲得数（月内登録）
            newAcquisitions = customersData.filter(c => {
              const registeredAt = new Date(c.registered_at);
              return registeredAt >= monthStart && registeredAt <= monthEnd;
            }).length;

            // チャーン率計算
            const churnedInMonth = customersData.filter(c => {
              if (c.churned_at) {
                const churnedAt = new Date(c.churned_at);
                return churnedAt >= monthStart && churnedAt <= monthEnd;
              }
              return false;
            }).length;

            const startOfMonthActiveCustomers = customersData.filter(c => {
              const registeredAt = new Date(c.registered_at);
              return registeredAt < monthStart && 
                     (c.status === 'active' || (c.churned_at && new Date(c.churned_at) > monthStart));
            }).length;

            churnRate = startOfMonthActiveCustomers > 0 
              ? Math.round((churnedInMonth / startOfMonthActiveCustomers) * 100) 
              : 0;

            // 支出計算
            totalExpenses = expensesData.reduce((sum, expense) => 
              sum + parseFloat(expense.amount), 0);
          }

          // 目標データを取得（フォールバック付き）
          const monthTargets = mergedTargetsByMonth[month] || {};
          
          const result = {
            month,
            mrr,
            mrrTarget: monthTargets.mrr || 0,
            activeCustomers,
            activeCustomersTarget: monthTargets.active_customers || 0,
            newAcquisitions,
            newAcquisitionsTarget: monthTargets.new_acquisitions || 0,
            churnRate,
            churnRateTarget: monthTargets.churn_rate || 0,
            totalExpenses,
            monthlyExpensesTarget: monthTargets.monthly_expenses || 0,
            isFuture,
            isCurrentMonth
          };
          
          // デバッグ: 最初の数ヶ月のデータをログ出力
          if (['2025-09', '2025-10', '2025-11'].includes(month)) {
            console.log(`MonthlyTrends: Month ${month}:`, {
              targets: monthTargets,
              mrrTarget: result.mrrTarget,
              activeCustomersTarget: result.activeCustomersTarget,
              newAcquisitionsTarget: result.newAcquisitionsTarget
            });
          }

          return result;
        });

        // サマリー統計を計算
        const pastData = monthlyData.filter(d => !d.isFuture);
        
        // MRR成長率の計算
        const mrrGrowthRates: number[] = [];
        for (let i = 1; i < pastData.length; i++) {
          if (pastData[i-1].mrr > 0) {
            const growthRate = ((pastData[i].mrr - pastData[i-1].mrr) / pastData[i-1].mrr) * 100;
            mrrGrowthRates.push(growthRate);
          }
        }
        const avgMrrGrowth = mrrGrowthRates.length > 0 
          ? Math.round(mrrGrowthRates.reduce((sum, rate) => sum + rate, 0) / mrrGrowthRates.length)
          : 0;

        // 累計新規獲得
        const totalNewCustomers = pastData.reduce((sum, d) => sum + d.newAcquisitions, 0);

        // 平均目標達成率（MRR基準）
        const achievementRates = pastData
          .filter(d => d.mrrTarget > 0)
          .map(d => (d.mrr / d.mrrTarget) * 100);
        const avgAchievementRate = achievementRates.length > 0
          ? Math.round(achievementRates.reduce((sum, rate) => sum + rate, 0) / achievementRates.length)
          : 0;

        // 年間成長率予測（直近3ヶ月の平均成長率を基準）
        const recentGrowthRates = mrrGrowthRates.slice(-3);
        const avgRecentGrowth = recentGrowthRates.length > 0
          ? recentGrowthRates.reduce((sum, rate) => sum + rate, 0) / recentGrowthRates.length
          : 0;
        const projectedAnnualGrowth = Math.round(avgRecentGrowth * 12);

        const summary: TrendSummary = {
          avgMrrGrowth,
          totalNewCustomers,
          avgAchievementRate,
          projectedAnnualGrowth
        };

        const endTime = performance.now();
        console.log(`MonthlyTrends: Data fetch completed in ${(endTime - startTime).toFixed(2)}ms`);
        
        return { monthlyData, summary };

      } catch (error) {
        console.error('MonthlyTrends: Fetch error:', error);
        
        // フォールバックデータを返す（スプレッドシートの目標値を使用）
        const fallbackTargets: Record<string, Record<string, number>> = {
          '2025-09': { mrr: 69720, active_customers: 28, new_acquisitions: 30, churn_rate: 5.0, monthly_expenses: 845000 },
          '2025-10': { mrr: 107070, active_customers: 43, new_acquisitions: 45, churn_rate: 5.0, monthly_expenses: 910000 },
          '2025-11': { mrr: 161850, active_customers: 65, new_acquisitions: 68, churn_rate: 5.0, monthly_expenses: 946000 },
          '2025-12': { mrr: 241530, active_customers: 97, new_acquisitions: 102, churn_rate: 5.0, monthly_expenses: 1036000 },
          '2026-01': { mrr: 361050, active_customers: 145, new_acquisitions: 153, churn_rate: 5.0, monthly_expenses: 1117000 },
          '2026-02': { mrr: 542820, active_customers: 218, new_acquisitions: 230, churn_rate: 5.0, monthly_expenses: 1235000 },
          '2026-03': { mrr: 816720, active_customers: 328, new_acquisitions: 345, churn_rate: 5.0, monthly_expenses: 1454000 },
          '2026-04': { mrr: 1225080, active_customers: 492, new_acquisitions: 518, churn_rate: 5.0, monthly_expenses: 1722000 },
          '2026-05': { mrr: 1837620, active_customers: 738, new_acquisitions: 777, churn_rate: 5.0, monthly_expenses: 2120000 },
          '2026-06': { mrr: 2758920, active_customers: 1108, new_acquisitions: 1166, churn_rate: 5.0, monthly_expenses: 2763000 },
          '2026-07': { mrr: 4138380, active_customers: 1662, new_acquisitions: 1749, churn_rate: 5.0, monthly_expenses: 3666000 },
          '2026-08': { mrr: 6207570, active_customers: 2493, new_acquisitions: 2624, churn_rate: 5.0, monthly_expenses: 5018000 }
        };

        const fallbackMonths = months.map(month => {
          const targets = fallbackTargets[month] || {};
          return {
            month,
            mrr: 0,
            mrrTarget: targets.mrr || 0,
            activeCustomers: 0,
            activeCustomersTarget: targets.active_customers || 0,
            newAcquisitions: 0,
            newAcquisitionsTarget: targets.new_acquisitions || 0,
            churnRate: 0,
            churnRateTarget: targets.churn_rate || 5,
            totalExpenses: 0,
            monthlyExpensesTarget: targets.monthly_expenses || 0,
            isFuture: new Date(month + '-01') > new Date(),
            isCurrentMonth: month === currentMonth
          };
        });

        return {
          monthlyData: fallbackMonths,
          summary: {
            avgMrrGrowth: 0,
            totalNewCustomers: 0,
            avgAchievementRate: 0,
            projectedAnnualGrowth: 0
          }
        };
      }
    },
  });
}