'use client';

import React, { useMemo } from 'react';

import { cn } from '@testea/util';

import type { ITestRun } from './runs-list-constants';
import { type ActivityCell, isRunOpen, summarizeActivity } from './runs-list-model';

const WEEKDAY_LABELS = ['월', '', '수', '', '금', '', '일'];

const CELL_TONE: Record<NonNullable<ActivityCell['tone']>, [string, string, string]> = {
  pass: ['bg-result-pass/40', 'bg-result-pass/65', 'bg-result-pass/95'],
  fail: ['bg-result-fail/40', 'bg-result-fail/65', 'bg-result-fail/95'],
  blocked: ['bg-result-blocked/40', 'bg-result-blocked/65', 'bg-result-blocked/95'],
};

const LEGEND = [
  { label: '통과', className: 'bg-result-pass/70' },
  { label: '실패 있음', className: 'bg-result-fail/70' },
  { label: '차단만', className: 'bg-result-blocked/70' },
  { label: '실행 없음', className: 'bg-white/[0.07]' },
];

const cellTitle = (cell: ActivityCell) => {
  if (cell.future) return undefined;
  return cell.total > 0 ? `${cell.date} 결과 ${cell.total}건` : `${cell.date} 실행 없음`;
};

export const RunsListSummary = ({ runs }: { runs: ITestRun[] }) => {
  const openRuns = runs.filter(isRunOpen);
  const remaining = openRuns.reduce((sum, run) => sum + run.stats.untested, 0);
  const activity = useMemo(() => summarizeActivity(runs), [runs]);

  return (
    <section
      aria-label="실행 현황"
      className="border-line-2 flex flex-col gap-5 rounded-[10px] border px-6 py-3.5 md:flex-row md:gap-0"
    >
      <div className="flex shrink-0 flex-col gap-1 md:w-[150px] md:pr-7">
        <p className="text-[12px] font-medium text-white/45">진행 중</p>
        <p className="flex items-baseline gap-1.5 font-bold">
          <span className="text-[32px] leading-none text-white/95">{openRuns.length}</span>
          <span className="text-[15px] text-white/60">개</span>
        </p>
        <p className="text-[12px] text-white/45">남은 케이스 {remaining}건</p>
      </div>

      <div aria-hidden="true" className="bg-line-2 hidden w-px self-stretch md:block" />

      <div className="flex min-w-0 flex-1 flex-col gap-3 md:px-7">
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1">
          <p className="text-[12px] font-medium text-white/45">최근 12주 실행</p>
          <div className="hidden flex-1 md:block" />
          <ul className="flex flex-wrap items-center gap-3.5" aria-label="색 설명">
            {LEGEND.map((item) => (
              <li key={item.label} className="flex items-center gap-[5px]">
                <span aria-hidden="true" className={cn('size-2 rounded-[2px]', item.className)} />
                <span className="text-[11px] text-white/45">{item.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap items-start gap-x-7 gap-y-3">
          <div className="flex gap-1.5" role="img" aria-label="최근 12주 날짜별 실행 결과">
            <div aria-hidden="true" className="flex flex-col gap-0.5">
              {WEEKDAY_LABELS.map((label, i) => (
                <span key={i} className="h-[9px] w-3 text-[9px] leading-[9px] text-white/35">
                  {label}
                </span>
              ))}
            </div>
            <div aria-hidden="true" className="flex gap-[3px]">
              {activity.weeks.map((week) => (
                <div key={week[0].date} className="flex flex-col gap-0.5">
                  {week.map((cell) => (
                    <span
                      key={cell.date}
                      title={cellTitle(cell)}
                      className={cn(
                        'size-[9px] rounded-[2px]',
                        cell.future
                          ? 'bg-transparent'
                          : cell.tone
                            ? CELL_TONE[cell.tone][cell.level - 1]
                            : 'bg-white/[0.07]',
                        cell.isToday && 'border-[1.5px] border-white/90'
                      )}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <dl className="flex flex-col gap-[7px] text-[12px]">
            <div className="flex items-center gap-1.5">
              <dt className="text-white/50">실행한 날</dt>
              <dd className="font-bold text-white/90">
                {activity.executedDays}일 / {activity.periodDays}일
              </dd>
            </div>
            <div className="flex items-center gap-1.5">
              <dt className="text-white/50">실패가 있던 날</dt>
              <dd
                className={cn(
                  'font-bold',
                  activity.failDays > 0 ? 'text-result-fail' : 'text-white/90'
                )}
              >
                {activity.failDays}일
              </dd>
            </div>
            {activity.longestGap && (
              <div className="flex items-center gap-1.5">
                <dt className="text-white/50">가장 길게 쉰 기간</dt>
                <dd className="font-bold text-white/75">
                  {activity.longestGap.days}일 ({activity.longestGap.label})
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </section>
  );
};
