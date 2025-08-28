'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState } from 'react';
import Link from 'next/link';
import { Settings, Save, RefreshCw, DollarSign, TrendingUp, Target, BarChart3, Users, Calculator } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/lib/auth-context';

interface ServiceSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  setting_type: string;
  category: string;
  description: string;
}

interface ServicePlan {
  id: string;
  plan_name: string;
  plan_type: string;
  price: number;
  currency: string;
  features: any;
  is_active: boolean;
}

interface GrowthParameter {
  id: string;
  parameter_name: string;
  parameter_value: number;
  unit: string;
  category: string;
  description: string;
}

export default function SettingsPage() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // サービス設定取得
  const { data: serviceSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['service-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_settings')
        .select('*')
        .order('category', { ascending: true });
      
      if (error) throw error;
      return data as ServiceSetting[];
    }
  });

  // サービスプラン取得
  const { data: servicePlans, isLoading: plansLoading } = useQuery({
    queryKey: ['service-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_plans')
        .select('*')
        .eq('is_active', true)
        .order('plan_type', { ascending: true });
      
      if (error) throw error;
      return data as ServicePlan[];
    }
  });

  // 成長パラメータ取得
  const { data: growthParameters, isLoading: parametersLoading } = useQuery({
    queryKey: ['growth-parameters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('growth_parameters')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true });
      
      if (error) throw error;
      return data as GrowthParameter[];
    }
  });

  // 設定更新
  const updateSettingMutation = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: string }) => {
      const { data, error } = await supabase
        .from('service_settings')
        .update({ 
          setting_value: value,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-settings'] });
      setSuccess('設定を更新しました');
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : '設定の更新に失敗しました');
      setTimeout(() => setError(null), 5000);
    }
  });

  // プラン更新
  const updatePlanMutation = useMutation({
    mutationFn: async ({ id, price }: { id: string; price: number }) => {
      const { data, error } = await supabase
        .from('service_plans')
        .update({ 
          price,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-plans'] });
      setSuccess('プラン料金を更新しました');
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : 'プラン料金の更新に失敗しました');
      setTimeout(() => setError(null), 5000);
    }
  });

  // パラメータ更新
  const updateParameterMutation = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: number }) => {
      const { data, error } = await supabase
        .from('growth_parameters')
        .update({ 
          parameter_value: value,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['growth-parameters'] });
      setSuccess('成長パラメータを更新しました');
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : '成長パラメータの更新に失敗しました');
      setTimeout(() => setError(null), 5000);
    }
  });

  const formatSettingValue = (setting: ServiceSetting) => {
    switch (setting.setting_type) {
      case 'number':
        if (setting.setting_key.includes('price') || setting.setting_key.includes('cost')) {
          return `¥${parseFloat(setting.setting_value).toLocaleString()}`;
        } else if (setting.setting_key.includes('rate')) {
          return `${(parseFloat(setting.setting_value) * 100).toFixed(1)}%`;
        }
        return setting.setting_value;
      default:
        return setting.setting_value;
    }
  };

  const getInputType = (setting: ServiceSetting) => {
    return setting.setting_type === 'number' ? 'number' : 'text';
  };

  const getInputStep = (setting: ServiceSetting) => {
    if (setting.setting_key.includes('rate')) {
      return '0.01';
    }
    return '1';
  };

  const getDisplayValue = (setting: ServiceSetting) => {
    if (setting.setting_key.includes('rate') && setting.setting_type === 'number') {
      return (parseFloat(setting.setting_value) * 100).toString();
    }
    return setting.setting_value;
  };

  const handleSettingChange = (setting: ServiceSetting, newValue: string) => {
    let processedValue = newValue;
    
    if (setting.setting_key.includes('rate') && setting.setting_type === 'number') {
      processedValue = (parseFloat(newValue) / 100).toString();
    }
    
    updateSettingMutation.mutate({ id: setting.id, value: processedValue });
  };

  return (
    <ProtectedRoute>
      <div className="relative min-h-screen overflow-hidden">
        {/* 背景グラデーション */}
        <div className="absolute inset-0 gradient-mesh opacity-10" />
        
        {/* ヘッダー */}
        <header className="relative z-10 glass border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="animate-fade-in">
                <h1 className="text-2xl font-bold">
                  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    システム設定
                  </span>
                </h1>
                <p className="text-muted-foreground mt-1">
                  サービスの基本設定と成長パラメータの管理
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/dashboard">
                  <Button variant="outline" className="glass hover:bg-white/20">
                    ダッシュボードに戻る
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* メインコンテンツ */}
        <main className="relative z-10 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* 成功・エラーメッセージ */}
          {success && (
            <Alert className="mb-6">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="pricing" className="space-y-6">
            <TabsList className="grid w-full lg:w-auto grid-cols-5 glass">
              <TabsTrigger value="pricing" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                料金設定
              </TabsTrigger>
              <TabsTrigger value="growth" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                成長指標
              </TabsTrigger>
              <TabsTrigger value="channels" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                チャネル
              </TabsTrigger>
              <TabsTrigger value="cohort" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                コホート
              </TabsTrigger>
              <TabsTrigger value="economics" className="flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                単価経済
              </TabsTrigger>
            </TabsList>

            {/* 料金設定タブ */}
            <TabsContent value="pricing" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* サービスプラン */}
                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      サービスプラン
                    </CardTitle>
                    <CardDescription>
                      月額・年額プランの料金設定
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {plansLoading ? (
                      <div className="flex justify-center py-4">
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      </div>
                    ) : (
                      servicePlans?.map((plan) => (
                        <div key={plan.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h4 className="font-semibold">{plan.plan_name}</h4>
                            <p className="text-sm text-muted-foreground">
                              現在の料金: ¥{plan.price.toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              defaultValue={plan.price}
                              className="w-32"
                              onBlur={(e) => {
                                const newPrice = parseFloat(e.target.value);
                                if (newPrice !== plan.price) {
                                  updatePlanMutation.mutate({ id: plan.id, price: newPrice });
                                }
                              }}
                            />
                            <span className="text-sm text-muted-foreground">円</span>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* 料金関連設定 */}
                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      料金関連設定
                    </CardTitle>
                    <CardDescription>
                      料金計算に関する基本設定
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {settingsLoading ? (
                      <div className="flex justify-center py-4">
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      </div>
                    ) : (
                      serviceSettings?.filter(s => s.category === 'pricing').map((setting) => (
                        <div key={setting.id} className="space-y-2">
                          <Label>{setting.description}</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type={getInputType(setting)}
                              step={getInputStep(setting)}
                              defaultValue={getDisplayValue(setting)}
                              onBlur={(e) => handleSettingChange(setting, e.target.value)}
                            />
                            <span className="text-sm text-muted-foreground min-w-16">
                              {setting.setting_key.includes('rate') ? '%' : 
                               setting.setting_key.includes('price') ? '円' : ''}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            現在の値: {formatSettingValue(setting)}
                          </p>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* 成長指標タブ */}
            <TabsContent value="growth" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 成長関連設定 */}
                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      成長パラメータ
                    </CardTitle>
                    <CardDescription>
                      ユーザー獲得と成長に関する指標
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {settingsLoading ? (
                      <div className="flex justify-center py-4">
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      </div>
                    ) : (
                      serviceSettings?.filter(s => s.category === 'growth').map((setting) => (
                        <div key={setting.id} className="space-y-2">
                          <Label>{setting.description}</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type={getInputType(setting)}
                              step={getInputStep(setting)}
                              defaultValue={getDisplayValue(setting)}
                              onBlur={(e) => handleSettingChange(setting, e.target.value)}
                            />
                            <span className="text-sm text-muted-foreground min-w-16">
                              {setting.setting_key.includes('rate') ? '%' : 
                               setting.setting_key.includes('slots') ? '枠' : ''}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            現在の値: {formatSettingValue(setting)}
                          </p>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* リテンション設定 */}
                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      リテンション設定
                    </CardTitle>
                    <CardDescription>
                      顧客維持に関する指標
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {settingsLoading ? (
                      <div className="flex justify-center py-4">
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      </div>
                    ) : (
                      serviceSettings?.filter(s => s.category === 'retention').map((setting) => (
                        <div key={setting.id} className="space-y-2">
                          <Label>{setting.description}</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type={getInputType(setting)}
                              step={getInputStep(setting)}
                              defaultValue={getDisplayValue(setting)}
                              onBlur={(e) => handleSettingChange(setting, e.target.value)}
                            />
                            <span className="text-sm text-muted-foreground min-w-16">%</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            現在の値: {formatSettingValue(setting)}
                          </p>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* その他のタブは後で実装 */}
            <TabsContent value="channels">
              <Card className="glass">
                <CardContent className="p-6 text-center">
                  <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">チャネル設定</h3>
                  <p className="text-muted-foreground">準備中です</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cohort">
              <Card className="glass">
                <CardContent className="p-6 text-center">
                  <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">コホート分析</h3>
                  <p className="text-muted-foreground">準備中です</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="economics">
              <Card className="glass">
                <CardContent className="p-6 text-center">
                  <Calculator className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">単価経済学</h3>
                  <p className="text-muted-foreground">準備中です</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </ProtectedRoute>
  );
}