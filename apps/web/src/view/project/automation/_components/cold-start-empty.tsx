'use client';
import React from 'react';

import { useRouter } from 'next/navigation';

import { DSButton, EmptyState } from '@testea/ui';
import { Play, Sparkles } from 'lucide-react';

interface ColdStartEmptyProps {
  projectSlug: string;
}

/**
 * 콜드스타트 빈 상태.
 *
 * 후보·플래키가 모두 비고 실행 이력이 적을 때, 빈 목록 대신 회귀 반복 실행(TR12)
 * 동선으로 유도한다. 런 목록과 스위트로 이동하는 링크를 제공한다.
 */
export const ColdStartEmpty = ({ projectSlug }: ColdStartEmptyProps) => {
  const router = useRouter();

  return (
    <section className="rounded-4 border-line-2 bg-bg-2 col-span-6 border border-dashed">
      <EmptyState
        icon={<Sparkles className="text-text-3 h-10 w-10" aria-hidden="true" />}
        title="아직 추천할 실행 이력이 적습니다"
        description="회귀를 반복 실행해 이력을 쌓으면 자동화 효과가 큰 케이스를 추천해 드립니다."
        action={
          <div className="flex items-center gap-2">
            <DSButton
              variant="solid"
              size="small"
              className="flex items-center gap-1"
              onClick={() => router.push(`/projects/${projectSlug}/runs`)}
            >
              <Play className="h-4 w-4" aria-hidden="true" />
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
        }
      />
    </section>
  );
};
