'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthContext } from '@/lib/auth-context';

interface DailyReport {
  id: string;
  date: string;
  new_acquisitions: number;
  churns: number;
  acquisition_details: Record<string, number>;
  activities: string | null;
  tomorrow_plan: string | null;
  customer_feedback: string | null;
  created_at: string;
  users: {
    id: string;
    name: string;
    email: string;
  };
}

interface DailyReportsListProps {
  userId?: string;
  limit?: number;
}

export function DailyReportsList({ userId, limit = 10 }: DailyReportsListProps) {
  const { user, userProfile } = useAuthContext();
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, [userId, limit]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (userId) params.append('user_id', userId);
      params.append('limit', limit.toString());

      const response = await fetch(`/api/daily-reports?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch daily reports');
      }

      const data = await response.json();
      setReports(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    });
  };

  const getTotalAcquisitions = (details: Record<string, number>) => {
    return Object.values(details || {}).reduce((sum, val) => sum + val, 0);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            <span className="ml-2">読み込み中...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">日報がまだありません</p>
          <p className="text-sm text-gray-400 mt-1">最初の日報を作成しましょう</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <Card key={report.id}>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">{formatDate(report.date)}</CardTitle>
                <p className="text-sm text-gray-500">{report.users.name}</p>
              </div>
              <div className="flex space-x-2">
                <Badge variant="secondary">
                  新規: {getTotalAcquisitions(report.acquisition_details)}
                </Badge>
                <Badge variant={report.churns > 0 ? 'destructive' : 'secondary'}>
                  解約: {report.churns}
                </Badge>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            {/* 新規獲得内訳 */}
            {report.acquisition_details && Object.keys(report.acquisition_details).length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">獲得内訳</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(report.acquisition_details).map(([channel, count]) => (
                    count > 0 && (
                      <Badge key={channel} variant="outline">
                        {channel}: {count}
                      </Badge>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* 活動内容 */}
            {report.activities && (
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">活動内容</h4>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                  {report.activities}
                </p>
              </div>
            )}

            {/* 明日の予定 */}
            {report.tomorrow_plan && (
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">明日の予定</h4>
                <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded">
                  {report.tomorrow_plan}
                </p>
              </div>
            )}

            {/* 顧客フィードバック */}
            {report.customer_feedback && (
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">顧客フィードバック</h4>
                <p className="text-sm text-gray-700 bg-green-50 p-3 rounded">
                  {report.customer_feedback}
                </p>
              </div>
            )}

            <div className="flex justify-between items-center mt-4 pt-3 border-t">
              <span className="text-xs text-gray-400">
                作成: {new Date(report.created_at).toLocaleString('ja-JP')}
              </span>
              
              {(userProfile?.role === 'manager' || userProfile?.role === 'admin' || user?.id === report.users.id) && (
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    編集
                  </Button>
                  {(userProfile?.role === 'manager' || userProfile?.role === 'admin') && (
                    <Button variant="destructive" size="sm">
                      削除
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {reports.length >= limit && (
        <Card>
          <CardContent className="p-4 text-center">
            <Button variant="outline" onClick={() => fetchReports()}>
              さらに読み込む
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}