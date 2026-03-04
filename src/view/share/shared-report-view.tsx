'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, XCircle, Circle, Clock, BarChart3 } from 'lucide-react';
import { LoadingSpinner } from '@/shared/ui';
import { sharedReportQueryOptions } from '@/features/runs-share';
import type { TestStatusData } from '@/widgets/project';

const TestStatusChart = dynamic(
  () => import('@/widgets/project/ui/test-status-chart').then(mod => ({ default: mod.TestStatusChart })),
  { ssr: false, loading: () => <div className="bg-bg-2 rounded-[16px] p-6 h-[400px] animate-pulse" /> }
);

const RUN_STATUS_CONFIG: Record<string, { label: string; style: string }> = {
  NOT_STARTED: { label: 'Not Started', style: 'bg-slate-500/20 text-slate-300' },
  IN_PROGRESS: { label: 'In Progress', style: 'bg-blue-500/20 text-blue-300' },
  COMPLETED: { label: 'Completed', style: 'bg-green-500/20 text-green-300' },
};

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface SharedReportViewProps {
  token: string;
}

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
        <div className="bg-red-500/10 flex h-16 w-16 items-center justify-center rounded-full">
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

  const statCards = [
    { label: 'Total', value: report.stats.total, icon: <BarChart3 className="h-5 w-5" />, color: 'text-text-1' },
    { label: 'Passed', value: report.stats.pass, icon: <CheckCircle2 className="h-5 w-5" />, color: 'text-green-400' },
    { label: 'Failed', value: report.stats.fail, icon: <XCircle className="h-5 w-5" />, color: 'text-red-400' },
    { label: 'Blocked', value: report.stats.blocked, icon: <AlertTriangle className="h-5 w-5" />, color: 'text-amber-400' },
    { label: 'Untested', value: report.stats.untested, icon: <Circle className="h-5 w-5" />, color: 'text-slate-400' },
  ];

  return (
    <div className="bg-bg-1 text-text-1 min-h-screen font-sans">
      {/* Header */}
      <header className="border-line-2 border-b">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
          <div className="flex flex-col gap-2">
            <p className="text-text-3 text-sm">{report.projectName}</p>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold">{report.runName}</h1>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.style}`}>
                {statusInfo.label}
              </span>
            </div>
            <div className="text-text-3 flex flex-wrap items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                생성: {formatDate(report.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                수정: {formatDate(report.updatedAt)}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* Progress Bar */}
        <div className="mb-8 flex items-center gap-4">
          <div className="bg-bg-3 h-3 flex-1 overflow-hidden rounded-full">
            <div
              className="bg-primary h-full rounded-full transition-all duration-300"
              style={{ width: `${report.stats.progressPercent}%` }}
            />
          </div>
          <span className="text-text-1 text-lg font-semibold">
            {report.stats.progressPercent}%
          </span>
        </div>

        {/* Stat Cards */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {statCards.map((card) => (
            <div key={card.label} className="bg-bg-2 border-line-2 rounded-xl border p-4">
              <div className={`mb-2 ${card.color}`}>{card.icon}</div>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-text-3 text-sm">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Chart */}
        <TestStatusChart data={testStatusData} />
      </main>

      {/* Footer */}
      <footer className="border-line-2 border-t py-6">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Link
            href="/"
            className="text-text-3 hover:text-primary text-sm transition-colors"
          >
            Powered by <span className="font-semibold">Testea</span>
          </Link>
        </div>
      </footer>
    </div>
  );
};
