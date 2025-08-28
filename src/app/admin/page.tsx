export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">管理者ページ</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">アカウント作成手順</h2>
          <div className="text-sm space-y-4">
            <div>
              <p><strong>1. Supabaseダッシュボードでユーザー作成</strong></p>
              <div className="ml-4 mt-2">
                <p>Email: tatsuya.nakano@garoinc.jp</p>
                <p>Password: Garo0122</p>
              </div>
            </div>
            
            <div>
              <p><strong>2. UUIDを確認してSQL実行</strong></p>
              <div className="ml-4 mt-2 bg-gray-100 p-3 rounded">
                <code className="text-xs">
                  INSERT INTO users (id, email, name, role, created_at) VALUES<br />
                  (&apos;UUID_HERE&apos;, &apos;tatsuya.nakano@garoinc.jp&apos;, &apos;中野達也&apos;, &apos;admin&apos;, now());
                </code>
              </div>
            </div>

            <div>
              <p><strong>3. ログインテスト</strong></p>
              <p className="ml-4 mt-2">
                <a href="/login" className="text-blue-600 hover:underline">
                  ログインページでテスト
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <h3 className="font-semibold text-blue-800 mb-2">詳細手順書</h3>
          <p className="text-blue-700 text-sm">
            ACCOUNT_SETUP.mdファイルに詳細な手順が記載されています。
          </p>
        </div>
      </div>
    </div>
  );
}