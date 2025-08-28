import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Target, AlertTriangle } from 'lucide-react';

interface ProgressCardProps {
  title: string;
  value: string;
  target?: number;
  actual?: number;
  progress: number;
  difference: number;
  change?: string;
  icon: string;
  color: string;
  unit?: 'currency' | 'count' | 'percentage';
  isInverted?: boolean; // チャーン率など、低い方が良い指標
}

export function ProgressCard({
  title,
  value,
  target,
  actual,
  progress,
  difference,
  change,
  icon,
  color,
  unit = 'count',
  isInverted = false
}: ProgressCardProps) {
  
  const formatValue = (val: number, unit: string) => {
    switch (unit) {
      case 'currency':
        return `¥${val.toLocaleString()}`;
      case 'percentage':
        return `${val}%`;
      default:
        return val.toString();
    }
  };

  const getProgressColor = () => {
    if (!target) return 'bg-gray-400';
    
    if (isInverted) {
      // チャーン率など：低い方が良い
      if (progress >= 90) return 'bg-green-500';
      if (progress >= 70) return 'bg-yellow-500';
      return 'bg-red-500';
    } else {
      // 通常の指標：高い方が良い
      if (progress >= 90) return 'bg-green-500';
      if (progress >= 70) return 'bg-blue-500';
      if (progress >= 50) return 'bg-yellow-500';
      return 'bg-red-500';
    }
  };

  const getDifferenceDisplay = () => {
    if (!target || difference === 0) return null;
    
    const isPositive = difference > 0;
    const displayValue = formatValue(Math.abs(difference), unit);
    
    if (isInverted) {
      // チャーン率など：差異が負の場合（実際が目標より低い）が良い
      return {
        icon: !isPositive ? TrendingDown : TrendingUp,
        color: !isPositive ? 'text-green-600' : 'text-red-600',
        text: `目標より${displayValue}${!isPositive ? '低い' : '高い'}`
      };
    } else {
      // 通常の指標：差異が正の場合（実際が目標より高い）が良い
      return {
        icon: isPositive ? TrendingUp : TrendingDown,
        color: isPositive ? 'text-green-600' : 'text-red-600',
        text: `目標より${displayValue}${isPositive ? '上' : '下'}`
      };
    }
  };

  const differenceInfo = getDifferenceDisplay();

  return (
    <Card className="group glass rounded-2xl shadow-soft hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in">
      <CardContent className="p-6">
        <div className={`absolute inset-0 bg-gradient-to-r ${color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`} />
        <div className="relative z-10">
          {/* ヘッダー */}
          <div className="flex items-center justify-between mb-4">
            <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r ${color} text-white text-xl shadow-lg`}>
              {icon}
            </div>
            <div className="flex flex-col items-end">
              {change && (
                <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full mb-1">
                  {change}
                </span>
              )}
              {target && (
                <div className="flex items-center text-xs text-muted-foreground">
                  <Target className="w-3 h-3 mr-1" />
                  {formatValue(target, unit)}
                </div>
              )}
            </div>
          </div>

          {/* メイン値 */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
          </div>

          {/* 進捗バーと目標差異 */}
          {target && (
            <div className="mt-4 space-y-3">
              {/* 進捗バー */}
              <div className="w-full">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>目標達成率</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${getProgressColor()}`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>

              {/* 差異表示 */}
              {differenceInfo && (
                <div className={`flex items-center text-sm ${differenceInfo.color}`}>
                  <differenceInfo.icon className="w-4 h-4 mr-1" />
                  <span className="font-medium">{differenceInfo.text}</span>
                </div>
              )}

              {/* アラート */}
              {progress < 50 && !isInverted && (
                <div className="flex items-center text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  <span>目標達成に注意が必要</span>
                </div>
              )}

              {progress > 150 && isInverted && (
                <div className="flex items-center text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  <span>目標を大きく上回っています</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}