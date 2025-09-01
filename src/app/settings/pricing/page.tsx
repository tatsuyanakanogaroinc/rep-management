'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuthContext } from '@/lib/auth-context';
import { AppLayout } from '@/components/layout/app-layout';
import { PageLoading } from '@/components/ui/loading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, DollarSign, Calculator, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { usePricingSettings, validatePricingSettings } from '@/hooks/usePricingSettings';
import { useState, useEffect } from 'react';
import { useAutoSave } from '@/hooks/useAutoSave';
import { AutoSaveIndicator } from '@/components/ui/auto-save-indicator';

export default function PricingSettingsPage() {
  const { userProfile } = useAuthContext();
  const { data: pricingSettings, isLoading, updatePricing, isUpdating } = usePricingSettings();
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // 管理者権限チェック
  const isAdmin = userProfile?.role === 'admin';

  const [formData, setFormData] = useState({
    monthly_price: 4980,
    yearly_price: 49800,
    pricing_model: 'flat' as 'flat' | 'per_user' | 'tiered'
  });

  // 料金設定が読み込まれたらフォームを更新
  useEffect(() => {
    if (pricingSettings) {
      setFormData({
        monthly_price: pricingSettings.monthly_price,
        yearly_price: pricingSettings.yearly_price,
        pricing_model: pricingSettings.pricing_model
      });
    }
  }, [pricingSettings]);

  // メッセージを3秒後に消す
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // 自動保存機能
  const autoSave = useAutoSave(formData, {
    delay: 3000, // 3秒後に自動保存
    onSave: async (data) => {
      if (!pricingSettings) return; // 初期データがない場合はスキップ
      
      // バリデーション
      const validationErrors = validatePricingSettings(data);
      if (validationErrors.length > 0) {
        throw new Error('入力エラー: ' + validationErrors.join(', '));
      }
      
      await updatePricing(data);
    },
    enabled: !!pricingSettings // 設定が読み込まれた後のみ有効
  });

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
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      // バリデーション
      const validationErrors = validatePricingSettings(formData);
      if (validationErrors.length > 0) {
        setErrorMessage('入力エラー: ' + validationErrors.join(', '));
        return;
      }
      
      await updatePricing(formData);
      setSuccessMessage('料金設定が正常に保存されました。新規顧客から適用されます。');
      setErrorMessage('');
    } catch (error) {
      console.error('Save error:', error);
      const errorMessage = error instanceof Error ? error.message : '不明なエラー';
      setErrorMessage(`保存中にエラーが発生しました: ${errorMessage}`);
      setSuccessMessage('');
    }
  };

  // 割引率計算
  const discountRate = formData.monthly_price > 0 ? 
    ((formData.monthly_price * 12 - formData.yearly_price) / (formData.monthly_price * 12)) * 100 : 0;

  if (isLoading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <PageLoading message="料金設定を読み込み中..." />
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="relative min-h-screen overflow-hidden">
          <div className="absolute inset-0 gradient-mesh opacity-10" />
        
        {/* ヘッダー */}
        <header className="relative z-10 glass border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="animate-fade-in">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-8 h-8 text-primary" />
                  <div>
                    <h1 className="text-2xl font-bold">
                      <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        料金設定管理
                      </span>
                    </h1>
                    <p className="text-muted-foreground mt-1">
                      サービス料金とプランの設定
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <AutoSaveIndicator
                  isSaving={autoSave.isSaving}
                  lastSaved={autoSave.lastSaved}
                  error={autoSave.error}
                  hasUnsavedChanges={autoSave.hasUnsavedChanges}
                />
                <Badge variant="outline" className="px-3 py-1">
                  <DollarSign className="w-4 h-4 mr-1" />
                  管理者権限
                </Badge>
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

          {/* 料金設定フォーム */}
          <Card className="glass mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                基本料金設定
              </CardTitle>
              <CardDescription>
                サービスの月額・年額料金を設定します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 料金設定 */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    料金プラン
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

                  <div>
                    <Label htmlFor="pricing_model">料金モデル</Label>
                    <Select
                      value={formData.pricing_model}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, pricing_model: value as any }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="flat">定額制</SelectItem>
                        <SelectItem value="per_user">ユーザー数ベース</SelectItem>
                        <SelectItem value="tiered">階層制</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      現在は定額制のみサポート
                    </p>
                  </div>
                </div>

                {/* プレビュー */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    料金プレビュー
                  </h3>
                  
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium mb-2">月額プラン</h4>
                    <p className="text-2xl font-bold text-blue-700">
                      ¥{formData.monthly_price.toLocaleString()}/月
                    </p>
                    <p className="text-sm text-muted-foreground">
                      年間費用: ¥{(formData.monthly_price * 12).toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium mb-2">年額プラン</h4>
                    <p className="text-2xl font-bold text-green-700">
                      ¥{formData.yearly_price.toLocaleString()}/年
                    </p>
                    <p className="text-sm text-muted-foreground">
                      月割り: ¥{Math.round(formData.yearly_price / 12).toLocaleString()}/月
                    </p>
                    <Badge className={`mt-2 ${discountRate >= 10 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {discountRate.toFixed(1)}% 割引
                    </Badge>
                  </div>
                </div>
              </div>

              {/* アクションボタン */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
                <Button 
                  onClick={handleSave}
                  disabled={isUpdating}
                  className="flex items-center gap-2"
                >
                  {isUpdating ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <DollarSign className="w-4 h-4" />
                  )}
                  料金設定を保存
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 影響範囲の説明 */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                変更の影響範囲
              </CardTitle>
              <CardDescription>
                料金変更による各機能への影響
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">新規顧客</h4>
                    <p className="text-sm text-muted-foreground">
                      変更後の料金が即座に適用されます
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">既存顧客</h4>
                    <p className="text-sm text-muted-foreground">
                      既存顧客の料金は変更されません（別途契約変更が必要）
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">予測・分析機能</h4>
                    <p className="text-sm text-muted-foreground">
                      MRR計算、成長パラメータ、予測モデルが新料金で再計算されます
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}