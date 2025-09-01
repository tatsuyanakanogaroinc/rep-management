import { useEffect, useRef, useState } from 'react';
import { useDebounce } from './useDebounce';

interface AutoSaveOptions {
  delay?: number;
  onSave: (data: any) => Promise<void>;
  enabled?: boolean;
}

export function useAutoSave<T>(data: T, options: AutoSaveOptions) {
  const { delay = 2000, onSave, enabled = true } = options;
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const initialDataRef = useRef<T>(data);
  const lastSavedDataRef = useRef<T>(data);

  // データの変更をデバウンス
  const debouncedData = useDebounce(data, delay);

  useEffect(() => {
    // 初期データの設定
    if (initialDataRef.current === data) {
      initialDataRef.current = data;
      lastSavedDataRef.current = data;
      return;
    }

    // 自動保存が無効、または保存中の場合はスキップ
    if (!enabled || isSaving) return;

    // データが変更されていない場合はスキップ
    if (JSON.stringify(lastSavedDataRef.current) === JSON.stringify(debouncedData)) {
      return;
    }

    const autoSave = async () => {
      setIsSaving(true);
      setError(null);

      try {
        await onSave(debouncedData);
        lastSavedDataRef.current = debouncedData;
        setLastSaved(new Date());
      } catch (err) {
        console.error('Auto-save error:', err);
        setError(err instanceof Error ? err.message : '自動保存に失敗しました');
      } finally {
        setIsSaving(false);
      }
    };

    autoSave();
  }, [debouncedData, enabled, isSaving, onSave]);

  return {
    isSaving,
    lastSaved,
    error,
    hasUnsavedChanges: JSON.stringify(lastSavedDataRef.current) !== JSON.stringify(data)
  };
}