'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function PlanVsActualDebugPage() {
  console.log('=== PlanVsActualDebugPage rendering ===');
  
  const testData = [
    { id: 1, name: 'テストチャネル1', value: 100 },
    { id: 2, name: 'テストチャネル2', value: 200 },
    { id: 3, name: 'テストチャネル3', value: 300 },
  ];
  
  console.log('Test data:', testData);

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6 p-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">予実管理（デバッグ版）</h1>
            <p className="text-muted-foreground">React Error #185 デバッグ中</p>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              この画面はReact Error #185のデバッグ用です。エラーが発生しないかテストしています。
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>基本的なmap関数テスト</CardTitle>
              <CardDescription>配列のmap処理でエラーが発生するかテスト</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {testData.map((item) => {
                  console.log('Rendering item:', item);
                  return (
                    <div key={item.id} className="p-2 border rounded">
                      <strong>{item.name}</strong>: {item.value}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>フィルタ付きmap関数テスト</CardTitle>
              <CardDescription>filter + map の組み合わせでエラーが発生するかテスト</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {testData
                  .filter(item => item && item.name)
                  .map((item, index) => {
                    console.log('Rendering filtered item:', item, 'index:', index);
                    return (
                      <div key={`filtered-${item.id}-${index}`} className="p-2 border rounded bg-blue-50">
                        <strong>{item.name}</strong>: {item.value} (フィルタ済み)
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>null/undefined混在配列テスト</CardTitle>
              <CardDescription>null/undefinedが混在する配列のmap処理テスト</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { id: 1, name: '有効なアイテム1', value: 10 },
                  null,
                  { id: 2, name: '有効なアイテム2', value: 20 },
                  undefined,
                  { id: 3, name: null, value: 30 },
                  { id: 4, name: '有効なアイテム4', value: 40 },
                ]
                  .filter(item => item && item.name)
                  .map((item, index) => {
                    if (!item || !item.name) {
                      console.warn('Invalid item passed filter:', item);
                      return null;
                    }
                    
                    console.log('Rendering null-test item:', item, 'index:', index);
                    return (
                      <div key={`null-test-${item.id}-${index}`} className="p-2 border rounded bg-green-50">
                        <strong>{item.name}</strong>: {item.value} (null テスト済み)
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}