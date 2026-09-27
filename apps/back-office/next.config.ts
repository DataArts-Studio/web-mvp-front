import type { NextConfig } from 'next';

import path from 'node:path';

// pnpm 모노레포 루트 고정.
// - Turbopack 이 워크스페이스 루트를 잘못 추론해 next 패키지·@testea/* 워크스페이스
//   패키지를 못 잡는 빌드 에러(inferred workspace root)를 막는다.
// - OpenNext 파일 트레이싱이 워크스페이스 의존성까지 포함하도록 트레이싱 루트도 맞춘다.
// apps/back-office 기준 두 단계 위가 저장소 최상위.
const repoRoot = path.join(__dirname, '..', '..');

const nextConfig: NextConfig = {
  turbopack: {
    root: repoRoot,
  },
  outputFileTracingRoot: repoRoot,
  transpilePackages: [
    '@testea/db',
    '@testea/fetch-kit',
    '@testea/lib',
    '@testea/ui',
    '@testea/util',
  ],
  // 운영 도구라 외부 임베드가 필요 없다. 클릭재킹·MIME 스니핑·리퍼러 누출을 막는 최소 헤더.
  // 전체 CSP(script-src 등)는 Next 인라인 스크립트와 충돌 위험이 있어 frame-ancestors 만 건다.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=15552000' },
        ],
      },
    ];
  },
};

export default nextConfig;
