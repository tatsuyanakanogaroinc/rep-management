import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

export interface DashboardData {
  mrr: number;
  mrrChange: string;
  activeCustomers: number;
  activeCustomersChange: string;
  newAcquisitions: number;
  churns: number;
  churnRate: number;
  totalExpenses: number;
  monthlyReports: number;
}

export function useDashboardData(selectedMonth: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['dashboard-data', selectedMonth],
    enabled,
    queryFn: async (): Promise<DashboardData> => {
      const monthStart = startOfMonth(new Date(selectedMonth + '-01'));
      const monthEnd = endOfMonth(monthStart);
      const prevMonthStart = startOfMonth(subMonths(monthStart, 1));
      const prevMonthEnd = endOfMonth(prevMonthStart);

      // 1. アクティブ顧客数（月末時点）
      const { data: activeCustomersData } = await supabase
        .from('customers')
        .select('id, plan_type')
        .eq('status', 'active')
        .lte('registered_at', monthEnd.toISOString());

      const activeCustomers = activeCustomersData?.length || 0;

      // 2. 前月のアクティブ顧客数
      const { data: prevActiveCustomersData } = await supabase
        .from('customers')
        .select('id')
        .eq('status', 'active')
        .lte('registered_at', prevMonthEnd.toISOString());

      const prevActiveCustomers = prevActiveCustomersData?.length || 0;

      // 3. MRR計算（簡易版：月額プラン数×平均料金）
      const monthlyCustomers = activeCustomersData?.filter(c => c.plan_type === 'monthly').length || 0;
      const yearlyCustomers = activeCustomersData?.filter(c => c.plan_type === 'yearly').length || 0;
      const mrr = (monthlyCustomers * 5000) + (yearlyCustomers * 4000); // 仮の料金設定

      // 4. 前月MRR
      const prevMonthlyCustomers = prevActiveCustomersData?.filter((c: any) => c.plan_type === 'monthly').length || 0;
      const prevYearlyCustomers = prevActiveCustomersData?.filter((c: any) => c.plan_type === 'yearly').length || 0;
      const prevMrr = (prevMonthlyCustomers * 5000) + (prevYearlyCustomers * 4000);

      // 5. 新規獲得数（選択月中に登録）
      const { data: newAcquisitionsData } = await supabase
        .from('customers')
        .select('id')
        .gte('registered_at', monthStart.toISOString())
        .lte('registered_at', monthEnd.toISOString());

      const newAcquisitions = newAcquisitionsData?.length || 0;

      // 6. チャーン数（選択月中に解約）
      const { data: churnsData } = await supabase
        .from('customers')
        .select('id')
        .eq('status', 'churned')
        .gte('churned_at', monthStart.toISOString())
        .lte('churned_at', monthEnd.toISOString());

      const churns = churnsData?.length || 0;

      // 7. 月次支出合計
      const { data: expensesData } = await supabase
        .from('expenses')
        .select('amount')
        .gte('date', format(monthStart, 'yyyy-MM-dd'))
        .lte('date', format(monthEnd, 'yyyy-MM-dd'));

      const totalExpenses = expensesData?.reduce((sum, exp) => sum + parseFloat(exp.amount), 0) || 0;

      // 8. 日報エントリー数
      const { data: reportsData } = await supabase
        .from('daily_reports')
        .select('id')
        .gte('date', format(monthStart, 'yyyy-MM-dd'))
        .lte('date', format(monthEnd, 'yyyy-MM-dd'));

      const monthlyReports = reportsData?.length || 0;

      // 計算
      const churnRate = prevActiveCustomers > 0 ? Math.round((churns / prevActiveCustomers) * 100) : 0;
      const mrrChange = prevMrr > 0 ? `${mrr > prevMrr ? '+' : ''}${Math.round(((mrr - prevMrr) / prevMrr) * 100)}%` : '+0%';
      const customerChange = prevActiveCustomers > 0 ? `${activeCustomers > prevActiveCustomers ? '+' : ''}${activeCustomers - prevActiveCustomers}` : '+0';

      return {
        mrr,
        mrrChange,
        activeCustomers,
        activeCustomersChange: customerChange,
        newAcquisitions,
        churns,
        churnRate,
        totalExpenses,
        monthlyReports,
      };
    },
    refetchInterval: 5 * 60 * 1000, // 5分ごとに更新
  });
}