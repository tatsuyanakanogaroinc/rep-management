'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthContext } from '@/lib/auth-context';
import { getDailyActuals, aggregateMonthlyActuals } from '@/lib/daily-actuals';

export function useDailyActuals(month: string) {
  const { user } = useAuthContext();

  const { data: dailyActuals = [], isLoading } = useQuery({
    queryKey: ['daily-actuals', user?.id, month],
    queryFn: () => user ? getDailyActuals(user.id, month) : Promise.resolve([]),
    enabled: !!user && !!month,
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
    retry: 1
  });

  const monthlyTotals = aggregateMonthlyActuals(dailyActuals);

  return {
    dailyActuals,
    monthlyTotals,
    isLoading
  };
}