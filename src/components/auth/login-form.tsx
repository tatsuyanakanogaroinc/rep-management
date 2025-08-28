'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthContext } from '@/lib/auth-context';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuthContext();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        console.error('SignIn error:', error);
        setError(error.message);
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('SignIn catch error:', err);
      if (err instanceof Error) {
        if (err.message.includes('Failed to fetch')) {
          setError('サーバーに接続できません。インターネット接続を確認してください。');
        } else if (err.message.includes('Supabase configuration error')) {
          setError('システム設定エラーが発生しました。管理者にお問い合わせください。');
        } else if (err.message.includes('Invalid login credentials')) {
          setError('メールアドレスまたはパスワードが正しくありません。');
        } else if (err.message.includes('Email not confirmed')) {
          setError('メールアドレスが確認されていません。管理者にお問い合わせください。');
        } else {
          setError(err.message);
        }
      } else {
        setError('ログイン中にエラーが発生しました');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="glass rounded-2xl shadow-soft border-0 p-8 backdrop-blur-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive" className="border-0 bg-destructive/10 text-destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-3">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">
              メールアドレス
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 rounded-xl border-0 bg-white/50 backdrop-blur-sm shadow-soft focus:bg-white/80 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
            />
          </div>
          
          <div className="space-y-3">
            <Label htmlFor="password" className="text-sm font-medium text-foreground">
              パスワード
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="パスワードを入力"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-12 rounded-xl border-0 bg-white/50 backdrop-blur-sm shadow-soft focus:bg-white/80 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full h-12 rounded-xl gradient-primary text-white border-0 shadow-soft hover:shadow-glow transition-all duration-300 font-medium text-base disabled:opacity-50 disabled:cursor-not-allowed" 
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>ログイン中...</span>
              </div>
            ) : (
              'ログイン'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}