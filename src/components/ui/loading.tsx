'use client';

import { cn } from '@/lib/utils';
import { Loader2, Brain, BarChart3 } from 'lucide-react';

interface LoadingProps {
  variant?: 'default' | 'card' | 'page' | 'ai' | 'chart';
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

export function Loading({ 
  variant = 'default', 
  size = 'md', 
  message,
  className 
}: LoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  };

  const getIcon = () => {
    switch (variant) {
      case 'ai':
        return <Brain className={cn(sizeClasses[size], 'animate-pulse')} />;
      case 'chart':
        return <BarChart3 className={cn(sizeClasses[size], 'animate-pulse')} />;
      default:
        return <Loader2 className={cn(sizeClasses[size], 'animate-spin')} />;
    }
  };

  if (variant === 'page') {
    return (
      <div className={cn('min-h-screen flex items-center justify-center', className)}>
        <div className="text-center space-y-4">
          <div className="mx-auto">
            {getIcon()}
          </div>
          <div>
            <h3 className="text-lg font-medium">読み込み中...</h3>
            {message && (
              <p className="text-muted-foreground mt-1">{message}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <div className="text-center space-y-3">
          <div className="mx-auto">
            {getIcon()}
          </div>
          {message && (
            <p className="text-sm text-muted-foreground">{message}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {getIcon()}
      {message && (
        <span className="text-sm text-muted-foreground">{message}</span>
      )}
    </div>
  );
}

// 特定用途のローディングコンポーネント
export function AILoading({ message = 'AI分析中...' }: { message?: string }) {
  return <Loading variant="ai" message={message} />;
}

export function ChartLoading({ message = 'チャートを読み込み中...' }: { message?: string }) {
  return <Loading variant="chart" message={message} />;
}

export function PageLoading({ message }: { message?: string }) {
  return <Loading variant="page" message={message} />;
}

export function CardLoading({ message }: { message?: string }) {
  return <Loading variant="card" message={message} />;
}