import Link from 'next/link';

import { PlaygroundHeader } from '@/view/challenges/playground-header';

import { PostmanScriptTool } from './postman-script-tool';

const ENDPOINTS = [
  ['POST', '/api/practice/auth/login', '토큰 발급'],
  ['GET', '/api/practice/auth/me', '현재 사용자'],
  ['GET', '/api/practice/products', '상품 목록'],
  ['GET', '/api/practice/status/[code]', '상태 코드 시뮬레이터'],
];

export const PostmanV1PlaygroundView = () => {
  return (
    <div className="bg-bg-1 text-text-1 flex min-h-screen flex-col font-sans">
      <PlaygroundHeader containerClassName="max-w-[1600px]" />
      <main className="mx-auto w-full max-w-[1600px] flex-1 px-5 py-6 lg:px-6">
        <div className="border-line-2 mb-5 flex flex-wrap items-end justify-between gap-4 border-b pb-5">
          <div className="min-w-0">
            <Link
              href="/playground"
              className="text-text-3 hover:text-text-1 text-sm transition-colors"
            >
              ← 플레이그라운드 목록
            </Link>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="bg-primary/12 text-primary rounded px-2 py-0.5 text-xs font-medium">
                API Sandbox
              </span>
              <span className="bg-bg-3 text-text-2 rounded px-2 py-0.5 text-xs">v1</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">Postman 형식 API Sandbox v1</h1>
            <p className="text-text-2 mt-2 max-w-4xl text-sm leading-relaxed">
              제공된 데모 API를 호출하고 응답을 보면서 `pm.test` 스크립트를 바로 작성해보는 작업
              화면입니다. 채점 없이 요청과 스크립트를 원하는 만큼 바꿔볼 수 있습니다.
            </p>
          </div>

          <div className="grid min-w-full grid-cols-2 gap-2 text-xs sm:min-w-[560px] sm:grid-cols-4">
            {ENDPOINTS.map(([method, path, label]) => (
              <div key={`${method}-${path}`} className="border-line-2 rounded-md border px-3 py-2">
                <p className="text-primary font-mono font-semibold">{method}</p>
                <p className="text-text-2 mt-1 truncate font-mono">{path}</p>
                <p className="text-text-3 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <PostmanScriptTool />
      </main>
    </div>
  );
};
