import type { NextConfig } from 'next';

import path from 'node:path';

// pnpm 모노레포 루트 고정.
// - Turbopack 이 워크스페이스 루트를 잘못 추론해 next 패키지·@testea/* 워크스페이스
//   패키지를 못 잡는 빌드 에러(inferred workspace root)를 막는다.
// apps/qaground 기준 두 단계 위가 저장소 최상위.
const repoRoot = path.join(__dirname, '..', '..');

// 보안 헤더(apps/web 과 동일 계열). script-src CSP 는 Monaco·GTM 등 동작 영향이 커서
// 여기서는 넣지 않고, 프레이밍 차단만 CSP frame-ancestors 로 함께 둔다.
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: repoRoot,
  },
  outputFileTracingRoot: repoRoot,
  // google-auth-library 는 Node 전용(서버에서만 import). 번들링 대신 외부화한다.
  serverExternalPackages: ['google-auth-library'],
  transpilePackages: ['@testea/db', '@testea/lib', '@testea/ui', '@testea/util'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
