import type { NextConfig } from 'next';

import path from 'node:path';

// pnpm 모노레포 루트 고정.
// - Turbopack 이 워크스페이스 루트를 잘못 추론해 next 패키지·@testea/* 워크스페이스
//   패키지를 못 잡는 빌드 에러(inferred workspace root)를 막는다.
// apps/qaground 기준 두 단계 위가 저장소 최상위.
const repoRoot = path.join(__dirname, '..', '..');

const nextConfig: NextConfig = {
  turbopack: {
    root: repoRoot,
  },
  outputFileTracingRoot: repoRoot,
  transpilePackages: ['@testea/lib', '@testea/ui', '@testea/util'],
};

export default nextConfig;
