import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPrefixes = ['/classroom', '/mypage', '/textbooks', '/admin'];

/** 시험 목록(/exam)은 공개, 접수 폼(/exam/:id/apply)만 로그인 필요 */
function isExamApplyPath(pathname: string): boolean {
  return /^\/exam\/[^/]+\/apply\/?$/.test(pathname);
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const isProtected =
    isExamApplyPath(pathname) ||
    protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = req.cookies.get('accessToken')?.value;
  if (token) {
    return NextResponse.next();
  }

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = '/login';
  loginUrl.searchParams.set('next', `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    '/classroom',
    '/classroom/:path*',
    '/mypage',
    '/mypage/:path*',
    '/textbooks',
    '/textbooks/:path*',
    '/exam/:path*',
    '/admin',
    '/admin/:path*',
  ],
};

