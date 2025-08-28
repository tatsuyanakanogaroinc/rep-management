'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuthContext } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, userProfile, signOut } = useAuthContext();

  const handleSignOut = async () => {
    await signOut();
  };

  const metrics = [
    {
      title: 'MRR',
      value: '¥0',
      description: '月次経常収益',
      icon: '💰',
      color: 'from-green-500 to-emerald-500',
      change: '+0%'
    },
    {
      title: '有料会員数',
      value: '0',
      description: 'アクティブ会員',
      icon: '👥',
      color: 'from-blue-500 to-cyan-500',
      change: '+0'
    },
    {
      title: '新規獲得',
      value: '0',
      description: '今月の新規獲得',
      icon: '📈',
      color: 'from-purple-500 to-violet-500',
      change: '+0'
    },
    {
      title: 'チャーン率',
      value: '0%',
      description: '月次解約率',
      icon: '📊',
      color: 'from-orange-500 to-red-500',
      change: '0%'
    }
  ];

  const quickActions = [
    {
      title: '日報を入力',
      description: '今日の活動を記録',
      icon: '📝',
      href: '/daily-report',
      color: 'from-blue-500 to-purple-500'
    },
    {
      title: '顧客を追加',
      description: '新しい顧客情報を登録',
      icon: '👥',
      href: '/customers',
      color: 'from-purple-500 to-pink-500'
    },
    {
      title: '支出を登録',
      description: '経費・支出を記録',
      icon: '💰',
      href: '/expenses',
      color: 'from-pink-500 to-orange-500'
    }
  ];

  return (
    <ProtectedRoute>
      <div className="relative min-h-screen overflow-hidden">
        {/* 背景グラデーション */}
        <div className="absolute inset-0 gradient-mesh opacity-10" />
        
        {/* ヘッダー */}
        <header className="relative z-10 glass border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="animate-fade-in">
                <h1 className="text-2xl font-bold">
                  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    ダッシュボード
                  </span>
                </h1>
                <p className="text-muted-foreground mt-1">
                  ビジネスの状況を一目で把握
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="glass rounded-xl px-4 py-2 text-right">
                  <p className="text-sm font-medium text-foreground">
                    {userProfile?.name || user?.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {userProfile?.role}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleSignOut}
                  className="glass hover:bg-white/20 transition-all duration-200"
                >
                  ログアウト
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* メインコンテンツ */}
        <main className="relative z-10 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* メトリクスカード */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {metrics.map((metric, index) => (
              <div
                key={metric.title}
                className="group glass rounded-2xl p-6 shadow-soft hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${metric.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`} />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r ${metric.color} text-white text-xl shadow-lg`}>
                      {metric.icon}
                    </div>
                    <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      {metric.change}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                    <p className="text-3xl font-bold text-foreground">{metric.value}</p>
                    <p className="text-xs text-muted-foreground">{metric.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* クイックアクション */}
            <div className="glass rounded-2xl p-6 shadow-soft animate-fade-in" style={{ animationDelay: '400ms' }}>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-foreground mb-2">クイックアクション</h2>
                <p className="text-muted-foreground">よく使う機能にすぐアクセス</p>
              </div>
              <div className="space-y-3">
                {quickActions.map((action, index) => (
                  <Link key={action.title} href={action.href}>
                    <div className="group p-4 rounded-xl glass hover:bg-white/50 transition-all duration-200 cursor-pointer">
                      <div className="flex items-center space-x-4">
                        <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r ${action.color} text-white text-xl shadow-lg group-hover:scale-105 transition-transform duration-200`}>
                          {action.icon}
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                            {action.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {action.description}
                          </p>
                        </div>
                        <div className="ml-auto">
                          <svg className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* 最新の活動 */}
            <div className="glass rounded-2xl p-6 shadow-soft animate-fade-in" style={{ animationDelay: '500ms' }}>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-foreground mb-2">最新の活動</h2>
                <p className="text-muted-foreground">システムの最新の更新情報</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-start space-x-4 p-4 rounded-xl glass">
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mt-2 shadow-glow"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">システムが初期化されました</p>
                    <p className="text-xs text-muted-foreground mt-1">今すぐ</p>
                  </div>
                </div>
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto rounded-full glass flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-muted-foreground">データの入力を開始して、<br />活動履歴を確認しましょう</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}