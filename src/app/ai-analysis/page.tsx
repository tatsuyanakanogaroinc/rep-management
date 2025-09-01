'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useState } from 'react';
import { format, subMonths, startOfYear, endOfYear } from 'date-fns';
import { ja } from 'date-fns/locale';
import { 
  Brain, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Lightbulb, 
  BarChart3, 
  Calendar,
  ArrowRight,
  Activity,
  Users,
  DollarSign
} from 'lucide-react';
import { useMonthlyPlanning } from '@/hooks/useMonthlyPlanning';

export default function AIAnalysisPage() {
  const { getPlanForMonth, monthlyPlans } = useMonthlyPlanning();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return format(now, 'yyyy-MM');
  });

  // 過去12ヶ月の選択肢を生成
  const generateMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = subMonths(now, i);
      const value = format(date, 'yyyy-MM');
      const label = format(date, 'yyyy年MM月', { locale: ja });
      options.push({ value, label });
    }
    return options;
  };

  const monthOptions = generateMonthOptions();
  const selectedPlan = getPlanForMonth(selectedMonth);
  const currentDate = new Date();
  const isCurrentMonth = format(currentDate, 'yyyy-MM') === selectedMonth;
  const dayOfMonth = currentDate.getDate();
  const daysInMonth = new Date(parseInt(selectedMonth.split('-')[0]), parseInt(selectedMonth.split('-')[1]), 0).getDate();
  const monthProgress = isCurrentMonth ? (dayOfMonth / daysInMonth) * 100 : 100;

  // 年間目標に対する進捗分析
  const getAnnualProgress = () => {
    const currentYear = format(currentDate, 'yyyy');
    const yearPlans = monthlyPlans.filter(plan => plan.month.startsWith(currentYear));
    const currentMonthIndex = parseInt(selectedMonth.split('-')[1]) - 1;
    const yearProgressPlans = yearPlans.slice(0, currentMonthIndex + 1);
    
    const totalAnnualTarget = yearPlans.reduce((sum, plan) => sum + plan.mrr, 0);
    const currentAnnualActual = yearProgressPlans.reduce((sum, plan) => sum + plan.mrr, 0);
    
    return {
      totalTarget: totalAnnualTarget,
      currentActual: currentAnnualActual,
      monthsCompleted: currentMonthIndex + 1,
      achievement: totalAnnualTarget > 0 ? (currentAnnualActual / totalAnnualTarget) * 100 : 0
    };
  };

  const annualProgress = getAnnualProgress();

  // 月次目標達成のための改善策分析
  const getMonthlyImprovementAnalysis = () => {
    if (!selectedPlan) return null;

    const analysis = {
      status: 'good' as 'good' | 'warning' | 'critical',
      urgency: 'medium' as 'low' | 'medium' | 'high',
      recommendations: [] as string[],
      priorityActions: [] as string[]
    };

    // 月の進捗に基づく分析
    if (isCurrentMonth) {
      const expectedProgress = monthProgress;
      const requiredDailyAcquisitions = Math.ceil(selectedPlan.newAcquisitions / daysInMonth);
      const remainingDays = daysInMonth - dayOfMonth;
      const remainingTarget = selectedPlan.newAcquisitions;

      if (remainingDays < 10) {
        analysis.urgency = 'high';
        analysis.status = 'warning';
        analysis.recommendations.push(
          `残り${remainingDays}日で${remainingTarget}人の獲得が必要`,
          '緊急的な広告予算増額を検討',
          'SNS投稿頻度を2倍に増加',
          '既存顧客への紹介キャンペーン実施'
        );
      } else if (remainingDays < 20) {
        analysis.status = 'warning';
        analysis.recommendations.push(
          `1日平均${requiredDailyAcquisitions}人の獲得が必要`,
          '広告予算の20%増額を検討',
          'コンバージョン率改善施策の実施'
        );
      }
    }

    // チャネル分析
    if (selectedPlan.channels) {
      const totalBudget = selectedPlan.channels.reduce((sum, ch) => sum + ch.budget, 0);
      const highCpaChannels = selectedPlan.channels.filter(ch => ch.targetCpa && ch.targetCpa > 7000);
      
      if (highCpaChannels.length > 0) {
        analysis.recommendations.push(
          `CPA高いチャネル(${highCpaChannels.map(ch => ch.name).join(', ')})の最適化`,
          'ターゲティング精度向上',
          'クリエイティブA/Bテスト実施'
        );
      }
    }

    return analysis;
  };

  // 流入経路別の詳細分析
  const getChannelAnalysis = () => {
    if (!selectedPlan?.channels) return [];

    return selectedPlan.channels.map(channel => {
      const analysis = {
        channel: channel.name,
        performance: 'good' as 'excellent' | 'good' | 'warning' | 'poor',
        cpaScore: 100,
        volumeScore: 100,
        recommendations: [] as string[],
        insights: [] as string[]
      };

      // CPA分析
      if (channel.targetCpa) {
        if (channel.targetCpa > 8000) {
          analysis.performance = 'poor';
          analysis.cpaScore = 40;
          analysis.recommendations.push(
            'ターゲティングの見直し',
            'キーワード除外設定の強化',
            'ランディングページの改善'
          );
        } else if (channel.targetCpa > 6000) {
          analysis.performance = 'warning';
          analysis.cpaScore = 70;
          analysis.recommendations.push(
            'クリエイティブの最適化',
            '入札戦略の調整'
          );
        } else {
          analysis.performance = 'good';
          analysis.cpaScore = 90;
        }
      }

      // ボリューム分析
      const expectedVolume = selectedPlan.newAcquisitions * (channel.trafficRatio / 100);
      if (expectedVolume < 5) {
        analysis.volumeScore = 60;
        analysis.insights.push('獲得ボリュームが少ない - 予算配分見直しを検討');
      }

      // チャネル別改善提案
      switch (channel.name) {
        case 'Google広告':
          analysis.insights.push(
            '検索キーワードの拡張を検討',
            'リスティング広告とディスプレイ広告のバランス調整'
          );
          break;
        case 'Facebook広告':
          analysis.insights.push(
            'Lookalike オーディエンスの活用',
            '動画クリエイティブの導入'
          );
          break;
        case 'SNS':
          analysis.insights.push(
            'インフルエンサーマーケティングの強化',
            'ユーザー生成コンテンツの活用'
          );
          break;
      }

      return analysis;
    });
  };

  const monthlyAnalysis = getMonthlyImprovementAnalysis();
  const channelAnalyses = getChannelAnalysis();

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
                    <Brain className="w-8 h-8 text-primary" />
                    <div>
                      <h1 className="text-3xl font-bold">
                        <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                          AI分析
                        </span>
                      </h1>
                      <p className="text-muted-foreground mt-1">
                        {format(new Date(selectedMonth + '-01'), 'yyyy年MM月', { locale: ja })}の総合分析と改善提案
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-48 glass hover:bg-white/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {monthOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </header>

          {/* メインコンテンツ */}
          <main className="relative z-10 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="space-y-8">
              
              {/* 総合分析サマリー */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    総合分析サマリー
                  </CardTitle>
                  <CardDescription>
                    現在の状況と重要度の高い改善点
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedPlan ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* 月次進捗 */}
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 mb-2">
                          {Math.round(monthProgress)}%
                        </div>
                        <div className="text-sm text-muted-foreground mb-3">月次進捗</div>
                        <Progress value={monthProgress} className="h-2" />
                        <div className="text-xs text-muted-foreground mt-2">
                          {isCurrentMonth ? `${dayOfMonth}日/${daysInMonth}日経過` : '月末'}
                        </div>
                      </div>

                      {/* 年間進捗 */}
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-purple-600 mb-2">
                          {Math.round(annualProgress.achievement)}%
                        </div>
                        <div className="text-sm text-muted-foreground mb-3">年間達成率</div>
                        <Progress value={annualProgress.achievement} className="h-2" />
                        <div className="text-xs text-muted-foreground mt-2">
                          {annualProgress.monthsCompleted}/12ヶ月経過
                        </div>
                      </div>

                      {/* 総合評価 */}
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl mb-2">
                          {annualProgress.achievement >= 90 ? '🎉' : 
                           annualProgress.achievement >= 70 ? '✅' : 
                           annualProgress.achievement >= 50 ? '⚠️' : '🚨'}
                        </div>
                        <div className="text-sm font-semibold mb-1">
                          {annualProgress.achievement >= 90 ? '優秀' : 
                           annualProgress.achievement >= 70 ? '良好' : 
                           annualProgress.achievement >= 50 ? '要改善' : '緊急対応'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          総合パフォーマンス
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        選択した月の計画データがありません。月次計画を作成してください。
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {selectedPlan && (
                <>
                  {/* 月次目標達成のための改善策 */}
                  <Card className="glass">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        月次目標達成のための改善策
                      </CardTitle>
                      <CardDescription>
                        {format(new Date(selectedMonth + '-01'), 'yyyy年MM月', { locale: ja })}の目標達成に向けた具体的アクション
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {monthlyAnalysis ? (
                        <div className="space-y-6">
                          {/* 緊急度表示 */}
                          <div className={`p-4 rounded-lg border-l-4 ${
                            monthlyAnalysis.urgency === 'high' ? 'border-red-500 bg-red-50' :
                            monthlyAnalysis.urgency === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                            'border-green-500 bg-green-50'
                          }`}>
                            <div className="flex items-center gap-2 mb-2">
                              {monthlyAnalysis.urgency === 'high' ? <AlertTriangle className="w-5 h-5 text-red-600" /> :
                               monthlyAnalysis.urgency === 'medium' ? <Info className="w-5 h-5 text-yellow-600" /> :
                               <CheckCircle className="w-5 h-5 text-green-600" />}
                              <h3 className="font-semibold">
                                {monthlyAnalysis.urgency === 'high' ? '緊急対応が必要' :
                                 monthlyAnalysis.urgency === 'medium' ? '注意が必要' :
                                 '順調に進行中'}
                              </h3>
                            </div>
                            {isCurrentMonth && (
                              <p className="text-sm mb-3">
                                残り{daysInMonth - dayOfMonth}日で新規獲得目標{selectedPlan.newAcquisitions}人を達成する必要があります
                              </p>
                            )}
                          </div>

                          {/* 改善提案 */}
                          <div className="space-y-4">
                            <h4 className="font-semibold flex items-center gap-2">
                              <Lightbulb className="w-4 h-4" />
                              具体的改善策
                            </h4>
                            <div className="grid gap-3">
                              {monthlyAnalysis.recommendations.map((rec, index) => (
                                <div key={index} className="flex items-start gap-3 p-3 bg-white/50 rounded-lg border">
                                  <ArrowRight className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                  <span className="text-sm">{rec}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* 今日のアクション */}
                          {isCurrentMonth && (
                            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border">
                              <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                今日実行すべきアクション
                              </h4>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                  広告キャンペーンの成果確認
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                  SNS投稿の実施
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                  コンバージョン率のチェック
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                          <h3 className="font-medium mb-2">順調に進行中</h3>
                          <p className="text-sm text-muted-foreground">
                            現在の進捗は良好です。計画通りに実行を継続してください。
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* 年間目標に対する分析 */}
                  <Card className="glass">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        年間目標に対する進捗分析
                      </CardTitle>
                      <CardDescription>
                        {format(currentDate, 'yyyy', { locale: ja })}年の目標達成状況と軌道修正提案
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* 年間進捗概要 */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center p-4 border rounded-lg">
                            <div className="text-xl font-bold text-green-600 mb-1">
                              ¥{annualProgress.currentActual.toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground">累計MRR実績</div>
                          </div>
                          <div className="text-center p-4 border rounded-lg">
                            <div className="text-xl font-bold text-blue-600 mb-1">
                              ¥{annualProgress.totalTarget.toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground">年間MRR目標</div>
                          </div>
                          <div className="text-center p-4 border rounded-lg">
                            <div className="text-xl font-bold text-purple-600 mb-1">
                              {Math.round(annualProgress.achievement)}%
                            </div>
                            <div className="text-sm text-muted-foreground">達成率</div>
                          </div>
                        </div>

                        {/* 軌道修正提案 */}
                        <div className="space-y-4">
                          <h4 className="font-semibold flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            年間目標達成のための戦略
                          </h4>
                          
                          {annualProgress.achievement < 70 ? (
                            <Alert variant="destructive">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>
                                <strong>緊急対応が必要:</strong> 年間目標達成には大幅な軌道修正が必要です。
                              </AlertDescription>
                            </Alert>
                          ) : annualProgress.achievement < 90 ? (
                            <Alert>
                              <Info className="h-4 w-4" />
                              <AlertDescription>
                                <strong>注意:</strong> 年間目標達成のため施策強化をお勧めします。
                              </AlertDescription>
                            </Alert>
                          ) : (
                            <Alert className="border-green-200 bg-green-50">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <AlertDescription className="text-green-800">
                                <strong>順調:</strong> 年間目標達成は良好なペースです。
                              </AlertDescription>
                            </Alert>
                          )}

                          <div className="grid gap-3">
                            {annualProgress.achievement < 90 && [
                              '来月の新規獲得目標を20%上方修正',
                              'チャーン率を5%以下に改善',
                              '高単価プランへのアップセル強化',
                              '新規チャネルの開拓を検討'
                            ].map((action, index) => (
                              <div key={index} className="flex items-start gap-3 p-3 bg-white/50 rounded-lg border">
                                <ArrowRight className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm">{action}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 流入経路別詳細分析 */}
                  <Card className="glass">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        流入経路別詳細分析
                      </CardTitle>
                      <CardDescription>
                        各チャネルのパフォーマンス分析と最適化提案
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {channelAnalyses.map((analysis, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="font-semibold text-lg">{analysis.channel}</h3>
                              <div className="flex items-center gap-2">
                                <Badge 
                                  className={
                                    analysis.performance === 'excellent' ? 'bg-green-100 text-green-800' :
                                    analysis.performance === 'good' ? 'bg-blue-100 text-blue-800' :
                                    analysis.performance === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }
                                >
                                  {analysis.performance === 'excellent' ? '優秀' :
                                   analysis.performance === 'good' ? '良好' :
                                   analysis.performance === 'warning' ? '要改善' :
                                   '要対策'}
                                </Badge>
                              </div>
                            </div>

                            {/* パフォーマンススコア */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div>
                                <div className="text-sm text-muted-foreground mb-1">CPAスコア</div>
                                <div className="flex items-center gap-2">
                                  <Progress value={analysis.cpaScore} className="flex-1 h-2" />
                                  <span className="text-sm font-medium">{analysis.cpaScore}</span>
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground mb-1">ボリュームスコア</div>
                                <div className="flex items-center gap-2">
                                  <Progress value={analysis.volumeScore} className="flex-1 h-2" />
                                  <span className="text-sm font-medium">{analysis.volumeScore}</span>
                                </div>
                              </div>
                            </div>

                            {/* 改善提案 */}
                            {analysis.recommendations.length > 0 && (
                              <div className="mb-4">
                                <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                                  <Lightbulb className="w-4 h-4 text-yellow-600" />
                                  改善提案
                                </h4>
                                <div className="space-y-1">
                                  {analysis.recommendations.map((rec, i) => (
                                    <div key={i} className="text-sm flex items-start gap-2">
                                      <span className="w-1.5 h-1.5 bg-yellow-600 rounded-full mt-1.5 flex-shrink-0"></span>
                                      {rec}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* インサイト */}
                            {analysis.insights.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                                  <Brain className="w-4 h-4 text-purple-600" />
                                  AIインサイト
                                </h4>
                                <div className="space-y-1">
                                  {analysis.insights.map((insight, i) => (
                                    <div key={i} className="text-sm flex items-start gap-2 text-muted-foreground">
                                      <span className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-1.5 flex-shrink-0"></span>
                                      {insight}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* その他の重要な分析 */}
                  <Card className="glass">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        その他の重要な分析
                      </CardTitle>
                      <CardDescription>
                        市場動向と競合分析、リスク要因
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* 市場分析 */}
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" />
                            市場・競合分析
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1.5 flex-shrink-0"></span>
                              SaaS市場の成長率は引き続き高い水準を維持
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1.5 flex-shrink-0"></span>
                              競合他社も積極的なマーケティングを展開中
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1.5 flex-shrink-0"></span>
                              年末商戦に向けた獲得競争が激化する予測
                            </div>
                          </div>
                        </div>

                        {/* リスク分析 */}
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-orange-600" />
                            潜在的リスク要因
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 bg-orange-600 rounded-full mt-1.5 flex-shrink-0"></span>
                              広告費の上昇によるCPA悪化リスク
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 bg-orange-600 rounded-full mt-1.5 flex-shrink-0"></span>
                              季節性によるコンバージョン率の変動
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 bg-orange-600 rounded-full mt-1.5 flex-shrink-0"></span>
                              既存顧客のチャーン率上昇の可能性
                            </div>
                          </div>
                        </div>

                        {/* 機会分析 */}
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            成長機会
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-1.5 flex-shrink-0"></span>
                              年間プランへのアップセル機会拡大
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-1.5 flex-shrink-0"></span>
                              新機能リリースによる既存顧客満足度向上
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-1.5 flex-shrink-0"></span>
                              紹介プログラムによる低コスト獲得チャネル強化
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </main>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}