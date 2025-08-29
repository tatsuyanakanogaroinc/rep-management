'use client';

// SSG無効化
export const dynamic = 'force-dynamic';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calculator, TrendingUp, DollarSign, Users, Target, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/lib/auth-context';
import { usePlanningCalculation } from '@/hooks/usePlanningCalculation';
import dynamic from 'next/dynamic';

const PlanningResults = dynamic(() => import('@/components/features/planning/planning-results').then(mod => ({ default: mod.PlanningResults })), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
});
import { useSettingsSync } from '@/hooks/useSettingsSync';

interface ServiceSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  setting_type: string;
  category: string;
  description: string;
}


export default function PlanningPage() {
  const { user } = useAuthContext();
  const { syncPlanningSettings, syncChannelSettings, isUpdating } = useSettingsSync();
  const [simulationParams, setSimulationParams] = useState({
    targetNewCustomers: 100,
    conversionRate: 15,
    monthlyPrice: 4980,
    yearlyPrice: 49800,
    yearlyRatio: 30,
    churnRate: 5
  });

  const [channelMix, setChannelMix] = useState({
    google: 30,
    facebook: 25,
    referral: 20,
    organic: 15,
    others: 10
  });

  const [channelCPA, setChannelCPA] = useState({
    google: 6000,
    facebook: 5500,
    referral: 0,
    organic: 0,
    others: 4000
  });

  // 計算結果をリアルタイムで取得
  const simulationResult = usePlanningCalculation(simulationParams, channelMix, channelCPA);

  // 自動保存（デバウンス付き）
  useEffect(() => {
    const timer = setTimeout(() => {
      if (user && isChannelMixValid) {
        syncPlanningSettings(simulationParams).catch(console.error);
        syncChannelSettings(channelMix, channelCPA).catch(console.error);
      }
    }, 1000); // 1秒後に保存

    return () => clearTimeout(timer);
  }, [simulationParams, channelMix, channelCPA, user, isChannelMixValid, syncPlanningSettings, syncChannelSettings]);

  // サービス設定取得
  const { data: serviceSettings } = useQuery({
    queryKey: ['service-settings-planning'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_settings')
        .select('*');
      
      if (error) throw error;
      return data as ServiceSetting[];
    }
  });

  // 設定値から初期パラメータを設定
  useEffect(() => {
    if (serviceSettings) {
      const settings: Record<string, string> = {};
      serviceSettings.forEach(s => {
        settings[s.setting_key] = s.setting_value;
      });

      setSimulationParams(prev => ({
        ...prev,
        monthlyPrice: parseFloat(settings.monthly_plan_price || '4980'),
        yearlyPrice: parseFloat(settings.yearly_plan_price || '49800'),
        conversionRate: parseFloat(settings.trial_conversion_rate || '0.15') * 100,
        churnRate: parseFloat(settings.monthly_churn_rate || '0.05') * 100
      }));
    }
  }, [serviceSettings]);


  const getChannelName = (key: string) => {
    const names: Record<string, string> = {
      google: 'Google広告',
      facebook: 'Facebook広告',
      referral: '紹介',
      organic: 'オーガニック',
      others: 'その他'
    };
    return names[key] || key;
  };

  // チャネル割合の合計をチェック
  const totalChannelPercentage = Object.values(channelMix).reduce((sum, val) => sum + val, 0);
  const isChannelMixValid = totalChannelPercentage === 100;

  return (
    <ProtectedRoute>
      <div className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-10" />
        
        <header className="relative z-10 glass border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="animate-fade-in">
                <h1 className="text-2xl font-bold">
                  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    計画シミュレーション
                  </span>
                </h1>
                <p className="text-muted-foreground mt-1">
                  設定値を変更して事業計画をシミュレーション
                </p>
              </div>
              <Link href="/dashboard">
                <Button variant="outline" className="glass hover:bg-white/20">
                  ダッシュボードに戻る
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <main className="relative z-10 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 左側：パラメータ設定 */}
            <div className="space-y-6">
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    基本パラメータ
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>月間新規獲得目標（人）</Label>
                    <Input
                      type="number"
                      value={simulationParams.targetNewCustomers}
                      onChange={(e) => setSimulationParams(prev => ({
                        ...prev,
                        targetNewCustomers: parseInt(e.target.value) || 0
                      }))}
                    />
                  </div>
                  <div>
                    <Label>トライアル転換率（%）</Label>
                    <Input
                      type="number"
                      value={simulationParams.conversionRate}
                      onChange={(e) => setSimulationParams(prev => ({
                        ...prev,
                        conversionRate: parseFloat(e.target.value) || 0
                      }))}
                    />
                  </div>
                  <div>
                    <Label>年額プラン比率（%）</Label>
                    <Input
                      type="number"
                      value={simulationParams.yearlyRatio}
                      onChange={(e) => setSimulationParams(prev => ({
                        ...prev,
                        yearlyRatio: parseFloat(e.target.value) || 0
                      }))}
                    />
                  </div>
                  <div>
                    <Label>月次チャーン率（%）</Label>
                    <Input
                      type="number"
                      value={simulationParams.churnRate}
                      onChange={(e) => setSimulationParams(prev => ({
                        ...prev,
                        churnRate: parseFloat(e.target.value) || 0
                      }))}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    流入経路別設定
                  </CardTitle>
                  <CardDescription>
                    各チャネルの割合とCPAを設定
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!isChannelMixValid && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        チャネル割合の合計が100%になるよう調整してください（現在: {totalChannelPercentage}%）
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {Object.entries(channelMix).map(([key, value]) => (
                    <div key={key} className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>{getChannelName(key)} 割合（%）</Label>
                        <Input
                          type="number"
                          value={value}
                          onChange={(e) => setChannelMix(prev => ({
                            ...prev,
                            [key]: parseFloat(e.target.value) || 0
                          }))}
                        />
                      </div>
                      <div>
                        <Label>CPA（円）</Label>
                        <Input
                          type="number"
                          value={channelCPA[key as keyof typeof channelCPA]}
                          onChange={(e) => setChannelCPA(prev => ({
                            ...prev,
                            [key]: parseFloat(e.target.value) || 0
                          }))}
                          disabled={key === 'referral' || key === 'organic'}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="bg-white/50 p-4 rounded-lg">
                <div className="text-sm text-muted-foreground mb-2">
                  リアルタイム計算 {isUpdating ? '💾' : '✓'}
                </div>
                <div className="text-lg font-semibold">
                  {isUpdating ? '保存中...' : '自動保存済み'} {isChannelMixValid ? '✓' : '⚠️'}
                </div>
                {!isChannelMixValid && (
                  <div className="text-xs text-red-600 mt-1">
                    チャネル割合を100%に調整してください
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-2">
                  設定は自動的に保存され、全システムに反映されます
                </div>
              </div>
            </div>

            {/* 右側：シミュレーション結果 */}
            <div className="space-y-6">
              {isChannelMixValid ? (
                <PlanningResults result={simulationResult} />
              ) : (
                <Card className="glass">
                  <CardContent className="p-12 text-center">
                    <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">設定を完了してください</h3>
                    <p className="text-muted-foreground">
                      チャネル割合の合計を100%にすると、リアルタイムで結果が表示されます
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}