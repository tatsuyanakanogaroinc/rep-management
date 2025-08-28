'use client';

import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* 背景グラデーション */}
      <div className="absolute inset-0 gradient-mesh opacity-20" />
      
      {/* メインコンテンツ */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
        <div className="text-center animate-fade-in">
          <div className="mb-8">
            <div className="mx-auto w-16 h-16 rounded-full gradient-primary flex items-center justify-center mb-6 shadow-glow">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              エラーが発生しました
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              {error.message || 'アプリケーションエラーが発生しました。もう一度お試しください。'}
            </p>
          </div>
          
          <Button 
            onClick={() => reset()}
            className="gradient-primary text-white border-0 shadow-soft hover:shadow-glow transition-all duration-300 px-8 py-3"
          >
            再試行
          </Button>
        </div>
      </div>
    </div>
  );
}