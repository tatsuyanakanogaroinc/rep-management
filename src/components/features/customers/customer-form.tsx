'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database } from '@/types/supabase';

type CustomerInsert = Database['public']['Tables']['customers']['Insert'];
type Customer = Database['public']['Tables']['customers']['Row'];

interface CustomerFormProps {
  onSuccess?: (customer: Customer) => void;
  initialData?: Partial<Customer>;
  isEditing?: boolean;
  onCancel?: () => void;
}

const ACQUISITION_CHANNELS = [
  { value: 'organic', label: 'オーガニック検索' },
  { value: 'referral', label: 'リファラル' },
  { value: 'social', label: 'SNS' },
  { value: 'advertisement', label: '広告' },
  { value: 'direct', label: '直接' },
  { value: 'email', label: 'メールマーケティング' },
  { value: 'other', label: 'その他' },
];

export function CustomerForm({ onSuccess, initialData, isEditing = false, onCancel }: CustomerFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CustomerInsert>({
    company_name: initialData?.company_name || '',
    contact_name: initialData?.contact_name || '',
    plan_type: initialData?.plan_type || 'monthly',
    status: initialData?.status || 'active',
    acquisition_channel: initialData?.acquisition_channel || '',
    ltv: initialData?.ltv || 0,
    invitations_sent: initialData?.invitations_sent || 0,
    invitations_approved: initialData?.invitations_approved || 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = isEditing ? `/api/customers/${initialData?.id}` : '/api/customers';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${isEditing ? 'update' : 'create'} customer`);
      }

      if (onSuccess) {
        onSuccess(result);
      }

      if (!isEditing) {
        // Reset form for new customer
        setFormData({
          company_name: '',
          contact_name: '',
          plan_type: 'monthly',
          status: 'active',
          acquisition_channel: '',
          ltv: 0,
          invitations_sent: 0,
          invitations_approved: 0,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? '顧客情報編集' : '新規顧客追加'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">会社名 *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                required
                placeholder="株式会社サンプル"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_name">担当者名</Label>
              <Input
                id="contact_name"
                value={formData.contact_name || ''}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                placeholder="山田太郎"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plan_type">プランタイプ *</Label>
              <Select value={formData.plan_type} onValueChange={(value: 'monthly' | 'yearly') => setFormData({ ...formData, plan_type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="プランを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">月額プラン</SelectItem>
                  <SelectItem value="yearly">年額プラン</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">ステータス</Label>
              <Select value={formData.status || 'active'} onValueChange={(value: 'active' | 'dormant' | 'churned') => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="ステータスを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">アクティブ</SelectItem>
                  <SelectItem value="dormant">休眠</SelectItem>
                  <SelectItem value="churned">解約</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="acquisition_channel">獲得経路 *</Label>
            <Select value={formData.acquisition_channel} onValueChange={(value) => setFormData({ ...formData, acquisition_channel: value })}>
              <SelectTrigger>
                <SelectValue placeholder="獲得経路を選択" />
              </SelectTrigger>
              <SelectContent>
                {ACQUISITION_CHANNELS.map((channel) => (
                  <SelectItem key={channel.value} value={channel.value}>
                    {channel.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ltv">LTV (円)</Label>
              <Input
                id="ltv"
                type="number"
                min="0"
                step="1000"
                value={formData.ltv || 0}
                onChange={(e) => setFormData({ ...formData, ltv: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invitations_sent">招待送信数</Label>
              <Input
                id="invitations_sent"
                type="number"
                min="0"
                value={formData.invitations_sent}
                onChange={(e) => setFormData({ ...formData, invitations_sent: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invitations_approved">招待承認数</Label>
              <Input
                id="invitations_approved"
                type="number"
                min="0"
                value={formData.invitations_approved}
                onChange={(e) => setFormData({ ...formData, invitations_approved: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex space-x-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? '保存中...' : (isEditing ? '更新' : '顧客を追加')}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                キャンセル
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}