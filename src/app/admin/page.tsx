'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const checkUsers = async () => {
    setLoading(true);
    try {
      // Check auth users
      const { data: authUsers, error: authError } = await supabase
        .from('auth.users')
        .select('*');

      console.log('Auth users:', authUsers, authError);

      // Check profile users  
      const { data: profileUsers, error: profileError } = await supabase
        .from('users')
        .select('*');

      console.log('Profile users:', profileUsers, profileError);

      if (profileUsers) {
        setUsers(profileUsers);
      }
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  const createTatsuyaProfile = async () => {
    try {
      // Check if tatsuya account exists in auth
      const { data: authData, error: authError } = await supabase
        .rpc('get_auth_users'); // This won't work from client, just for demo

      console.log('Auth check:', authData, authError);

      // Try to insert profile (will need the actual UUID from Supabase dashboard)
      const { data, error } = await supabase
        .from('users')
        .upsert({
          email: 'tatsuya.nakano@garoinc.jp',
          name: '中野達也',
          role: 'admin'
        })
        .select();

      console.log('Profile create result:', data, error);
      
      if (error) {
        alert('エラー: ' + error.message);
      } else {
        alert('プロファイル作成成功');
        checkUsers();
      }
    } catch (error) {
      console.error('Error creating profile:', error);
      alert('エラーが発生しました');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">管理者ページ（デバッグ用）</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">アカウント管理</h2>
          
          <div className="space-y-4">
            <button
              onClick={checkUsers}
              className="bg-blue-500 text-white px-4 py-2 rounded mr-4"
              disabled={loading}
            >
              {loading ? '確認中...' : 'ユーザー一覧確認'}
            </button>

            <button
              onClick={createTatsuyaProfile}
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              Tatsuyaプロファイル作成
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">作成手順:</h2>
          <div className="text-sm space-y-2">
            <p><strong>1. Supabaseダッシュボードでユーザー作成</strong></p>
            <p className="ml-4">Email: tatsuya.nakano@garoinc.jp</p>
            <p className="ml-4">Password: Garo0122</p>
            
            <p className="mt-4"><strong>2. 作成されたUUIDを確認</strong></p>
            <p className="ml-4">Authentication > Users でUUIDをコピー</p>
            
            <p className="mt-4"><strong>3. SQL Editorで以下を実行</strong></p>
            <pre className="ml-4 bg-gray-100 p-2 rounded text-xs">
{`INSERT INTO users (id, email, name, role, created_at) VALUES
('UUID_HERE', 'tatsuya.nakano@garoinc.jp', '中野達也', 'admin', now());`}
            </pre>
          </div>

          {users.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">登録済みユーザー:</h3>
              <div className="space-y-2">
                {users.map((user, index) => (
                  <div key={index} className="bg-gray-50 p-2 rounded text-sm">
                    <div>Email: {user.email}</div>
                    <div>Name: {user.name}</div>
                    <div>Role: {user.role}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}