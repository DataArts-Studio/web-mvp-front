'use client';
import React from 'react';

import { useRouter } from 'next/navigation';

import { DSButton } from '@testea/ui';

interface ColdStartEmptyProps {
  projectSlug: string;
}

export const ColdStartEmpty = ({ projectSlug }: ColdStartEmptyProps) => {
  const router = useRouter();

  return (
    <section className="border-line-3/40 col-span-6 flex flex-col items-start gap-3 border-t py-6">
      <div>
        <p className="text-text-1 text-sm font-semibold">추천할 실행 이력이 부족합니다.</p>
        <p className="text-text-3 mt-1 text-sm">
          회귀 실행 이력이 쌓이면 자동화 효과가 큰 케이스를 표시합니다.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <DSButton
          variant="solid"
          size="small"
          onClick={() => router.push(`/projects/${projectSlug}/runs`)}
        >
          테스트 실행으로 이동
        </DSButton>
        <DSButton
          variant="ghost"
          size="small"
          onClick={() => router.push(`/projects/${projectSlug}/suites`)}
        >
          스위트 보기
        </DSButton>
      </div>
    </section>
  );
};
