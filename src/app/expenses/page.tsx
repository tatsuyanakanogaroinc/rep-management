'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { ExpenseForm } from '@/components/features/expenses/expense-form';
import { ExpensesList } from '@/components/features/expenses/expenses-list';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthContext } from '@/lib/auth-context';
import Link from 'next/link';

interface Expense {
  id: string;
  date: string;
  category: string;
  amount: number;
  vendor: string;
  status: 'pending' | 'approved' | 'rejected';
  notes: string | null;
  created_by: string;
}

export default function ExpensesPage() {
  const { user, userProfile, signOut } = useAuthContext();
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleFormSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
    setActiveTab('list');
    setEditingExpense(null);
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setActiveTab('create');
  };

  const handleCancelEdit = () => {
    setEditingExpense(null);
    setActiveTab('list');
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-4">
                <Link href="/dashboard">
                  <Button variant="outline">← ダッシュボード</Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">支出管理</h1>
                  <p className="text-gray-600">支出の登録・承認・管理</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {userProfile?.name || user?.email}
                  </p>
                  <p className="text-xs text-gray-500">{userProfile?.role}</p>
                </div>
                <Button variant="outline" onClick={handleSignOut}>
                  ログアウト
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* メインコンテンツ */}
            <div className="lg:col-span-3">
              {/* タブナビゲーション */}
              <div className="mb-6">
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      onClick={() => {
                        setActiveTab('list');
                        setEditingExpense(null);
                      }}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'list'
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      支出一覧
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('create');
                        setEditingExpense(null);
                      }}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'create'
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {editingExpense ? '支出編集' : '支出登録'}
                    </button>
                  </nav>
                </div>
              </div>

              {/* タブコンテンツ */}
              {activeTab === 'list' && (
                <ExpensesList 
                  onEdit={handleEdit}
                  refreshTrigger={refreshTrigger}
                />
              )}

              {activeTab === 'create' && (
                <ExpenseForm 
                  onSuccess={handleFormSuccess}
                  initialData={editingExpense || undefined}
                  isEditing={!!editingExpense}
                  onCancel={editingExpense ? handleCancelEdit : undefined}
                />
              )}
            </div>

            {/* サイドバー */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
                {/* 月次統計 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">今月の支出</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">承認済み</span>
                      <span className="font-medium">¥0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">承認待ち</span>
                      <span className="font-medium">¥0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">却下</span>
                      <span className="font-medium">¥0</span>
                    </div>
                    <div className="border-t pt-2 mt-3">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-900">合計</span>
                        <span className="font-bold">¥0</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 費目別統計 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">費目別（今月）</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">サーバー費</span>
                        <span>¥0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">広告費</span>
                        <span>¥0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">人件費</span>
                        <span>¥0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">その他</span>
                        <span>¥0</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 承認権限 */}
                {(userProfile?.role === 'manager' || userProfile?.role === 'admin') && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">承認待ち</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-4">
                        <div className="text-2xl font-bold text-orange-600">0件</div>
                        <p className="text-sm text-gray-500">承認待ちの支出</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* クイックアクション */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">クイックアクション</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        setActiveTab('create');
                        setEditingExpense(null);
                      }}
                    >
                      💰 支出を登録
                    </Button>
                    <Link href="/daily-report">
                      <Button variant="outline" className="w-full justify-start">
                        📝 日報を作成
                      </Button>
                    </Link>
                    <Link href="/customers">
                      <Button variant="outline" className="w-full justify-start">
                        👥 顧客を管理
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* 支出管理のコツ */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">💡 支出管理のコツ</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-2 text-gray-600">
                      <li>• 領収書は必ず保存しましょう</li>
                      <li>• 定期支出は忘れずに記録</li>
                      <li>• 備考欄に詳細を記載</li>
                      <li>• 承認フローを活用しましょう</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}