'use client';

import { useState } from 'react';

import type { Challenge } from '@/shared/challenges/registry';
import type { ChallengeSolution } from '@/shared/challenges/solution-types';

import { ChallengeSolutionCompare } from './challenge-solution-compare';

type ResultTab = 'result' | 'solutions' | 'ai-review';

const TABS: { id: ResultTab; label: string }[] = [
  { id: 'result', label: '결과' },
  { id: 'solutions', label: '다른 사람 풀이' },
  { id: 'ai-review', label: 'AI 리뷰' },
];

function EmptyPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="border-line-2 bg-bg-2 flex min-h-80 items-center justify-center border px-6 py-12 text-center">
      <div className="max-w-md">
        <h2 className="text-text-1 text-lg font-semibold">{title}</h2>
        <p className="text-text-3 mt-2 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export function ChallengeResultTabs({
  challenge,
  solution,
}: {
  challenge: Challenge;
  solution?: ChallengeSolution;
}) {
  const [activeTab, setActiveTab] = useState<ResultTab>('result');

  return (
    <section className="min-w-0">
      <div className="border-line-2 mb-6 flex flex-wrap gap-1 border-b">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`border-line-2 -mb-px h-10 border-b px-4 text-sm transition-colors ${
              activeTab === tab.id
                ? 'border-primary text-text-1 bg-bg-2'
                : 'text-text-3 hover:text-text-1 border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'result' && (
        <div>
          <h2 className="text-lg font-semibold">모범 풀이 포인트</h2>
          <div className="border-line-2 bg-bg-2 mt-4 border">
            {(solution?.approach?.length ? solution.approach : challenge.requirement).map(
              (item, index) => (
                <div key={item} className="border-line-2 border-b px-4 py-3 last:border-b-0">
                  <div className="flex gap-3">
                    <span className="text-primary mt-0.5 font-mono text-xs">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <p className="text-text-2 text-sm leading-relaxed">{item}</p>
                  </div>
                </div>
              )
            )}
          </div>

          {solution?.code && (
            <ChallengeSolutionCompare slug={challenge.slug} solutionCode={solution.code} />
          )}

          {!!solution?.notes?.length && (
            <section className="mt-8">
              <h2 className="text-lg font-semibold">리뷰 메모</h2>
              <ul className="text-text-2 mt-3 flex list-disc flex-col gap-2 pl-5 text-sm leading-relaxed">
                {solution.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {activeTab === 'solutions' && (
        <EmptyPanel
          title="다른 사람 풀이"
          description="추후 로그인 제출 이력을 기반으로 공개 풀이, 인기 풀이, 내 풀이 비교를 연결합니다."
        />
      )}

      {activeTab === 'ai-review' && (
        <EmptyPanel
          title="AI 리뷰"
          description="제출 코드의 테스트 범위, 단언 품질, 안정성 개선점을 AI가 요약해 주는 영역으로 확장합니다."
        />
      )}
    </section>
  );
}
