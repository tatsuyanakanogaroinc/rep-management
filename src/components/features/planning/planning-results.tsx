'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, DollarSign, Users, Target, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

interface PlanningResult {
  monthlyNewCustomers: number;
  trialUsers: number;
  yearlyRevenue: number;
  monthlyRevenue: number;
  totalCustomers: number;
  channelBreakdown: ChannelResult[];
  totalMarketingBudget: number;
  customerAcquisitionCost: number;
  ltv: number;
  ltvCacRatio: number;
  paybackPeriod: number;
  projectedGrowth: {
    month3: number;
    month6: number;
    month12: number;
  };
}

interface ChannelResult {
  name: string;
  percentage: number;
  customers: number;
  cpa: number;
  budget: number;
  roi: number;
  ltv: number;
}

interface PlanningResultsProps {
  result: PlanningResult;
}

export function PlanningResults({ result }: PlanningResultsProps) {
  const getHealthIndicator = (ltvCacRatio: number) => {
    if (ltvCacRatio >= 3) {
      return { icon: CheckCircle, color: 'text-green-600', message: '健全' };
    } else if (ltvCacRatio >= 1.5) {
      return { icon: AlertTriangle, color: 'text-yellow-600', message: '注意' };
    } else {
      return { icon: AlertCircle, color: 'text-red-600', message: '危険' };
    }
  };

  const healthIndicator = getHealthIndicator(result.ltvCacRatio);
  const HealthIcon = healthIndicator.icon;

  return (
    <div className="space-y-6">
      {/* メインKPI */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            主要指標
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{result.monthlyNewCustomers}人</div>
              <div className="text-sm text-muted-foreground">月間新規顧客</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{result.trialUsers.toLocaleString()}人</div>
              <div className="text-sm text-muted-foreground">必要トライアル数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">¥{Math.round(result.monthlyRevenue).toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">月次収益</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">¥{Math.round(result.yearlyRevenue).toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">年間収益予測</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ユニットエコノミクス */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            ユニットエコノミクス
          </CardTitle>
          <CardDescription>
            事業の収益性指標
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <HealthIcon className={`w-5 h-5 ${healthIndicator.color}`} />
                <span className="font-semibold">LTV/CAC比率</span>
              </div>
              <div className="text-3xl font-bold">{result.ltvCacRatio.toFixed(1)}x</div>
              <div className={`text-sm ${healthIndicator.color}`}>{healthIndicator.message}</div>
            </div>
            <div>
              <div className="font-semibold mb-2">顧客獲得コスト (CAC)</div>
              <div className="text-3xl font-bold">¥{Math.round(result.customerAcquisitionCost).toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">1顧客あたり</div>
            </div>
            <div>
              <div className="font-semibold mb-2">ペイバック期間</div>
              <div className="text-3xl font-bold">{result.paybackPeriod.toFixed(1)}ヶ月</div>
              <div className="text-sm text-muted-foreground">投資回収期間</div>
            </div>
          </div>

          {/* 健全性アラート */}
          {result.ltvCacRatio < 3 && (
            <Alert className="mt-4" variant={result.ltvCacRatio < 1.5 ? "destructive" : "default"}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {result.ltvCacRatio < 1.5 
                  ? "LTV/CAC比率が低すぎます。マーケティング効率の改善が必要です。"
                  : "LTV/CAC比率が理想値（3以上）を下回っています。収益性の改善を検討してください。"}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* チャネル別予算配分 */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            チャネル別予算配分
          </CardTitle>
          <CardDescription>
            月間マーケティング予算: ¥{result.totalMarketingBudget.toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {result.channelBreakdown.map((channel) => (
              <div key={channel.name} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold">{channel.name}</h4>
                  <div className="text-right">
                    <div className="font-bold">¥{channel.budget.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">{channel.percentage}%</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">獲得予定</div>
                    <div className="font-semibold">{channel.customers}人</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">CPA</div>
                    <div className="font-semibold">¥{channel.cpa.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">ROI</div>
                    <div className={`font-semibold ${channel.roi > 300 ? 'text-green-600' : channel.roi > 150 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {channel.roi.toFixed(0)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">予想LTV</div>
                    <div className="font-semibold">¥{Math.round(channel.ltv).toLocaleString()}</div>
                  </div>
                </div>
                
                <div className="mt-3">
                  <Progress value={channel.percentage} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 成長予測 */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            成長予測
          </CardTitle>
          <CardDescription>
            チャーンを考慮した累計顧客数予測
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{result.projectedGrowth.month3.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">3ヶ月後</div>
              <div className="text-xs text-muted-foreground mt-1">
                月次成長: +{result.monthlyNewCustomers}人
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{result.projectedGrowth.month6.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">6ヶ月後</div>
              <div className="text-xs text-muted-foreground mt-1">
                半年収益: ¥{Math.round(result.monthlyRevenue * 6).toLocaleString()}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{result.projectedGrowth.month12.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">12ヶ月後</div>
              <div className="text-xs text-muted-foreground mt-1">
                年間収益: ¥{Math.round(result.yearlyRevenue).toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 推奨アクション */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>推奨アクション</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {result.ltvCacRatio < 1.5 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>緊急:</strong> LTV/CAC比率が危険域です。マーケティング予算の削減またはLTVの改善が必要です。
                </AlertDescription>
              </Alert>
            )}
            
            {result.paybackPeriod > 12 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>注意:</strong> ペイバック期間が12ヶ月を超えています。顧客獲得コストの最適化を検討してください。
                </AlertDescription>
              </Alert>
            )}
            
            {result.channelBreakdown.some(ch => ch.roi < 150) && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>最適化:</strong> ROIが低いチャネルがあります。予算配分の見直しを推奨します。
                </AlertDescription>
              </Alert>
            )}
            
            {result.ltvCacRatio >= 3 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>良好:</strong> ユニットエコノミクスが健全です。このペースでの成長継続を推奨します。
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}