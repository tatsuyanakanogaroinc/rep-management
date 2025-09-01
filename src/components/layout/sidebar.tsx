'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuthContext } from '@/lib/auth-context';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  Brain,
  Target,
  TrendingUp,
  DollarSign,
  Menu,
  X,
  LogOut,
  ChevronDown,
  ChevronRight,
  Calculator
} from 'lucide-react';

interface NavigationItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  adminOnly?: boolean;
  children?: NavigationItem[];
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, userProfile, signOut } = useAuthContext();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['analytics']);

  const isAdmin = userProfile?.role === 'admin';

  const navigationItems: NavigationItem[] = [
    {
      href: '/dashboard',
      label: 'ダッシュボード',
      icon: <LayoutDashboard className="w-5 h-5" />
    },
    {
      href: '/customers',
      label: '顧客管理',
      icon: <Users className="w-5 h-5" />
    },
    {
      href: '/expenses',
      label: '支出管理',
      icon: <CreditCard className="w-5 h-5" />
    },
    {
      href: '/cohort-analysis',
      label: 'コホート分析',
      icon: <BarChart3 className="w-5 h-5" />
    },
    {
      href: '/plan-vs-actual',
      label: 'AI分析・予測',
      icon: <Brain className="w-5 h-5" />,
      badge: 'AI'
    },
    {
      href: '/targets',
      label: '目標管理',
      icon: <Target className="w-5 h-5" />
    },
    {
      href: '/monthly-planning',
      label: '月次計画',
      icon: <Calculator className="w-5 h-5" />,
      badge: 'New'
    },
    {
      href: '/monthly-report',
      label: '月次レポート',
      icon: <BarChart3 className="w-5 h-5" />
    },
    {
      href: '/daily-report',
      label: '日報',
      icon: <BarChart3 className="w-5 h-5" />
    }
  ];

  const settingsItems: NavigationItem[] = [
    {
      href: '/settings/growth-parameters',
      label: '成長パラメータ',
      icon: <TrendingUp className="w-5 h-5" />,
      adminOnly: true
    },
    {
      href: '/settings/pricing',
      label: '料金設定',
      icon: <DollarSign className="w-5 h-5" />,
      adminOnly: true
    },
    {
      href: '/settings/users',
      label: 'ユーザー管理',
      icon: <Users className="w-5 h-5" />,
      adminOnly: true
    }
  ];

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/';
    return pathname.startsWith(href);
  };

  const renderNavigationItem = (item: NavigationItem, depth = 0) => {
    if (item.adminOnly && !isAdmin) return null;

    const active = isActive(item.href);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedSections.includes(item.href);

    return (
      <div key={item.href}>
        {hasChildren ? (
          <Button
            variant="ghost"
            className={`w-full justify-start h-auto p-3 ${
              active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
            } ${depth > 0 ? 'pl-8' : ''}`}
            onClick={() => toggleSection(item.href)}
          >
            <div className="flex items-center gap-3 flex-1">
              {item.icon}
              {!isCollapsed && (
                <>
                  <span className="font-medium">{item.label}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </div>
            {!isCollapsed && (
              isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
            )}
          </Button>
        ) : (
          <Link 
            href={item.href}
            className={`block w-full p-3 rounded-md transition-colors ${
              active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-gray-100'
            } ${depth > 0 ? 'pl-8' : ''}`}
            onClick={() => setIsMobileOpen(false)}
          >
            <div className="flex items-center gap-3">
              {item.icon}
              {!isCollapsed && (
                <>
                  <span className="font-medium">{item.label}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </div>
          </Link>
        )}
        
        {/* 子項目の表示 */}
        {hasChildren && isExpanded && !isCollapsed && (
          <div className="ml-4 mt-1 space-y-1">
            {item.children?.map(child => renderNavigationItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const sidebarContent = (
    <div className={`flex flex-col h-full ${isCollapsed ? 'w-20' : 'w-64'} transition-all duration-300`}>
      {/* ヘッダー */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h2 className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                SNS Management
              </h2>
              <p className="text-xs text-muted-foreground">v1.0</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="lg:flex hidden"
          >
            <Menu className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {/* メイン機能 */}
        <div className="space-y-1">
          {navigationItems.map(item => renderNavigationItem(item))}
        </div>

        {/* 設定セクション */}
        {isAdmin && (
          <>
            <Separator className="my-4" />
            <div className="space-y-1">
              {!isCollapsed && (
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
                  設定
                </p>
              )}
              {settingsItems.map(item => renderNavigationItem(item))}
            </div>
          </>
        )}
      </nav>

      {/* ユーザー情報 */}
      <div className="p-4 border-t">
        {!isCollapsed ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {userProfile?.name?.[0] || user?.email?.[0] || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {userProfile?.name || user?.email}
                </p>
                <p className="text-xs text-muted-foreground">
                  {userProfile?.role === 'admin' ? '管理者' : 'ユーザー'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="w-full justify-start text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4 mr-2" />
              ログアウト
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="w-full p-2"
            title="ログアウト"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* デスクトップサイドバー */}
      <aside className="hidden lg:block fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-40">
        {sidebarContent}
      </aside>

      {/* モバイルサイドバー */}
      <div className="lg:hidden">
        {/* モバイルヘッダー */}
        <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 flex items-center justify-between px-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            SNS Management
          </h1>
          <div className="w-10" /> {/* スペーサー */}
        </header>

        {/* モバイルオーバーレイ */}
        {isMobileOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          >
            <div
              className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="font-bold text-lg">SNS Management</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {sidebarContent}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}