'use client';

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

interface ServiceSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  setting_type: string;
  category: string;
  description: string;
}

interface SimulationResult {
  monthlyNewCustomers: number;
  yearlyRevenue: number;
  monthlyRevenue: number;
  totalCustomers: number;
  channelBreakdown: ChannelData[];
  totalMarketingBudget: number;
}

interface ChannelData {
  name: string;
  percentage: number;
  customers: number;
  cpa: number;
  budget: number;
}

export default function PlanningPage() {
  const { user } = useAuthContext();
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

  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);

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

  // シミュレーション実行
  const runSimulation = () => {
    const channelData: ChannelData[] = Object.entries(channelMix).map(([channel, percentage]) => {
      const customers = Math.round(simulationParams.targetNewCustomers * percentage / 100);
      const cpa = channelCPA[channel as keyof typeof channelCPA];
      const budget = customers * cpa;
      
      return {
        name: getChannelName(channel),
        percentage,
        customers,
        cpa,
        budget
      };
    });

    const totalMarketingBudget = channelData.reduce((sum, ch) => sum + ch.budget, 0);
    
    // 月次・年次収益計算
    const monthlyCustomers = simulationParams.targetNewCustomers;
    const yearlyCustomers = Math.round(monthlyCustomers * simulationParams.yearlyRatio / 100);
    const monthlyOnlyCustomers = monthlyCustomers - yearlyCustomers;
    
    const monthlyRevenue = (monthlyOnlyCustomers * simulationParams.monthlyPrice) + 
                          (yearlyCustomers * simulationParams.yearlyPrice / 12);
    
    const yearlyRevenue = monthlyRevenue * 12;
    
    // 累計顧客数（チャーンを考慮）
    const monthlyChurnRate = simulationParams.churnRate / 100;
    const totalCustomers = Math.round(monthlyCustomers / monthlyChurnRate);

    setSimulationResult({
      monthlyNewCustomers: monthlyCustomers,
      yearlyRevenue,
      monthlyRevenue,
      totalCustomers,
      channelBreakdown: channelData,
      totalMarketingBudget
    });
  };

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

              <Button
                onClick={runSimulation}
                disabled={!isChannelMixValid}
                className="w-full bg-gradient-to-r from-primary to-accent"
              >
                <Calculator className="w-4 h-4 mr-2" />
                シミュレーション実行
              </Button>
            </div>

            {/* 右側：シミュレーション結果 */}
            <div className="space-y-6">
              {simulationResult && (
                <>
                  <Card className="glass">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        シミュレーション結果
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">月間新規顧客</div>
                          <div className="text-2xl font-bold">{simulationResult.monthlyNewCustomers}人</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">累計顧客数</div>
                          <div className="text-2xl font-bold">{simulationResult.totalCustomers}人</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">月次収益</div>
                          <div className="text-2xl font-bold">¥{Math.round(simulationResult.monthlyRevenue).toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">年間収益</div>
                          <div className="text-2xl font-bold">¥{Math.round(simulationResult.yearlyRevenue).toLocaleString()}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        流入経路別予算配分
                      </CardTitle>
                      <CardDescription>
                        月間マーケティング予算: ¥{simulationResult.totalMarketingBudget.toLocaleString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {simulationResult.channelBreakdown.map((channel) => (
                          <div key={channel.name} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>{channel.name}</span>
                              <span className="font-semibold">¥{channel.budget.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{channel.customers}人 ({channel.percentage}%)</span>
                              <span>CPA: ¥{channel.cpa.toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
                                style={{ width: `${channel.percentage}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}