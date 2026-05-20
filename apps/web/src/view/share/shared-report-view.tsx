'use client';

import React, { useState } from 'react';

import dynamic from 'next/dynamic';
import Link from 'next/link';

import { sharedReportQueryOptions } from '@/features/runs-share';
import type {
  SharedReportCaseItem,
  SharedReportSuiteBreakdown,
} from '@/features/runs-share/api/share-actions';
import type { TestStatusData } from '@/widgets/project';
import { useQuery } from '@tanstack/react-query';
import { LoadingSpinner, RUN_STATUS_CONFIG } from '@testea/ui';
import { cn } from '@testea/util';
import {
  AlertTriangle,
  Ban,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  ClipboardList,
  Clock,
  FileText,
  FolderOpen,
  ListChecks,
  MessageSquare,
  Shield,
  Sparkles,
  XCircle,
} from 'lucide-react';

const TestStatusChart = dynamic(
  () =>
    import('@/widgets/project/ui/test-status-chart').then((mod) => ({
      default: mod.TestStatusChart,
    })),
  { ssr: false, loading: () => <div className="bg-bg-2 h-[300px] animate-pulse rounded-xl p-6" /> }
);

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatShortDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

interface SharedReportViewProps {
  token: string;
}

// ─── Status helpers ──────────────────────────────────────────────

const STATUS_ICON = {
  pass: <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />,
  fail: <XCircle className="h-3.5 w-3.5 text-red-400" />,
  blocked: <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />,
  untested: <Circle className="h-3.5 w-3.5 text-slate-400" />,
} as const;

const STATUS_LABEL = {
  pass: 'Pass',
  fail: 'Fail',
  blocked: 'Blocked',
  untested: 'Untested',
} as const;

const STATUS_DOT = {
  pass: 'bg-green-400',
  fail: 'bg-red-400',
  blocked: 'bg-amber-400',
  untested: 'bg-slate-400',
} as const;

// ─── Executive summary builder ──────────────────────────────────

function buildExecutiveSummary(stats: {
  total: number;
  pass: number;
  fail: number;
  blocked: number;
  untested: number;
  progressPercent: number;
}): string {
  const { total, pass, fail, blocked, untested, progressPercent } = stats;
  if (total === 0) return '테스트 케이스가 등록되지 않았습니다.';

  const executed = total - untested;

  if (executed === 0)
    return `전체 ${total}건의 테스트 케이스가 미실행 상태입니다. 테스트 실행을 시작해 주세요.`;

  const parts: string[] = [];
  parts.push(`전체 ${total}건 중 ${executed}건이 실행되었습니다 (진행률 ${progressPercent}%).`);

  if (fail > 0 || blocked > 0) {
    const issues: string[] = [];
    if (fail > 0) issues.push(`실패 ${fail}건`);
    if (blocked > 0) issues.push(`차단 ${blocked}건`);
    parts.push(`${issues.join(', ')}이 확인되어 조치가 필요합니다.`);
  } else if (pass === executed) {
    parts.push('실행된 모든 케이스가 통과하였습니다.');
  }

  if (untested > 0 && executed > 0) {
    parts.push(`미실행 ${untested}건이 남아있습니다.`);
  }

  return parts.join(' ');
}

// ─── Main View ───────────────────────────────────────────────────

export const SharedReportView = ({ token }: SharedReportViewProps) => {
  const { data, isLoading, isError } = useQuery(sharedReportQueryOptions(token));

  if (isLoading) {
    return (
      <div className="bg-bg-1 flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError || !data?.success) {
    const errorMessage = !data?.success
      ? data?.errors?._general?.[0]
      : '리포트를 불러올 수 없습니다.';
    return (
      <div className="bg-bg-1 text-text-1 flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
          <AlertTriangle className="h-8 w-8 text-red-400" />
        </div>
        <h1 className="text-xl font-semibold">{errorMessage}</h1>
        <p className="text-text-3 text-sm">링크가 만료되었거나 유효하지 않습니다.</p>
        <Link href="/" className="text-primary mt-2 text-sm hover:underline">
          Testea 홈으로 이동
        </Link>
      </div>
    );
  }

  const report = data.data;
  const statusInfo = RUN_STATUS_CONFIG[report.status] || RUN_STATUS_CONFIG.NOT_STARTED;
  const testStatusData: TestStatusData = {
    pass: report.stats.pass,
    fail: report.stats.fail,
    blocked: report.stats.blocked,
    untested: report.stats.untested,
  };
  const executiveSummary = buildExecutiveSummary(report.stats);
  const hasIssues = report.stats.fail > 0 || report.stats.blocked > 0;
  const passRate =
    report.stats.total > 0 ? Math.round((report.stats.pass / report.stats.total) * 100) : 0;

  return (
    <div className="bg-bg-1 text-text-1 flex min-h-screen flex-col font-sans">
      {/* ─── Report Title Bar ─────────────────────────────────── */}
      <header className="border-line-2 bg-bg-2/50 border-b">
        <div className="mx-auto max-w-5xl px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <FileText className="text-primary h-4 w-4" />
                <span className="text-text-3 text-xs font-medium tracking-wider uppercase">
                  Test Report
                </span>
              </div>
              <h1 className="mb-1 text-xl font-bold">{report.runName}</h1>
              <p className="text-text-3 text-sm">{report.projectName}</p>
            </div>
            <div className="shrink-0 text-right">
              <span
                className={cn(
                  'mb-2 inline-block rounded-md px-2.5 py-1 text-xs font-semibold',
                  statusInfo.style
                )}
              >
                {statusInfo.label}
              </span>
              <div className="text-text-4 space-y-0.5 text-[11px]">
                <p>생성 {formatShortDate(report.createdAt)}</p>
                <p>수정 {formatShortDate(report.updatedAt)}</p>
                <p>만료 {formatShortDate(report.expiresAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 space-y-6 px-6 py-6">
        {/* ═══ Section 1: Executive Summary ═══════════════════════ */}
        <ReportSection number={1} title="Executive Summary" icon={<FileText className="h-4 w-4" />}>
          <div className="bg-bg-2/60 border-line-2 rounded-lg border p-4">
            <p
              className={cn(
                'text-sm leading-relaxed',
                hasIssues
                  ? 'text-amber-300'
                  : report.stats.untested === 0 && report.stats.total > 0
                    ? 'text-green-300'
                    : 'text-text-2'
              )}
            >
              {executiveSummary}
            </p>
          </div>

          {/* KPI Row */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <KpiCard
              label="진행률"
              value={`${report.stats.progressPercent}%`}
              sub={`${report.stats.total - report.stats.untested} / ${report.stats.total}건 실행`}
              accent={report.stats.progressPercent === 100 ? 'text-green-400' : 'text-primary'}
            />
            <KpiCard
              label="통과율"
              value={`${passRate}%`}
              sub={`${report.stats.pass} / ${report.stats.total}건 통과`}
              accent={
                passRate === 100
                  ? 'text-green-400'
                  : passRate >= 80
                    ? 'text-text-1'
                    : 'text-amber-400'
              }
            />
            <KpiCard
              label="이슈"
              value={`${report.stats.fail + report.stats.blocked}건`}
              sub={`실패 ${report.stats.fail} · 차단 ${report.stats.blocked}`}
              accent={hasIssues ? 'text-red-400' : 'text-green-400'}
            />
          </div>

          {/* AI Analysis */}
          {report.aiSummary && (
            <div className="bg-primary/5 border-primary/20 mt-4 rounded-lg border p-4">
              <div className="mb-2 flex items-center gap-1.5">
                <Sparkles className="text-primary h-3.5 w-3.5" />
                <span className="text-primary text-[11px] font-semibold tracking-wider uppercase">
                  AI Analysis
                </span>
              </div>
              <div className="text-text-2 text-sm leading-relaxed">
                {report.aiSummary
                  .split('\n')
                  .filter(Boolean)
                  .map((line, i) => (
                    <p key={i} className="mb-1 last:mb-0">
                      {line}
                    </p>
                  ))}
              </div>
            </div>
          )}
        </ReportSection>

        {/* ═══ Section 2: 테스트 현황 ═════════════════════════════ */}
        <ReportSection number={2} title="테스트 현황" icon={<BarChart3 className="h-4 w-4" />}>
          {/* Progress bar */}
          <div className="mb-4 flex items-center gap-3">
            <div className="bg-bg-4 h-2.5 flex-1 overflow-hidden rounded-full">
              <div className="flex h-full">
                {report.stats.pass > 0 && (
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{ width: `${(report.stats.pass / report.stats.total) * 100}%` }}
                  />
                )}
                {report.stats.fail > 0 && (
                  <div
                    className="h-full bg-red-500 transition-all"
                    style={{ width: `${(report.stats.fail / report.stats.total) * 100}%` }}
                  />
                )}
                {report.stats.blocked > 0 && (
                  <div
                    className="h-full bg-amber-500 transition-all"
                    style={{ width: `${(report.stats.blocked / report.stats.total) * 100}%` }}
                  />
                )}
              </div>
            </div>
            <span className="text-text-1 w-12 text-right text-sm font-bold tabular-nums">
              {report.stats.progressPercent}%
            </span>
          </div>

          {/* Status breakdown grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatusMetric status="pass" count={report.stats.pass} total={report.stats.total} />
            <StatusMetric status="fail" count={report.stats.fail} total={report.stats.total} />
            <StatusMetric
              status="blocked"
              count={report.stats.blocked}
              total={report.stats.total}
            />
            <StatusMetric
              status="untested"
              count={report.stats.untested}
              total={report.stats.total}
            />
          </div>

          {/* Chart */}
          {report.stats.total > 0 && (
            <div className="mt-4">
              <TestStatusChart data={testStatusData} />
            </div>
          )}
        </ReportSection>

        {/* ═══ Section 3: 스위트별 분석 ═══════════════════════════ */}
        {report.suiteBreakdown.length > 0 && (
          <ReportSection number={3} title="스위트별 분석" icon={<FolderOpen className="h-4 w-4" />}>
            <div className="border-line-2 overflow-hidden rounded-lg border">
              {/* Table header */}
              <div className="text-text-3 border-line-2 bg-bg-3/80 grid grid-cols-[1fr_56px_56px_56px_56px_56px_72px] gap-1 border-b px-4 py-2 text-[11px] font-semibold tracking-wider uppercase">
                <span>스위트명</span>
                <span className="text-center">전체</span>
                <span className="text-center">Pass</span>
                <span className="text-center">Fail</span>
                <span className="text-center">Block</span>
                <span className="text-center">N/A</span>
                <span className="text-right">통과율</span>
              </div>
              {report.suiteBreakdown.map((suite, i) => (
                <SuiteRow
                  key={suite.suiteName}
                  suite={suite}
                  total={report.stats.total}
                  isLast={i === report.suiteBreakdown.length - 1}
                />
              ))}
            </div>
          </ReportSection>
        )}

        {/* ═══ Section 4: 이슈 케이스 (실패 + 차단) ═══════════════ */}
        {(report.failedCases.length > 0 || report.blockedCases.length > 0) && (
          <ReportSection
            number={report.suiteBreakdown.length > 0 ? 4 : 3}
            title="이슈 케이스"
            icon={<Shield className="h-4 w-4" />}
            badge={
              <span className="rounded bg-red-400/10 px-2 py-0.5 text-[11px] font-semibold text-red-400">
                {report.failedCases.length + report.blockedCases.length}건
              </span>
            }
          >
            {report.failedCases.length > 0 && (
              <div className="mb-4">
                <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-red-400">
                  <XCircle className="h-3.5 w-3.5" />
                  실패 ({report.failedCases.length}건)
                </h4>
                <CaseTable cases={report.failedCases} status="fail" />
              </div>
            )}
            {report.blockedCases.length > 0 && (
              <div>
                <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                  <Ban className="h-3.5 w-3.5" />
                  차단 ({report.blockedCases.length}건)
                </h4>
                <CaseTable cases={report.blockedCases} status="blocked" />
              </div>
            )}
          </ReportSection>
        )}

        {/* ═══ Section 5: 전체 케이스 목록 ═════════════════════════ */}
        {report.allCases.length > 0 && (
          <ReportSection
            number={
              (report.suiteBreakdown.length > 0 ? 3 : 2) +
              (report.failedCases.length > 0 || report.blockedCases.length > 0 ? 1 : 0) +
              1
            }
            title="전체 케이스 목록"
            icon={<ClipboardList className="h-4 w-4" />}
            badge={
              <span className="text-text-3 bg-bg-3 rounded px-2 py-0.5 text-[11px] font-semibold">
                {report.allCases.length}건
              </span>
            }
          >
            <AllCasesTable cases={report.allCases} />
          </ReportSection>
        )}
      </main>

      {/* ─── Footer ─────────────────────────────────────────── */}
      <footer className="border-line-2 mt-auto border-t py-5">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6">
          <p className="text-text-4 text-[11px]">리포트 만료일: {formatDate(report.expiresAt)}</p>
          <Link href="/" className="text-text-3 hover:text-primary text-xs transition-colors">
            Powered by <span className="font-semibold">Testea</span>
          </Link>
        </div>
      </footer>
    </div>
  );
};

// ─── Report Section wrapper ─────────────────────────────────────

const ReportSection = ({
  number,
  title,
  icon,
  badge,
  children,
}: {
  number: number;
  title: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <section>
    <div className="border-line-2 mb-3 flex items-center gap-3 border-b pb-2">
      <span className="bg-primary/10 text-primary flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold">
        {number}
      </span>
      <span className="text-text-3">{icon}</span>
      <h2 className="text-text-1 text-sm font-bold tracking-wide uppercase">{title}</h2>
      {badge}
    </div>
    {children}
  </section>
);

// ─── KPI Card ────────────────────────────────────────────────────

const KpiCard = ({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent: string;
}) => (
  <div className="bg-bg-2 border-line-2 rounded-lg border px-4 py-3">
    <p className="text-text-3 mb-1 text-[11px] font-medium tracking-wider uppercase">{label}</p>
    <p className={cn('text-2xl font-bold tabular-nums', accent)}>{value}</p>
    <p className="text-text-4 mt-0.5 text-[11px]">{sub}</p>
  </div>
);

// ─── Status metric ───────────────────────────────────────────────

const StatusMetric = ({
  status,
  count,
  total,
}: {
  status: keyof typeof STATUS_ICON;
  count: number;
  total: number;
}) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="bg-bg-2 border-line-2 flex items-center gap-3 rounded-lg border p-3">
      <div className={cn('h-2 w-2 shrink-0 rounded-full', STATUS_DOT[status])} />
      <div className="min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="text-text-1 text-lg font-bold tabular-nums">{count}</span>
          <span className="text-text-4 text-[11px] tabular-nums">({pct}%)</span>
        </div>
        <p className="text-text-3 text-[11px]">{STATUS_LABEL[status]}</p>
      </div>
    </div>
  );
};

// ─── Suite row ───────────────────────────────────────────────────

const SuiteRow = ({
  suite,
  total,
  isLast,
}: {
  suite: SharedReportSuiteBreakdown;
  total: number;
  isLast: boolean;
}) => (
  <div
    className={cn(
      'hover:bg-bg-3/40 grid grid-cols-[1fr_56px_56px_56px_56px_56px_72px] gap-1 px-4 py-2 text-sm transition-colors',
      !isLast && 'border-line-2/50 border-b'
    )}
  >
    <div className="flex min-w-0 items-center gap-2">
      <FolderOpen className="text-text-4 h-3 w-3 shrink-0" />
      <span className="text-text-1 truncate text-xs">{suite.suiteName}</span>
    </div>
    <span className="text-text-2 text-center text-xs tabular-nums">{suite.total}</span>
    <span
      className={cn(
        'text-center text-xs tabular-nums',
        suite.pass > 0 ? 'text-green-400' : 'text-text-4'
      )}
    >
      {suite.pass}
    </span>
    <span
      className={cn(
        'text-center text-xs tabular-nums',
        suite.fail > 0 ? 'font-semibold text-red-400' : 'text-text-4'
      )}
    >
      {suite.fail}
    </span>
    <span
      className={cn(
        'text-center text-xs tabular-nums',
        suite.blocked > 0 ? 'text-amber-400' : 'text-text-4'
      )}
    >
      {suite.blocked}
    </span>
    <span
      className={cn(
        'text-center text-xs tabular-nums',
        suite.untested > 0 ? 'text-slate-400' : 'text-text-4'
      )}
    >
      {suite.untested}
    </span>
    <div className="flex items-center justify-end gap-1.5">
      <div className="bg-bg-4 h-1.5 w-10 overflow-hidden rounded-full">
        <div className="h-full rounded-full bg-green-500" style={{ width: `${suite.passRate}%` }} />
      </div>
      <span
        className={cn(
          'w-7 text-right text-[11px] font-semibold tabular-nums',
          suite.passRate === 100
            ? 'text-green-400'
            : suite.passRate === 0
              ? 'text-text-4'
              : 'text-text-2'
        )}
      >
        {suite.passRate}%
      </span>
    </div>
  </div>
);

// ─── Issue case table ────────────────────────────────────────────

const ISSUE_CASE_LIMIT = 5;

const CaseTable = ({
  cases,
  status,
}: {
  cases: SharedReportCaseItem[];
  status: 'fail' | 'blocked';
}) => {
  const [expanded, setExpanded] = useState(false);
  const needsTruncation = cases.length > ISSUE_CASE_LIMIT;
  const visible = expanded ? cases : cases.slice(0, ISSUE_CASE_LIMIT);

  return (
    <div className="border-line-2 overflow-hidden rounded-lg border">
      <div className="divide-line-2/50 divide-y">
        {visible.map((c, i) => (
          <div
            key={i}
            className="hover:bg-bg-3/30 flex items-start gap-3 px-4 py-2.5 transition-colors"
          >
            {STATUS_ICON[status]}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-primary font-mono text-[11px] font-semibold">{c.code}</span>
                <span className="text-text-1 truncate text-xs">{c.title}</span>
              </div>
              <div className="text-text-4 mt-0.5 flex items-center gap-3 text-[11px]">
                {c.suiteName && (
                  <span className="flex items-center gap-1">
                    <FolderOpen className="h-2.5 w-2.5" />
                    {c.suiteName}
                  </span>
                )}
                {c.executedAt && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {new Date(c.executedAt).toLocaleString('ko-KR', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </div>
              {c.comment && (
                <div className="text-text-3 bg-bg-3/50 mt-1.5 flex items-start gap-1.5 rounded px-2 py-1 text-[11px]">
                  <MessageSquare className="mt-0.5 h-2.5 w-2.5 shrink-0" />
                  <span className="break-words whitespace-pre-wrap">{c.comment}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {needsTruncation && (
        <ExpandButton
          expanded={expanded}
          onToggle={() => setExpanded(!expanded)}
          totalCount={cases.length}
          visibleCount={visible.length}
        />
      )}
    </div>
  );
};

// ─── All cases table ─────────────────────────────────────────────

const ALL_CASES_LIMIT = 20;

const AllCasesTable = ({ cases }: { cases: SharedReportCaseItem[] }) => {
  const [expanded, setExpanded] = useState(false);
  const needsTruncation = cases.length > ALL_CASES_LIMIT;
  const visible = expanded ? cases : cases.slice(0, ALL_CASES_LIMIT);

  return (
    <div className="border-line-2 overflow-hidden rounded-lg border">
      {/* Table header */}
      <div className="text-text-3 border-line-2 bg-bg-3/80 grid grid-cols-[56px_1fr_120px_80px_120px] gap-2 border-b px-4 py-2 text-[11px] font-semibold tracking-wider uppercase">
        <span>코드</span>
        <span>케이스명</span>
        <span>스위트</span>
        <span className="text-center">상태</span>
        <span className="text-right">실행일시</span>
      </div>
      {visible.map((c, i) => (
        <div
          key={i}
          className={cn(
            'hover:bg-bg-3/30 grid grid-cols-[56px_1fr_120px_80px_120px] gap-2 px-4 py-1.5 text-xs transition-colors',
            i < visible.length - 1 && 'border-line-2/30 border-b'
          )}
        >
          <span className="text-primary font-mono text-[11px] font-semibold">{c.code}</span>
          <span className="text-text-1 truncate">{c.title}</span>
          <span className="text-text-3 truncate text-[11px]">{c.suiteName || '-'}</span>
          <span className="flex items-center justify-center gap-1">
            {STATUS_ICON[c.status]}
            <span
              className={cn('text-[11px] font-medium', {
                'text-green-400': c.status === 'pass',
                'text-red-400': c.status === 'fail',
                'text-amber-400': c.status === 'blocked',
                'text-slate-400': c.status === 'untested',
              })}
            >
              {STATUS_LABEL[c.status]}
            </span>
          </span>
          <span className="text-text-4 text-right text-[11px] tabular-nums">
            {c.executedAt
              ? new Date(c.executedAt).toLocaleString('ko-KR', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '-'}
          </span>
        </div>
      ))}
      {needsTruncation && (
        <ExpandButton
          expanded={expanded}
          onToggle={() => setExpanded(!expanded)}
          totalCount={cases.length}
          visibleCount={visible.length}
        />
      )}
    </div>
  );
};

// ─── Expand/Collapse button ──────────────────────────────────────

const ExpandButton = ({
  expanded,
  onToggle,
  totalCount,
  visibleCount,
}: {
  expanded: boolean;
  onToggle: () => void;
  totalCount: number;
  visibleCount: number;
}) => (
  <button
    onClick={onToggle}
    className="text-text-3 hover:text-text-1 hover:bg-bg-3/50 border-line-2 flex w-full items-center justify-center gap-1.5 border-t py-2 text-[11px] font-medium transition-colors"
  >
    {expanded ? (
      <>
        <ChevronUp className="h-3.5 w-3.5" />
        접기
      </>
    ) : (
      <>
        <ChevronDown className="h-3.5 w-3.5" />
        나머지 {totalCount - visibleCount}건 더보기
      </>
    )}
  </button>
);
