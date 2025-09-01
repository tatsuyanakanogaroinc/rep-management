'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { useAuthContext } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useState, useEffect } from 'react';
import { format, addMonths } from 'date-fns';
import { ja } from 'date-fns/locale';
import { 
  Calculator, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Target, 
  BarChart3,
  Settings,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Zap,
  Plus,
  Trash2,
  Radio,
  FileText
} from 'lucide-react';
import { useGrowthParameters } from '@/hooks/useGrowthParameters';
import { usePricingSettings } from '@/hooks/usePricingSettings';
import { useMonthlyPlanning } from '@/hooks/useMonthlyPlanning';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';

export default function MonthlyPlanningPage() {
  const { userProfile } = useAuthContext();
  const { data: growthParams, updateParameters: updateGrowthParams } = useGrowthParameters();
  const { data: pricingSettings, updatePricing } = usePricingSettings();
  const { parameters, monthlyPlans, updateParameters, updateChannels } = useMonthlyPlanning();
  
  const [isCalculating, setIsCalculating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // パラメータ更新ハンドラー
  const handleParameterChange = (field: string, value: number) => {
    updateParameters({ [field]: value });
  };
  
  // 流入経路の更新
  const handleChannelChange = (index: number, field: string, value: number | boolean | string) => {
    const newChannels = [...parameters.channels];
    newChannels[index] = { ...newChannels[index], [field]: value };
    updateChannels(newChannels);
  };
  
  // 流入経路の追加
  const addChannel = () => {
    const newChannels = [...parameters.channels, { name: '新しいチャネル', cpa: 5000, ratio: 0, isActive: true }];
    updateChannels(newChannels);
  };
  
  // 流入経路の削除
  const removeChannel = (index: number) => {
    const newChannels = parameters.channels.filter((_, i) => i !== index);
    updateChannels(newChannels);
  };

  // 設定を保存
  const handleSaveSettings = async () => {
    setIsCalculating(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      // 成長パラメータ更新
      if (growthParams) {
        await updateGrowthParams({
          initial_acquisitions: parameters.initialAcquisitions,
          monthly_growth_rate: parameters.monthlyGrowthRate,
          churn_rate: parameters.churnRate,
          monthly_price: parameters.monthlyPrice,
          yearly_price: parameters.yearlyPrice
        });
      }
      
      // 料金設定更新
      if (pricingSettings) {
        await updatePricing({
          monthly_price: parameters.monthlyPrice,
          yearly_price: parameters.yearlyPrice,
          pricing_model: 'flat'
        });
      }
      
      setSuccessMessage('設定が保存され、月次計画が更新されました！');
    } catch (error) {
      console.error('Save error:', error);
      setErrorMessage('設定の保存中にエラーが発生しました');
    } finally {
      setIsCalculating(false);
    }
  };

  // メッセージを3秒後に消す
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
        setErrorMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

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
                  <Calculator className="w-8 h-8 text-primary" />
                  <div>
                    <h1 className="text-2xl font-bold">
                      <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        月次計画シミュレーター
                      </span>
                    </h1>
                    <p className="text-muted-foreground mt-1">
                      事業成長パラメータと将来予測を統合管理
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="px-3 py-1">
                  <Zap className="w-4 h-4 mr-1" />
                  リアルタイム計算
                </Badge>
              </div>
            </div>
          </div>
        </header>

        {/* メッセージ */}
        {successMessage && (
          <Alert className="m-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        {errorMessage && (
          <Alert variant="destructive" className="m-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* メインコンテンツ */}
        <main className="relative z-10 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="simulation" className="space-y-8">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="simulation">計画シミュレーション</TabsTrigger>
              <TabsTrigger value="channels">流入経路設定</TabsTrigger>
              <TabsTrigger value="pl">簡易PL</TabsTrigger>
              <TabsTrigger value="parameters">パラメータ設定</TabsTrigger>
              <TabsTrigger value="forecast">将来予測</TabsTrigger>
            </TabsList>

            {/* 計画シミュレーション */}
            <TabsContent value="simulation" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* パラメータ調整パネル */}
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      クイック調整
                    </CardTitle>
                    <CardDescription>
                      パラメータを調整して即座に計画をシミュレーション
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>初月新規獲得数</Label>
                      <Input
                        type="number"
                        value={parameters.initialAcquisitions}
                        onChange={(e) => handleParameterChange('initialAcquisitions', parseInt(e.target.value) || 0)}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label>月次成長率（%）</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={parameters.monthlyGrowthRate}
                        onChange={(e) => handleParameterChange('monthlyGrowthRate', parseFloat(e.target.value) || 0)}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label>チャーン率（%）</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={parameters.churnRate}
                        onChange={(e) => handleParameterChange('churnRate', parseFloat(e.target.value) || 0)}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label>月額料金（円）</Label>
                      <Input
                        type="number"
                        value={parameters.monthlyPrice}
                        onChange={(e) => handleParameterChange('monthlyPrice', parseInt(e.target.value) || 0)}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label>基本支出（円/月）</Label>
                      <Input
                        type="number"
                        value={parameters.baseExpenses}
                        onChange={(e) => handleParameterChange('baseExpenses', parseInt(e.target.value) || 0)}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label>計画期間（ヶ月）</Label>
                      <Select
                        value={parameters.planningHorizon.toString()}
                        onValueChange={(value) => handleParameterChange('planningHorizon', parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="6">6ヶ月</SelectItem>
                          <SelectItem value="12">12ヶ月</SelectItem>
                          <SelectItem value="18">18ヶ月</SelectItem>
                          <SelectItem value="24">24ヶ月</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button 
                      onClick={handleSaveSettings}
                      disabled={isCalculating}
                      className="w-full"
                    >
                      {isCalculating ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Settings className="w-4 h-4 mr-2" />
                      )}
                      設定を保存
                    </Button>
                  </CardContent>
                </Card>

                {/* 計画グラフ */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      月次計画推移
                    </CardTitle>
                    <CardDescription>
                      顧客数、MRR、利益の予測推移
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={monthlyPlans}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="monthLabel" 
                            fontSize={12}
                            interval="preserveStartEnd"
                          />
                          <YAxis fontSize={12} />
                          <Tooltip 
                            labelFormatter={(label) => label}
                            formatter={(value: number, name: string) => [
                              name === 'mrr' || name === 'profit' || name === 'expenses' 
                                ? `¥${value.toLocaleString()}` 
                                : value.toLocaleString(),
                              name === 'totalCustomers' ? '総顧客数' :
                              name === 'newAcquisitions' ? '新規獲得' :
                              name === 'mrr' ? 'MRR' :
                              name === 'profit' ? '利益' :
                              name === 'expenses' ? '支出' : name
                            ]}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="totalCustomers" 
                            stroke="#3b82f6" 
                            strokeWidth={2}
                            name="総顧客数"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="newAcquisitions" 
                            stroke="#10b981" 
                            strokeWidth={2}
                            name="新規獲得"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="mrr" 
                            stroke="#8b5cf6" 
                            strokeWidth={2}
                            name="MRR"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="profit" 
                            stroke="#f59e0b" 
                            strokeWidth={2}
                            name="月次利益"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 月次計画テーブル */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    月次計画詳細
                  </CardTitle>
                  <CardDescription>
                    各月の詳細な計画数値
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">月</th>
                          <th className="text-right p-2">新規獲得</th>
                          <th className="text-right p-2">総顧客数</th>
                          <th className="text-right p-2">チャーン</th>
                          <th className="text-right p-2">MRR</th>
                          <th className="text-right p-2">支出</th>
                          <th className="text-right p-2">月次利益</th>
                          <th className="text-right p-2">累積利益</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyPlans.map((plan, index) => (
                          <tr key={plan.month} className={`border-b hover:bg-gray-50 ${index === 0 ? 'bg-blue-50' : ''}`}>
                            <td className="p-2 font-medium">
                              {plan.monthLabel}
                              {index === 0 && <Badge className="ml-2 text-xs">現在</Badge>}
                            </td>
                            <td className="text-right p-2">{plan.newAcquisitions.toLocaleString()}</td>
                            <td className="text-right p-2 font-medium">{plan.totalCustomers.toLocaleString()}</td>
                            <td className="text-right p-2 text-red-600">{plan.churnCount.toLocaleString()}</td>
                            <td className="text-right p-2 font-medium text-green-600">
                              ¥{plan.mrr.toLocaleString()}
                            </td>
                            <td className="text-right p-2 text-red-600">
                              ¥{plan.expenses.toLocaleString()}
                            </td>
                            <td className={`text-right p-2 font-medium ${plan.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ¥{plan.profit.toLocaleString()}
                            </td>
                            <td className={`text-right p-2 font-bold ${plan.cumulativeProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ¥{plan.cumulativeProfit.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 流入経路設定 */}
            <TabsContent value="channels" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 流入経路設定カード */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Radio className="w-5 h-5" />
                      流入経路設定
                    </CardTitle>
                    <CardDescription>
                      各チャネルのCPAと流入割合を設定
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {parameters.channels.map((channel, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Input
                            value={channel.name}
                            onChange={(e) => handleChannelChange(index, 'name', e.target.value)}
                            className="font-medium"
                            placeholder="チャネル名"
                          />
                          <div className="flex items-center gap-2">
                            <Badge variant={channel.isActive ? "default" : "outline"}>
                              {channel.isActive ? '有効' : '無効'}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeChannel(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>CPA（円）</Label>
                            <Input
                              type="number"
                              value={channel.cpa}
                              onChange={(e) => handleChannelChange(index, 'cpa', parseInt(e.target.value) || 0)}
                              placeholder="5000"
                            />
                          </div>
                          <div>
                            <Label>流入割合（%）</Label>
                            <Input
                              type="number"
                              value={channel.ratio}
                              onChange={(e) => handleChannelChange(index, 'ratio', parseInt(e.target.value) || 0)}
                              placeholder="30"
                            />
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={channel.isActive}
                            onCheckedChange={(checked) => handleChannelChange(index, 'isActive', checked)}
                          />
                          <Label>このチャネルを有効にする</Label>
                        </div>
                      </div>
                    ))}
                    
                    <Button
                      onClick={addChannel}
                      variant="outline"
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      流入経路を追加
                    </Button>
                  </CardContent>
                </Card>

                {/* 流入経路サマリー */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      流入経路サマリー
                    </CardTitle>
                    <CardDescription>
                      現在の設定による月次コスト予測
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* 総流入割合チェック */}
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">総流入割合</span>
                          <span className={`font-bold ${
                            parameters.channels.filter(c => c.isActive).reduce((sum, c) => sum + c.ratio, 0) === 100 
                              ? 'text-green-600' : 'text-orange-600'
                          }`}>
                            {parameters.channels.filter(c => c.isActive).reduce((sum, c) => sum + c.ratio, 0)}%
                          </span>
                        </div>
                        {parameters.channels.filter(c => c.isActive).reduce((sum, c) => sum + c.ratio, 0) !== 100 && (
                          <p className="text-xs text-orange-600 mt-1">
                            ⚠ 合計が100%ではありません
                          </p>
                        )}
                      </div>

                      {/* チャネル別予測 */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">初月の予測（{parameters.initialAcquisitions}人獲得）</h4>
                        {parameters.channels.filter(c => c.isActive).map((channel, index) => {
                          const totalActiveRatio = parameters.channels.filter(c => c.isActive).reduce((sum, c) => sum + c.ratio, 0);
                          const acquisitions = totalActiveRatio > 0 ? Math.round(parameters.initialAcquisitions * (channel.ratio / totalActiveRatio)) : 0;
                          const cost = acquisitions * channel.cpa;
                          
                          return (
                            <div key={index} className="flex justify-between items-center p-2 bg-white rounded border">
                              <span className="text-sm">{channel.name}</span>
                              <div className="text-right">
                                <div className="text-sm font-medium">{acquisitions}人</div>
                                <div className="text-xs text-muted-foreground">
                                  {cost > 0 ? `¥${cost.toLocaleString()}` : '無料'}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* 総コスト */}
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">初月の総広告費</span>
                          <span className="font-bold text-blue-600">
                            ¥{(() => {
                              const totalActiveRatio = parameters.channels.filter(c => c.isActive).reduce((sum, c) => sum + c.ratio, 0);
                              return parameters.channels.filter(c => c.isActive).reduce((sum, channel) => {
                                const acquisitions = totalActiveRatio > 0 ? Math.round(parameters.initialAcquisitions * (channel.ratio / totalActiveRatio)) : 0;
                                return sum + (acquisitions * channel.cpa);
                              }, 0).toLocaleString();
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* 簡易PL */}
            <TabsContent value="pl" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 当月のPL */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      {monthlyPlans[0]?.monthLabel} 損益計算書
                    </CardTitle>
                    <CardDescription>
                      当月の詳細損益計算
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {monthlyPlans[0] && (
                      <div className="space-y-4">
                        {/* 売上 */}
                        <div className="space-y-2">
                          <h4 className="font-semibold text-blue-700 border-b pb-1">売上高</h4>
                          <div className="ml-4 space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>月額サブスクリプション</span>
                              <span>¥{monthlyPlans[0].pl.revenue.monthlySubscription.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>年額サブスクリプション（月割）</span>
                              <span>¥{monthlyPlans[0].pl.revenue.yearlySubscription.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between font-semibold border-t pt-1">
                              <span>売上高合計</span>
                              <span>¥{monthlyPlans[0].pl.revenue.total.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* 売上原価 */}
                        <div className="space-y-2">
                          <h4 className="font-semibold text-red-700 border-b pb-1">売上原価</h4>
                          <div className="ml-4 space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>流入経路コスト</span>
                              <span>¥{monthlyPlans[0].pl.costs.channelCosts.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between font-semibold border-t pt-1">
                              <span>売上原価合計</span>
                              <span>¥{monthlyPlans[0].pl.costs.channelCosts.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* 売上総利益 */}
                        <div className="bg-green-50 p-3 rounded">
                          <div className="flex justify-between font-semibold text-green-700">
                            <span>売上総利益</span>
                            <span>¥{monthlyPlans[0].pl.grossProfit.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm text-green-600 mt-1">
                            <span>売上総利益率</span>
                            <span>{monthlyPlans[0].pl.grossMargin.toFixed(1)}%</span>
                          </div>
                        </div>

                        {/* 営業費用 */}
                        <div className="space-y-2">
                          <h4 className="font-semibold text-orange-700 border-b pb-1">営業費用</h4>
                          <div className="ml-4 space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>運営費・人件費・その他</span>
                              <span>¥{monthlyPlans[0].pl.costs.operatingExpenses.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between font-semibold border-t pt-1">
                              <span>営業費用合計</span>
                              <span>¥{monthlyPlans[0].pl.costs.operatingExpenses.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* 営業利益 */}
                        <div className={`p-3 rounded ${monthlyPlans[0].pl.netProfit >= 0 ? 'bg-blue-50' : 'bg-red-50'}`}>
                          <div className={`flex justify-between font-bold text-lg ${monthlyPlans[0].pl.netProfit >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                            <span>営業利益</span>
                            <span>¥{monthlyPlans[0].pl.netProfit.toLocaleString()}</span>
                          </div>
                          <div className={`flex justify-between text-sm mt-1 ${monthlyPlans[0].pl.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                            <span>営業利益率</span>
                            <span>{monthlyPlans[0].pl.netMargin.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* PLトレンドグラフ */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      PL推移グラフ
                    </CardTitle>
                    <CardDescription>
                      売上、原価、利益の推移
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyPlans.slice(0, 6)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="monthLabel" 
                            fontSize={10}
                            interval={0}
                          />
                          <YAxis 
                            fontSize={12}
                            tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`}
                          />
                          <Tooltip 
                            formatter={(value: number, name: string) => [
                              `¥${value.toLocaleString()}`,
                              name === 'revenue.total' ? '売上高' :
                              name === 'costs.channelCosts' ? '売上原価' :
                              name === 'costs.operatingExpenses' ? '営業費用' :
                              name === 'grossProfit' ? '売上総利益' :
                              name === 'netProfit' ? '営業利益' : name
                            ]}
                          />
                          <Legend />
                          <Bar dataKey="pl.revenue.total" fill="#10b981" name="売上高" />
                          <Bar dataKey="pl.costs.channelCosts" fill="#ef4444" name="売上原価" />
                          <Bar dataKey="pl.costs.operatingExpenses" fill="#f59e0b" name="営業費用" />
                          <Bar dataKey="pl.netProfit" fill="#3b82f6" name="営業利益" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 月別PLテーブル */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    月別損益計算書
                  </CardTitle>
                  <CardDescription>
                    各月の詳細なPL計算結果
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-gray-300">
                          <th className="text-left p-3 font-semibold">月</th>
                          <th className="text-right p-3 font-semibold">売上高</th>
                          <th className="text-right p-3 font-semibold">売上原価</th>
                          <th className="text-right p-3 font-semibold">売上総利益</th>
                          <th className="text-right p-3 font-semibold">総利益率</th>
                          <th className="text-right p-3 font-semibold">営業費用</th>
                          <th className="text-right p-3 font-semibold">営業利益</th>
                          <th className="text-right p-3 font-semibold">営業利益率</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyPlans.map((plan, index) => (
                          <tr key={plan.month} className={`border-b hover:bg-gray-50 ${index === 0 ? 'bg-blue-50' : ''}`}>
                            <td className="p-3 font-medium">
                              {plan.monthLabel}
                              {index === 0 && <Badge className="ml-2 text-xs">現在</Badge>}
                            </td>
                            <td className="text-right p-3 font-medium text-green-600">
                              ¥{plan.pl.revenue.total.toLocaleString()}
                            </td>
                            <td className="text-right p-3 text-red-600">
                              ¥{plan.pl.costs.channelCosts.toLocaleString()}
                            </td>
                            <td className="text-right p-3 font-medium text-green-700">
                              ¥{plan.pl.grossProfit.toLocaleString()}
                            </td>
                            <td className="text-right p-3 text-green-600">
                              {plan.pl.grossMargin.toFixed(1)}%
                            </td>
                            <td className="text-right p-3 text-orange-600">
                              ¥{plan.pl.costs.operatingExpenses.toLocaleString()}
                            </td>
                            <td className={`text-right p-3 font-bold ${plan.pl.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                              ¥{plan.pl.netProfit.toLocaleString()}
                            </td>
                            <td className={`text-right p-3 font-semibold ${plan.pl.netMargin >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                              {plan.pl.netMargin.toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* PL分析指標 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {monthlyPlans[0]?.pl.grossMargin.toFixed(1) || 0}%
                      </div>
                      <p className="text-sm text-muted-foreground">
                        当月売上総利益率
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${monthlyPlans[0]?.pl.netMargin >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {monthlyPlans[0]?.pl.netMargin.toFixed(1) || 0}%
                      </div>
                      <p className="text-sm text-muted-foreground">
                        当月営業利益率
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        ¥{(() => {
                          const avgGrossProfit = monthlyPlans.reduce((sum, plan) => sum + plan.pl.grossProfit, 0) / monthlyPlans.length;
                          return avgGrossProfit.toLocaleString();
                        })()}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        平均売上総利益
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {(() => {
                          const avgNetMargin = monthlyPlans.reduce((sum, plan) => sum + plan.pl.netMargin, 0) / monthlyPlans.length;
                          return avgNetMargin.toFixed(1);
                        })()}%
                      </div>
                      <p className="text-sm text-muted-foreground">
                        平均営業利益率
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 利益率推移グラフ */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    利益率推移
                  </CardTitle>
                  <CardDescription>
                    売上総利益率と営業利益率の推移
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyPlans}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="monthLabel" 
                          fontSize={12}
                          interval="preserveStartEnd"
                        />
                        <YAxis 
                          fontSize={12}
                          tickFormatter={(value) => `${value}%`}
                        />
                        <Tooltip 
                          formatter={(value: number, name: string) => [
                            `${value.toFixed(1)}%`,
                            name === 'pl.grossMargin' ? '売上総利益率' : '営業利益率'
                          ]}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="pl.grossMargin" 
                          stroke="#10b981" 
                          strokeWidth={3}
                          name="売上総利益率"
                          dot={{ fill: '#10b981', strokeWidth: 2, r: 5 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="pl.netMargin" 
                          stroke="#3b82f6" 
                          strokeWidth={3}
                          name="営業利益率"
                          dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* パラメータ設定 */}
            <TabsContent value="parameters" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      成長パラメータ
                    </CardTitle>
                    <CardDescription>
                      事業成長の基本パラメータ
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>初月新規獲得数</Label>
                      <Input
                        type="number"
                        value={parameters.initialAcquisitions}
                        onChange={(e) => handleParameterChange('initialAcquisitions', parseInt(e.target.value) || 0)}
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        事業開始月の新規顧客獲得数
                      </p>
                    </div>
                    
                    <div>
                      <Label>月次成長率（%）</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={parameters.monthlyGrowthRate}
                        onChange={(e) => handleParameterChange('monthlyGrowthRate', parseFloat(e.target.value) || 0)}
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        毎月の新規獲得数成長率
                      </p>
                    </div>
                    
                    <div>
                      <Label>チャーン率（%）</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={parameters.churnRate}
                        onChange={(e) => handleParameterChange('churnRate', parseFloat(e.target.value) || 0)}
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        月次の顧客離脱率
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      料金・支出設定
                    </CardTitle>
                    <CardDescription>
                      収益と支出の基本設定
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>月額料金（円）</Label>
                      <Input
                        type="number"
                        value={parameters.monthlyPrice}
                        onChange={(e) => handleParameterChange('monthlyPrice', parseInt(e.target.value) || 0)}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label>年額料金（円）</Label>
                      <Input
                        type="number"
                        value={parameters.yearlyPrice}
                        onChange={(e) => handleParameterChange('yearlyPrice', parseInt(e.target.value) || 0)}
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        月割り: ¥{Math.round(parameters.yearlyPrice / 12).toLocaleString()}
                      </p>
                    </div>
                    
                    <div>
                      <Label>基本支出（円/月）</Label>
                      <Input
                        type="number"
                        value={parameters.baseExpenses}
                        onChange={(e) => handleParameterChange('baseExpenses', parseInt(e.target.value) || 0)}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label>支出成長率（%）</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={parameters.expenseGrowthRate}
                        onChange={(e) => handleParameterChange('expenseGrowthRate', parseFloat(e.target.value) || 0)}
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        事業成長に伴う支出増加率
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* リアルタイム計算結果 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {monthlyPlans[parameters.planningHorizon - 1]?.totalCustomers.toLocaleString() || 0}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {parameters.planningHorizon}ヶ月後の顧客数
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        ¥{monthlyPlans[parameters.planningHorizon - 1]?.mrr.toLocaleString() || 0}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        最終月のMRR
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${
                        monthlyPlans[monthlyPlans.length - 1]?.cumulativeProfit >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ¥{monthlyPlans[monthlyPlans.length - 1]?.cumulativeProfit.toLocaleString() || 0}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        累積利益
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {((parameters.monthlyGrowthRate / 100 + 1) ** parameters.planningHorizon).toFixed(1)}x
                      </div>
                      <p className="text-sm text-muted-foreground">
                        総成長倍率
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* 詳細パラメータ設定 */}
            <TabsContent value="parameters" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>詳細設定</CardTitle>
                    <CardDescription>
                      より詳細なパラメータ調整
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        パラメータ設定タブは、成長パラメータ設定ページと料金設定ページで詳細に管理できます。
                      </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full" asChild>
                        <a href="/settings/growth-parameters">
                          <TrendingUp className="w-4 h-4 mr-2" />
                          成長パラメータ設定
                        </a>
                      </Button>
                      
                      <Button variant="outline" className="w-full" asChild>
                        <a href="/settings/pricing">
                          <DollarSign className="w-4 h-4 mr-2" />
                          料金設定管理
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>シナリオ分析</CardTitle>
                    <CardDescription>
                      複数シナリオでの計画比較
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center p-2 bg-green-50 rounded">
                          <div className="font-bold text-green-700">楽観的</div>
                          <div>成長率: +50%</div>
                          <div>チャーン: -30%</div>
                        </div>
                        <div className="text-center p-2 bg-blue-50 rounded">
                          <div className="font-bold text-blue-700">現実的</div>
                          <div>現在の設定</div>
                        </div>
                        <div className="text-center p-2 bg-orange-50 rounded">
                          <div className="font-bold text-orange-700">悲観的</div>
                          <div>成長率: -30%</div>
                          <div>チャーン: +50%</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* 将来予測 */}
            <TabsContent value="forecast" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    収益予測
                  </CardTitle>
                  <CardDescription>
                    MRRと月次利益の将来予測
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyPlans}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="monthLabel" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip 
                          formatter={(value: number, name: string) => [
                            `¥${value.toLocaleString()}`,
                            name === 'mrr' ? 'MRR' : '月次利益'
                          ]}
                        />
                        <Legend />
                        <Bar dataKey="mrr" fill="#10b981" name="MRR" />
                        <Bar dataKey="profit" fill="#3b82f6" name="月次利益" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* 主要指標の予測 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">損益分岐点</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      {(() => {
                        const breakEvenMonth = monthlyPlans.findIndex(plan => plan.cumulativeProfit >= 0);
                        return breakEvenMonth >= 0 ? (
                          <div>
                            <div className="text-3xl font-bold text-green-600">
                              {breakEvenMonth + 1}ヶ月目
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {monthlyPlans[breakEvenMonth]?.monthLabel}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <div className="text-3xl font-bold text-red-600">
                              {parameters.planningHorizon}ヶ月+
                            </div>
                            <p className="text-sm text-muted-foreground">
                              計画期間内では達成困難
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">最大月次売上</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">
                        ¥{Math.max(...monthlyPlans.map(p => p.mrr)).toLocaleString()}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        計画期間中の最大MRR
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">総投資回収</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${
                        monthlyPlans[monthlyPlans.length - 1]?.cumulativeProfit >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ¥{Math.abs(monthlyPlans[monthlyPlans.length - 1]?.cumulativeProfit || 0).toLocaleString()}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {monthlyPlans[monthlyPlans.length - 1]?.cumulativeProfit >= 0 ? '期間終了時の利益' : '期間終了時の損失'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}