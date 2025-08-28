'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthContext } from '@/lib/auth-context';
import { Database } from '@/types/supabase';

type ExpenseInsert = Database['public']['Tables']['expenses']['Insert'];
type Expense = Database['public']['Tables']['expenses']['Row'];

interface ExpenseFormProps {
  onSuccess?: (expense: Expense) => void;
  initialData?: Partial<Expense>;
  isEditing?: boolean;
  onCancel?: () => void;
}

const EXPENSE_CATEGORIES = [
  { value: 'server_costs', label: 'サーバー費' },
  { value: 'payment_fees', label: '決済手数料' },
  { value: 'outsourcing_cs', label: 'CS外注費' },
  { value: 'personnel_costs', label: '人件費' },
  { value: 'advertising', label: '広告費' },
  { value: 'ambassador_rewards', label: 'アンバサダー報酬' },
  { value: 'sales_expenses', label: '営業費' },
  { value: 'administrative_expenses', label: '管理費' },
  { value: 'office_rent', label: 'オフィス家賃' },
  { value: 'utilities', label: '光熱費' },
  { value: 'communication', label: '通信費' },
  { value: 'software_licenses', label: 'ソフトウェアライセンス' },
  { value: 'travel_expenses', label: '交通費' },
  { value: 'entertainment', label: '接待交際費' },
  { value: 'other', label: 'その他' },
];

export function ExpenseForm({ onSuccess, initialData, isEditing = false, onCancel }: ExpenseFormProps) {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<ExpenseInsert>({
    date: initialData?.date || new Date().toISOString().split('T')[0],
    category: initialData?.category || '',
    amount: initialData?.amount || 0,
    vendor: initialData?.vendor || '',
    notes: initialData?.notes || '',
    created_by: user?.id || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const url = isEditing ? `/api/expenses/${initialData?.id}` : '/api/expenses';
      const method = isEditing ? 'PUT' : 'POST';

      const submitData = {
        ...formData,
        created_by: user.id,
        amount: Number(formData.amount),
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${isEditing ? 'update' : 'create'} expense`);
      }

      if (onSuccess) {
        onSuccess(result);
      }

      if (!isEditing) {
        // Reset form for new expense
        setFormData({
          date: new Date().toISOString().split('T')[0],
          category: '',
          amount: 0,
          vendor: '',
          notes: '',
          created_by: user.id,
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
        <CardTitle>{isEditing ? '支出編集' : '支出登録'}</CardTitle>
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
              <Label htmlFor="date">支出日 *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">金額 (円) *</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="1"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) || 0 })}
                required
                placeholder="10000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">費目 *</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="費目を選択" />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendor">支払先 *</Label>
            <Input
              id="vendor"
              value={formData.vendor}
              onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
              required
              placeholder="例: AWS, Google Ads, 株式会社○○"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">備考</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="支出の詳細や目的などを記入..."
              rows={3}
            />
          </div>

          <div className="border rounded-lg p-4 bg-blue-50">
            <h4 className="text-sm font-medium text-blue-900 mb-2">💡 ポイント</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 領収書は別途保存してください</li>
              <li>• 定期的な支出は継続して記録しましょう</li>
              <li>• 備考欄に詳細な情報を記載すると後で確認しやすくなります</li>
            </ul>
          </div>

          <div className="flex space-x-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? '保存中...' : (isEditing ? '更新' : '支出を登録')}
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