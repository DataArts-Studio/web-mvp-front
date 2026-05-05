/**
 * Next.js 미들웨어
 *
 * 프로젝트 접근 제어를 담당.
 * /projects/[slug]/* 경로에 대해 접근 토큰을 검증하고,
 * 토큰이 없거나 유효하지 않으면 접근 페이지로 리다이렉트.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 상수 직접 정의 (import 문제 방지)
const COOKIE_PREFIX = 'project_access';

/**
 * 프로젝트 접근 토큰 쿠키 이름 생성
 */
function getAccessTokenCookieName(projectName: string): string {
  const sanitized = projectName.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${COOKIE_PREFIX}_${sanitized}`;
}

/**
 * Base64URL 디코딩 (UTF-8 지원)
 */
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  // atob은 Latin-1만 지원하므로 UTF-8 디코딩 필요
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new TextDecoder('utf-8').decode(bytes);
}

/**
 * 토큰 페이로드 파싱 (검증 없이)
 */
function parseTokenPayload(token: string): { projectName: string; expiresAt: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(base64UrlDecode(parts[1]));

    if (payload.type !== 'project_access') {
      return null;
    }

    return {
      projectName: payload.projectName,
      expiresAt: payload.expiresAt,
    };
  } catch {
    return null;
  }
}

/**
 * 프로젝트 slug 추출 (URL 경로에서)
 */
function extractProjectSlug(pathname: string): string | null {
  const match = pathname.match(/^\/projects\/([^/]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * 접근 제어가 필요한 경로인지 확인
 */
function isProtectedPath(pathname: string): boolean {
  // /projects/[slug]/access 경로는 제외 (접근 페이지)
  if (pathname.match(/^\/projects\/[^/]+\/access/)) {
    return false;
  }

  // /projects/[slug]/* 경로는 보호됨
  return pathname.match(/^\/projects\/[^/]+/) !== null;
}

/**
 * 공개 경로인지 확인
 */
function isPublicPath(pathname: string): boolean {
  const publicPaths = ['/', '/docs', '/landing', '/projects'];

  if (publicPaths.includes(pathname)) {
    return true;
  }

  if (pathname === '/projects' || pathname === '/projects/') {
    return true;
  }

  return false;
}

/**
 * 프로덕션 환경에서 차단해야 하는 개발/테스트 경로인지 확인
 */
function isBlockedInProduction(pathname: string): boolean {
  const blockedPaths = ['/dev', '/sentry-example-page', '/api/sentry-example-api'];

  return blockedPaths.some(
    (blocked) => pathname === blocked || pathname.startsWith(blocked + '/')
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // console.log('[Middleware] Running for:', pathname);

  // 프로덕션 환경에서 개발/테스트 경로 차단
  if (process.env.NODE_ENV === 'production' && isBlockedInProduction(pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 공개 경로는 통과
  if (isPublicPath(pathname)) {
    // console.log('[Middleware] Public path, passing through');
    return NextResponse.next();
  }

  // 보호된 경로가 아니면 통과
  if (!isProtectedPath(pathname)) {
    // console.log('[Middleware] Not protected, passing through');
    return NextResponse.next();
  }

  // console.log('[Middleware] Protected path detected');

  // 프로젝트 slug 추출
  const projectSlug = extractProjectSlug(pathname);
  if (!projectSlug) {
    // console.log('[Middleware] No slug found, passing through');
    return NextResponse.next();
  }

  // console.log('[Middleware] Project slug:', projectSlug);

  // 접근 토큰 쿠키 확인
  const cookieName = getAccessTokenCookieName(projectSlug);
  const token = request.cookies.get(cookieName)?.value;

  // console.log('[Middleware] Cookie name:', cookieName);
  // console.log('[Middleware] Token exists:', !!token);

  // 토큰이 없으면 접근 페이지로 리다이렉트
  if (!token) {
    const accessUrl = new URL(`/projects/${encodeURIComponent(projectSlug)}/access`, request.url);
    accessUrl.searchParams.set('redirect', pathname);
    // console.log('[Middleware] No token, redirecting to:', accessUrl.toString());
    return NextResponse.redirect(accessUrl);
  }

  // 토큰 페이로드 파싱
  const payload = parseTokenPayload(token);
  if (!payload) {
    const response = NextResponse.redirect(
      new URL(`/projects/${encodeURIComponent(projectSlug)}/access?redirect=${encodeURIComponent(pathname)}`, request.url)
    );
    response.cookies.delete(cookieName);
    // console.log('[Middleware] Invalid token, redirecting');
    return response;
  }

  // 토큰 만료 확인
  const now = Math.floor(Date.now() / 1000);
  if (payload.expiresAt < now) {
    const response = NextResponse.redirect(
      new URL(`/projects/${encodeURIComponent(projectSlug)}/access?redirect=${encodeURIComponent(pathname)}&expired=true`, request.url)
    );
    response.cookies.delete(cookieName);
    // console.log('[Middleware] Token expired, redirecting');
    return response;
  }

  // 프로젝트 이름 일치 확인
  if (payload.projectName !== projectSlug) {
    const accessUrl = new URL(`/projects/${encodeURIComponent(projectSlug)}/access`, request.url);
    accessUrl.searchParams.set('redirect', pathname);
    // console.log('[Middleware] Project mismatch, redirecting');
    // console.log('[Middleware] Token projectName:', payload.projectName);
    // console.log('[Middleware] URL projectSlug:', projectSlug);
    return NextResponse.redirect(accessUrl);
  }

  // console.log('[Middleware] Token valid, allowing access');
  return NextResponse.next();
}

/**
 * 미들웨어가 적용될 경로 패턴
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
