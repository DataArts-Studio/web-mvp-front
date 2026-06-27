import Link from 'next/link';

import {
  CATEGORY_LABEL,
  type Challenge,
  type ChallengeDifficulty,
  DIFFICULTY_LABEL,
  type HttpMethod,
  TRACK_LABEL,
} from '@/shared/challenges/registry';

import { ApiTesterExercise } from './api-tester-exercise';
import { AutomationCodeExercise } from './automation-code-exercise';
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

const DIFFICULTY_BADGE: Record<ChallengeDifficulty, string> = {
  easy: 'bg-[#3fb950]/12 text-[#3fb950]',
  medium: 'bg-[#d29922]/12 text-[#d29922]',
  hard: 'bg-[#f85149]/12 text-[#f85149]',
};

function ChallengeMeta({ challenge }: { challenge: Challenge }) {
  return (
    <>
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
    </>
  );
}

function RequirementList({ challenge }: { challenge: Challenge }) {
  return (
    <>
      <h2 className="text-lg font-semibold">요구사항</h2>
      <ol className="text-text-2 mt-3 flex list-decimal flex-col gap-2 pl-5 text-sm leading-relaxed">
        {challenge.requirement.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ol>
    </>
  );
}

function ApiEndpoints({ challenge }: { challenge: Challenge }) {
  if (!challenge.endpoints) return null;
  return (
    <div className="mt-6">
      <h3 className="text-base font-semibold">연습 대상 API</h3>
      <p className="text-text-2 mt-2 text-sm">
        베이스 경로 <code className="text-primary font-mono text-xs">{challenge.apiBase}</code>
      </p>
      <div className="border-line-2 bg-bg-2 mt-3 overflow-hidden rounded-xl border">
        <div className="border-line-2 text-text-3 grid grid-cols-[3.5rem_1fr_2.5rem] gap-3 border-b px-4 py-2.5 text-xs">
          <span>메서드</span>
          <span>경로</span>
          <span>인증</span>
        </div>
        {challenge.endpoints.map((ep) => (
          <div
            key={`${ep.method} ${ep.path}`}
            className="border-line-2 grid grid-cols-[3.5rem_1fr_2.5rem] items-start gap-3 border-b px-4 py-2.5 text-sm last:border-b-0"
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
        <p className="border-line-2 bg-bg-2 text-text-2 mt-3 rounded-xl border px-4 py-3 text-xs leading-relaxed">
          {challenge.apiNote}
        </p>
      )}
    </div>
  );
}

export const ChallengeDetailView = ({ challenge }: { challenge: Challenge }) => {
  const isAutomationCode =
    challenge.track === 'automation' && !!challenge.sandboxSlug && !!challenge.selectors?.length;
  const isApiTester = !!challenge.endpoints && !!challenge.apiBase;
  const isSplit = isAutomationCode || isApiTester;

  const backLink = (
    <Link
      href="/challenges"
      className="text-text-3 hover:text-text-1 mb-6 inline-block text-sm transition-colors"
    >
      ← 챌린지 목록
    </Link>
  );

  // 자동화 코드 트랙: 프로그래머스식 풀높이 2단 (좌 문제·요구사항·셀렉터 / 우 에디터·터미널)
  if (isAutomationCode) {
    return (
      <div className="bg-bg-1 text-text-1 flex min-h-screen flex-col font-sans lg:h-screen lg:overflow-hidden">
        <PlaygroundHeader />
        <div className="border-line-2 flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1.5 border-b px-4 py-2.5 sm:px-6">
          <Link
            href="/challenges"
            aria-label="챌린지 목록"
            className="text-text-3 hover:text-text-1 text-sm transition-colors"
          >
            ←
          </Link>
          <h1 className="mr-1 text-base font-semibold sm:text-lg">{challenge.title}</h1>
          <span className="bg-bg-3 text-text-2 rounded-full px-2 py-0.5 text-xs">
            {TRACK_LABEL[challenge.track]}
          </span>
          <span className="bg-bg-3 text-text-2 rounded-full px-2 py-0.5 text-xs">
            {CATEGORY_LABEL[challenge.category]}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${DIFFICULTY_BADGE[challenge.difficulty]}`}
          >
            {DIFFICULTY_LABEL[challenge.difficulty]}
          </span>
        </div>
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <div className="border-line-2 overflow-y-auto border-b p-5 sm:p-6 lg:w-2/5 lg:max-w-lg lg:border-r lg:border-b-0">
            <p className="text-text-2 text-sm leading-relaxed whitespace-pre-line">
              {challenge.summary}
            </p>
            <h2 className="mt-6 text-base font-semibold">요구사항</h2>
            <ol className="text-text-2 mt-3 flex list-decimal flex-col gap-2 pl-5 text-sm leading-relaxed">
              {challenge.requirement.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ol>
            {!!challenge.selectors?.length && (
              <div className="mt-6">
                <h3 className="text-text-3 text-xs font-semibold tracking-wide uppercase">
                  참고 셀렉터
                </h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {challenge.selectors.map((s) => (
                    <code
                      key={s.testid}
                      title={s.desc}
                      className="bg-bg-3 text-text-2 rounded px-2 py-0.5 font-mono text-xs"
                    >
                      {s.testid}
                    </code>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex min-h-0 flex-1 flex-col">
            <AutomationCodeExercise
              slug={challenge.slug}
              sandboxSlug={challenge.sandboxSlug!}
              selectors={challenge.selectors!}
              starterSpec={challenge.starterSpec}
            />
          </div>
        </div>
      </div>
    );
  }

  // 프로그래머스식 2단: 좌 요구사항(+API 엔드포인트) / 우 작성·실행 폼
  if (isSplit) {
    return (
      <div className="bg-bg-1 text-text-1 flex min-h-screen flex-col font-sans">
        <PlaygroundHeader />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6">
          {backLink}
          <ChallengeMeta challenge={challenge} />
          <div className="mt-8 grid gap-8 lg:grid-cols-[4fr_6fr] lg:gap-10">
            <div className="lg:sticky lg:top-24 lg:self-start">
              <RequirementList challenge={challenge} />
              {isApiTester && <ApiEndpoints challenge={challenge} />}
            </div>
            <div>
              {isAutomationCode ? (
                <AutomationCodeExercise
                  slug={challenge.slug}
                  sandboxSlug={challenge.sandboxSlug!}
                  selectors={challenge.selectors!}
                  starterSpec={challenge.starterSpec}
                />
              ) : (
                <ApiTesterExercise apiBase={challenge.apiBase!} slug={challenge.slug} />
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 매뉴얼 케이스(케이스 작성·버그 찾기): 좌 문제·요구사항(sticky) / 우 작성 폼
  if (challenge.modelTestCases || challenge.knownDefects) {
    return (
      <div className="bg-bg-1 text-text-1 flex min-h-screen flex-col font-sans">
        <PlaygroundHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6">
          {backLink}
          <ChallengeMeta challenge={challenge} />
          <div className="mt-8 grid gap-8 lg:grid-cols-[2fr_3fr] lg:gap-10">
            <div className="lg:sticky lg:top-24 lg:self-start">
              <RequirementList challenge={challenge} />
            </div>
            <div>
              {challenge.knownDefects ? (
                <DefectReportExercise
                  slug={challenge.slug}
                  sandboxSlug={challenge.sandboxSlug}
                  knownDefects={challenge.knownDefects}
                />
              ) : (
                <TestCaseExercise
                  slug={challenge.slug}
                  modelTestCases={challenge.modelTestCases!}
                />
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-bg-1 text-text-1 flex min-h-screen flex-col font-sans">
      <PlaygroundHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
        {backLink}
        <ChallengeMeta challenge={challenge} />
        <section className="mt-8">
          <RequirementList challenge={challenge} />
        </section>

        {challenge.knownDefects ? (
          <DefectReportExercise
            slug={challenge.slug}
            sandboxSlug={challenge.sandboxSlug}
            knownDefects={challenge.knownDefects}
          />
        ) : challenge.modelTestCases ? (
          <TestCaseExercise slug={challenge.slug} modelTestCases={challenge.modelTestCases} />
        ) : challenge.sandboxSlug ? (
          <section className="mt-8">
            <h2 className="text-lg font-semibold">연습 대상</h2>
            <p className="text-text-2 mt-2 text-sm leading-relaxed">
              아래 페이지를 열어 직접 살펴보며 결함을 찾거나 테스트를 진행하세요.
            </p>
            <Link
              href={`/sandbox/${challenge.sandboxSlug}`}
              target="_blank"
              className="bg-primary rounded-button h-button-md hover:bg-primary/90 active:bg-primary/80 mt-4 inline-flex items-center justify-center px-5 text-sm font-medium text-white transition-colors"
            >
              연습 대상 열기
            </Link>
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
