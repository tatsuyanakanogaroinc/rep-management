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
import { Database } from '@/types/supabase';

type Customer = Database['public']['Tables']['customers']['Row'];

interface CustomersListProps {
  onEdit?: (customer: Customer) => void;
  refreshTrigger?: number;
}

export function CustomersList({ onEdit, refreshTrigger }: CustomersListProps) {
  const { userProfile } = useAuthContext();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');

  useEffect(() => {
    fetchCustomers();
  }, [refreshTrigger]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (channelFilter !== 'all') params.append('channel', channelFilter);

      const response = await fetch(`/api/customers?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }

      const data = await response.json();
      setCustomers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (customerId: string) => {
    if (!confirm('この顧客を削除してもよろしいですか？')) return;

    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete customer');
      }

      setCustomers(customers.filter(c => c.id !== customerId));
    } catch (err) {
      setError(err instanceof Error ? err.message : '削除に失敗しました');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default' as const,
      dormant: 'secondary' as const,
      churned: 'destructive' as const,
    };
    const labels = {
      active: 'アクティブ',
      dormant: '休眠',
      churned: '解約',
    };
    return <Badge variant={variants[status as keyof typeof variants]}>{labels[status as keyof typeof labels]}</Badge>;
  };

  const getChannelLabel = (channel: string) => {
    const labels: Record<string, string> = {
      organic: 'オーガニック',
      referral: 'リファラル',
      social: 'SNS',
      advertisement: '広告',
      direct: '直接',
      email: 'メール',
      other: 'その他',
    };
    return labels[channel] || channel;
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (customer.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    const matchesChannel = channelFilter === 'all' || customer.acquisition_channel === channelFilter;
    
    return matchesSearch && matchesStatus && matchesChannel;
  });

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '¥0';
    return `¥${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP');
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>顧客一覧</CardTitle>
        
        {/* フィルター */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <Input
            placeholder="会社名・担当者名で検索..."
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
              <SelectItem value="active">アクティブ</SelectItem>
              <SelectItem value="dormant">休眠</SelectItem>
              <SelectItem value="churned">解約</SelectItem>
            </SelectContent>
          </Select>

          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger className="sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全経路</SelectItem>
              <SelectItem value="organic">オーガニック</SelectItem>
              <SelectItem value="referral">リファラル</SelectItem>
              <SelectItem value="social">SNS</SelectItem>
              <SelectItem value="advertisement">広告</SelectItem>
              <SelectItem value="direct">直接</SelectItem>
              <SelectItem value="email">メール</SelectItem>
              <SelectItem value="other">その他</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-500">
              {customers.length === 0 ? '顧客がまだありません' : '条件に一致する顧客がありません'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>会社名</TableHead>
                  <TableHead>担当者</TableHead>
                  <TableHead>プラン</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>獲得経路</TableHead>
                  <TableHead>LTV</TableHead>
                  <TableHead>登録日</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.company_name}</TableCell>
                    <TableCell>{customer.contact_name || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {customer.plan_type === 'monthly' ? '月額' : '年額'}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(customer.status)}</TableCell>
                    <TableCell>{getChannelLabel(customer.acquisition_channel)}</TableCell>
                    <TableCell>{formatCurrency(customer.ltv)}</TableCell>
                    <TableCell>{formatDate(customer.registered_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        {onEdit && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(customer)}
                          >
                            編集
                          </Button>
                        )}
                        {(userProfile?.role === 'manager' || userProfile?.role === 'admin') && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(customer.id)}
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
          合計: {filteredCustomers.length}件 / {customers.length}件
        </div>
      </CardContent>
    </Card>
  );
}