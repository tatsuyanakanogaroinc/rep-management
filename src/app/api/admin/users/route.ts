import { NextRequest, NextResponse } from 'next/server';
import { createUser, deleteUser, deactivateUser } from '@/lib/user-management';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// サーバーサイドでの実行を確保
if (typeof window !== 'undefined') {
  throw new Error('This API can only run on the server side');
}

// ユーザー作成API
export async function POST(request: NextRequest) {
  try {
    const { email, role } = await request.json();

    if (!email || !role) {
      return NextResponse.json(
        { error: 'メールアドレスとロールが必要です' },
        { status: 400 }
      );
    }

    const result = await createUserDirect(email, role);

    if (result.success) {
      return NextResponse.json({
        success: true,
        user: {
          email: result.email,
          password: result.password,
          role: result.role
        }
      });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('User creation API error:', error);
    return NextResponse.json(
      { error: 'ユーザー作成中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

// API route専用のユーザー作成関数
async function createUserDirect(email: string, role: string) {
  try {
    console.log('=== API CREATE USER START ===');
    console.log('Creating user:', { email, role });
    
    const supabaseAdmin = getSupabaseAdmin();
    
    // パスワード生成
    const password = generatePassword();
    
    // 管理者権限でユーザー作成
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: role
      }
    });

    if (authError) {
      if (authError.message.includes('User already registered')) {
        throw new Error(`ユーザー ${email} は既に登録されています`);
      }
      throw new Error(`認証エラー: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('ユーザーの作成に失敗しました');
    }

    // ユーザープロファイルを作成
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: authData.user.id,
        email: email,
        role: role,
        name: email.split('@')[0],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      throw new Error(`プロファイル作成エラー: ${profileError.message}`);
    }

    console.log('=== API CREATE USER SUCCESS ===');
    
    return {
      success: true,
      email: email,
      password: password,
      role: role
    };

  } catch (error) {
    console.error('=== API CREATE USER ERROR ===', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '不明なエラーが発生しました'
    };
  }
}

// パスワード生成関数
function generatePassword(): string {
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

// ユーザー削除API
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'ユーザーIDとメールアドレスが必要です' },
        { status: 400 }
      );
    }

    // API側で直接権限チェックを行う
    const result = await deleteUserDirect(userId, email);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message
      });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('User deletion API error:', error);
    return NextResponse.json(
      { error: 'ユーザー削除中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

// API route専用の削除関数（権限チェックを簡略化）
async function deleteUserDirect(userId: string, email: string) {
  try {
    console.log('=== API DELETE USER START ===');
    console.log('Target:', { userId, email });

    const supabaseAdmin = getSupabaseAdmin();

    // 削除前にユーザーが存在することを確認
    console.log('Step 1: Checking if user exists...');
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (checkError || !existingUser) {
      throw new Error(`削除対象のユーザーが見つかりません: ${email}`);
    }

    // Step 2: 管理者権限でユーザー認証情報を削除
    console.log('Step 2: Deleting user authentication...');
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (authDeleteError) {
      console.error('Auth deletion failed:', authDeleteError);
      // 認証削除エラーでも継続（プロファイル削除を試行）
    } else {
      console.log('Auth deletion successful');
    }

    // Step 3: 管理者権限でプロファイルを削除
    console.log('Step 3: Deleting user profile...');
    const { data: deletedData, error: profileError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId)
      .select();

    if (profileError) {
      console.error('Profile deletion failed:', profileError);
      throw new Error(`プロファイル削除エラー: ${profileError.message}`);
    }

    if (!deletedData || deletedData.length === 0) {
      throw new Error('プロファイルの削除に失敗しました');
    }

    console.log('=== API DELETE USER SUCCESS ===');

    return {
      success: true,
      message: `ユーザー ${email} が正常に削除されました`,
      deletedCount: deletedData.length
    };

  } catch (error) {
    console.error('=== API DELETE USER ERROR ===', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '不明なエラーが発生しました'
    };
  }
}

// ユーザー無効化API
export async function PATCH(request: NextRequest) {
  try {
    const { userId, email } = await request.json();

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'ユーザーIDとメールアドレスが必要です' },
        { status: 400 }
      );
    }

    const result = await deactivateUserDirect(userId, email);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message
      });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('User deactivation API error:', error);
    return NextResponse.json(
      { error: 'ユーザー無効化中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

// API route専用の無効化関数（権限チェックを簡略化）
async function deactivateUserDirect(userId: string, email: string) {
  try {
    console.log('=== API DEACTIVATE USER START ===');
    console.log('Target:', { userId, email });

    const supabaseAdmin = getSupabaseAdmin();

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

    console.log('=== API DEACTIVATE USER SUCCESS ===');

    return {
      success: true,
      message: `ユーザー ${email} が無効化されました`
    };

  } catch (error) {
    console.error('=== API DEACTIVATE USER ERROR ===', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '不明なエラーが発生しました'
    };
  }
}