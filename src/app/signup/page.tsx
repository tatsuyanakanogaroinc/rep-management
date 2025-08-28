'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignUpPage() {
  const router = useRouter();

  useEffect(() => {
    // 新規登録ページにアクセスしたら自動的にログインページにリダイレクト
    router.replace('/login');
  }, [router]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* 背景グラデーション */}
      <div className="absolute inset-0 gradient-mesh opacity-20" />
      
      {/* メインコンテンツ */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
        <div className="text-center animate-fade-in">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-4">
              社内専用システム
            </h1>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              一般会員登録は無効になっています。<br />
              ログインページに移動しています...
            </p>
          </div>
          
          <Link href="/login">
            <button className="gradient-primary text-white border-0 shadow-soft hover:shadow-glow transition-all duration-300 px-8 py-3 rounded-xl">
              ログインページへ
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}