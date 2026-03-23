import Link from 'next/link';
import { LogoHorizontal } from '@/components/layout/Logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{
        background:
          'linear-gradient(150deg, #eef2ff 0%, #dbeafe 40%, #e0f2fe 70%, #f0fdf4 100%)',
      }}
    >
      {/* 로고 */}
      <Link href="/" className="mb-8 block hover:opacity-85 transition-opacity">
        <LogoHorizontal height={80} />
      </Link>

      {/* 폼 카드 (로그인 / 회원가입) */}
      {children}

      {/* 홈 링크 */}
      <p className="mt-6 text-xs text-gray-400">
        <Link href="/" className="hover:text-gray-600 underline">
          ← 홈으로 돌아가기
        </Link>
      </p>
    </div>
  );
}
