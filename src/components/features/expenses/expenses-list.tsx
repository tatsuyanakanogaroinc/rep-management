'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuthContext } from '@/lib/auth-context';

interface Expense {
  id: string;
  date: string;
  category: string;
  amount: number;
  vendor: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by: string | null;
  receipt_url: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  created_by_user: {
    id: string;
    name: string;
    email: string;
  };
  approved_by_user?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface ExpensesListProps {
  onEdit?: (expense: Expense) => void;
  refreshTrigger?: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  server_costs: 'サーバー費',
  payment_fees: '決済手数料',
  outsourcing_cs: 'CS外注費',
  personnel_costs: '人件費',
  advertising: '広告費',
  ambassador_rewards: 'アンバサダー報酬',
  sales_expenses: '営業費',
  administrative_expenses: '管理費',
  office_rent: 'オフィス家賃',
  utilities: '光熱費',
  communication: '通信費',
  software_licenses: 'ソフトウェアライセンス',
  travel_expenses: '交通費',
  entertainment: '接待交際費',
  other: 'その他',
};

export function ExpensesList({ onEdit, refreshTrigger }: ExpensesListProps) {
  const { user, userProfile } = useAuthContext();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchExpenses();
  }, [refreshTrigger]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);

      const response = await fetch(`/api/expenses?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch expenses');
      }

      const data = await response.json();
      setExpenses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (expenseId: string, status: 'approved' | 'rejected') => {
    try {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          approved_by: user?.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update expense status');
      }

      await fetchExpenses();
    } catch (err) {
      setError(err instanceof Error ? err.message : '承認処理に失敗しました');
    }
  };

  const handleDelete = async (expenseId: string) => {
    if (!confirm('この支出を削除してもよろしいですか？')) return;

    try {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete expense');
      }

      setExpenses(expenses.filter(e => e.id !== expenseId));
    } catch (err) {
      setError(err instanceof Error ? err.message : '削除に失敗しました');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary' as const,
      approved: 'default' as const,
      rejected: 'destructive' as const,
    };
    const labels = {
      pending: '承認待ち',
      approved: '承認済み',
      rejected: '却下',
    };
    return <Badge variant={variants[status as keyof typeof variants]}>{labels[status as keyof typeof labels]}</Badge>;
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.created_by_user.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || expense.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

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

  const canApprove = userProfile?.role === 'manager' || userProfile?.role === 'admin';

  return (
    <Card>
      <CardHeader>
        <CardTitle>支出一覧</CardTitle>
        
        {/* フィルター */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <Input
            placeholder="支払先・備考・申請者で検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="sm:w-64"
          />
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全ステータス</SelectItem>
              <SelectItem value="pending">承認待ち</SelectItem>
              <SelectItem value="approved">承認済み</SelectItem>
              <SelectItem value="rejected">却下</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全費目</SelectItem>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* 合計金額 */}
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">表示中の合計金額</span>
            <span className="text-lg font-bold">{formatCurrency(totalAmount)}</span>
          </div>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-500">
              {expenses.length === 0 ? '支出がまだありません' : '条件に一致する支出がありません'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>支出日</TableHead>
                  <TableHead>費目</TableHead>
                  <TableHead>支払先</TableHead>
                  <TableHead>金額</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>申請者</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{formatDate(expense.date)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {CATEGORY_LABELS[expense.category] || expense.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{expense.vendor}</TableCell>
                    <TableCell>{formatCurrency(expense.amount)}</TableCell>
                    <TableCell>{getStatusBadge(expense.status)}</TableCell>
                    <TableCell>{expense.created_by_user.name}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        {expense.status === 'pending' && canApprove && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleApproval(expense.id, 'approved')}
                            >
                              承認
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleApproval(expense.id, 'rejected')}
                            >
                              却下
                            </Button>
                          </>
                        )}
                        {(expense.created_by === user?.id && expense.status === 'pending') && onEdit && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(expense)}
                          >
                            編集
                          </Button>
                        )}
                        {(canApprove || expense.created_by === user?.id) && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(expense.id)}
                          >
                            削除
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-500">
          合計: {filteredExpenses.length}件 / {expenses.length}件
        </div>
      </CardContent>
    </Card>
  );
}