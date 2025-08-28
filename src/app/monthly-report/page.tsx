'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useState } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import Link from 'next/link';
import { Download, FileText, TrendingUp, TrendingDown, Users, DollarSign } from 'lucide-react';

export default function MonthlyReportPage() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return format(now, 'yyyy-MM');
  });

  const { data: dashboardData, isLoading } = useDashboardData(selectedMonth);

  // 過去12ヶ月の選択肢を生成
  const generateMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = format(date, 'yyyy-MM');
      const label = format(date, 'yyyy年MM月', { locale: ja });
      options.push({ value, label });
    }
    return options;
  };

  const monthOptions = generateMonthOptions();

  const reportSections = [
    {
      title: '収益メトリクス',
      icon: <DollarSign className="w-5 h-5" />,
      items: [
        { label: 'MRR（月次経常収益）', value: `¥${dashboardData?.mrr?.toLocaleString() || 0}`, change: dashboardData?.mrrChange },
        { label: '月次支出', value: `¥${dashboardData?.totalExpenses?.toLocaleString() || 0}`, change: null },
        { label: '収益性', value: `¥${((dashboardData?.mrr || 0) - (dashboardData?.totalExpenses || 0)).toLocaleString()}`, change: null }
      ]
    },
    {
      title: '顧客メトリクス',
      icon: <Users className="w-5 h-5" />,
      items: [
        { label: '有料会員数', value: (dashboardData?.activeCustomers || 0).toString(), change: dashboardData?.activeCustomersChange },
        { label: '新規獲得', value: (dashboardData?.newAcquisitions || 0).toString(), change: `+${dashboardData?.newAcquisitions || 0}` },
        { label: 'チャーン数', value: (dashboardData?.churns || 0).toString(), change: null },
        { label: 'チャーン率', value: `${dashboardData?.churnRate || 0}%`, change: null }
      ]
    },
    {
      title: '運営メトリクス',
      icon: <FileText className="w-5 h-5" />,
      items: [
        { label: '日報エントリー数', value: (dashboardData?.monthlyReports || 0).toString(), change: null },
        { label: '平均日報頻度', value: `${Math.round((dashboardData?.monthlyReports || 0) / 30 * 100)}%`, change: null }
      ]
    }
  ];

  const exportReport = () => {
    const reportData = {
      month: format(new Date(selectedMonth + '-01'), 'yyyy年MM月', { locale: ja }),
      mrr: dashboardData?.mrr || 0,
      activeCustomers: dashboardData?.activeCustomers || 0,
      newAcquisitions: dashboardData?.newAcquisitions || 0,
      churns: dashboardData?.churns || 0,
      churnRate: dashboardData?.churnRate || 0,
      totalExpenses: dashboardData?.totalExpenses || 0,
      monthlyReports: dashboardData?.monthlyReports || 0,
      generatedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monthly-report-${selectedMonth}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
                    月次レポート
                  </span>
                </h1>
                <p className="text-muted-foreground mt-1">
                  {format(new Date(selectedMonth + '-01'), 'yyyy年MM月', { locale: ja })}の詳細分析
                </p>
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
                <Button 
                  onClick={exportReport}
                  className="glass hover:bg-white/20 transition-all duration-200"
                  disabled={isLoading}
                >
                  <Download className="w-4 h-4 mr-2" />
                  エクスポート
                </Button>
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
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* サマリーカード */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="glass">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">月次収益</CardTitle>
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground">
                      ¥{dashboardData?.mrr?.toLocaleString() || 0}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      前月比: {dashboardData?.mrrChange || '+0%'}
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">顧客数</CardTitle>
                      <Users className="w-5 h-5 text-blue-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground">
                      {dashboardData?.activeCustomers || 0}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      新規獲得: {dashboardData?.newAcquisitions || 0}人
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">チャーン率</CardTitle>
                      <TrendingDown className="w-5 h-5 text-orange-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground">
                      {dashboardData?.churnRate || 0}%
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      解約数: {dashboardData?.churns || 0}人
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 詳細レポートセクション */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {reportSections.map((section) => (
                  <Card key={section.title} className="glass">
                    <CardHeader>
                      <div className="flex items-center space-x-2">
                        {section.icon}
                        <CardTitle>{section.title}</CardTitle>
                      </div>
                      <CardDescription>
                        {format(new Date(selectedMonth + '-01'), 'yyyy年MM月', { locale: ja })}の{section.title}詳細
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {section.items.map((item) => (
                          <div key={item.label} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                            <span className="text-sm text-muted-foreground">{item.label}</span>
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold">{item.value}</span>
                              {item.change && (
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  item.change.startsWith('+') ? 'bg-green-100 text-green-700' : 
                                  item.change.startsWith('-') ? 'bg-red-100 text-red-700' : 
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {item.change}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}