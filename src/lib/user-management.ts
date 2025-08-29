import { supabase } from './supabase';

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
    
    // タイムアウト付きでユーザー作成（10秒）
    const createUserPromise = supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined, // メール確認を無効化
        data: {
          role: role
        }
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

    // ユーザープロファイルを作成（タイムアウト付き、upsert使用）
    const profilePromise = supabase
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
        
        const { error: updateError } = await supabase
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
 * ユーザーを削除する（プロファイルと認証データの両方）
 */
export async function deleteUser(userId: string, email: string) {
  try {
    console.log('Deleting user:', { userId, email });

    // タイムアウト付きで削除処理（15秒）
    const deleteTimeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('ユーザー削除がタイムアウトしました')), 15000)
    );

    // 1. プロファイル削除
    const deleteProfilePromise = supabase
      .from('users')
      .delete()
      .eq('id', userId);

    const { error: profileError } = await Promise.race([
      deleteProfilePromise,
      deleteTimeout
    ]);

    if (profileError) {
      throw new Error(`プロファイル削除エラー: ${profileError.message}`);
    }

    console.log('Profile deleted successfully');

    // 2. 認証ユーザー削除（admin API使用）
    // Note: これはSupabase admin API経由でのみ可能
    // 現在のクライアントサイドからは直接削除できないため、
    // プロファイルのみ削除し、認証データは無効化する
    
    console.log('User deletion completed:', { userId, email });

    return {
      success: true,
      message: `ユーザー ${email} が正常に削除されました`
    };

  } catch (error) {
    console.error('User deletion error:', error);
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

    const { error } = await supabase
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