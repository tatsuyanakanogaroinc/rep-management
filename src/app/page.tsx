'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/lib/auth-context';

export default function Home() {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return null; // リダイレクト中
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            SNS経営管理システム
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            招待制SNSサービスの経営管理をデジタル化し、リアルタイムでのデータ可視化と意思決定の高速化を実現
          </p>
          
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              <Link href="/login">
                <Button size="lg" className="w-full">
                  ログイン
                </Button>
              </Link>
            </div>
            <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
              <Link href="/signup">
                <Button variant="outline" size="lg" className="w-full">
                  アカウント作成
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white mx-auto">
                📊
              </div>
              <h3 className="mt-6 text-lg font-medium text-gray-900">リアルタイムダッシュボード</h3>
              <p className="mt-2 text-base text-gray-500">
                主要KPIをリアルタイムで監視・可視化
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white mx-auto">
                📝
              </div>
              <h3 className="mt-6 text-lg font-medium text-gray-900">日報機能</h3>
              <p className="mt-2 text-base text-gray-500">
                AI音声入力対応で効率的な日報作成
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white mx-auto">
                👥
              </div>
              <h3 className="mt-6 text-lg font-medium text-gray-900">顧客管理</h3>
              <p className="mt-2 text-base text-gray-500">
                顧客データの一元管理と分析
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white mx-auto">
                🔮
              </div>
              <h3 className="mt-6 text-lg font-medium text-gray-900">AI予測</h3>
              <p className="mt-2 text-base text-gray-500">
                売上予測と異常検知アラート
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
