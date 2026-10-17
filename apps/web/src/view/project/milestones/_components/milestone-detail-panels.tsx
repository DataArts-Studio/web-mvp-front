'use client';

import React from 'react';

import Link from 'next/link';

import type { MilestoneWithStats } from '@/entities/milestone';
import { getLastRunFreshness } from '@/shared/lib';
import { cn } from '@testea/util';
import { ArrowRight, CheckCircle2, CircleDot, XCircle } from 'lucide-react';

import type { MilestoneRisks, SuiteProgress } from './milestone-detail-model';

type MilestoneRun = NonNullable<MilestoneWithStats['testRuns']>[number];
type MilestoneCase = NonNullable<MilestoneWithStats['testCases']>[number];

export type CaseFilter = 'all' | 'fail' | 'blockedNoReason' | 'untested';

const agoText = (date: Date | undefined) => {
  if (!date) return '';
  const days = getLastRunFreshness(date).daysSince;
  if (days === null) return '';
  return days <= 0 ? '오늘' : days === 1 ? '어제' : `${days}일 전`;
};

/** 결과 비율을 배경으로 깐 막대 (03g 행과 같은 말투) */
const resultBackground = (pass: number, fail: number, blocked: number, total: number) => {
  if (total === 0) return undefined;
  const p = (pass / total) * 100;
  const f = p + (fail / total) * 100;
  const b = f + (blocked / total) * 100;
  return `linear-gradient(to right, rgb(11 181 127 / 0.08) 0 ${p}%, rgb(252 65 65 / 0.09) ${p}% ${f}%, rgb(245 158 11 / 0.09) ${f}% ${b}%, transparent ${b}% 100%)`;
};

export const RunsTab = ({
  runs,
  projectSlug,
  milestoneId,
}: {
  runs: MilestoneRun[];
  projectSlug: string;
  milestoneId: string;
}) => {
  const sorted = [...runs].sort(
    (a, b) =>
      new Date(b.createdAt ?? b.updatedAt).getTime() -
      new Date(a.createdAt ?? a.updatedAt).getTime()
  );
  return (
    <ul>
      {sorted.map((run) => {
        const counts = run.counts ?? { pass: 0, fail: 0, blocked: 0, total: 0 };
        const recorded = counts.pass + counts.fail + counts.blocked;
        const inProgress = run.status !== 'COMPLETED';
        const rate = counts.total > 0 ? Math.round((counts.pass / counts.total) * 100) : null;
        const statusLabel =
          run.status === 'COMPLETED'
            ? counts.fail > 0
              ? '실패 있음'
              : counts.blocked > 0
                ? '차단 있음'
                : '모두 통과'
            : run.status === 'IN_PROGRESS'
              ? '진행 중'
              : '시작 전';
        return (
          <li key={run.id} className="border-b border-white/[0.06]">
            <Link
              href={`/projects/${projectSlug}/runs/${run.id}`}
              style={{
                backgroundImage: resultBackground(
                  counts.pass,
                  counts.fail,
                  counts.blocked,
                  counts.total
                ),
              }}
              className="flex items-center gap-3 px-2.5 py-3 hover:bg-white/[0.03]"
            >
              <span className="flex shrink-0" title={statusLabel}>
                {inProgress ? (
                  <CircleDot className="text-result-running h-4 w-4" aria-hidden="true" />
                ) : counts.fail > 0 || counts.blocked > 0 ? (
                  <XCircle
                    className={cn(
                      'h-4 w-4',
                      counts.fail > 0 ? 'text-result-fail' : 'text-result-blocked'
                    )}
                    aria-hidden="true"
                  />
                ) : (
                  <CheckCircle2 className="text-result-pass h-4 w-4" aria-hidden="true" />
                )}
                <span className="sr-only">{statusLabel}</span>
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-[14px] font-medium text-white/90">{run.name}</span>
                <span className="text-[11px] text-white/40">
                  {agoText(run.createdAt ?? run.updatedAt)}
                </span>
              </span>
              <span className="hidden shrink-0 text-[11px] text-white/45 sm:block">
                통과 {counts.pass} · 실패 {counts.fail} · 차단 {counts.blocked}
              </span>
              <span className="flex w-[84px] shrink-0 flex-col items-end">
                {inProgress ? (
                  <>
                    <span className="text-result-running text-[14px] font-bold">
                      {recorded}
                      <span className="font-normal text-white/40">/{counts.total}</span>
                    </span>
                    <span className="text-result-running text-[11px]">진행 중</span>
                  </>
                ) : (
                  <span className="text-[15px] font-bold text-white/95">
                    {rate === null ? '-' : `${rate}%`}
                  </span>
                )}
              </span>
            </Link>
          </li>
        );
      })}
      <li>
        <Link
          href={`/projects/${projectSlug}/runs/create?milestoneId=${milestoneId}`}
          className="block px-2.5 py-3 text-[12px] text-white/40 hover:text-white/70"
        >
          + 이 마일스톤으로 새 실행 만들기
        </Link>
      </li>
    </ul>
  );
};

const ProgressBar = ({ row }: { row: SuiteProgress }) => {
  const pct = (n: number) => (row.total > 0 ? `${(n / row.total) * 100}%` : '0%');
  return (
    <span className="flex h-1 w-full overflow-hidden rounded-[2px] bg-white/[0.08]">
      <span className="bg-result-pass h-full" style={{ width: pct(row.pass) }} />
      <span className="bg-result-fail h-full" style={{ width: pct(row.fail) }} />
      <span className="bg-result-blocked h-full" style={{ width: pct(row.blocked) }} />
    </span>
  );
};

const suiteTitle = (row: SuiteProgress) => (row.id ? row.title : '직접 추가한 케이스');
const suiteRate = (row: SuiteProgress) =>
  row.total > 0 ? Math.round(((row.pass + row.fail + row.blocked) / row.total) * 100) : 0;

export const SuitesTab = ({
  rows,
  projectSlug,
  onAddSuites,
}: {
  rows: SuiteProgress[];
  projectSlug: string;
  onAddSuites: () => void;
}) => (
  <ul>
    {rows.map((row) => {
      const content = (
        <>
          <span className="flex items-center justify-between gap-3">
            <span className="min-w-0 truncate text-[14px] text-white/90">{suiteTitle(row)}</span>
            <span className="shrink-0 text-[12px] text-white/50">
              {row.pass + row.fail + row.blocked}/{row.total} 실행 ·{' '}
              <span className="font-bold text-white/90">{suiteRate(row)}%</span>
            </span>
          </span>
          <ProgressBar row={row} />
        </>
      );
      return (
        <li key={row.id ?? 'direct'} className="border-b border-white/[0.06]">
          {row.id ? (
            <Link
              href={`/projects/${projectSlug}/suites/${row.id}`}
              className="flex flex-col gap-2 px-2.5 py-3 hover:bg-white/[0.03]"
            >
              {content}
            </Link>
          ) : (
            <div className="flex flex-col gap-2 px-2.5 py-3">{content}</div>
          )}
        </li>
      );
    })}
    <li>
      <button
        type="button"
        onClick={onAddSuites}
        className="px-2.5 py-3 text-[12px] text-white/40 hover:text-white/70"
      >
        + 스위트 추가
      </button>
    </li>
  </ul>
);

const STATUS_TEXT: Record<string, { label: string; tone: string }> = {
  pass: { label: '통과', tone: 'text-result-pass' },
  fail: { label: '실패', tone: 'text-result-fail' },
  blocked: { label: '차단', tone: 'text-result-blocked' },
};

export const CASE_FILTERS: { value: CaseFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'fail', label: '실패' },
  { value: 'blockedNoReason', label: '사유 없는 차단' },
  { value: 'untested', label: '미실행' },
];

export const matchesCaseFilter = (c: MilestoneCase, filter: CaseFilter) => {
  if (filter === 'fail') return c.lastStatus === 'fail';
  if (filter === 'blockedNoReason') return c.lastStatus === 'blocked' && !c.lastComment;
  if (filter === 'untested') return !c.lastStatus || c.lastStatus === 'untested';
  return true;
};

export const CasesTab = ({
  cases,
  filter,
  onFilterChange,
  onSelectCase,
  onAddCases,
}: {
  cases: MilestoneCase[];
  filter: CaseFilter;
  onFilterChange: (filter: CaseFilter) => void;
  onSelectCase: (id: string) => void;
  onAddCases: () => void;
}) => {
  const visible = cases.filter((c) => matchesCaseFilter(c, filter));
  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 py-2">
        <div role="group" aria-label="케이스 결과 필터" className="flex flex-wrap gap-1">
          {CASE_FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={filter === item.value}
              onClick={() => onFilterChange(item.value)}
              className={cn(
                'rounded-[4px] px-2 py-1 text-[12px]',
                filter === item.value
                  ? 'bg-white/[0.08] text-white'
                  : 'text-white/45 hover:text-white/75'
              )}
            >
              {item.label} {cases.filter((c) => matchesCaseFilter(c, item.value)).length}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onAddCases}
          className="border-line-2 h-8 rounded-[6px] border px-2.5 text-[12px] text-white/80 hover:bg-white/[0.04]"
        >
          + 케이스 추가
        </button>
      </div>
      {visible.length === 0 ? (
        <p className="py-6 text-center text-[12px] text-white/35">해당하는 케이스가 없습니다.</p>
      ) : (
        <ul>
          {visible.map((c) => {
            const status = c.lastStatus ? STATUS_TEXT[c.lastStatus] : undefined;
            return (
              <li key={c.id} className="border-b border-white/[0.05]">
                <button
                  type="button"
                  onClick={() => onSelectCase(c.id)}
                  className="flex w-full items-center gap-3 px-2.5 py-2.5 text-left hover:bg-white/[0.03]"
                >
                  <span className="w-[52px] shrink-0 font-mono text-[11px] text-white/40">
                    {c.caseKey}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] text-white/90">
                    {c.title}
                  </span>
                  {c.lastStatus === 'blocked' && c.lastComment && (
                    <span className="hidden max-w-[200px] truncate text-[11px] text-white/40 md:block">
                      {c.lastComment}
                    </span>
                  )}
                  <span
                    className={cn(
                      'w-12 shrink-0 text-right text-[12px]',
                      status?.tone ?? 'text-white/30'
                    )}
                  >
                    {status?.label ?? '미실행'}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export const MilestoneAside = ({
  suiteRows,
  risks,
  onShowCases,
}: {
  suiteRows: SuiteProgress[];
  risks: MilestoneRisks;
  onShowCases: (filter: CaseFilter) => void;
}) => {
  const riskItems: {
    count: number;
    tone: string;
    title: string;
    note: string;
    filter: CaseFilter;
  }[] = [
    {
      count: risks.failing,
      tone: 'text-result-fail',
      title: '실패',
      note: '가장 최근 결과가 실패인 케이스',
      filter: 'fail',
    },
    {
      count: risks.blockedWithoutReason,
      tone: 'text-result-blocked',
      title: '사유 없는 차단',
      note: '실행 화면에서 사유를 남겨 주세요',
      filter: 'blockedNoReason',
    },
    {
      count: risks.untested,
      tone: 'text-result-running',
      title: '미실행',
      note:
        risks.daysLeft !== null && risks.perDayNeeded !== null
          ? `남은 ${risks.daysLeft}일 기준 하루 ${risks.perDayNeeded}건`
          : '아직 결과가 없는 케이스',
      filter: 'untested',
    },
  ];

  return (
    <aside className="flex flex-col gap-6">
      <section className="flex flex-col gap-2.5">
        <h2 className="flex items-center justify-between text-[12px] font-medium text-white/50">
          스위트별 진행
          <span className="font-normal text-white/30">{suiteRows.length}개</span>
        </h2>
        {suiteRows.length === 0 ? (
          <p className="text-[12px] text-white/35">범위에 스위트가 없습니다.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {suiteRows.map((row) => (
              <li key={row.id ?? 'direct'} className="flex flex-col gap-1.5">
                <span className="flex items-baseline justify-between gap-2 text-[12px]">
                  <span className="min-w-0 truncate text-white/85">
                    {suiteTitle(row)}{' '}
                    <span className="text-[11px] text-white/35">{row.total} 케이스</span>
                  </span>
                  <span className="shrink-0 font-bold text-white/90">{suiteRate(row)}%</span>
                </span>
                <ProgressBar row={row} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-1">
        <h2 className="text-[12px] font-medium text-white/50">릴리스 위험</h2>
        <ul>
          {riskItems.map((item) => (
            <li key={item.filter} className="border-b border-white/[0.06] last:border-b-0">
              <div className="flex items-center gap-3 py-3">
                <span
                  className={cn(
                    'w-9 shrink-0 text-center text-[18px] font-bold',
                    item.count > 0 ? item.tone : 'text-white/25'
                  )}
                >
                  {item.count}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[13px] text-white/90">{item.title}</span>
                  <span className="truncate text-[11px] text-white/40">{item.note}</span>
                </span>
                {item.count > 0 && (
                  <button
                    type="button"
                    onClick={() => onShowCases(item.filter)}
                    aria-label={`${item.title} 케이스 보기`}
                    className="text-primary inline-flex shrink-0 items-center gap-1 text-[12px] hover:underline"
                  >
                    보기
                    <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
};
