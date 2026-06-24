import Link from 'next/link';

import {
  CATEGORY_LABEL,
  type Challenge,
  DIFFICULTY_LABEL,
  type HttpMethod,
  TRACK_LABEL,
} from '@/shared/challenges/registry';

import { DefectReportExercise } from './defect-report-exercise';
import { PlaygroundHeader } from './playground-header';
import { TestCaseExercise } from './test-case-exercise';

const METHOD_COLOR: Record<HttpMethod, string> = {
  GET: 'text-primary',
  POST: 'text-amber-500',
  PUT: 'text-blue-600',
  PATCH: 'text-blue-600',
  DELETE: 'text-system-red',
};

export const ChallengeDetailView = ({ challenge }: { challenge: Challenge }) => {
  return (
    <div className="bg-bg-1 text-text-1 flex min-h-screen flex-col font-sans">
      <PlaygroundHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
        <Link
          href="/challenges"
          className="text-text-3 hover:text-text-1 mb-6 inline-block text-sm transition-colors"
        >
          ← 챌린지 목록
        </Link>

        <div className="mb-3 flex items-center gap-2">
          <span className="bg-bg-3 text-text-2 rounded-full px-2.5 py-1 text-xs">
            {TRACK_LABEL[challenge.track]}
          </span>
          <span className="bg-bg-3 text-text-2 rounded-full px-2.5 py-1 text-xs">
            {CATEGORY_LABEL[challenge.category]}
          </span>
          <span className="bg-bg-3 text-text-2 rounded-full px-2.5 py-1 text-xs">
            {DIFFICULTY_LABEL[challenge.difficulty]}
          </span>
          {challenge.tools.map((tool) => (
            <span key={tool} className="text-text-3 text-xs">
              {tool}
            </span>
          ))}
        </div>

        <h1 className="text-2xl font-bold sm:text-3xl">{challenge.title}</h1>
        <p className="text-text-2 mt-3 text-sm leading-relaxed">{challenge.summary}</p>

        <section className="mt-10">
          <h2 className="text-lg font-semibold">요구사항</h2>
          <ol className="text-text-2 mt-3 flex list-decimal flex-col gap-2 pl-5 text-sm leading-relaxed">
            {challenge.requirement.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ol>
        </section>

        {challenge.endpoints ? (
          <section className="mt-8">
            <h2 className="text-lg font-semibold">연습 대상 API</h2>
            <p className="text-text-2 mt-2 text-sm leading-relaxed">
              아래 엔드포인트에 HTTP 요청을 보내 응답 본문과 상태 코드를 검증하세요.
            </p>
            <p className="text-text-2 mt-3 text-sm">
              베이스 경로{' '}
              <code className="text-primary font-mono text-xs">{challenge.apiBase}</code>
            </p>

            <div className="border-line-2 bg-bg-2 mt-4 overflow-hidden rounded-xl border">
              <div className="border-line-2 text-text-3 grid grid-cols-[3.5rem_1fr_2.5rem] gap-3 border-b px-5 py-3 text-xs">
                <span>메서드</span>
                <span>경로</span>
                <span>인증</span>
              </div>
              {challenge.endpoints.map((ep) => (
                <div
                  key={`${ep.method} ${ep.path}`}
                  className="border-line-2 grid grid-cols-[3.5rem_1fr_2.5rem] items-start gap-3 border-b px-5 py-3 text-sm last:border-b-0"
                >
                  <span className={`font-mono text-xs font-semibold ${METHOD_COLOR[ep.method]}`}>
                    {ep.method}
                  </span>
                  <span className="flex flex-col gap-1">
                    <code className="text-text-1 font-mono text-xs break-all">{ep.path}</code>
                    <span className="text-text-3 text-xs">{ep.desc}</span>
                  </span>
                  <span className="text-text-3 text-xs">{ep.auth ? '필요' : '-'}</span>
                </div>
              ))}
            </div>

            {challenge.apiNote && (
              <p className="border-line-2 bg-bg-2 text-text-2 mt-4 rounded-xl border px-4 py-3 text-xs leading-relaxed">
                {challenge.apiNote}
              </p>
            )}
          </section>
        ) : challenge.knownDefects ? (
          <DefectReportExercise
            sandboxSlug={challenge.sandboxSlug}
            knownDefects={challenge.knownDefects}
          />
        ) : challenge.modelTestCases ? (
          <TestCaseExercise modelTestCases={challenge.modelTestCases} />
        ) : challenge.sandboxSlug ? (
          <section className="mt-8">
            <h2 className="text-lg font-semibold">연습 대상</h2>
            <p className="text-text-2 mt-2 text-sm leading-relaxed">
              {challenge.selectors?.length
                ? '아래 페이지를 열어 테스트를 작성하세요. 안정적인 셀렉터(data-testid)가 심어져 있습니다.'
                : '아래 페이지를 열어 직접 살펴보며 결함을 찾거나 테스트를 진행하세요.'}
            </p>
            <Link
              href={`/sandbox/${challenge.sandboxSlug}`}
              target="_blank"
              className="bg-primary rounded-button h-button-md hover:bg-primary/90 active:bg-primary/80 mt-4 inline-flex items-center justify-center px-5 text-sm font-medium text-white transition-colors"
            >
              연습 대상 열기
            </Link>

            {challenge.selectors?.length ? (
              <div className="border-line-2 bg-bg-2 mt-5 overflow-hidden rounded-xl border">
                <div className="border-line-2 text-text-3 grid grid-cols-[1fr_1.4fr] gap-4 border-b px-5 py-3 text-xs">
                  <span>셀렉터</span>
                  <span>설명</span>
                </div>
                {challenge.selectors.map((s) => (
                  <div
                    key={s.testid}
                    className="border-line-2 grid grid-cols-[1fr_1.4fr] items-center gap-4 border-b px-5 py-3 text-sm last:border-b-0"
                  >
                    <code className="text-primary font-mono text-xs">
                      [data-testid=&quot;{s.testid}&quot;]
                    </code>
                    <span className="text-text-2 text-sm">{s.desc}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        {!challenge.knownDefects && !challenge.modelTestCases && (
          <section className="border-line-3 mt-8 rounded-2xl border border-dashed p-6">
            <h2 className="text-base font-semibold">
              {challenge.track === 'manual' ? '결과 제출' : '자동 채점 제출'}
            </h2>
            <p className="text-text-3 mt-2 text-sm leading-relaxed">
              {challenge.track === 'manual'
                ? '작성한 테스트 케이스와 결함 리포트를 제출·리뷰하는 기능은 곧 제공됩니다.'
                : '작성한 테스트를 제출하면 격리된 러너가 실행해 통과/실패를 채점합니다. 곧 제공됩니다.'}
            </p>
          </section>
        )}
      </main>
    </div>
  );
};
