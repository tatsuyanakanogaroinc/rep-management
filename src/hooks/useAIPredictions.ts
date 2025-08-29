import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { generatePredictions, generateAlerts, PredictionData, Alert, HistoricalData } from '@/lib/ai-predictions';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

export function useAIPredictions(currentMonth: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['ai-predictions', currentMonth],
    enabled,
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
    retry: 1, // 失敗時1回のみリトライ
    queryFn: async (): Promise<{ predictions: PredictionData[]; alerts: Alert[] }> => {
      console.log('AIPredictions: Generating predictions for', currentMonth);
      const startTime = performance.now();
      
      try {
        // 6秒でタイムアウト
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('AI predictions timeout')), 6000)
        );

        const dataFetch = async () => {
      // 過去6ヶ月のデータを取得
      const historicalData: Record<string, HistoricalData[]> = {
        mrr: [],
        active_customers: [],
        new_acquisitions: [],
        churn_rate: [],
        monthly_expenses: []
      };

      // 過去6ヶ月の範囲を計算
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(currentMonth + '-01'), i);
        months.push(format(date, 'yyyy-MM'));
      }

      // 各月のデータを取得
      for (const month of months) {
        const monthStart = startOfMonth(new Date(month + '-01'));
        const monthEnd = endOfMonth(monthStart);

        try {
          // 顧客データ取得
          const { data: customersData } = await supabase
            .from('customers')
            .select('id, plan_type, status')
            .lte('registered_at', monthEnd.toISOString());

          const activeCustomers = customersData?.filter(c => c.status === 'active').length || 0;
          
          // MRR計算
          const monthlyCustomers = customersData?.filter(c => c.plan_type === 'monthly' && c.status === 'active').length || 0;
          const yearlyCustomers = customersData?.filter(c => c.plan_type === 'yearly' && c.status === 'active').length || 0;
          const mrr = (monthlyCustomers * 5000) + (yearlyCustomers * 4000);

          // 新規獲得数
          const { data: newAcquisitionsData } = await supabase
            .from('customers')
            .select('id')
            .gte('registered_at', monthStart.toISOString())
            .lte('registered_at', monthEnd.toISOString());
          
          const newAcquisitions = newAcquisitionsData?.length || 0;

          // チャーン数とチャーン率
          const { data: churnsData } = await supabase
            .from('customers')
            .select('id')
            .eq('status', 'churned')
            .gte('churned_at', monthStart.toISOString())
            .lte('churned_at', monthEnd.toISOString());
          
          const churns = churnsData?.length || 0;
          const previousMonthCustomers = activeCustomers + churns;
          const churnRate = previousMonthCustomers > 0 ? Math.round((churns / previousMonthCustomers) * 100) : 0;

          // 支出データ
          const { data: expensesData } = await supabase
            .from('expenses')
            .select('amount')
            .gte('date', format(monthStart, 'yyyy-MM-dd'))
            .lte('date', format(monthEnd, 'yyyy-MM-dd'));
          
          const monthlyExpenses = expensesData?.reduce((sum, exp) => sum + parseFloat(exp.amount), 0) || 0;

          // データを追加
          historicalData.mrr.push({ date: month, value: mrr });
          historicalData.active_customers.push({ date: month, value: activeCustomers });
          historicalData.new_acquisitions.push({ date: month, value: newAcquisitions });
          historicalData.churn_rate.push({ date: month, value: churnRate });
          historicalData.monthly_expenses.push({ date: month, value: monthlyExpenses });

        } catch (error) {
          console.error(`Error fetching data for ${month}:`, error);
          // エラーの場合は0値を追加
          historicalData.mrr.push({ date: month, value: 0 });
          historicalData.active_customers.push({ date: month, value: 0 });
          historicalData.new_acquisitions.push({ date: month, value: 0 });
          historicalData.churn_rate.push({ date: month, value: 0 });
          historicalData.monthly_expenses.push({ date: month, value: 0 });
        }
      }

      // 目標データを取得
      const { data: targetsData } = await supabase
        .from('targets')
        .select('metric_type, target_value')
        .eq('period', format(new Date(currentMonth + '-01'), 'yyyy-MM'));

      const targets = targetsData?.reduce((acc, target) => {
        acc[target.metric_type] = target.target_value;
        return acc;
      }, {} as Record<string, number>) || {};

      // 予測生成
      const predictions = await generatePredictions(historicalData, currentMonth);
      
      // アラート生成
      const alerts = generateAlerts(predictions, targets);

      return { predictions, alerts };
        };

        const result = await Promise.race([dataFetch(), timeout]);
        
        const endTime = performance.now();
        console.log(`AIPredictions: Completed in ${(endTime - startTime).toFixed(2)}ms`);
        
        return result;
        
      } catch (error) {
        console.error('AIPredictions: Error:', error);
        
        // フォールバックデータを返す
        const fallbackPredictions: PredictionData[] = [
          {
            metric: 'mrr',
            currentValue: 0,
            predictedValue: 0,
            changePercent: 0,
            trend: 'stable' as const,
            confidence: 0.1
          },
          {
            metric: 'active_customers',
            currentValue: 0,
            predictedValue: 0,
            changePercent: 0,
            trend: 'stable' as const,
            confidence: 0.1
          }
        ];

        const fallbackAlerts: Alert[] = [
          {
            id: 'fallback-1',
            type: 'info' as const,
            title: 'データ取得中',
            message: '予測データの読み込みに時間がかかっています。しばらくお待ちください。',
            priority: 1
          }
        ];

        return { predictions: fallbackPredictions, alerts: fallbackAlerts };
      }
    },
  });
}