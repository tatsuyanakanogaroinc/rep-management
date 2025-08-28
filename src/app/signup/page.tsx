import { SignUpForm } from '@/components/auth/signup-form';
import Link from 'next/link';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            アカウント作成
          </h1>
          <p className="text-gray-600 mb-8">
            SNS経営管理システムを始めましょう
          </p>
        </div>
        
        <SignUpForm />
        
        <div className="text-center">
          <p className="text-sm text-gray-600">
            既にアカウントをお持ちの方は{' '}
            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              こちら
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}