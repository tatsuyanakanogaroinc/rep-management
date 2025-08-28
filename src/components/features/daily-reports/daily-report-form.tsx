'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthContext } from '@/lib/auth-context';
import { Database } from '@/types/supabase';

type DailyReportInsert = Database['public']['Tables']['daily_reports']['Insert'];

interface DailyReportFormProps {
  onSuccess?: () => void;
  initialData?: Partial<DailyReportInsert>;
  isEditing?: boolean;
}

export function DailyReportForm({ onSuccess, initialData, isEditing = false }: DailyReportFormProps) {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<DailyReportInsert>({
    user_id: user?.id || '',
    date: initialData?.date || new Date().toISOString().split('T')[0],
    new_acquisitions: initialData?.new_acquisitions || 0,
    churns: initialData?.churns || 0,
    acquisition_details: initialData?.acquisition_details || {},
    activities: initialData?.activities || '',
    tomorrow_plan: initialData?.tomorrow_plan || '',
    customer_feedback: initialData?.customer_feedback || '',
  });

  const [acquisitionChannels, setAcquisitionChannels] = useState({
    organic: 0,
    referral: 0,
    social: 0,
    advertisement: 0,
    ...((initialData?.acquisition_details as Record<string, number>) || {}),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const submitData = {
        ...formData,
        user_id: user.id,
        acquisition_details: acquisitionChannels,
      };

      const response = await fetch('/api/daily-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create daily report');
      }

      setSuccess('日報を作成しました');
      
      // Reset form
      setFormData({
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
        new_acquisitions: 0,
        churns: 0,
        acquisition_details: {},
        activities: '',
        tomorrow_plan: '',
        customer_feedback: '',
      });
      setAcquisitionChannels({ organic: 0, referral: 0, social: 0, advertisement: 0 });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleChannelChange = (channel: string, value: number) => {
    setAcquisitionChannels(prev => ({
      ...prev,
      [channel]: value,
    }));
  };

  const totalAcquisitions = Object.values(acquisitionChannels).reduce((sum, val) => sum + val, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? '日報編集' : '日報作成'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">日付</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="churns">解約数</Label>
              <Input
                id="churns"
                type="number"
                min="0"
                value={formData.churns}
                onChange={(e) => setFormData({ ...formData, churns: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label>新規獲得内訳</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="organic">オーガニック</Label>
                <Input
                  id="organic"
                  type="number"
                  min="0"
                  value={acquisitionChannels.organic}
                  onChange={(e) => handleChannelChange('organic', parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="referral">リファラル</Label>
                <Input
                  id="referral"
                  type="number"
                  min="0"
                  value={acquisitionChannels.referral}
                  onChange={(e) => handleChannelChange('referral', parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="social">SNS</Label>
                <Input
                  id="social"
                  type="number"
                  min="0"
                  value={acquisitionChannels.social}
                  onChange={(e) => handleChannelChange('social', parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="advertisement">広告</Label>
                <Input
                  id="advertisement"
                  type="number"
                  min="0"
                  value={acquisitionChannels.advertisement}
                  onChange={(e) => handleChannelChange('advertisement', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="text-sm text-gray-600">
              合計新規獲得数: {totalAcquisitions}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="activities">本日の活動内容</Label>
            <Textarea
              id="activities"
              placeholder="今日の活動について記入してください..."
              value={formData.activities || ''}
              onChange={(e) => setFormData({ ...formData, activities: e.target.value })}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tomorrow_plan">明日の予定</Label>
            <Textarea
              id="tomorrow_plan"
              placeholder="明日の予定を記入してください..."
              value={formData.tomorrow_plan || ''}
              onChange={(e) => setFormData({ ...formData, tomorrow_plan: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer_feedback">顧客フィードバック</Label>
            <Textarea
              id="customer_feedback"
              placeholder="顧客からのフィードバックがあれば記入してください..."
              value={formData.customer_feedback || ''}
              onChange={(e) => setFormData({ ...formData, customer_feedback: e.target.value })}
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '保存中...' : (isEditing ? '更新' : '日報を保存')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}