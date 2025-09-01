'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuthContext } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { 
  ArrowLeft, 
  Plus, 
  Calendar, 
  DollarSign, 
  Repeat, 
  CheckCircle, 
  AlertCircle,
  Trash2,
  Edit,
  Save,
  X
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface RecurringExpense {
  id: string;
  description: string;
  amount: number;
  category: string;
  day_of_month: number;
  is_active: boolean;
  created_at: string;
  last_processed_month?: string;
}

export default function RecurringExpensesPage() {
  const { userProfile } = useAuthContext();
  const queryClient = useQueryClient();
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // フォームデータ
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'infrastructure',
    day_of_month: '1',
    is_active: true
  });

  // 支出カテゴリ
  const expenseCategories = [
    { value: 'marketing', label: '広告・マーケティング' },
    { value: 'development', label: '開発・技術' },
    { value: 'infrastructure', label: 'インフラ・サーバー' },
    { value: 'tools', label: 'ツール・サービス' },
    { value: 'outsourcing', label: '外注費' },
    { value: 'office', label: 'オフィス・設備' },
    { value: 'other', label: 'その他' },
  ];

  // 定期支出一覧を取得
  const { data: recurringExpenses, isLoading } = useQuery({
    queryKey: ['recurring-expenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recurring_expenses')
        .select('*')
        .order('day_of_month', { ascending: true });
      
      if (error) throw error;
      return data as RecurringExpense[];
    }
  });

  // 定期支出を追加
  const addMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('recurring_expenses').insert([{
        description: data.description,
        amount: parseFloat(data.amount),
        category: data.category,
        day_of_month: parseInt(data.day_of_month),
        is_active: data.is_active
      }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] });
      setSuccessMessage('定期支出を追加しました');
      setIsAddingNew(false);
      setFormData({
        description: '',
        amount: '',
        category: 'infrastructure',
        day_of_month: '1',
        is_active: true
      });
    },
    onError: () => {
      setErrorMessage('追加に失敗しました');
    }
  });

  // 定期支出を更新
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from('recurring_expenses')
        .update({
          description: data.description,
          amount: parseFloat(data.amount),
          category: data.category,
          day_of_month: parseInt(data.day_of_month),
          is_active: data.is_active
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] });
      setSuccessMessage('定期支出を更新しました');
      setEditingId(null);
    },
    onError: () => {
      setErrorMessage('更新に失敗しました');
    }
  });

  // 定期支出を削除
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('recurring_expenses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] });
      setSuccessMessage('定期支出を削除しました');
    },
    onError: () => {
      setErrorMessage('削除に失敗しました');
    }
  });

  // 手動で実行（現在月の支出を生成）
  const processRecurringExpenses = async () => {
    try {
      const currentMonth = format(new Date(), 'yyyy-MM');
      
      // アクティブな定期支出を取得
      const activeExpenses = recurringExpenses?.filter(e => e.is_active) || [];
      
      for (const expense of activeExpenses) {
        // すでに処理済みかチェック
        if (expense.last_processed_month === currentMonth) {
          continue;
        }
        
        // 支出日を計算
        const expenseDate = new Date();
        expenseDate.setDate(expense.day_of_month);
        
        // 支出を追加
        const { error: insertError } = await supabase.from('expenses').insert([{
          description: `${expense.description} (定期)`,
          amount: expense.amount,
          category: expense.category,
          date: format(expenseDate, 'yyyy-MM-dd')
        }]);
        
        if (insertError) {
          console.error('Failed to insert expense:', insertError);
          continue;
        }
        
        // 処理済みフラグを更新
        await supabase
          .from('recurring_expenses')
          .update({ last_processed_month: currentMonth })
          .eq('id', expense.id);
      }
      
      setSuccessMessage('定期支出を処理しました');
      queryClient.invalidateQueries({ queryKey: ['dashboard-with-targets'] });
    } catch (error) {
      console.error('Process recurring expenses error:', error);
      setErrorMessage('処理に失敗しました');
    }
  };

  // メッセージを3秒後に消す
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const startEdit = (expense: RecurringExpense) => {
    setEditingId(expense.id);
    setFormData({
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category,
      day_of_month: expense.day_of_month.toString(),
      is_active: expense.is_active
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      description: '',
      amount: '',
      category: 'infrastructure',
      day_of_month: '1',
      is_active: true
    });
  };

  return (
    <ProtectedRoute>
      <div className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-10" />
        
        {/* ヘッダー */}
        <header className="relative z-10 glass border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="animate-fade-in">
                <div className="flex items-center gap-3">
                  <Repeat className="w-8 h-8 text-primary" />
                  <div>
                    <h1 className="text-2xl font-bold">
                      <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        定期支出管理
                      </span>
                    </h1>
                    <p className="text-muted-foreground mt-1">
                      毎月自動で登録される支出の設定
                    </p>
                  </div>
                </div>
              </div>
              <Link href="/expenses">
                <Button variant="outline" className="glass hover:bg-white/20">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  支出管理に戻る
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* メインコンテンツ */}
        <main className="relative z-10 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* メッセージ表示 */}
          {successMessage && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {successMessage}
              </AlertDescription>
            </Alert>
          )}
          
          {errorMessage && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* アクションバー */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-sm text-muted-foreground">
                登録済み: {recurringExpenses?.length || 0}件 / 
                アクティブ: {recurringExpenses?.filter(e => e.is_active).length || 0}件
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={processRecurringExpenses}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                今月分を生成
              </Button>
              <Button
                onClick={() => setIsAddingNew(true)}
                className="flex items-center gap-2"
                disabled={isAddingNew}
              >
                <Plus className="w-4 h-4" />
                新規追加
              </Button>
            </div>
          </div>

          {/* 新規追加フォーム */}
          {isAddingNew && (
            <Card className="glass mb-6">
              <CardHeader>
                <CardTitle>新規定期支出</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="description">説明</Label>
                    <Input
                      id="description"
                      placeholder="例: AWS利用料"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="amount">金額</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">¥</span>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="50000"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="category">カテゴリ</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {expenseCategories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="day_of_month">毎月の支払日</Label>
                    <Input
                      id="day_of_month"
                      type="number"
                      min="1"
                      max="28"
                      value={formData.day_of_month}
                      onChange={(e) => setFormData({ ...formData, day_of_month: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      1-28日を指定（月末処理は28日）
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-6">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">有効にする</Label>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsAddingNew(false);
                        setFormData({
                          description: '',
                          amount: '',
                          category: 'infrastructure',
                          day_of_month: '1',
                          is_active: true
                        });
                      }}
                    >
                      キャンセル
                    </Button>
                    <Button
                      onClick={() => addMutation.mutate(formData)}
                      disabled={!formData.description || !formData.amount || addMutation.isPending}
                    >
                      {addMutation.isPending ? '追加中...' : '追加'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 定期支出一覧 */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>定期支出一覧</CardTitle>
              <CardDescription>
                毎月自動で登録される支出項目
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : recurringExpenses?.length === 0 ? (
                <div className="text-center py-8">
                  <Repeat className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">定期支出が登録されていません</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recurringExpenses?.map((expense) => (
                    <div key={expense.id} className="border rounded-lg p-4">
                      {editingId === expense.id ? (
                        // 編集モード
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                              placeholder="説明"
                              value={formData.description}
                              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">¥</span>
                              <Input
                                type="number"
                                placeholder="金額"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className="pl-8"
                              />
                            </div>
                            <Select
                              value={formData.category}
                              onValueChange={(value) => setFormData({ ...formData, category: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {expenseCategories.map((cat) => (
                                  <SelectItem key={cat.value} value={cat.value}>
                                    {cat.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              type="number"
                              min="1"
                              max="28"
                              placeholder="支払日"
                              value={formData.day_of_month}
                              onChange={(e) => setFormData({ ...formData, day_of_month: e.target.value })}
                            />
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={formData.is_active}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                              />
                              <Label>有効</Label>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelEdit}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => updateMutation.mutate({ id: expense.id, data: formData })}
                                disabled={updateMutation.isPending}
                              >
                                <Save className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // 表示モード
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-medium">{expense.description}</h3>
                              {expense.is_active ? (
                                <Badge className="bg-green-100 text-green-700">有効</Badge>
                              ) : (
                                <Badge variant="outline">無効</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                ¥{expense.amount.toLocaleString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                毎月{expense.day_of_month}日
                              </span>
                              <Badge variant="outline">
                                {expenseCategories.find(c => c.value === expense.category)?.label}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEdit(expense)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (confirm('この定期支出を削除しますか？')) {
                                  deleteMutation.mutate(expense.id);
                                }
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
}