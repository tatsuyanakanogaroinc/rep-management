'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  TrendingDown, 
  Target, 
  Clock,
  ArrowRight,
  Lightbulb
} from 'lucide-react';
import { analyzeVariances, prioritizeRecommendations, generateAnalysisSummary } from '@/lib/ai-analysis';

interface AIVarianceAnalysisProps {
  comparisonData: Array<{
    metric: string;
    planned: number;
    actual: number;
    achievement: number;
    difference: number;
    unit: string;
    isInverted?: boolean;
  }>;
  historicalData?: any[];
}

export function AIVarianceAnalysis({ comparisonData, historicalData }: AIVarianceAnalysisProps) {
  // AI分析を実行
  const analyses = analyzeVariances(comparisonData, historicalData);
  const prioritizedAnalyses = prioritizeRecommendations(analyses);
  const summary = generateAnalysisSummary(analyses);

  // アイコンとカラーの取得
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-5 h-5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      case 'info': return <Info className="w-5 h-5" />;
      case 'success': return <CheckCircle className="w-5 h-5" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-200 bg-red-50 text-red-800';
      case 'warning': return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'info': return 'border-blue-200 bg-blue-50 text-blue-800';
      case 'success': return 'border-green-200 bg-green-50 text-green-800';
      default: return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  const getTimeframeBadge = (timeframe: string) => {
    switch (timeframe) {
      case 'immediate': return <Badge className="bg-red-100 text-red-700">緊急</Badge>;
      case 'short': return <Badge className="bg-yellow-100 text-yellow-700">短期</Badge>;
      case 'medium': return <Badge className="bg-blue-100 text-blue-700">中期</Badge>;
      case 'long': return <Badge variant="outline">長期</Badge>;
      default: return <Badge variant="outline">{timeframe}</Badge>;
    }
  };

  const getOverallStatusColor = () => {
    switch (summary.overallStatus) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'concerning': return 'border-yellow-500 bg-yellow-50';
      case 'good': return 'border-green-500 bg-green-50';
      case 'excellent': return 'border-emerald-500 bg-emerald-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getOverallStatusIcon = () => {
    switch (summary.overallStatus) {
      case 'critical': return '🚨';
      case 'concerning': return '⚠️';
      case 'good': return '✅';
      case 'excellent': return '🎉';
      default: return '📊';
    }
  };

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          AI乖離分析
        </CardTitle>
        <CardDescription>
          実績と計画の乖離を分析し、改善提案を生成
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 全体サマリー */}
        <Alert className={getOverallStatusColor()}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getOverallStatusIcon()}</span>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">
                総合評価: {summary.overallStatus === 'excellent' ? '優秀' : 
                        summary.overallStatus === 'good' ? '良好' : 
                        summary.overallStatus === 'concerning' ? '要注意' : '危機的'}
              </h3>
              <p className="text-sm">
                重要な課題: <strong>{summary.topPriority}</strong>
              </p>
              <p className="text-sm mt-1">
                推奨アクション: <strong>{summary.keyRecommendation}</strong>
              </p>
            </div>
            {summary.criticalIssues > 0 && (
              <Badge className="bg-red-100 text-red-700">
                緊急 {summary.criticalIssues}件
              </Badge>
            )}
          </div>
        </Alert>

        {/* 優先度の高い分析結果 */}
        {prioritizedAnalyses.length > 0 ? (
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Target className="w-5 h-5" />
              優先対応項目
            </h3>
            
            {prioritizedAnalyses.slice(0, 5).map((analysis, index) => (
              <div 
                key={index}
                className={`border rounded-lg p-4 ${getSeverityColor(analysis.severity)}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getSeverityIcon(analysis.severity)}
                    <h4 className="font-medium">{analysis.issue}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTimeframeBadge(analysis.timeframe)}
                    <Badge variant="outline" className="text-xs">
                      信頼度 {analysis.confidence}%
                    </Badge>
                  </div>
                </div>
                
                <p className="text-sm mb-3">{analysis.impact}</p>
                
                {/* 原因分析 */}
                <div className="mb-3">
                  <h5 className="text-sm font-medium mb-2 flex items-center gap-1">
                    <TrendingDown className="w-4 h-4" />
                    考えられる原因
                  </h5>
                  <ul className="text-sm space-y-1">
                    {analysis.rootCauses.slice(0, 3).map((cause, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-current rounded-full"></span>
                        {cause}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* 改善提案 */}
                <div>
                  <h5 className="text-sm font-medium mb-2 flex items-center gap-1">
                    <Lightbulb className="w-4 h-4" />
                    改善提案
                  </h5>
                  <ul className="text-sm space-y-1">
                    {analysis.recommendations.slice(0, 3).map((rec, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <ArrowRight className="w-3 h-3" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h3 className="font-medium text-lg mb-2">パフォーマンス良好</h3>
            <p className="text-sm text-muted-foreground">
              主要指標は目標を達成しており、特別な対策は不要です。
            </p>
          </div>
        )}

        {/* すべての分析結果 */}
        {analyses.length > 5 && (
          <div className="mt-6 pt-6 border-t">
            <details className="group">
              <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium hover:text-primary">
                <span>すべての分析結果を表示 ({analyses.length}件)</span>
                <ArrowRight className="w-4 h-4 group-open:rotate-90 transition-transform" />
              </summary>
              <div className="mt-4 space-y-3">
                {analyses.slice(5).map((analysis, index) => (
                  <div key={index} className="border rounded p-3 bg-gray-50">
                    <div className="flex items-center gap-2 mb-2">
                      {getSeverityIcon(analysis.severity)}
                      <span className="text-sm font-medium">{analysis.issue}</span>
                      <Badge variant="outline" className="text-xs ml-auto">
                        {analysis.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{analysis.impact}</p>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}

        {/* 分析情報 */}
        <div className="mt-6 pt-6 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>分析完了: {new Date().toLocaleString('ja-JP')}</span>
            <span>•</span>
            <span>{analyses.length}件の分析項目</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}