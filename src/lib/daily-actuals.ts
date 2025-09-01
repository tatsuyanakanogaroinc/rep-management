'use client';

import { supabase } from '@/lib/supabase';
import { DailyActual } from '@/types/database';

export interface DailyActualInput {
  date: string;
  newAcquisitions: number;
  revenue: number;
  expenses: number;
  channelData: Record<string, {
    acquisitions: number;
    cost: number;
  }>;
}

export async function saveDailyActual(input: DailyActualInput): Promise<DailyActual | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('ユーザーが認証されていません');

    const { data, error } = await supabase
      .from('daily_actuals')
      .upsert({
        user_id: user.id,
        date: input.date,
        new_acquisitions: input.newAcquisitions,
        revenue: input.revenue,
        expenses: input.expenses,
        channel_data: input.channelData,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,date'
      })
      .select()
      .single();

    if (error) {
      console.error('日次実績保存エラー:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('日次実績保存エラー:', error);
    return null;
  }
}

export async function getDailyActuals(userId: string, month: string): Promise<DailyActual[]> {
  try {
    const startDate = `${month}-01`;
    const endDate = `${month}-31`;

    const { data, error } = await supabase
      .from('daily_actuals')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) {
      console.error('日次実績取得エラー:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('日次実績取得エラー:', error);
    return [];
  }
}

export async function getDailyActual(userId: string, date: string): Promise<DailyActual | null> {
  try {
    const { data, error } = await supabase
      .from('daily_actuals')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('日次実績取得エラー:', error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error('日次実績取得エラー:', error);
    return null;
  }
}

export function aggregateMonthlyActuals(dailyActuals: DailyActual[]) {
  const totals = {
    newAcquisitions: 0,
    revenue: 0,
    expenses: 0,
    channels: {} as Record<string, { acquisitions: number; cost: number }>
  };

  dailyActuals.forEach(daily => {
    totals.newAcquisitions += daily.new_acquisitions;
    totals.revenue += daily.revenue;
    totals.expenses += daily.expenses;

    Object.entries(daily.channel_data).forEach(([channel, data]) => {
      if (!totals.channels[channel]) {
        totals.channels[channel] = { acquisitions: 0, cost: 0 };
      }
      totals.channels[channel].acquisitions += data.acquisitions;
      totals.channels[channel].cost += data.cost;
    });
  });

  return totals;
}