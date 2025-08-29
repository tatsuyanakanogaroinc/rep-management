'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  User, 
  UserX, 
  UserMinus, 
  Shield, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  Trash2
} from 'lucide-react';
import { deleteUser, deactivateUser } from '@/lib/user-management';
import { useAuthContext } from '@/lib/auth-context';

interface User {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'manager' | 'member';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UserListProps {
  users: User[];
  isLoading: boolean;
}

export function UserList({ users, isLoading }: UserListProps) {
  const { userProfile } = useAuthContext();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<'delete' | 'deactivate'>('delete');

  // ユーザー削除mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ userId, email }: { userId: string; email: string }) => {
      console.log('=== MUTATION: Starting deleteUser function ===');
      const result = await deleteUser(userId, email);
      console.log('=== MUTATION: deleteUser result ===', result);
      return result;
    },
    onSuccess: (result) => {
      console.log('=== MUTATION: onSuccess callback ===', result);
      if (result.success) {
        console.log('Invalidating queries and closing dialog...');
        queryClient.invalidateQueries({ queryKey: ['user-list'] });
        setDeleteDialogOpen(false);
        setSelectedUser(null);
      } else {
        console.error('Delete result shows failure:', result);
      }
    },
    onError: (error) => {
      console.error('=== MUTATION: onError callback ===', error);
    },
  });

  // ユーザー無効化mutation
  const deactivateMutation = useMutation({
    mutationFn: async ({ userId, email }: { userId: string; email: string }) => {
      return await deactivateUser(userId, email);
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['user-list'] });
        setDeleteDialogOpen(false);
        setSelectedUser(null);
      }
    },
  });

  const handleDeleteClick = (user: User, type: 'delete' | 'deactivate') => {
    setSelectedUser(user);
    setActionType(type);
    setDeleteDialogOpen(true);
  };

  const handleConfirmAction = () => {
    if (!selectedUser) return;

    console.log('=== USER DELETION INITIATED FROM UI ===');
    console.log('Action type:', actionType);
    console.log('Target user:', selectedUser);

    if (actionType === 'delete') {
      console.log('Starting delete mutation...');
      deleteMutation.mutate({
        userId: selectedUser.id,
        email: selectedUser.email
      });
    } else {
      console.log('Starting deactivate mutation...');
      deactivateMutation.mutate({
        userId: selectedUser.id,
        email: selectedUser.email
      });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-100 text-red-800 border-red-200">管理者</Badge>;
      case 'manager':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">マネージャー</Badge>;
      default:
        return <Badge variant="outline">メンバー</Badge>;
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        <CheckCircle className="w-3 h-3 mr-1" />
        アクティブ
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
        <UserX className="w-3 h-3 mr-1" />
        無効
      </Badge>
    );
  };

  const isCurrentUser = (userId: string) => userProfile?.id === userId;

  if (isLoading) {
    return (
      <Card className="glass">
        <CardHeader>
          <CardTitle>ユーザー一覧</CardTitle>
          <CardDescription>登録済みユーザーの管理</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center justify-between p-4 rounded-lg bg-white/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                      <div className="h-3 bg-gray-200 rounded w-48"></div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            ユーザー一覧
          </CardTitle>
          <CardDescription>
            登録済みユーザーの管理 ({users.length}人)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8">
              <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">ユーザーが見つかりません</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div 
                  key={user.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-white/50 border border-gray-100 hover:bg-white/80 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm">
                          {user.name || user.email.split('@')[0]}
                        </p>
                        {isCurrentUser(user.id) && (
                          <Badge variant="outline" className="text-xs px-2">
                            現在のユーザー
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">{user.email}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        登録: {new Date(user.created_at).toLocaleDateString('ja-JP')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-1">
                      {getRoleBadge(user.role)}
                      {getStatusBadge(user.is_active)}
                    </div>
                    
                    {!isCurrentUser(user.id) && (
                      <div className="flex gap-1">
                        {user.is_active && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(user, 'deactivate')}
                            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            disabled={deactivateMutation.isPending}
                          >
                            <UserMinus className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(user, 'delete')}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* エラーメッセージ */}
          {(deleteMutation.isError || deactivateMutation.isError) && (
            <Alert className="mt-4" variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {deleteMutation.error?.message || deactivateMutation.error?.message || '操作に失敗しました'}
              </AlertDescription>
            </Alert>
          )}

          {/* 成功メッセージ */}
          {(deleteMutation.isSuccess || deactivateMutation.isSuccess) && (
            <Alert className="mt-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-green-600">
                {deleteMutation.data?.message || deactivateMutation.data?.message}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 削除確認ダイアログ */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              {actionType === 'delete' ? 'ユーザー削除の確認' : 'ユーザー無効化の確認'}
            </DialogTitle>
            <DialogDescription>
              この操作は取り消すことができません。本当に続行しますか？
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="py-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium mb-2">対象ユーザー:</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {selectedUser.name ? selectedUser.name[0].toUpperCase() : selectedUser.email[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {selectedUser.name || selectedUser.email.split('@')[0]}
                    </p>
                    <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  {actionType === 'delete' ? (
                    <>
                      <strong>削除:</strong> ユーザーのプロファイルがデータベースから完全に削除されます。
                      ログイン情報も無効になります。
                    </>
                  ) : (
                    <>
                      <strong>無効化:</strong> ユーザーのアカウントが無効化され、ログインできなくなります。
                      プロファイルは保持されます。
                    </>
                  )}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              キャンセル
            </Button>
            <Button
              variant={actionType === 'delete' ? 'destructive' : 'default'}
              onClick={handleConfirmAction}
              disabled={deleteMutation.isPending || deactivateMutation.isPending}
              className={actionType === 'deactivate' ? 'bg-orange-600 hover:bg-orange-700' : ''}
            >
              {deleteMutation.isPending || deactivateMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  処理中...
                </div>
              ) : (
                <>
                  {actionType === 'delete' ? (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      削除する
                    </>
                  ) : (
                    <>
                      <UserMinus className="w-4 h-4 mr-2" />
                      無効化する
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}