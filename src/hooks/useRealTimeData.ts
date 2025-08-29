import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/lib/auth-context';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

interface RealTimeMetrics {
  period: string;
  mrr: number;
  activeCustomers: number;
  newAcquisitions: number;
  churnRate: number;
  totalExpenses: number;
  channelData: ChannelMetrics[];
}

interface ChannelMetrics {
  channel_name: string;
  acquisitions: number;
  cost: number;
  cpa: number;
  conversion_rate: number;
}

interface CustomerMetrics {
  id: string;
  registered_at: string;
  status: string;
  churned_at: string | null;
  plan_type: string;
  acquisition_channel: string | null;
}

export function useRealTimeData(period: string, enabled: boolean = true) {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  // リアルタイムデータ取得
  const { data, isLoading, error } = useQuery({
    queryKey: ['realtime-data', period],
    enabled: enabled && !!user,
    queryFn: async (): Promise<RealTimeMetrics> => {
      const periodStart = startOfMonth(new Date(period + '-01'));
      const periodEnd = endOfMonth(periodStart);

      try {
        // 1. 顧客データ取得
        const { data: customersData, error: customersError } = await supabase
          .from('customers')
          .select('id, registered_at, status, churned_at, plan_type, acquisition_channel')
          .order('registered_at', { ascending: false });

        if (customersError) throw customersError;

        const customers = customersData as CustomerMetrics[];

        // 2. 期間内のアクティブ顧客数計算
        const activeCustomers = customers.filter(c => {
          const registeredAt = new Date(c.registered_at);
          const isRegisteredBeforeEnd = registeredAt <= periodEnd;
          
          if (c.status === 'churned' && c.churned_at) {
            const churnedAt = new Date(c.churned_at);
            return isRegisteredBeforeEnd && churnedAt > periodEnd;
          }
          
          return isRegisteredBeforeEnd && c.status === 'active';
        }).length;

        // 3. 期間内の新規獲得数
        const newAcquisitions = customers.filter(c => {
          const registeredAt = new Date(c.registered_at);
          return registeredAt >= periodStart && registeredAt <= periodEnd;
        }).length;

        // 4. MRR計算
        const activeCustomersList = customers.filter(c => {
          const registeredAt = new Date(c.registered_at);
          const isRegisteredBeforeEnd = registeredAt <= periodEnd;
          
          if (c.status === 'churned' && c.churned_at) {
            const churnedAt = new Date(c.churned_at);
            return isRegisteredBeforeEnd && churnedAt > periodEnd;
          }
          
          return isRegisteredBeforeEnd && c.status === 'active';
        });

        const monthlyRevenue = activeCustomersList.reduce((sum, customer) => {
          if (customer.plan_type === 'monthly') return sum + 4980;
          if (customer.plan_type === 'yearly') return sum + 4150; // 年額を月割り
          return sum;
        }, 0);

        // 5. チャーン率計算
        const churnedInPeriod = customers.filter(c => {
          if (c.churned_at) {
            const churnedAt = new Date(c.churned_at);
            return churnedAt >= periodStart && churnedAt <= periodEnd;
          }
          return false;
        }).length;

        const startOfPeriodActiveCustomers = customers.filter(c => {
          const registeredAt = new Date(c.registered_at);
          return registeredAt < periodStart && 
                 (c.status === 'active' || (c.churned_at && new Date(c.churned_at) > periodStart));
        }).length;

        const churnRate = startOfPeriodActiveCustomers > 0 
          ? Math.round((churnedInPeriod / startOfPeriodActiveCustomers) * 100) 
          : 0;

        // 6. 支出データ取得
        const { data: expensesData, error: expensesError } = await supabase
          .from('expenses')
          .select('amount')
          .gte('date', format(periodStart, 'yyyy-MM-dd'))
          .lte('date', format(periodEnd, 'yyyy-MM-dd'));

        if (expensesError) throw expensesError;

        const totalExpenses = expensesData?.reduce((sum, expense) => 
          sum + parseFloat(expense.amount), 0) || 0;

        // 7. チャネル別データ計算
        const channelData: ChannelMetrics[] = [];
        const channelGroups = customers
          .filter(c => {
            const registeredAt = new Date(c.registered_at);
            return registeredAt >= periodStart && registeredAt <= periodEnd;
          })
          .reduce((acc, customer) => {
            const channel = customer.acquisition_channel || 'その他';
            if (!acc[channel]) acc[channel] = [];
            acc[channel].push(customer);
            return acc;
          }, {} as Record<string, CustomerMetrics[]>);

        for (const [channelName, channelCustomers] of Object.entries(channelGroups)) {
          const acquisitions = channelCustomers.length;
          
          // チャネル別支出データを取得（実装時は実際の支出データを使用）
          let cost = 0;
          const cpaMap: Record<string, number> = {
            'Google広告': 6000,
            'Facebook広告': 5500,
            'Instagram広告': 5000,
            'Twitter広告': 4500,
            'LinkedIn広告': 8000,
            'YouTube広告': 7000,
            '紹介': 0,
            'オーガニック検索': 0,
            'SNS': 3000,
            'メールマーケティング': 2000,
            'その他': 4000
          };

          const estimatedCPA = cpaMap[channelName] || 4000;
          cost = acquisitions * estimatedCPA;
          
          const cpa = acquisitions > 0 ? cost / acquisitions : 0;
          
          // 簡易的な転換率計算（実装時はより詳細なトラッキングデータを使用）
          const conversionRate = channelName === '紹介' ? 15.0 : 
                                channelName === 'オーガニック検索' ? 3.2 :
                                channelName.includes('広告') ? 2.0 : 1.5;

          channelData.push({
            channel_name: channelName,
            acquisitions,
            cost,
            cpa,
            conversion_rate: conversionRate
          });
        }

        return {
          period,
          mrr: monthlyRevenue,
          activeCustomers,
          newAcquisitions,
          churnRate,
          totalExpenses,
          channelData
        };

      } catch (error) {
        console.error('Real-time data fetch error:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
    cacheTime: 10 * 60 * 1000, // 10分間保持
    refetchInterval: 5 * 60 * 1000, // 5分ごとに自動更新
  });

  // データ更新の手動実行
  const refreshData = useMutation({
    mutationFn: async () => {
      await queryClient.invalidateQueries({ queryKey: ['realtime-data'] });
      await queryClient.refetchQueries({ queryKey: ['realtime-data', period] });
    }
  });

  return {
    data,
    isLoading,
    error,
    refreshData: refreshData.mutate,
    isRefreshing: refreshData.isPending
  };
}

// チャネル設定の同期
export function useChannelDataSync() {
  const queryClient = useQueryClient();

  const syncChannelTargets = useMutation({
    mutationFn: async (channelData: ChannelMetrics[]) => {
      const currentMonth = format(new Date(), 'yyyy-MM');
      
      for (const channel of channelData) {
        // 実績をもとに次月の目標を自動設定
        const suggestedTarget = Math.round(channel.acquisitions * 1.1); // 10%増を推奨
        
        await supabase
          .from('channel_targets')
          .upsert({
            channel_name: channel.channel_name,
            target_type: 'acquisition',
            target_value: suggestedTarget,
            unit: '人',
            period: format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1), 'yyyy-MM'),
            cpa_target: channel.cpa * 0.95, // 5%改善を目標
            conversion_rate_target: channel.conversion_rate * 1.05, // 5%改善を目標
            description: `${channel.channel_name}の自動生成目標（前月実績+10%）`,
            is_active: true
          }, {
            onConflict: 'channel_name,target_type,period'
          });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel-targets'] });
    }
  });

  return {
    syncChannelTargets: syncChannelTargets.mutate,
    isSyncing: syncChannelTargets.isPending
  };
}