'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/lib/auth-context';

interface TargetData {
  period: string;
  metric_type: string;
  target_value: number;
  unit: string;
  category?: string;
  description?: string;
  priority?: 'high' | 'medium' | 'low';
}

export function EnhancedTargetImport() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const [csvData, setCsvData] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [importMode, setImportMode] = useState<'csv' | 'manual' | 'template'>('template');
  const [previewData, setPreviewData] = useState<TargetData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 目標テンプレート（一般的なKPI）
  const defaultTargets = [
    { metric_type: 'mrr', label: 'MRR（月次経常収益）', unit: 'currency', category: '収益' },
    { metric_type: 'active_customers', label: 'アクティブ顧客数', unit: 'count', category: '顧客' },
    { metric_type: 'new_acquisitions', label: '新規獲得数', unit: 'count', category: '顧客' },
    { metric_type: 'churn_rate', label: 'チャーン率', unit: 'percentage', category: '顧客' },
    { metric_type: 'customer_lifetime_value', label: '顧客生涯価値（LTV）', unit: 'currency', category: '収益' },
    { metric_type: 'monthly_expenses', label: '月次支出', unit: 'currency', category: '費用' },
    { metric_type: 'customer_acquisition_cost', label: '顧客獲得コスト（CAC）', unit: 'currency', category: '費用' },
    { metric_type: 'daily_active_users', label: 'デイリーアクティブユーザー', unit: 'count', category: 'エンゲージメント' },
    { metric_type: 'monthly_active_users', label: 'マンスリーアクティブユーザー', unit: 'count', category: 'エンゲージメント' },
    { metric_type: 'average_session_duration', label: '平均セッション時間', unit: 'minutes', category: 'エンゲージメント' },
  ];

  // 期間オプション生成
  const generatePeriodOptions = () => {
    const options = [];
    const now = new Date();
    
    // 今月から未来12ヶ月
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const value = date.toISOString().slice(0, 7); // YYYY-MM
      const label = date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' });
      options.push({ value, label });
    }
    
    return options;
  };

  const periodOptions = generatePeriodOptions();

  // CSV解析
  const parseCsvData = (csvText: string): TargetData[] => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const data: TargetData[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      // 必要なフィールドが存在する場合のみ追加
      if (row.metric_type && row.target_value) {
        data.push({
          period: selectedPeriod || row.period,
          metric_type: row.metric_type,
          target_value: parseFloat(row.target_value) || 0,
          unit: row.unit || 'count',
          category: row.category || '',
          description: row.description || '',
          priority: row.priority || 'medium'
        });
      }
    }

    return data;
  };

  // プレビュー生成
  const generatePreview = () => {
    setError(null);
    
    if (importMode === 'csv' && csvData) {
      const parsed = parseCsvData(csvData);
      setPreviewData(parsed);
    } else if (importMode === 'template') {
      const template = defaultTargets.map(target => ({
        period: selectedPeriod,
        metric_type: target.metric_type,
        target_value: 0, // ユーザーが入力する
        unit: target.unit,
        category: target.category,
        description: `${target.label}の目標値`,
        priority: 'medium' as const
      }));
      setPreviewData(template);
    }
  };

  // インポート実行
  const importMutation = useMutation({
    mutationFn: async (targets: TargetData[]) => {
      if (!user?.id || !selectedPeriod) {
        throw new Error('ユーザーIDまたは期間が不正です');
      }

      const insertData = targets
        .filter(target => target.target_value > 0)
        .map(target => ({
          ...target,
          created_by: user.id,
          current_value: 0
        }));

      if (insertData.length === 0) {
        throw new Error('インポートするデータがありません');
      }

      // 既存の同じ期間・指標の目標を削除
      for (const target of insertData) {
        await supabase
          .from('targets')
          .delete()
          .eq('period', target.period)
          .eq('metric_type', target.metric_type);
      }

      // 新しい目標をインサート
      const { data, error } = await supabase
        .from('targets')
        .insert(insertData)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['targets'] });
      setSuccess(`${data.length}件の目標をインポートしました`);
      setCsvData('');
      setPreviewData([]);
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : 'インポートに失敗しました');
    }
  });

  // CSVテンプレートダウンロード
  const downloadTemplate = () => {
    const csvContent = [
      'metric_type,target_value,unit,category,description,priority',
      'mrr,1000000,currency,収益,月次経常収益の目標,high',
      'active_customers,500,count,顧客,アクティブ顧客数の目標,high',
      'new_acquisitions,50,count,顧客,新規獲得数の目標,medium',
      'churn_rate,5,percentage,顧客,チャーン率の上限,high'
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `target-template-${selectedPeriod || 'sample'}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            目標データインポート
          </CardTitle>
          <CardDescription>
            既存のスプレッドシートやCSVから目標データを一括インポートできます
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 期間選択 */}
          <div>
            <Label>対象期間 *</Label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="目標設定する期間を選択" />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* インポートモード選択 */}
          <div>
            <Label>インポート方法</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              <Card 
                className={`cursor-pointer transition-all ${importMode === 'template' ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setImportMode('template')}
              >
                <CardContent className="p-4 text-center">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <h4 className="font-semibold">テンプレート使用</h4>
                  <p className="text-xs text-muted-foreground">標準的なKPI目標</p>
                </CardContent>
              </Card>
              
              <Card 
                className={`cursor-pointer transition-all ${importMode === 'csv' ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setImportMode('csv')}
              >
                <CardContent className="p-4 text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <h4 className="font-semibold">CSV インポート</h4>
                  <p className="text-xs text-muted-foreground">独自データの取り込み</p>
                </CardContent>
              </Card>
              
              <Card className="cursor-pointer opacity-50">
                <CardContent className="p-4 text-center">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <h4 className="font-semibold">手動入力</h4>
                  <p className="text-xs text-muted-foreground">準備中</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* CSV入力エリア */}
          {importMode === 'csv' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>CSV データ</Label>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={downloadTemplate}
                  className="text-xs"
                >
                  <Download className="w-3 h-3 mr-1" />
                  テンプレートDL
                </Button>
              </div>
              <Textarea
                placeholder="CSVデータをここに貼り付けてください..."
                value={csvData}
                onChange={(e) => setCsvData(e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                形式: metric_type,target_value,unit,category,description,priority
              </p>
            </div>
          )}

          {/* プレビューボタン */}
          <div className="flex gap-3">
            <Button 
              onClick={generatePreview}
              disabled={!selectedPeriod || (importMode === 'csv' && !csvData)}
              variant="outline"
            >
              プレビュー生成
            </Button>
            
            {previewData.length > 0 && (
              <Button 
                onClick={() => importMutation.mutate(previewData)}
                disabled={importMutation.isPending}
                className="bg-gradient-to-r from-primary to-accent"
              >
                {importMutation.isPending ? 'インポート中...' : `${previewData.length}件をインポート`}
              </Button>
            )}
          </div>

          {/* エラー・成功メッセージ */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* プレビューテーブル */}
          {previewData.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">インポートプレビュー</h4>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 text-left">指標</th>
                      <th className="p-2 text-left">目標値</th>
                      <th className="p-2 text-left">単位</th>
                      <th className="p-2 text-left">カテゴリ</th>
                      <th className="p-2 text-left">優先度</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2 font-medium">{item.metric_type}</td>
                        <td className="p-2">
                          <Input
                            type="number"
                            value={item.target_value}
                            onChange={(e) => {
                              const updated = [...previewData];
                              updated[index].target_value = parseFloat(e.target.value) || 0;
                              setPreviewData(updated);
                            }}
                            className="w-20"
                          />
                        </td>
                        <td className="p-2">{item.unit}</td>
                        <td className="p-2">{item.category}</td>
                        <td className="p-2">
                          <Select 
                            value={item.priority} 
                            onValueChange={(value) => {
                              const updated = [...previewData];
                              updated[index].priority = value as 'high' | 'medium' | 'low';
                              setPreviewData(updated);
                            }}
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="high">高</SelectItem>
                              <SelectItem value="medium">中</SelectItem>
                              <SelectItem value="low">低</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}