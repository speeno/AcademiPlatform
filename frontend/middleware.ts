import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPrefixes = ['/classroom', '/mypage', '/textbooks', '/admin'];

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const isProtected = protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

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
  matcher: ['/classroom/:path*', '/mypage/:path*', '/textbooks/:path*', '/admin/:path*'],
};

