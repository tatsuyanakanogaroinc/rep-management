'use client';

import { useEffect, useState } from 'react';

export function EnvCheck() {
  const [envStatus, setEnvStatus] = useState<{
    url?: string;
    key?: string;
    error?: string;
  }>({});

  useEffect(() => {
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      setEnvStatus({
        url: url || 'NOT_SET',
        key: key ? 'SET' : 'NOT_SET'
      });
    } catch (error) {
      setEnvStatus({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, []);

  if (envStatus.error) {
    return (
      <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
        <strong className="font-bold">環境変数エラー: </strong>
        <span className="block sm:inline">{envStatus.error}</span>
      </div>
    );
  }

  if (envStatus.url === 'NOT_SET' || envStatus.key === 'NOT_SET') {
    return (
      <div className="fixed top-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded z-50 max-w-sm">
        <strong className="font-bold">設定確認:</strong>
        <div className="text-sm mt-1">
          <div>URL: {envStatus.url === 'NOT_SET' ? '❌未設定' : '✅設定済み'}</div>
          <div>KEY: {envStatus.key === 'NOT_SET' ? '❌未設定' : '✅設定済み'}</div>
        </div>
      </div>
    );
  }

  return null;
}