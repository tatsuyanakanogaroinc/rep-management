'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuthContext } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Settings, Calculator, TrendingUp, DollarSign, Users, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useGrowthParameters } from '@/hooks/useGrowthParameters';
import { useState } from 'react';

export default function GrowthParametersPage() {
  const { userProfile } = useAuthContext();
  const { data: parameters, isLoading, updateParameters, recalculateTargets } = useGrowthParameters();
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // 管理者権限チェック
  const isAdmin = userProfile?.role === 'admin';

  const [formData, setFormData] = useState({
    initial_acquisitions: parameters?.initial_acquisitions || 30,
    monthly_growth_rate: parameters?.monthly_growth_rate || 50,
    monthly_price: parameters?.monthly_price || 2490,
    yearly_price: parameters?.yearly_price || 24900,
    churn_rate: parameters?.churn_rate || 5.0
  });

  // パラメータが読み込まれたらフォームを更新
  if (parameters && formData.initial_acquisitions !== parameters.initial_acquisitions) {
    setFormData({
      initial_acquisitions: parameters.initial_acquisitions,
      monthly_growth_rate: parameters.monthly_growth_rate,
      monthly_price: parameters.monthly_price,
      yearly_price: parameters.yearly_price,
      churn_rate: parameters.churn_rate
    });
  }

  if (!isAdmin) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h1 className="text-xl font-semibold mb-2">アクセス権限がありません</h1>
              <p className="text-muted-foreground mb-6">
                この機能は管理者のみがアクセスできます。
              </p>
              <Link href="/dashboard">
                <Button>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  ダッシュボードに戻る
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  const handleInputChange = (field: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setFormData(prev => ({
        ...prev,
        [field]: numValue
      }));
    }
  };

  const handleSave = async () => {
    try {
      await updateParameters(formData);
      setSuccessMessage('パラメータが正常に保存されました');
      setErrorMessage('');
    } catch (error) {
      setErrorMessage('保存中にエラーが発生しました');
      setSuccessMessage('');
    }
  };

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    try {
      await recalculateTargets(formData);
      setSuccessMessage('目標値が正常に再計算されました。ダッシュボードに反映されます。');
      setErrorMessage('');
    } catch (error) {
      setErrorMessage('再計算中にエラーが発生しました');
      setSuccessMessage('');
    } finally {
      setIsRecalculating(false);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">設定を読み込み中...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-10" />
        
        {/* ヘッダー */}
        <header className="relative z-10 glass border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="animate-fade-in">
                <div className="flex items-center gap-3">
                  <Settings className="w-8 h-8 text-primary" />
                  <div>
                    <h1 className="text-2xl font-bold">
                      <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        成長パラメータ設定
                      </span>
                    </h1>
                    <p className="text-muted-foreground mt-1">
                      事業成長の基本パラメータを設定
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="px-3 py-1">
                  <Settings className="w-4 h-4 mr-1" />
                  管理者権限
                </Badge>
                <Link href="/dashboard">
                  <Button variant="outline" className="glass hover:bg-white/20">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    ダッシュボードに戻る
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* メインコンテンツ */}
        <main className="relative z-10 max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* 成功・エラーメッセージ */}
          {successMessage && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {successMessage}
              </AlertDescription>
            </Alert>
          )}

          {errorMessage && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* パラメータ設定フォーム */}
          <Card className="glass mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                基本パラメータ設定
              </CardTitle>
              <CardDescription>
                これらの値を変更すると、すべての月次目標が自動で再計算されます
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 成長パラメータ */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    成長パラメータ
                  </h3>
                  
                  <div>
                    <Label htmlFor="initial_acquisitions">初月新規獲得数</Label>
                    <Input
                      id="initial_acquisitions"
                      type="number"
                      value={formData.initial_acquisitions}
                      onChange={(e) => handleInputChange('initial_acquisitions', e.target.value)}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      事業開始月の新規顧客獲得数
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="monthly_growth_rate">目標月次成長率（%）</Label>
                    <Input
                      id="monthly_growth_rate"
                      type="number"
                      step="0.1"
                      value={formData.monthly_growth_rate}
                      onChange={(e) => handleInputChange('monthly_growth_rate', e.target.value)}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      月次の新規獲得数成長率（50% = 毎月1.5倍）
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="churn_rate">想定チャーン率（%）</Label>
                    <Input
                      id="churn_rate"
                      type="number"
                      step="0.1"
                      value={formData.churn_rate}
                      onChange={(e) => handleInputChange('churn_rate', e.target.value)}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      月次の顧客離脱率
                    </p>
                  </div>
                </div>

                {/* 価格設定 */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    価格設定
                  </h3>
                  
                  <div>
                    <Label htmlFor="monthly_price">月額料金（円）</Label>
                    <Input
                      id="monthly_price"
                      type="number"
                      value={formData.monthly_price}
                      onChange={(e) => handleInputChange('monthly_price', e.target.value)}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      月額プランの料金
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="yearly_price">年額料金（円）</Label>
                    <Input
                      id="yearly_price"
                      type="number"
                      value={formData.yearly_price}
                      onChange={(e) => handleInputChange('yearly_price', e.target.value)}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      年額プラン料金（月割り: ¥{Math.round(formData.yearly_price / 12).toLocaleString()}）
                    </p>
                  </div>
                </div>
              </div>

              {/* アクションボタン */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
                <Button 
                  onClick={handleSave}
                  className="flex items-center gap-2"
                  variant="outline"
                >
                  <Settings className="w-4 h-4" />
                  設定を保存
                </Button>
                
                <Button 
                  onClick={handleRecalculate}
                  disabled={isRecalculating}
                  className="flex items-center gap-2"
                >
                  {isRecalculating ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Calculator className="w-4 h-4" />
                  )}
                  目標値を再計算
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 予測プレビュー */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                計算プレビュー
              </CardTitle>
              <CardDescription>
                現在の設定での3ヶ月後の予測値
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600 mb-1">3ヶ月後の新規獲得数</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {Math.round(formData.initial_acquisitions * Math.pow(1 + formData.monthly_growth_rate / 100, 3)).toLocaleString()}
                  </p>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600 mb-1">予想MRR</p>
                  <p className="text-2xl font-bold text-green-700">
                    ¥{Math.round((formData.initial_acquisitions * 3 * formData.monthly_price * 0.8)).toLocaleString()}
                  </p>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-600 mb-1">成長倍率</p>
                  <p className="text-2xl font-bold text-purple-700">
                    {(Math.pow(1 + formData.monthly_growth_rate / 100, 3)).toFixed(1)}x
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
}