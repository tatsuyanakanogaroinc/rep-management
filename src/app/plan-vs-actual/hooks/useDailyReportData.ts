import { useState, useEffect } from 'react';
import { useAuthContext } from '@/lib/auth-context';

interface DailyReportData {
  id: string;
  date: string;
  new_acquisitions: number;
  churns: number;
  acquisition_details: {
    organic?: number;
    referral?: number;
    social?: number;
    advertisement?: number;
  };
  activities: string;
  tomorrow_plan: string;
  customer_feedback: string;
  user_id: string;
}

interface MonthlyAggregateData {
  totalAcquisitions: number;
  totalChurns: number;
  channelBreakdown: {
    organic: number;
    referral: number;
    social: number;
    advertisement: number;
  };
  averageDaily: number;
}

export function useDailyReportData(targetMonth?: string) {
  const { user } = useAuthContext();
  const [dailyReports, setDailyReports] = useState<DailyReportData[]>([]);
  const [monthlyAggregate, setMonthlyAggregate] = useState<MonthlyAggregateData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDailyReports = async (month: string) => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const startDate = `${month}-01`;
      const endDate = `${month}-31`;

      const response = await fetch(
        `/api/daily-reports?user_id=${user.id}&start_date=${startDate}&end_date=${endDate}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch daily reports');
      }

      const data = await response.json();
      setDailyReports(data);

      // Calculate monthly aggregate
      const aggregate = calculateMonthlyAggregate(data);
      setMonthlyAggregate(aggregate);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyAggregate = (reports: DailyReportData[]): MonthlyAggregateData => {
    const totalAcquisitions = reports.reduce((sum, report) => sum + (report.new_acquisitions || 0), 0);
    const totalChurns = reports.reduce((sum, report) => sum + (report.churns || 0), 0);

    const channelBreakdown = reports.reduce(
      (acc, report) => {
        const details = report.acquisition_details || {};
        return {
          organic: acc.organic + (details.organic || 0),
          referral: acc.referral + (details.referral || 0),
          social: acc.social + (details.social || 0),
          advertisement: acc.advertisement + (details.advertisement || 0),
        };
      },
      { organic: 0, referral: 0, social: 0, advertisement: 0 }
    );

    const averageDaily = reports.length > 0 ? totalAcquisitions / reports.length : 0;

    return {
      totalAcquisitions,
      totalChurns,
      channelBreakdown,
      averageDaily,
    };
  };

  // チャネル名マッピング（日報→予実管理）
  const mapChannelNames = (dailyReportChannels: typeof monthlyAggregate.channelBreakdown) => {
    return [
      { name: 'オーガニック', actualAcquisitions: dailyReportChannels.organic, actualCpa: 0, actualCost: 0 },
      { name: '広告', actualAcquisitions: dailyReportChannels.advertisement, actualCpa: 0, actualCost: 0 },
      { name: 'SNS', actualAcquisitions: dailyReportChannels.social, actualCpa: 0, actualCost: 0 },
      { name: 'リファラル', actualAcquisitions: dailyReportChannels.referral, actualCpa: 0, actualCost: 0 },
    ];
  };

  useEffect(() => {
    if (targetMonth && user?.id) {
      fetchDailyReports(targetMonth);
    }
  }, [targetMonth, user?.id]);

  return {
    dailyReports,
    monthlyAggregate,
    loading,
    error,
    refetch: () => targetMonth && fetchDailyReports(targetMonth),
    mapChannelNames: monthlyAggregate ? () => mapChannelNames(monthlyAggregate.channelBreakdown) : null,
  };
}