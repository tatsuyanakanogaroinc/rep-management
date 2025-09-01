'use client';

import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Loader2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface AutoSaveIndicatorProps {
  isSaving: boolean;
  lastSaved: Date | null;
  error: string | null;
  hasUnsavedChanges: boolean;
  className?: string;
}

export function AutoSaveIndicator({
  isSaving,
  lastSaved,
  error,
  hasUnsavedChanges,
  className = ''
}: AutoSaveIndicatorProps) {
  if (error) {
    return (
      <Badge variant="destructive" className={`flex items-center gap-1 ${className}`}>
        <AlertCircle className="w-3 h-3" />
        保存エラー
      </Badge>
    );
  }

  if (isSaving) {
    return (
      <Badge variant="secondary" className={`flex items-center gap-1 ${className}`}>
        <Loader2 className="w-3 h-3 animate-spin" />
        自動保存中...
      </Badge>
    );
  }

  if (hasUnsavedChanges) {
    return (
      <Badge variant="outline" className={`flex items-center gap-1 ${className}`}>
        <Clock className="w-3 h-3" />
        未保存の変更
      </Badge>
    );
  }

  if (lastSaved) {
    return (
      <Badge variant="outline" className={`flex items-center gap-1 bg-green-50 text-green-700 border-green-200 ${className}`}>
        <CheckCircle className="w-3 h-3" />
        {format(lastSaved, 'HH:mm', { locale: ja })}に保存済み
      </Badge>
    );
  }

  return null;
}