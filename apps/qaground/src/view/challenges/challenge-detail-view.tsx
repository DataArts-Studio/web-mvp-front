'use client';

import { type CSSProperties, type KeyboardEvent, type PointerEvent, useRef, useState } from 'react';

import Link from 'next/link';

import {
  CATEGORY_LABEL,
  CHALLENGES,
  type Challenge,
  type ChallengeDifficulty,
  DIFFICULTY_LABEL,
  type HttpMethod,
  TRACK_LABEL,
} from '@/shared/challenges/registry';

import { ApiCodeExercise } from './api-code-exercise';
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
        <span className="bg-bg-3 text-text-2 px-2.5 py-1 text-xs">
          {TRACK_LABEL[challenge.track]}
        </span>
        <span className="bg-bg-3 text-text-2 px-2.5 py-1 text-xs">
          {CATEGORY_LABEL[challenge.category]}
        </span>
        <span className="bg-bg-3 text-text-2 px-2.5 py-1 text-xs">
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

const CHALLENGE_TITLE_BY_SLUG = new Map(CHALLENGES.map((item) => [item.slug, item.title]));

function ChallengeLearningMeta({ challenge }: { challenge: Challenge }) {
  const prerequisites = challenge.prerequisites ?? [];
  const next = challenge.recommendedNext ?? [];
  if (!challenge.estimatedMinutes && prerequisites.length === 0 && next.length === 0) return null;

  const linkItems = (slugs: string[]) =>
    slugs.map((slug) => ({ slug, title: CHALLENGE_TITLE_BY_SLUG.get(slug) ?? slug }));

  return (
    <div className="border-line-2 bg-bg-2 mt-5 border-l-2 px-4 py-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {challenge.estimatedMinutes && (
          <span className="text-text-2">예상 {challenge.estimatedMinutes}분</span>
        )}
        <span className={`px-2 py-0.5 font-medium ${DIFFICULTY_BADGE[challenge.difficulty]}`}>
          {DIFFICULTY_LABEL[challenge.difficulty]}
        </span>
      </div>
      {prerequisites.length > 0 && (
        <div className="mt-3">
          <p className="text-text-3 text-xs font-medium">먼저 풀면 좋은 문제</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {linkItems(prerequisites).map((item) => (
              <Link
                key={item.slug}
                href={`/challenges/${item.slug}`}
                className="border-line-3 text-text-2 hover:text-text-1 border px-2 py-1 text-xs transition-colors"
              >
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      )}
      {next.length > 0 && (
        <div className="mt-3">
          <p className="text-text-3 text-xs font-medium">다음 추천</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {linkItems(next).map((item) => (
              <Link
                key={item.slug}
                href={`/challenges/${item.slug}`}
                className="border-line-3 text-text-2 hover:text-text-1 border px-2 py-1 text-xs transition-colors"
              >
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
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
      <div className="border-line-2 bg-bg-2 mt-3 overflow-hidden border">
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
        <p className="border-line-2 bg-bg-2 text-text-2 mt-3 border px-4 py-3 text-xs leading-relaxed">
          {challenge.apiNote}
        </p>
      )}
    </div>
  );
}

export const ChallengeDetailView = ({ challenge }: { challenge: Challenge }) => {
  const [problemPaneWidth, setProblemPaneWidth] = useState(40);
  const problemPaneWidthRef = useRef(40);
  const splitRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const splitDragRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const isAutomationCode =
    challenge.track === 'automation' && !!challenge.sandboxSlug && !!challenge.selectors?.length;
  const isApiTester = !!challenge.endpoints && !!challenge.apiBase;
  const isSplit = isAutomationCode || isApiTester;

  const splitStyle = {
    '--problem-pane-width': `${problemPaneWidth}%`,
  } as CSSProperties;

  const applyProblemPaneWidth = (nextWidth: number) => {
    const clamped = Math.min(Math.max(nextWidth, 28), 50);
    problemPaneWidthRef.current = clamped;
    splitRef.current?.style.setProperty('--problem-pane-width', `${clamped}%`);
    resizeHandleRef.current?.setAttribute('aria-valuenow', String(Math.round(clamped)));
  };

  const onProblemResizeDown = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    splitDragRef.current = { startX: event.clientX, startWidth: problemPaneWidthRef.current };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onProblemResizeMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!splitDragRef.current) return;

    const totalWidth = splitRef.current?.clientWidth ?? 1200;
    const deltaPercent = ((event.clientX - splitDragRef.current.startX) / totalWidth) * 100;
    const nextWidth = splitDragRef.current.startWidth + deltaPercent;

    applyProblemPaneWidth(nextWidth);
  };

  const onProblemResizeUp = (event: PointerEvent<HTMLDivElement>) => {
    setProblemPaneWidth(problemPaneWidthRef.current);
    splitDragRef.current = null;

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer capture can already be released if the pointer leaves the window.
    }
  };

  const onProblemResizeCancel = () => {
    setProblemPaneWidth(problemPaneWidthRef.current);
    splitDragRef.current = null;
  };

  const onProblemResizeKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const nextWidth = problemPaneWidthRef.current + (event.key === 'ArrowLeft' ? -2 : 2);
    applyProblemPaneWidth(nextWidth);
    setProblemPaneWidth(problemPaneWidthRef.current);
  };

  const resizeHandle = (
    <div
      ref={resizeHandleRef}
      role="separator"
      aria-orientation="vertical"
      aria-label="문제와 풀이 영역 너비 조절"
      aria-valuemin={28}
      aria-valuemax={50}
      aria-valuenow={Math.round(problemPaneWidth)}
      tabIndex={0}
      onPointerDown={onProblemResizeDown}
      onPointerMove={onProblemResizeMove}
      onPointerUp={onProblemResizeUp}
      onPointerCancel={onProblemResizeCancel}
      onLostPointerCapture={onProblemResizeCancel}
      onKeyDown={onProblemResizeKeyDown}
      className="border-line-2 bg-bg-2 hover:bg-primary/20 focus-visible:ring-primary group hidden w-2 shrink-0 cursor-col-resize touch-none items-center justify-center border-r border-l transition-colors focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:outline-none lg:flex"
    >
      <span aria-hidden className="bg-line-3 group-hover:bg-primary h-8 w-0.5 transition-colors" />
    </div>
  );

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
        <PlaygroundHeader containerClassName="max-w-none" />
        <div className="border-line-2 flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1.5 border-b px-4 py-2.5 sm:px-6">
          <Link
            href="/challenges"
            aria-label="챌린지 목록"
            className="text-text-3 hover:text-text-1 text-sm transition-colors"
          >
            ←
          </Link>
          <h1 className="mr-1 text-base font-semibold sm:text-lg">{challenge.title}</h1>
          <span className="bg-bg-3 text-text-2 px-2 py-0.5 text-xs">
            {TRACK_LABEL[challenge.track]}
          </span>
          <span className="bg-bg-3 text-text-2 px-2 py-0.5 text-xs">
            {CATEGORY_LABEL[challenge.category]}
          </span>
          <span
            className={`px-2 py-0.5 text-xs font-medium ${DIFFICULTY_BADGE[challenge.difficulty]}`}
          >
            {DIFFICULTY_LABEL[challenge.difficulty]}
          </span>
        </div>
        <div
          ref={splitRef}
          style={splitStyle}
          className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row"
        >
          <div className="qg-problem-scrollbar border-line-2 w-full overflow-y-auto border-b p-5 sm:p-6 lg:w-[var(--problem-pane-width)] lg:max-w-[42rem] lg:min-w-[20rem] lg:flex-none lg:border-b-0">
            <p className="text-text-2 text-sm leading-relaxed whitespace-pre-line">
              {challenge.summary}
            </p>
            <ChallengeLearningMeta challenge={challenge} />
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
                <p className="text-text-3 mt-1.5 text-xs leading-relaxed">
                  테스트 코드에서 화면 요소를 안정적으로 찾기 위한 식별자입니다. 문구가 바뀌어도
                  같은 요소를 선택할 수 있으며, 화면에 직접 보이는 문구보다 안정적인 테스트 기준으로
                  사용합니다.
                </p>
                <div className="border-line-2 bg-bg-2 mt-3 overflow-hidden border">
                  {challenge.selectors.map((s) => (
                    <div
                      key={s.testid}
                      className="border-line-2 min-w-0 border-b px-3 py-2.5 last:border-b-0"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="text-text-1 shrink-0 text-xs font-medium">{s.name}</span>
                        <code className="bg-bg-3 text-primary shrink-0 px-1.5 py-0.5 font-mono text-[11px]">
                          {s.testid}
                        </code>
                        <span className="text-text-3 min-w-0 truncate text-xs">{s.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {resizeHandle}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
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

  // API 트랙: 자동화 코드 작성 화면과 같은 풀높이 2단 레이아웃.
  if (isApiTester) {
    return (
      <div className="bg-bg-1 text-text-1 flex min-h-screen flex-col font-sans lg:h-screen lg:overflow-hidden">
        <PlaygroundHeader containerClassName="max-w-none" />
        <div className="border-line-2 flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1.5 border-b px-4 py-2.5 sm:px-6">
          <Link
            href="/challenges"
            aria-label="챌린지 목록"
            className="text-text-3 hover:text-text-1 text-sm transition-colors"
          >
            ←
          </Link>
          <h1 className="mr-1 text-base font-semibold sm:text-lg">{challenge.title}</h1>
          <span className="bg-bg-3 text-text-2 px-2 py-0.5 text-xs">
            {TRACK_LABEL[challenge.track]}
          </span>
          <span className="bg-bg-3 text-text-2 px-2 py-0.5 text-xs">
            {CATEGORY_LABEL[challenge.category]}
          </span>
          <span
            className={`px-2 py-0.5 text-xs font-medium ${DIFFICULTY_BADGE[challenge.difficulty]}`}
          >
            {DIFFICULTY_LABEL[challenge.difficulty]}
          </span>
        </div>
        <div
          ref={splitRef}
          style={splitStyle}
          className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row"
        >
          <div className="qg-problem-scrollbar border-line-2 w-full overflow-y-auto border-b p-5 sm:p-6 lg:w-[var(--problem-pane-width)] lg:max-w-[42rem] lg:min-w-[20rem] lg:flex-none lg:border-b-0">
            <p className="text-text-2 text-sm leading-relaxed whitespace-pre-line">
              {challenge.summary}
            </p>
            <ChallengeLearningMeta challenge={challenge} />
            <h2 className="mt-6 text-base font-semibold">요구사항</h2>
            <ol className="text-text-2 mt-3 flex list-decimal flex-col gap-2 pl-5 text-sm leading-relaxed">
              {challenge.requirement.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ol>
            <ApiEndpoints challenge={challenge} />
          </div>
          {resizeHandle}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <ApiCodeExercise
              apiBase={challenge.apiBase!}
              slug={challenge.slug}
              endpoints={challenge.endpoints!}
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
        <PlaygroundHeader containerClassName="max-w-7xl" />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6">
          {backLink}
          <ChallengeMeta challenge={challenge} />
          <ChallengeLearningMeta challenge={challenge} />
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
                <ApiCodeExercise
                  apiBase={challenge.apiBase!}
                  slug={challenge.slug}
                  endpoints={challenge.endpoints!}
                />
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 매뉴얼 케이스(케이스 작성·버그 찾기): 문제 읽기 흐름은 살리고 작성 영역은 풀높이 작업 화면으로 분리.
  if (challenge.modelTestCases || challenge.knownDefects) {
    return (
      <div className="bg-bg-1 text-text-1 flex min-h-screen flex-col font-sans lg:h-screen lg:overflow-hidden">
        <PlaygroundHeader containerClassName="max-w-none" />
        <div className="border-line-2 flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1.5 border-b px-4 py-2.5 sm:px-6">
          <Link
            href="/challenges"
            aria-label="챌린지 목록"
            className="text-text-3 hover:text-text-1 text-sm transition-colors"
          >
            ←
          </Link>
          <h1 className="mr-1 text-base font-semibold sm:text-lg">{challenge.title}</h1>
          <span className="bg-bg-3 text-text-2 px-2 py-0.5 text-xs">
            {TRACK_LABEL[challenge.track]}
          </span>
          <span className="bg-bg-3 text-text-2 px-2 py-0.5 text-xs">
            {CATEGORY_LABEL[challenge.category]}
          </span>
          <span
            className={`px-2 py-0.5 text-xs font-medium ${DIFFICULTY_BADGE[challenge.difficulty]}`}
          >
            {DIFFICULTY_LABEL[challenge.difficulty]}
          </span>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
          <aside className="border-line-2 overflow-y-auto border-b p-5 sm:p-6 lg:w-2/5 lg:max-w-lg lg:border-r lg:border-b-0">
            <p className="text-text-2 text-sm leading-relaxed whitespace-pre-line">
              {challenge.summary}
            </p>
            <ChallengeLearningMeta challenge={challenge} />
            <div className="mt-6">
              <RequirementList challenge={challenge} />
            </div>
            {challenge.knownDefects && challenge.sandboxSlug && (
              <div className="border-line-2 bg-bg-2 mt-6 border p-4">
                <h3 className="text-text-1 text-sm font-semibold">연습 대상</h3>
                <p className="text-text-3 mt-1 text-xs leading-relaxed">
                  결함 리포트는 실제 화면을 관찰하며 재현 절차와 실제 결과를 남기는 흐름이
                  중요합니다.
                </p>
                <Link
                  href={`/sandbox/${challenge.sandboxSlug}`}
                  target="_blank"
                  className="border-line-3 text-text-1 hover:bg-bg-3 mt-3 inline-flex h-9 items-center justify-center border px-4 text-sm transition-colors"
                >
                  연습 대상 열기 ↗
                </Link>
              </div>
            )}
          </aside>
          <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
            {challenge.knownDefects ? (
              <DefectReportExercise
                slug={challenge.slug}
                sandboxSlug={undefined}
                knownDefects={challenge.knownDefects}
              />
            ) : (
              <TestCaseExercise
                slug={challenge.slug}
                modelTestCases={challenge.modelTestCases!}
                requirements={challenge.requirement}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-1 text-text-1 flex min-h-screen flex-col font-sans">
      <PlaygroundHeader containerClassName="max-w-3xl" />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
        {backLink}
        <ChallengeMeta challenge={challenge} />
        <ChallengeLearningMeta challenge={challenge} />
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
          <TestCaseExercise
            slug={challenge.slug}
            modelTestCases={challenge.modelTestCases}
            requirements={challenge.requirement}
          />
        ) : challenge.sandboxSlug ? (
          <section className="mt-8">
            <h2 className="text-lg font-semibold">연습 대상</h2>
            <p className="text-text-2 mt-2 text-sm leading-relaxed">
              아래 페이지를 열어 직접 살펴보며 결함을 찾거나 테스트를 진행하세요.
            </p>
            <Link
              href={`/sandbox/${challenge.sandboxSlug}`}
              target="_blank"
              className="bg-primary h-button-md hover:bg-primary/90 active:bg-primary/80 mt-4 inline-flex items-center justify-center px-5 text-sm font-medium text-white transition-colors"
            >
              연습 대상 열기
            </Link>
          </section>
        ) : null}

        {!challenge.knownDefects && !challenge.modelTestCases && (
          <section className="border-line-3 mt-8 border border-dashed p-6">
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


