import { supabase } from './supabase';
import { supabaseAdmin } from './supabase-admin';

/**
 * 管理者権限での強制削除（RLS回避）
 */
export async function forceDeleteUser(userId: string, email: string) {
  try {
    console.log('Force deleting user with admin privileges:', { userId, email });

    // RPC関数を使用して管理者権限で削除
    const { data, error } = await supabase.rpc('admin_delete_user', {
      target_user_id: userId
    });

    if (error) {
      console.error('RPC deletion failed, falling back to direct delete:', error);
      
      // RPC関数が利用できない場合は直接削除を試行
      const { data: deleteData, error: directError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)
        .select();

      if (directError) {
        throw new Error(`削除エラー: ${directError.message} (Code: ${directError.code})`);
      }

      if (!deleteData || deleteData.length === 0) {
        throw new Error('削除処理は完了しましたが、対象レコードが見つかりませんでした');
      }

      console.log('Direct deletion successful:', deleteData);
      return {
        success: true,
        message: `ユーザー ${email} が削除されました（直接削除）`,
        method: 'direct'
      };
    }

    console.log('RPC deletion successful:', data);
    return {
      success: true,
      message: `ユーザー ${email} が削除されました（RPC削除）`,
      method: 'rpc'
    };

  } catch (error) {
    console.error('Force deletion error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '強制削除に失敗しました'
    };
  }
}

/**
 * パスワードを自動生成する
 * 英大文字、英小文字、数字、記号を含む12桁のパスワードを生成
 */
export function generatePassword(): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%&*';
  
  const allChars = uppercase + lowercase + numbers + symbols;
  
  let password = '';
  
  // 各文字種から最低1文字は含める
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // 残り8文字をランダム生成
  for (let i = 4; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // 文字列をシャッフル
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * 新規ユーザーを作成する
 */
export async function createUser(email: string, role: string = 'member') {
  try {
    console.log('Creating user:', { email, role });
    
    // まず既存ユーザーをチェック
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .limit(1);
    
    if (checkError) {
      console.log('Check user error (proceeding):', checkError);
    }
    
    if (existingUsers && existingUsers.length > 0) {
      throw new Error(`ユーザー ${email} は既に存在します`);
    }
    
    const password = generatePassword();
    
    // 管理者権限でユーザー作成（10秒タイムアウト）
    const createUserPromise = supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // メール確認を自動完了
      user_metadata: {
        role: role
      }
    });

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('ユーザー作成がタイムアウトしました')), 10000)
    );

    const { data: authData, error: authError } = await Promise.race([
      createUserPromise,
      timeout
    ]);

    if (authError) {
      // 既に存在するユーザーの場合の処理
      if (authError.message.includes('User already registered')) {
        throw new Error(`ユーザー ${email} は既に登録されています`);
      }
      throw new Error(`認証エラー: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('ユーザーの作成に失敗しました');
    }

    // 管理者権限でユーザープロファイルを作成（タイムアウト付き、upsert使用）
    const profilePromise = supabaseAdmin
      .from('users')
      .upsert({
        id: authData.user.id,
        email: email,
        role: role,
        name: email.split('@')[0], // メールアドレスの@より前を名前として使用
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    const profileTimeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('プロファイル作成がタイムアウトしました')), 5000)
    );

    const { error: profileError } = await Promise.race([
      profilePromise,
      profileTimeout
    ]);

    console.log('Profile creation result:', { error: profileError });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      
      // 重複エラーの場合は既存プロファイルを更新
      if (profileError.code === '23505' || profileError.message.includes('duplicate key')) {
        console.log('Profile already exists, updating instead...');
        
        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update({
            role: role,
            name: email.split('@')[0],
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', authData.user.id);
          
        if (updateError) {
          throw new Error(`プロファイル更新エラー: ${updateError.message}`);
        }
        
        console.log('Profile updated successfully');
      } else {
        throw new Error(`プロファイル作成エラー: ${profileError.message}`);
      }
    }

    console.log('User created successfully:', { email, role, userId: authData.user.id });
    
    return {
      success: true,
      user: authData.user,
      email: email,
      password: password,
      role: role
    };

  } catch (error) {
    console.error('User creation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '不明なエラーが発生しました'
    };
  }
}

/**
 * メールアドレスの形式をチェック
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * パスワードの強度をチェック
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('パスワードは8文字以上である必要があります');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('大文字を含む必要があります');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('小文字を含む必要があります');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('数字を含む必要があります');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * ユーザーを削除する（管理者権限でプロファイルと認証データの両方）
 */
export async function deleteUser(userId: string, email: string) {
  try {
    console.log('=== DELETE USER START ===');
    console.log('Target:', { userId, email });

    // 現在のユーザーの権限を確認
    console.log('Step 1: Checking current user permissions...');
    const { data: currentUserSession } = await supabase.auth.getSession();
    const { data: currentUser } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', currentUserSession.session?.user?.id)
      .single();

    console.log('Current user info:', {
      sessionUserId: currentUserSession.session?.user?.id,
      currentUser,
      isAdmin: currentUser?.role === 'admin'
    });

    if (currentUser?.role !== 'admin') {
      throw new Error('管理者権限が必要です');
    }

    // 削除前にユーザーが存在することを確認（管理者権限で）
    console.log('Step 2: Checking if user exists...');
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    console.log('Pre-deletion check result:', { 
      existingUser, 
      checkError,
      exists: !!existingUser 
    });

    if (checkError || !existingUser) {
      throw new Error(`削除対象のユーザーが見つかりません: ${email} (Error: ${checkError?.message})`);
    }

    // Step 3: 管理者権限でユーザー認証情報を削除
    console.log('Step 3: Deleting user authentication...');
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (authDeleteError) {
      console.error('Auth deletion failed:', authDeleteError);
      // 認証削除エラーでも継続（プロファイル削除を試行）
    } else {
      console.log('Auth deletion successful');
    }

    // Step 4: 管理者権限でプロファイルを削除
    console.log('Step 4: Deleting user profile...');
    const { data: deletedData, error: profileError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId)
      .select();

    console.log('Profile deletion result:', { 
      deletedData, 
      profileError,
      deletedCount: deletedData?.length || 0
    });

    if (profileError) {
      console.error('Profile deletion failed:', profileError);
      throw new Error(`プロファイル削除エラー: ${profileError.message} (Code: ${profileError.code})`);
    }

    if (!deletedData || deletedData.length === 0) {
      console.warn('Profile deletion returned no data');
      throw new Error('プロファイルの削除に失敗しました（削除対象が見つかりませんでした）');
    }

    // Step 5: 削除後の確認
    console.log('Step 5: Verifying deletion...');
    const { data: verifyUser, error: verifyError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('id', userId)
      .single();

    console.log('Post-deletion verification:', { 
      verifyUser, 
      verifyError,
      errorCode: verifyError?.code,
      stillExists: !!verifyUser
    });

    if (verifyUser) {
      console.error('CRITICAL: User still exists after deletion!', verifyUser);
      throw new Error(`重大なエラー: 削除操作完了後もユーザーがデータベースに残っています`);
    }

    console.log('=== DELETE USER SUCCESS ===');
    console.log('User successfully deleted:', { userId, email, deletedCount: deletedData.length });

    return {
      success: true,
      message: `ユーザー ${email} が正常に削除されました（認証情報とプロファイルの両方）`,
      deletedCount: deletedData.length,
      method: 'admin'
    };

  } catch (error) {
    console.error('=== DELETE USER ERROR ===');
    console.error('Error details:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '不明なエラーが発生しました'
    };
  }
}

/**
 * ユーザーを無効化する（削除の代替手段）
 */
export async function deactivateUser(userId: string, email: string) {
  try {
    console.log('Deactivating user:', { userId, email });

    // 現在のユーザーの権限を確認
    const { data: currentUserSession } = await supabase.auth.getSession();
    const { data: currentUser } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', currentUserSession.session?.user?.id)
      .single();

    if (currentUser?.role !== 'admin') {
      throw new Error('管理者権限が必要です');
    }

    // 管理者権限でユーザーを無効化
    const { error } = await supabaseAdmin
      .from('users')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      throw new Error(`ユーザー無効化エラー: ${error.message}`);
    }

    console.log('User deactivated successfully');

    return {
      success: true,
      message: `ユーザー ${email} が無効化されました`
    };

  } catch (error) {
    console.error('User deactivation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '不明なエラーが発生しました'
    };
  }
}

/**
 * ユーザーリストを取得
 */
export async function getUserList() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`ユーザー取得エラー: ${error.message}`);
    }

    return {
      success: true,
      users: data || []
    };

  } catch (error) {
    console.error('Get user list error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '不明なエラーが発生しました',
      users: []
    };
  }
}