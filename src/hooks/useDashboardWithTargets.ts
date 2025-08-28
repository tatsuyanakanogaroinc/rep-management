import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

export interface DashboardDataWithTargets {
  mrr: number;
  mrrChange: string;
  mrrTarget?: number;
  mrrProgress: number;
  mrrDifference: number;
  
  activeCustomers: number;
  activeCustomersChange: string;
  activeCustomersTarget?: number;
  activeCustomersProgress: number;
  activeCustomersDifference: number;
  
  newAcquisitions: number;
  newAcquisitionsTarget?: number;
  newAcquisitionsProgress: number;
  newAcquisitionsDifference: number;
  
  churns: number;
  churnRate: number;
  churnRateTarget?: number;
  churnRateProgress: number;
  churnRateDifference: number;
  
  totalExpenses: number;
  monthlyExpensesTarget?: number;
  expensesProgress: number;
  expensesDifference: number;
  
  monthlyReports: number;
}

export function useDashboardWithTargets(selectedMonth: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['dashboard-with-targets', selectedMonth],
    enabled,
    queryFn: async (): Promise<DashboardDataWithTargets> => {
      const monthStart = startOfMonth(new Date(selectedMonth + '-01'));
      const monthEnd = endOfMonth(monthStart);
      const prevMonthStart = startOfMonth(subMonths(monthStart, 1));
      const prevMonthEnd = endOfMonth(prevMonthStart);

      // 並列でデータ取得
      const [
        { data: activeCustomersData },
        { data: prevActiveCustomersData },
        { data: newAcquisitionsData },
        { data: churnsData },
        { data: expensesData },
        { data: reportsData },
        { data: targetsData }
      ] = await Promise.all([
        // 1. アクティブ顧客数（月末時点）
        supabase
          .from('customers')
          .select('id, plan_type')
          .eq('status', 'active')
          .lte('registered_at', monthEnd.toISOString()),

        // 2. 前月のアクティブ顧客数
        supabase
          .from('customers')
          .select('id, plan_type')
          .eq('status', 'active')
          .lte('registered_at', prevMonthEnd.toISOString()),

        // 3. 新規獲得数（選択月中に登録）
        supabase
          .from('customers')
          .select('id')
          .gte('registered_at', monthStart.toISOString())
          .lte('registered_at', monthEnd.toISOString()),

        // 4. チャーン数（選択月中に解約）
        supabase
          .from('customers')
          .select('id')
          .eq('status', 'churned')
          .gte('churned_at', monthStart.toISOString())
          .lte('churned_at', monthEnd.toISOString()),

        // 5. 月次支出合計
        supabase
          .from('expenses')
          .select('amount')
          .gte('date', format(monthStart, 'yyyy-MM-dd'))
          .lte('date', format(monthEnd, 'yyyy-MM-dd')),

        // 6. 日報エントリー数
        supabase
          .from('daily_reports')
          .select('id')
          .gte('date', format(monthStart, 'yyyy-MM-dd'))
          .lte('date', format(monthEnd, 'yyyy-MM-dd')),

        // 7. 目標データ取得
        supabase
          .from('targets')
          .select('*')
          .eq('period', selectedMonth)
      ]);

      const activeCustomers = activeCustomersData?.length || 0;
      const prevActiveCustomers = prevActiveCustomersData?.length || 0;
      const newAcquisitions = newAcquisitionsData?.length || 0;
      const churns = churnsData?.length || 0;
      const totalExpenses = expensesData?.reduce((sum, exp) => sum + parseFloat(exp.amount), 0) || 0;
      const monthlyReports = reportsData?.length || 0;

      // MRR計算
      const monthlyCustomers = activeCustomersData?.filter(c => c.plan_type === 'monthly').length || 0;
      const yearlyCustomers = activeCustomersData?.filter(c => c.plan_type === 'yearly').length || 0;
      const mrr = (monthlyCustomers * 5000) + (yearlyCustomers * 4000);

      const prevMonthlyCustomers = prevActiveCustomersData?.filter((c: any) => c.plan_type === 'monthly').length || 0;
      const prevYearlyCustomers = prevActiveCustomersData?.filter((c: any) => c.plan_type === 'yearly').length || 0;
      const prevMrr = (prevMonthlyCustomers * 5000) + (prevYearlyCustomers * 4000);

      // チャーン率計算
      const churnRate = prevActiveCustomers > 0 ? Math.round((churns / prevActiveCustomers) * 100) : 0;

      // 変化率計算
      const mrrChange = prevMrr > 0 ? `${mrr > prevMrr ? '+' : ''}${Math.round(((mrr - prevMrr) / prevMrr) * 100)}%` : '+0%';
      const customerChange = prevActiveCustomers > 0 ? `${activeCustomers > prevActiveCustomers ? '+' : ''}${activeCustomers - prevActiveCustomers}` : '+0';

      // 目標データマップ作成
      const targets = targetsData?.reduce((acc, target) => {
        acc[target.metric_type] = target;
        return acc;
      }, {} as Record<string, any>) || {};

      // 目標との差異計算関数
      const calculateProgress = (actual: number, target?: number) => {
        if (!target || target === 0) return 0;
        return Math.min(Math.round((actual / target) * 100), 200); // 最大200%まで
      };

      const calculateDifference = (actual: number, target?: number) => {
        if (!target) return 0;
        return actual - target;
      };

      return {
        mrr,
        mrrChange,
        mrrTarget: targets['mrr']?.target_value,
        mrrProgress: calculateProgress(mrr, targets['mrr']?.target_value),
        mrrDifference: calculateDifference(mrr, targets['mrr']?.target_value),

        activeCustomers,
        activeCustomersChange: customerChange,
        activeCustomersTarget: targets['active_customers']?.target_value,
        activeCustomersProgress: calculateProgress(activeCustomers, targets['active_customers']?.target_value),
        activeCustomersDifference: calculateDifference(activeCustomers, targets['active_customers']?.target_value),

        newAcquisitions,
        newAcquisitionsTarget: targets['new_acquisitions']?.target_value,
        newAcquisitionsProgress: calculateProgress(newAcquisitions, targets['new_acquisitions']?.target_value),
        newAcquisitionsDifference: calculateDifference(newAcquisitions, targets['new_acquisitions']?.target_value),

        churns,
        churnRate,
        churnRateTarget: targets['churn_rate']?.target_value,
        churnRateProgress: targets['churn_rate']?.target_value ? 
          Math.max(0, Math.min(200, Math.round((1 - churnRate / targets['churn_rate'].target_value) * 100))) : 0,
        churnRateDifference: calculateDifference(churnRate, targets['churn_rate']?.target_value),

        totalExpenses,
        monthlyExpensesTarget: targets['monthly_expenses']?.target_value,
        expensesProgress: targets['monthly_expenses']?.target_value ?
          Math.round((totalExpenses / targets['monthly_expenses'].target_value) * 100) : 0,
        expensesDifference: calculateDifference(totalExpenses, targets['monthly_expenses']?.target_value),

        monthlyReports,
      };
    },
    refetchInterval: 5 * 60 * 1000, // 5分ごとに更新
  });
}