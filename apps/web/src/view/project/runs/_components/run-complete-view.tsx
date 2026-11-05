'use client';

import React, { useMemo, useRef, useState } from 'react';

import Link from 'next/link';

import type { RunComparison, TestCaseRunDetail, TestRunDetail } from '@/entities/test-run';
import { ShareButton } from '@/features/runs-share/ui/share-button';
import { useOutsideClick } from '@testea/lib';
import { cn } from '@testea/util';
import { Check, ChevronDown, ChevronLeft, MoreHorizontal } from 'lucide-react';

import {
  type HistoryTone,
  type SuiteDelta,
  type Transition,
  hasSuiteChange,
  runPeriodOf,
  shortDateOf,
  summarizeHistory,
  summarizeSuiteDeltas,
  transitionOf,
  transitionTabsOf,
} from './run-complete-model';
import { RESULT_META } from './run-detail-constants';

interface RunCompleteViewProps {
  testRun: TestRunDetail;
  comparison: RunComparison | undefined;
  projectSlug: string;
  testRunId: string;
  onEditResults: (caseRunId?: string) => void;
  onRerun: () => void;
  isRerunning: boolean;
  onAddTests: () => void;
  onAutoRun: () => void;
  showCharts: boolean;
  onToggleCharts: () => void;
  onShowShortcuts: () => void;
}

const HISTORY_TONE: Record<HistoryTone, string> = {
  fail: 'text-result-fail/85',
  pass: 'text-result-pass/85',
  blocked: 'text-result-blocked/85',
  neutral: 'text-white/50',
};

const HISTORY_BAR: Record<TestCaseRunDetail['status'], string> = {
  pass: 'bg-result-pass',
  fail: 'bg-result-fail',
  blocked: 'bg-result-blocked',
  untested: 'bg-white/15',
};

const Count = ({ label, value, tone }: { label: string; value: number; tone: string }) => (
  <span className="flex items-center gap-1">
    <span className="text-white/50">{label}</span>
    <span className={cn('font-bold', value > 0 ? tone : 'text-white/30')}>{value}</span>
  </span>
);

const ResultBars = ({
  total,
  pass,
  fail,
  blocked,
  passClass = 'bg-result-pass/[0.08]',
}: {
  total: number;
  pass: number;
  fail: number;
  blocked: number;
  passClass?: string;
}) => {
  if (total === 0) return null;
  const pct = (n: number) => `${(n / total) * 100}%`;
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex">
      <div className={passClass} style={{ width: pct(pass) }} />
      <div className="bg-result-fail/[0.09]" style={{ width: pct(fail) }} />
      <div className="bg-result-blocked/[0.09]" style={{ width: pct(blocked) }} />
    </div>
  );
};

const SuiteDeltaRow = ({ delta, hasPrevious }: { delta: SuiteDelta; hasPrevious: boolean }) => (
  <li className="relative flex items-center gap-2.5 overflow-hidden rounded-[4px] px-2 py-1">
    <ResultBars total={delta.total} pass={delta.pass} fail={delta.fail} blocked={delta.blocked} />
    <span className="relative w-[70px] shrink-0 truncate text-[13px] text-white/75">
      {delta.name}
    </span>
    <span className="relative flex min-w-0 items-center gap-2.5 text-[12px] whitespace-nowrap">
      {hasPrevious ? (
        <>
          {delta.newFail > 0 && (
            <Count label="새로 실패" value={delta.newFail} tone="text-result-fail" />
          )}
          {delta.recovered > 0 && (
            <Count label="복구" value={delta.recovered} tone="text-result-pass" />
          )}
          {delta.fail - delta.newFail > 0 && (
            <Count label="계속 실패" value={delta.fail - delta.newFail} tone="text-result-fail" />
          )}
        </>
      ) : (
        delta.fail > 0 && <Count label="실패" value={delta.fail} tone="text-result-fail" />
      )}
      {delta.blocked > 0 && <Count label="차단" value={delta.blocked} tone="text-result-blocked" />}
    </span>
    <span className="flex-1" />
    <span className="relative w-12 text-right text-[13px] font-bold text-white/90">
      {delta.passRate}%
    </span>
  </li>
);

export const RunCompleteView = ({
  testRun,
  comparison,
  projectSlug,
  testRunId,
  onEditResults,
  onRerun,
  isRerunning,
  onAddTests,
  onAutoRun,
  showCharts,
  onToggleCharts,
  onShowShortcuts,
}: RunCompleteViewProps) => {
  const cases = testRun.testCaseRuns;
  const previous = comparison?.previous ?? null;
  const hasPrevious = previous !== null;
  const tabs = transitionTabsOf(hasPrevious);

  const transitions = useMemo(() => {
    const map = new Map<string, Transition>();
    for (const tc of cases) map.set(tc.id, transitionOf(tc, comparison));
    return map;
  }, [cases, comparison]);

  const tabCounts = useMemo(() => {
    const counts: Partial<Record<Transition, number>> = {};
    for (const t of transitions.values()) counts[t] = (counts[t] ?? 0) + 1;
    return counts;
  }, [transitions]);

  const firstTab = tabs.find((t) => (tabCounts[t.value] ?? 0) > 0)?.value ?? tabs[0].value;
  const [tabChoice, setTabChoice] = useState<Transition | null>(null);
  const tab = tabChoice ?? firstTab;
  const [suiteFilter, setSuiteFilter] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [showSuiteMenu, setShowSuiteMenu] = useState(false);
  const suiteMenuRef = useRef<HTMLDivElement>(null);
  useOutsideClick(suiteMenuRef, () => setShowSuiteMenu(false), showSuiteMenu);
  const [showMore, setShowMore] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  useOutsideClick(moreRef, () => setShowMore(false), showMore);

  const suites = useMemo(() => {
    const map = new Map<string, string>();
    for (const tc of cases)
      map.set(tc.testSuiteId ?? '__unclassified__', tc.testSuiteName ?? '미분류');
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [cases]);

  const listCases = cases.filter(
    (tc) =>
      transitions.get(tc.id) === tab &&
      (suiteFilter === 'all' || (tc.testSuiteId ?? '__unclassified__') === suiteFilter)
  );

  const selected = listCases.find((tc) => tc.id === selectedId) ?? listCases[0] ?? null;
  const deltas = useMemo(() => summarizeSuiteDeltas(cases, comparison), [cases, comparison]);
  const changedDeltas = deltas.filter(hasSuiteChange);
  const unchangedCount = deltas.length - changedDeltas.length;

  const { total, pass, fail, blocked, untested } = testRun.stats;
  const passRate = total > 0 ? Math.round((pass / total) * 100) : 0;
  const diff = previous?.passRate != null ? passRate - previous.passRate : null;
  const listSuiteNames = [...new Set(listCases.map((tc) => tc.testSuiteName ?? '미분류'))];

  const menuItems: { label: string; onClick: () => void }[] = [
    { label: '결과 수정', onClick: () => onEditResults() },
    { label: '테스트 추가', onClick: onAddTests },
    { label: '자동 실행', onClick: onAutoRun },
    { label: showCharts ? '통계 차트 닫기' : '통계 차트 보기', onClick: onToggleCharts },
    { label: '키보드 단축키', onClick: onShowShortcuts },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-6 md:px-12">
      {/* 상단: 경로 · 도구 */}
      <div className="flex items-center gap-2">
        <nav aria-label="경로" className="flex min-w-0 items-center gap-2 text-[13px]">
          <Link
            href={`/projects/${projectSlug}/runs`}
            className="flex shrink-0 items-center gap-0.5 text-white/45 hover:text-white/80"
          >
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
            테스트 실행
          </Link>
          <span className="text-white/25" aria-hidden="true">
            /
          </span>
          <span className="truncate text-white/80">{testRun.name}</span>
        </nav>
        <div className="flex-1" />
        <ShareButton
          testRunId={testRunId}
          shareToken={testRun.shareToken}
          shareExpiresAt={testRun.shareExpiresAt}
          variant="text"
        />
        <button
          type="button"
          onClick={onRerun}
          disabled={isRerunning}
          className="bg-primary hover:bg-primary/90 rounded-[6px] px-3.5 py-[7px] text-[13px] font-bold whitespace-nowrap text-white disabled:opacity-60"
        >
          {isRerunning ? '만드는 중' : '다시 실행'}
        </button>
        <div className="relative shrink-0" ref={moreRef}>
          <button
            type="button"
            onClick={() => setShowMore((prev) => !prev)}
            aria-haspopup="menu"
            aria-expanded={showMore}
            aria-label="실행 메뉴 더 보기"
            className="flex h-[34px] w-[46px] items-center justify-center rounded-[6px] border border-white/[0.17] text-white/80 hover:border-white/35"
          >
            <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
          </button>
          {showMore && (
            <div
              role="menu"
              className="border-line-2 bg-bg-2 shadow-2 absolute top-full right-0 z-30 mt-1 min-w-[160px] rounded-[6px] border py-1"
            >
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setShowMore(false);
                    item.onClick();
                  }}
                  className="hover:bg-bg-3 flex w-full px-3 py-2 text-left text-[13px] text-white/80"
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 제목 */}
      <div className="mt-[18px] flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-[22px] font-bold text-white/95">{testRun.name}</h1>
        <span className="text-result-pass flex items-center gap-1.5 text-[13px] font-medium">
          <span aria-hidden="true" className="bg-result-pass size-1.5 rounded-full" />
          완료
        </span>
        <span className="text-[13px] text-white/45">{runPeriodOf(testRun.createdAt, cases)}</span>
      </div>

      {/* 요약 */}
      <section
        aria-label="실행 결과 요약"
        className="border-line-2 mt-4 flex flex-col gap-5 rounded-[10px] border px-6 py-5 lg:flex-row lg:gap-0"
      >
        <div className="flex shrink-0 flex-col gap-1 lg:pr-7">
          <p className="text-[12px] font-medium text-white/45">통과율</p>
          <p className="flex items-baseline font-bold">
            <span className="text-[44px] leading-none text-white/95">{passRate}</span>
            <span className="text-[22px] text-white/60">%</span>
          </p>
          <p className="text-[13px] font-medium text-white/45">
            {previous ? (
              <>
                직전 {previous.passRate ?? '-'}%
                {diff !== null && diff !== 0 && (
                  <>
                    {'  ·  '}
                    <span className={diff < 0 ? 'text-result-fail' : 'text-result-pass'}>
                      {Math.abs(diff)}%p {diff < 0 ? '하락' : '상승'}
                    </span>
                  </>
                )}
                {diff === 0 && '  ·  변화 없음'}
              </>
            ) : comparison ? (
              '비교할 직전 실행 없음'
            ) : (
              ' '
            )}
          </p>
        </div>

        <div aria-hidden="true" className="bg-line-2 hidden w-px self-stretch lg:block" />

        <div className="relative flex min-w-0 flex-1 flex-col gap-2.5 self-start overflow-hidden rounded-[6px] px-4 py-3 lg:mx-0">
          <ResultBars total={total} pass={pass} fail={fail} blocked={blocked} />
          <p className="relative flex items-center text-[12px] font-medium">
            <span className="text-white/45">결과 {total}건</span>
            <span className="flex-1" />
            <span className="text-white/35">미실행 {untested}</span>
          </p>
          <p className="relative flex flex-wrap items-center gap-4 text-[13px] whitespace-nowrap">
            <Count label="통과" value={pass} tone="text-result-pass" />
            <Count label="실패" value={fail} tone="text-result-fail" />
            <Count label="차단" value={blocked} tone="text-result-blocked" />
          </p>
        </div>

        <div aria-hidden="true" className="bg-line-2 hidden w-px self-stretch lg:block" />

        <div className="flex shrink-0 flex-col gap-2 lg:w-[300px] lg:pl-7">
          <p className="flex items-center text-[12px]">
            <span className="font-medium text-white/45">
              스위트별 {hasPrevious ? '변화' : '결과'}
            </span>
            <span className="flex-1" />
            {unchangedCount > 0 && (
              <span className="text-white/30">
                {hasPrevious ? '변화 없음' : '모두 통과'} {unchangedCount}개
              </span>
            )}
          </p>
          {changedDeltas.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {changedDeltas.slice(0, 3).map((delta) => (
                <SuiteDeltaRow key={delta.key} delta={delta} hasPrevious={hasPrevious} />
              ))}
            </ul>
          ) : (
            <p className="text-[12px] text-white/40">모든 스위트가 통과했습니다.</p>
          )}
          {changedDeltas.length > 3 && (
            <p className="text-[11px] text-white/35">외 {changedDeltas.length - 3}개 스위트</p>
          )}
        </div>
      </section>

      {/* 변화 탭 */}
      <div className="border-line-2 mt-[18px] flex flex-wrap items-end gap-1 border-b">
        <div
          role="tablist"
          aria-label="직전 실행 대비 변화"
          className="flex flex-wrap items-end gap-1"
        >
          {tabs.map((item) => {
            const active = tab === item.value;
            const count = tabCounts[item.value] ?? 0;
            if (item.value === 'untested' && count === 0) return null;
            return (
              <button
                key={item.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setTabChoice(item.value);
                  setSelectedId(null);
                }}
                className={cn(
                  '-mb-px flex items-center gap-2 border-b-2 px-3.5 pt-2.5 pb-3 text-[14px] whitespace-nowrap',
                  active
                    ? 'border-white/90 font-bold text-white/95'
                    : 'border-transparent font-medium text-white/60 hover:text-white/80'
                )}
              >
                {item.label}
                <span
                  className={cn(
                    'text-[13px] font-medium',
                    active ? 'text-white/60' : 'text-white/35'
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex-1" />
        <div className="relative pb-3" ref={suiteMenuRef}>
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={showSuiteMenu}
            onClick={() => setShowSuiteMenu((prev) => !prev)}
            className={cn(
              'flex items-center gap-1 text-[13px] font-medium whitespace-nowrap',
              suiteFilter !== 'all' ? 'text-primary' : 'text-white/55 hover:text-white/80'
            )}
          >
            스위트:{' '}
            <span className="max-w-[140px] truncate">
              {suiteFilter === 'all'
                ? '전체'
                : (suites.find((s) => s.id === suiteFilter)?.name ?? '전체')}
            </span>
            <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          {showSuiteMenu && (
            <div
              role="menu"
              className="border-line-2 bg-bg-2 shadow-2 absolute top-full right-0 z-30 mt-1 max-h-72 min-w-[200px] overflow-y-auto rounded-[6px] border py-1"
            >
              {[{ id: 'all', name: '전체' }, ...suites].map((suite) => {
                const checked = suiteFilter === suite.id;
                return (
                  <button
                    key={suite.id}
                    type="button"
                    role="menuitemradio"
                    aria-checked={checked}
                    onClick={() => {
                      setSuiteFilter(suite.id);
                      setSelectedId(null);
                      setShowSuiteMenu(false);
                    }}
                    className={cn(
                      'hover:bg-bg-3 flex w-full items-center gap-2 px-3 py-2 text-left text-[13px]',
                      checked ? 'text-primary' : 'text-white/75'
                    )}
                  >
                    <Check
                      className={cn('h-3.5 w-3.5 shrink-0', !checked && 'invisible')}
                      aria-hidden="true"
                    />
                    <span className="truncate">{suite.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 본문: 케이스 목록 · 비교 */}
      <div className="flex flex-col pb-10 lg:flex-row">
        <div className="flex w-full flex-col lg:w-[440px] lg:shrink-0 lg:pr-4">
          <p className="pt-3 pb-1.5 pl-[34px] text-[12px] text-white/40">
            {listCases.length}건
            {listSuiteNames.length === 1 && listCases.length > 0
              ? ` · 모두 ${listSuiteNames[0]}`
              : ''}
          </p>
          {listCases.length === 0 ? (
            <p className="py-10 text-center text-[13px] text-white/40">
              해당하는 케이스가 없습니다.
            </p>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {listCases.map((tc) => {
                const prevStatus = comparison?.previousByCase[tc.testCaseId]?.status;
                const isSelected = selected?.id === tc.id;
                return (
                  <li key={tc.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(tc.id)}
                      aria-current={isSelected ? 'true' : undefined}
                      className={cn(
                        'relative flex w-full items-center gap-3 overflow-hidden rounded-[6px] py-[11px] pr-3 pl-[34px] text-left',
                        isSelected ? 'bg-white/[0.05]' : 'hover:bg-white/[0.03]',
                        RESULT_META[tc.status].rowBg
                      )}
                    >
                      <span className="relative flex min-w-0 flex-1 flex-col gap-[5px]">
                        <span
                          className={cn(
                            'truncate text-[14px]',
                            isSelected ? 'font-bold text-white/95' : 'font-medium text-white/85'
                          )}
                        >
                          {tc.title || '제목 없음'}
                        </span>
                        <span className="flex min-w-0 items-center gap-3 text-[11px]">
                          <span className="shrink-0 font-mono text-white/38">{tc.code}</span>
                          {hasPrevious && (
                            <span className="truncate text-white/45">
                              직전{' '}
                              <span className={prevStatus ? RESULT_META[prevStatus].text : ''}>
                                {prevStatus ? RESULT_META[prevStatus].label : '없음'}
                              </span>
                            </span>
                          )}
                        </span>
                      </span>
                      {tc.comment && (
                        <span className="relative shrink-0 text-[11px] text-white/35">메모</span>
                      )}
                      <span
                        className={cn(
                          'relative shrink-0 text-[12px] font-medium',
                          RESULT_META[tc.status].text
                        )}
                      >
                        {RESULT_META[tc.status].label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {selected && (
          <CaseCompare
            testCase={selected}
            comparison={comparison}
            createdAt={testRun.createdAt}
            projectSlug={projectSlug}
            onEditResults={onEditResults}
          />
        )}
      </div>
    </div>
  );
};

const CaseCompare = ({
  testCase,
  comparison,
  createdAt,
  projectSlug,
  onEditResults,
}: {
  testCase: TestCaseRunDetail;
  comparison: RunComparison | undefined;
  createdAt: Date;
  projectSlug: string;
  onEditResults: (caseRunId?: string) => void;
}) => {
  const previous = comparison?.previous ?? null;
  const prevCase = comparison?.previousByCase[testCase.testCaseId];
  const history = comparison?.historyByCase[testCase.testCaseId] ?? [];
  const summary = summarizeHistory(history.map((h) => h.status));
  const memoLabel =
    testCase.status === 'fail' ? '실패 메모' : testCase.status === 'blocked' ? '차단 사유' : '메모';
  const memoBar =
    testCase.status === 'fail'
      ? 'bg-result-fail/70'
      : testCase.status === 'blocked'
        ? 'bg-result-blocked/70'
        : 'bg-white/30';

  return (
    <section
      aria-label="케이스 비교"
      className="border-line-2 mt-4 min-w-0 flex-1 border-t pt-6 lg:mt-0 lg:border-t-0 lg:border-l lg:pt-6 lg:pl-8"
    >
      <p className="flex min-w-0 items-center gap-2 text-[12px]">
        <span className="shrink-0 font-mono font-medium text-white/60">{testCase.code}</span>
        <span className="truncate text-white/40">{testCase.testSuiteName ?? '미분류'}</span>
      </p>
      <h2 className="mt-2 text-[18px] leading-snug font-bold break-all text-white/95">
        {testCase.title || '제목 없음'}
      </h2>

      <table className="border-line-2 mt-5 w-full overflow-hidden rounded-[8px] border text-left">
        <thead>
          <tr className="border-line-2 border-b text-[12px] text-white/45">
            <th scope="col" className="px-4 py-2.5 font-medium">
              항목
            </th>
            <th scope="col" className="px-4 py-2.5 font-medium">
              직전{previous ? ` ${shortDateOf(new Date(previous.createdAt))}` : ''}
            </th>
            <th scope="col" className="px-4 py-2.5 font-medium">
              이번 {shortDateOf(new Date(createdAt))}
            </th>
          </tr>
        </thead>
        <tbody className="text-[13px]">
          <tr className={cn('border-line-2 border-b', RESULT_META[testCase.status].rowBg)}>
            <th scope="row" className="px-4 py-2.5 font-normal text-white/75">
              결과
            </th>
            <td
              className={cn(
                'px-4 py-2.5',
                prevCase ? RESULT_META[prevCase.status].text : 'text-white/35'
              )}
            >
              {prevCase ? RESULT_META[prevCase.status].label : previous ? '포함 안 됨' : '-'}
            </td>
            <td className={cn('px-4 py-2.5 font-medium', RESULT_META[testCase.status].text)}>
              {RESULT_META[testCase.status].label}
            </td>
          </tr>
          <tr>
            <th scope="row" className="px-4 py-2.5 align-top font-normal text-white/75">
              메모
            </th>
            <td className="px-4 py-2.5 align-top break-words whitespace-pre-wrap text-white/60">
              {prevCase?.comment || '-'}
            </td>
            <td className="px-4 py-2.5 align-top break-words whitespace-pre-wrap text-white/85">
              {testCase.comment || '-'}
            </td>
          </tr>
        </tbody>
      </table>

      {testCase.comment && testCase.status !== 'pass' && (
        <div className="mt-4 flex gap-3">
          <div aria-hidden="true" className={cn('w-0.5 shrink-0 self-stretch', memoBar)} />
          <div className="flex min-w-0 flex-col gap-1.5">
            <p className="text-[12px] font-medium text-white/45">{memoLabel}</p>
            <p className="text-[13px] leading-[1.55] break-words whitespace-pre-wrap text-white/85">
              “{testCase.comment}”
            </p>
            {testCase.executedAt && (
              <p className="text-[12px] text-white/40">
                {shortDateOf(new Date(testCase.executedAt))} 기록
              </p>
            )}
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-7 flex flex-wrap items-center gap-4">
          <p className="text-[12px] text-white/40">최근 {history.length}회</p>
          <ol className="flex gap-1.5" aria-label="최근 결과">
            {history.map((h, i) => (
              <li
                key={`${h.runId}-${i}`}
                className="flex flex-col items-center gap-1"
                title={`${shortDateOf(new Date(h.executedAt))} ${RESULT_META[h.status].label}`}
              >
                <span
                  aria-hidden="true"
                  className={cn('h-2 w-[30px] rounded-[2px]', HISTORY_BAR[h.status])}
                />
                <span
                  className={cn(
                    'font-mono text-[10px]',
                    i === history.length - 1 ? 'text-white/70' : 'text-white/35'
                  )}
                >
                  {shortDateOf(new Date(h.executedAt))}
                </span>
                <span className="sr-only">{RESULT_META[h.status].label}</span>
              </li>
            ))}
          </ol>
          {summary && (
            <p className={cn('text-[12px]', HISTORY_TONE[summary.tone])}>{summary.text}</p>
          )}
        </div>
      )}

      <div className="mt-7 flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => onEditResults(testCase.id)}
          className="rounded-[6px] border border-white/[0.17] px-3.5 py-[7px] text-[13px] font-medium text-white/85 hover:border-white/35"
        >
          결과 수정
        </button>
        <div className="flex-1" />
        <Link
          href={`/projects/${projectSlug}/cases/${testCase.testCaseId}`}
          className="text-primary text-[13px] font-medium hover:underline"
        >
          케이스 열기 →
        </Link>
      </div>
    </section>
  );
};
