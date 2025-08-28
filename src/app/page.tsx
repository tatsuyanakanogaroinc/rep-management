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
    <div className="relative min-h-screen overflow-hidden">
      {/* 背景グラデーション */}
      <div className="absolute inset-0 gradient-mesh opacity-30" />
      
      {/* ナビゲーション */}
      <nav className="relative z-10 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg gradient-primary shadow-glow" />
              <span className="text-xl font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                SMS
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" className="hidden sm:inline-flex">
                  ログイン
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="gradient-primary text-white border-0 shadow-soft hover:shadow-glow transition-all duration-300">
                  無料で始める
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ヒーローセクション */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center animate-fade-in">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold">
            <span className="block">次世代の</span>
            <span className="block mt-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              SNS経営管理システム
            </span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-muted-foreground leading-relaxed">
            データドリブンな意思決定で、ビジネスの成長を加速。
            リアルタイムな分析と美しいダッシュボードで経営を可視化します。
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="gradient-primary text-white border-0 shadow-soft hover:shadow-glow transition-all duration-300 px-8 py-6 text-lg">
                無料で始める
                <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="px-8 py-6 text-lg border-2 hover:border-primary transition-colors">
                ログインはこちら
              </Button>
            </Link>
          </div>
        </div>

        {/* 機能カード */}
        <div className="mt-32">
          <h2 className="text-center text-3xl font-bold mb-16">
            パワフルな機能で<span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">経営を革新</span>
          </h2>
          
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: "📊",
                title: "リアルタイムダッシュボード",
                description: "主要KPIをリアルタイムで監視・可視化",
                gradient: "from-blue-500 to-purple-500"
              },
              {
                icon: "📝",
                title: "スマート日報",
                description: "AI音声入力対応で効率的な日報作成",
                gradient: "from-purple-500 to-pink-500"
              },
              {
                icon: "👥",
                title: "顧客インサイト",
                description: "顧客データの一元管理と分析",
                gradient: "from-pink-500 to-orange-500"
              },
              {
                icon: "🔮",
                title: "AI予測分析",
                description: "売上予測と異常検知アラート",
                gradient: "from-orange-500 to-yellow-500"
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="group relative p-6 bg-white rounded-2xl shadow-soft hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`} />
                <div className="relative z-10">
                  <div className={`flex items-center justify-center h-14 w-14 rounded-xl bg-gradient-to-r ${feature.gradient} text-white text-2xl mx-auto shadow-lg`}>
                    {feature.icon}
                  </div>
                  <h3 className="mt-6 text-lg font-semibold text-gray-900">{feature.title}</h3>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* CTA セクション */}
        <div className="mt-32 text-center">
          <div className="inline-block p-8 md:p-12 rounded-3xl bg-gradient-to-r from-primary/10 to-accent/10 backdrop-blur-sm">
            <h2 className="text-3xl font-bold mb-4">
              今すぐ始めましょう
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
              クレジットカード不要。いつでもキャンセル可能。
            </p>
            <Link href="/signup">
              <Button size="lg" className="gradient-primary text-white border-0 shadow-soft hover:shadow-glow transition-all duration-300 px-8 py-6 text-lg">
                無料アカウントを作成
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
