'use client';

import { useEffect, useState } from 'react';
import { testSupabaseConnection, getSupabaseConfig } from '@/lib/supabase-health';

export default function DebugPage() {
  const [envVars, setEnvVars] = useState<any>({});
  const [supabaseTest, setSupabaseTest] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkEnvVars = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '***' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.slice(-10) : undefined,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      CI: process.env.CI,
      VERCEL_URL: process.env.VERCEL_URL,
    };
    setEnvVars(checkEnvVars);
  }, []);

  const testSupabase = async () => {
    setLoading(true);
    try {
      const config = getSupabaseConfig();
      const testResult = await testSupabaseConnection();
      setSupabaseTest({ config, testResult });
    } catch (error) {
      setSupabaseTest({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Environment Variables Debug</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Environment Variables:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(envVars, null, 2)}
          </pre>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-lg font-semibold mb-4">Window Location:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {typeof window !== 'undefined' ? JSON.stringify({
              href: window.location.href,
              hostname: window.location.hostname,
              protocol: window.location.protocol,
            }, null, 2) : 'Server side rendering'}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-lg font-semibold mb-4">Supabase Connection Test:</h2>
          <button 
            className="bg-green-500 text-white px-4 py-2 rounded mb-4 mr-4 disabled:opacity-50"
            onClick={testSupabase}
            disabled={loading}
          >
            {loading ? 'Testing...' : 'Test Supabase Connection'}
          </button>
          {supabaseTest && (
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(supabaseTest, null, 2)}
            </pre>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-lg font-semibold mb-4">Network Test:</h2>
          <button 
            className="bg-blue-500 text-white px-4 py-2 rounded"
            onClick={async () => {
              try {
                const response = await fetch('https://httpbin.org/get');
                const data = await response.json();
                console.log('Network test success:', data);
                alert('Network test successful');
              } catch (error) {
                console.error('Network test failed:', error);
                alert('Network test failed: ' + error);
              }
            }}
          >
            Test Network Connection
          </button>
        </div>
      </div>
    </div>
  );
}