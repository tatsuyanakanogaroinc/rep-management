import { NextRequest, NextResponse } from 'next/server';
import { createUser, deleteUser, deactivateUser } from '@/lib/user-management';

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

    const result = await createUser(email, role);

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

    const result = await deleteUser(userId, email);

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

    const result = await deactivateUser(userId, email);

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