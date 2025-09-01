'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { CustomerForm } from '@/components/features/customers/customer-form';
import { CustomersList } from '@/components/features/customers/customers-list';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthContext } from '@/lib/auth-context';
import { Database } from '@/types/supabase';
import Link from 'next/link';

type Customer = Database['public']['Tables']['customers']['Row'];

export default function CustomersPage() {
  const { user, userProfile, signOut } = useAuthContext();
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleFormSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
    setActiveTab('list');
    setEditingCustomer(null);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setActiveTab('create');
  };

  const handleCancelEdit = () => {
    setEditingCustomer(null);
    setActiveTab('list');
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <div className="bg-white shadow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">顧客管理</h1>
                  <p className="text-gray-600">顧客データの一元管理と分析</p>
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
                        setEditingCustomer(null);
                      }}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'list'
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      顧客一覧
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('create');
                        setEditingCustomer(null);
                      }}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'create'
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {editingCustomer ? '顧客編集' : '新規追加'}
                    </button>
                  </nav>
                </div>
              </div>

              {/* タブコンテンツ */}
              {activeTab === 'list' && (
                <CustomersList 
                  onEdit={handleEdit}
                  refreshTrigger={refreshTrigger}
                />
              )}

              {activeTab === 'create' && (
                <CustomerForm 
                  onSuccess={handleFormSuccess}
                  initialData={editingCustomer || undefined}
                  isEditing={!!editingCustomer}
                  onCancel={editingCustomer ? handleCancelEdit : undefined}
                />
              )}
            </div>

            {/* サイドバー */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
                {/* 統計カード */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">顧客統計</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">アクティブ</span>
                      <span className="font-medium">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">休眠</span>
                      <span className="font-medium">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">解約</span>
                      <span className="font-medium">0</span>
                    </div>
                    <div className="border-t pt-2 mt-3">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-900">合計</span>
                        <span className="font-bold">0</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* プラン別統計 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">プラン別</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">月額プラン</span>
                      <span className="font-medium">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">年額プラン</span>
                      <span className="font-medium">0</span>
                    </div>
                  </CardContent>
                </Card>

                {/* 獲得経路統計 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">獲得経路</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">オーガニック</span>
                        <span>0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">リファラル</span>
                        <span>0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">SNS</span>
                        <span>0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">広告</span>
                        <span>0</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

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
                        setEditingCustomer(null);
                      }}
                    >
                      👥 新規顧客追加
                    </Button>
                    <Link href="/daily-report">
                      <Button variant="outline" className="w-full justify-start">
                        📝 日報を作成
                      </Button>
                    </Link>
                    <Link href="/expenses">
                      <Button variant="outline" className="w-full justify-start">
                        💰 支出を記録
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}