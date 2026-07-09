import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPrefixes = ['/classroom', '/mypage', '/textbooks', '/admin', '/training'];

/** 수업관리(교육 운영) 전용 로그인 화면 — 보호 대상에서 제외 */
const TRAINING_LOGIN_PATH = '/training/login';

/** 시험 목록(/exam)은 공개, 접수/로비/응시실만 로그인 필요 */
function isProtectedExamPath(pathname: string): boolean {
  return (
    /^\/exam\/[^/]+\/apply\/?$/.test(pathname) ||
    /^\/exam\/[^/]+\/lobby\/?$/.test(pathname) ||
    /^\/exam\/attempt\/[^/]+\/?$/.test(pathname)
  );
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (pathname === TRAINING_LOGIN_PATH) {
    return NextResponse.next();
  }

  const isProtected =
    isProtectedExamPath(pathname) ||
    protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = req.cookies.get('accessToken')?.value;
  if (token) {
    return NextResponse.next();
  }

  const loginUrl = req.nextUrl.clone();
  // 교육 운영 영역은 전용 수업관리 로그인 화면으로 보낸다
  loginUrl.pathname = pathname.startsWith('/training')
    ? TRAINING_LOGIN_PATH
    : '/login';
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
    '/training',
    '/training/:path*',
  ],
};

