import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* 背景グラデーション */}
      <div className="absolute inset-0 gradient-mesh opacity-20" />
      
      {/* メインコンテンツ */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
        <div className="text-center animate-fade-in">
          <div className="mb-8">
            <h1 className="text-8xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
              404
            </h1>
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              ページが見つかりません
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              お探しのページは存在しないか、移動された可能性があります。
            </p>
          </div>
          
          <Link href="/">
            <Button className="gradient-primary text-white border-0 shadow-soft hover:shadow-glow transition-all duration-300 px-8 py-3">
              ホームに戻る
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}