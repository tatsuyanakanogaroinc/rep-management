'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, Users, CreditCard, CheckCircle, AlertCircle, TrendingUp, DollarSign } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface QuickInputWidgetProps {
  currentMonth: string;
}

export function QuickInputWidget({ currentMonth }: QuickInputWidgetProps) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // 顧客入力フォーム
  const [customerForm, setCustomerForm] = useState({
    email: '',
    name: '',
    planType: 'monthly' as 'monthly' | 'yearly',
  });
  
  // 支出入力フォーム
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    category: 'marketing' as string,
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

  // 顧客追加処理
  const handleAddCustomer = async () => {
    if (!customerForm.email) {
      setErrorMessage('メールアドレスを入力してください');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // 現在の月の日付を設定
      const registeredAt = new Date(currentMonth + '-01').toISOString();
      
      const { error } = await supabase.from('customers').insert([
        {
          email: customerForm.email,
          name: customerForm.name || customerForm.email.split('@')[0],
          plan_type: customerForm.planType,
          registered_at: registeredAt,
          status: 'active',
        },
      ]);

      if (error) throw error;

      setSuccessMessage(`顧客「${customerForm.email}」を追加しました`);
      setCustomerForm({ email: '', name: '', planType: 'monthly' });
      
      // ダッシュボードデータを再取得
      queryClient.invalidateQueries({ queryKey: ['dashboard-with-targets', currentMonth] });
      queryClient.invalidateQueries({ queryKey: ['monthly-trends', currentMonth] });
      
    } catch (error) {
      console.error('Customer add error:', error);
      setErrorMessage('顧客の追加に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 支出追加処理
  const handleAddExpense = async () => {
    if (!expenseForm.description || !expenseForm.amount) {
      setErrorMessage('説明と金額を入力してください');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // 現在の月の1日を日付として設定
      const expenseDate = format(new Date(currentMonth + '-01'), 'yyyy-MM-dd');
      
      const { error } = await supabase.from('expenses').insert([
        {
          description: expenseForm.description,
          amount: parseFloat(expenseForm.amount),
          category: expenseForm.category,
          date: expenseDate,
        },
      ]);

      if (error) throw error;

      setSuccessMessage(`支出「${expenseForm.description}」を追加しました`);
      setExpenseForm({ description: '', amount: '', category: 'marketing' });
      
      // ダッシュボードデータを再取得
      queryClient.invalidateQueries({ queryKey: ['dashboard-with-targets', currentMonth] });
      queryClient.invalidateQueries({ queryKey: ['monthly-trends', currentMonth] });
      
    } catch (error) {
      console.error('Expense add error:', error);
      setErrorMessage('支出の追加に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 成功・エラーメッセージを3秒後に消す
  if (successMessage) {
    setTimeout(() => setSuccessMessage(''), 3000);
  }
  if (errorMessage) {
    setTimeout(() => setErrorMessage(''), 3000);
  }

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlusCircle className="w-5 h-5" />
          クイック入力
        </CardTitle>
        <CardDescription>
          {format(new Date(currentMonth + '-01'), 'yyyy年MM月', { locale: ja })}の実績を素早く入力
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* メッセージ表示 */}
        {successMessage && (
          <Alert className="mb-4 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}
        
        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="customer" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="customer" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              顧客追加
            </TabsTrigger>
            <TabsTrigger value="expense" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              支出追加
            </TabsTrigger>
          </TabsList>
          
          {/* 顧客追加タブ */}
          <TabsContent value="customer" className="space-y-4">
            <div>
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                placeholder="customer@example.com"
                value={customerForm.email}
                onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                disabled={isLoading}
              />
            </div>
            
            <div>
              <Label htmlFor="name">名前（オプション）</Label>
              <Input
                id="name"
                placeholder="山田太郎"
                value={customerForm.name}
                onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                disabled={isLoading}
              />
            </div>
            
            <div>
              <Label htmlFor="planType">プラン</Label>
              <Select
                value={customerForm.planType}
                onValueChange={(value) => setCustomerForm({ ...customerForm, planType: value as 'monthly' | 'yearly' })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">月額</Badge>
                      <span>¥2,490/月</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="yearly">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-50">年額</Badge>
                      <span>¥24,900/年</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={handleAddCustomer} 
              disabled={isLoading || !customerForm.email}
              className="w-full"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  追加中...
                </div>
              ) : (
                <>
                  <Users className="w-4 h-4 mr-2" />
                  顧客を追加
                </>
              )}
            </Button>
          </TabsContent>
          
          {/* 支出追加タブ */}
          <TabsContent value="expense" className="space-y-4">
            <div>
              <Label htmlFor="description">説明</Label>
              <Input
                id="description"
                placeholder="例: Facebook広告費"
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                disabled={isLoading}
              />
            </div>
            
            <div>
              <Label htmlFor="amount">金額</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">¥</span>
                <Input
                  id="amount"
                  type="number"
                  placeholder="10000"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  className="pl-8"
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="category">カテゴリ</Label>
              <Select
                value={expenseForm.category}
                onValueChange={(value) => setExpenseForm({ ...expenseForm, category: value })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={handleAddExpense} 
              disabled={isLoading || !expenseForm.description || !expenseForm.amount}
              className="w-full"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  追加中...
                </div>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  支出を追加
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>

        {/* 統計サマリー */}
        <div className="mt-6 pt-6 border-t">
          <p className="text-sm text-muted-foreground mb-3">今月の入力状況</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">新規顧客</p>
                <p className="text-xs text-muted-foreground">クイック入力から追加</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">支出記録</p>
                <p className="text-xs text-muted-foreground">詳細は各ページで確認</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}