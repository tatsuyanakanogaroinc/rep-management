'use client';

import { useState } from 'react';

export default function APITestPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [customUrl, setCustomUrl] = useState('https://nykqhkilrhoavelillqw.supabase.co');
  const [customKey, setCustomKey] = useState('');

  const testAPI = async () => {
    try {
      console.log('Testing API with:', { url: customUrl, keyPrefix: customKey.substring(0, 20) + '...' });
      
      const response = await fetch(`${customUrl}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': customKey,
          'Authorization': `Bearer ${customKey}`,
          'Content-Type': 'application/json'
        }
      });

      const result = {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        timestamp: new Date().toISOString()
      };

      if (response.ok) {
        try {
          const data = await response.text();
          result.data = data;
        } catch (e) {
          result.dataError = e.message;
        }
      } else {
        try {
          const errorData = await response.text();
          result.errorData = errorData;
        } catch (e) {
          result.errorParseError = e.message;
        }
      }

      setTestResult(result);
    } catch (error) {
      setTestResult({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Supabase API Key テスト</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">API設定</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Project URL</label>
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="w-full p-2 border rounded text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Anon Public Key</label>
              <textarea
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full p-2 border rounded text-sm h-24"
              />
            </div>
            
            <button
              onClick={testAPI}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              API接続テスト
            </button>
          </div>
        </div>

        {testResult && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">テスト結果</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
          <h3 className="font-semibold text-yellow-800 mb-2">手順</h3>
          <ol className="text-yellow-700 text-sm space-y-1">
            <li>1. Supabase Dashboard → Settings → API</li>
            <li>2. Project URL と Anon public key をコピー</li>
            <li>3. 上記フォームに入力してテスト実行</li>
            <li>4. Status 200 が返ってくれば成功</li>
            <li>5. 成功したら正しいキーを報告してください</li>
          </ol>
        </div>
      </div>
    </div>
  );
}