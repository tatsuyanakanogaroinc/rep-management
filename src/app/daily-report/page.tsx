'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DailyReportForm } from '@/components/features/daily-reports/daily-report-form';
import { DailyReportsList } from '@/components/features/daily-reports/daily-reports-list';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthContext } from '@/lib/auth-context';
import Link from 'next/link';

export default function DailyReportPage() {
  const { user, userProfile, signOut } = useAuthContext();
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  const [refreshList, setRefreshList] = useState(0);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleFormSuccess = () => {
    setRefreshList(prev => prev + 1);
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
                  <h1 className="text-2xl font-bold text-gray-900">日報管理</h1>
                  <p className="text-gray-600">日々の業務活動を記録・管理</p>
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* メインコンテンツ */}
            <div className="lg:col-span-2">
              {/* タブナビゲーション */}
              <div className="mb-6">
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      onClick={() => setActiveTab('create')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'create'
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      日報作成
                    </button>
                    <button
                      onClick={() => setActiveTab('list')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'list'
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      日報一覧
                    </button>
                  </nav>
                </div>
              </div>

              {/* タブコンテンツ */}
              {activeTab === 'create' && (
                <DailyReportForm onSuccess={handleFormSuccess} />
              )}

              {activeTab === 'list' && (
                <DailyReportsList key={refreshList} />
              )}
            </div>

            {/* サイドバー */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
                {/* 今週の統計 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">今週の実績</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">日報提出</span>
                      <span className="font-medium">0 / 7日</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">新規獲得</span>
                      <span className="font-medium">0件</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">解約数</span>
                      <span className="font-medium">0件</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                    </div>
                    <p className="text-xs text-gray-500">提出率: 0%</p>
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
                      onClick={() => setActiveTab('create')}
                    >
                      📝 今日の日報を作成
                    </Button>
                    <Link href="/customers">
                      <Button variant="outline" className="w-full justify-start">
                        👥 顧客データを確認
                      </Button>
                    </Link>
                    <Link href="/expenses">
                      <Button variant="outline" className="w-full justify-start">
                        💰 支出を記録
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* ヒント */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">💡 日報のコツ</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-2 text-gray-600">
                      <li>• 具体的な数値を記録しましょう</li>
                      <li>• 顧客の反応や課題を記録</li>
                      <li>• 明日のアクションプランを明確に</li>
                      <li>• 定期的な振り返りを行いましょう</li>
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