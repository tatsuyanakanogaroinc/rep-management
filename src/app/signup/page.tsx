import { SignUpForm } from '@/components/auth/signup-form';
import Link from 'next/link';

export default function SignUpPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* 背景グラデーション */}
      <div className="absolute inset-0 gradient-mesh opacity-20" />
      
      {/* ナビゲーション */}
      <nav className="relative z-10 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg gradient-primary shadow-glow" />
              <span className="text-xl font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                SMS
              </span>
            </Link>
            <Link href="/login">
              <button className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                ログイン
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* メインコンテンツ */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-4rem)] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full animate-fade-in">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                始めましょう
              </span>
            </h1>
            <p className="text-muted-foreground">
              アカウントを作成してSNS経営管理システムを始めましょう
            </p>
          </div>
          
          <SignUpForm />
          
          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground">
              既にアカウントをお持ちの方は{' '}
              <Link 
                href="/login" 
                className="font-medium bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent hover:opacity-80 transition-opacity"
              >
                こちらからログイン
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}