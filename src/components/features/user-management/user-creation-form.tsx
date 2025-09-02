'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, User, Mail, Lock, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { validateEmail } from '@/lib/user-management';

interface CreatedUser {
  email: string;
  password: string;
  role: string;
}

export function UserCreationForm() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createdUser, setCreatedUser] = useState<CreatedUser | null>(null);
  const [copiedField, setCopiedField] = useState<'email' | 'password' | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('メールアドレスを入力してください');
      return;
    }

    if (!validateEmail(email)) {
      setError('有効なメールアドレスを入力してください');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');
    setCreatedUser(null);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, role }),
      });

      const result = await response.json();

      if (result.success) {
        setCreatedUser({
          email: result.user.email,
          password: result.user.password,
          role: result.user.role
        });
        setSuccess('ユーザーが正常に作成されました！');
        setEmail(''); // フォームをリセット
      } else {
        setError(result.error || 'ユーザーの作成に失敗しました');
      }
    } catch (err) {
      setError('ユーザーの作成中にエラーが発生しました');
      console.error('User creation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, field: 'email' | 'password') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const resetForm = () => {
    setCreatedUser(null);
    setSuccess('');
    setError('');
    setEmail('');
    setRole('member');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* ユーザー作成フォーム */}
      <Card className="glass">
        <CardHeader>
          <div className="flex items-center gap-3">
            <UserPlus className="w-6 h-6 text-primary" />
            <div>
              <CardTitle>新規ユーザー作成</CardTitle>
              <CardDescription>
                メールアドレスを入力するだけで新しいユーザーアカウントを作成できます
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">メールアドレス</Label>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="flex-1"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="role">ユーザー権限</Label>
              <Select value={role} onValueChange={setRole} disabled={isLoading}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>メンバー - 基本的な機能の利用</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="manager">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>マネージャー - 分析と目標設定</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>管理者 - 全ての機能へのアクセス</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription className="text-green-600">{success}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  作成中...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  ユーザーを作成
                </div>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 作成されたユーザー情報の表示 */}
      {createdUser && (
        <Card className="glass border-green-200 bg-green-50/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <CardTitle className="text-green-800">ユーザー作成完了</CardTitle>
                  <CardDescription className="text-green-600">
                    以下の情報でユーザーがログインできます
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-100 text-green-800">
                {createdUser.role === 'admin' ? '管理者' : 
                 createdUser.role === 'manager' ? 'マネージャー' : 'メンバー'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* メールアドレス */}
            <div className="p-4 bg-white/80 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <div>
                    <Label className="text-sm font-medium">メールアドレス</Label>
                    <p className="text-lg font-mono bg-gray-100 px-3 py-1 rounded mt-1">
                      {createdUser.email}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(createdUser.email, 'email')}
                  className="flex items-center gap-1"
                >
                  {copiedField === 'email' ? (
                    <>
                      <Check className="w-4 h-4" />
                      コピー済み
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      コピー
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* パスワード */}
            <div className="p-4 bg-white/80 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-red-600" />
                  <div>
                    <Label className="text-sm font-medium">パスワード</Label>
                    <p className="text-lg font-mono bg-gray-100 px-3 py-1 rounded mt-1">
                      {createdUser.password}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(createdUser.password, 'password')}
                  className="flex items-center gap-1"
                >
                  {copiedField === 'password' ? (
                    <>
                      <Check className="w-4 h-4" />
                      コピー済み
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      コピー
                    </>
                  )}
                </Button>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>重要:</strong> このパスワードは自動生成されており、再表示されません。
                ユーザーに安全に伝達してください。初回ログイン後、パスワードの変更を推奨します。
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button onClick={resetForm} variant="outline" className="flex-1">
                <UserPlus className="w-4 h-4 mr-2" />
                続けて作成
              </Button>
              <Button 
                onClick={() => window.open('/login', '_blank')}
                className="flex-1"
              >
                <User className="w-4 h-4 mr-2" />
                ログインページを開く
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}