'use client';

import React from 'react';

import Link from 'next/link';

import type { MilestoneWithStats } from '@/entities/milestone';
import { cn } from '@testea/util';

import {
  type MilestoneHealth,
  dueHintOf,
  elapsedPercentOf,
  formatMonthDay,
  milestoneHealthOf,
  milestonePhaseOf,
  passRateOf,
} from './milestone-list-model';

/** 칸 너비. 머리글과 행이 같은 값을 쓴다. display 는 쓰는 쪽에서 정한다 (머리글은 lg 에서만 보임). */
export const MILESTONE_ROW_GRID =
  'grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3.5 gap-y-2 md:grid-cols-[minmax(0,1fr)_96px_auto] lg:grid-cols-[minmax(0,346px)_96px_250px_minmax(0,1fr)_150px_96px]';

const HEALTH: Record<MilestoneHealth, { label: string; tone: string; border: string }> = {
  onTrack: { label: '순조로움', tone: 'text-result-pass', border: 'border-result-pass/45' },
  delayed: { label: '지연', tone: 'text-result-fail', border: 'border-result-fail/45' },
  planned: { label: '예정', tone: 'text-[#999ea8]', border: 'border-[#999ea8]/45' },
  done: { label: '완료', tone: 'text-result-pass', border: 'border-result-pass/45' },
};

/** 진행률 링. 예정은 빈 점선 원, 완료는 꽉 찬 원. */
const ProgressRing = ({ percent, health }: { percent: number; health: MilestoneHealth }) => {
  const r = 6.5;
  const length = 2 * Math.PI * r;
  const value = health === 'done' ? 100 : percent;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="shrink-0">
      <circle
        cx="8"
        cy="8"
        r={r}
        fill="none"
        strokeWidth="2"
        className="stroke-white/15"
        strokeDasharray={health === 'planned' ? '2 2' : undefined}
      />
      {health !== 'planned' && value > 0 && (
        <circle
          cx="8"
          cy="8"
          r={r}
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          transform="rotate(-90 8 8)"
          strokeDasharray={`${(value / 100) * length} ${length}`}
          className={health === 'delayed' ? 'stroke-result-fail' : 'stroke-result-pass'}
        />
      )}
    </svg>
  );
};

const ResultBar = ({ milestone }: { milestone: MilestoneWithStats }) => {
  const total = milestone.totalCases;
  const pct = (n: number) => (total > 0 ? `${(n / total) * 100}%` : '0%');
  return (
    <div className="flex h-1 w-full max-w-[200px] overflow-hidden rounded-[2px] bg-white/[0.08]">
      <span className="bg-result-pass h-full" style={{ width: pct(milestone.passCases) }} />
      <span className="bg-result-fail h-full" style={{ width: pct(milestone.failCases) }} />
      <span className="bg-result-blocked h-full" style={{ width: pct(milestone.blockedCases) }} />
    </div>
  );
};

interface MilestoneListRowProps {
  milestone: MilestoneWithStats;
  today: string;
  href: string;
  projectSlug: string;
  onEdit: () => void;
}

export const MilestoneListRow = ({
  milestone,
  today,
  href,
  projectSlug,
  onEdit,
}: MilestoneListRowProps) => {
  const phase = milestonePhaseOf(milestone, today);
  const health = milestoneHealthOf(milestone, today);
  const elapsed = elapsedPercentOf(milestone, today);
  const due = dueHintOf(milestone, today);
  const passRate = passRateOf(milestone);
  const healthInfo = HEALTH[health];

  const subText =
    phase === 'inProgress'
      ? elapsed !== null
        ? `기간 ${elapsed}% 지남`
        : null
      : phase === 'planned'
        ? milestone.startDate
          ? `${formatMonthDay(milestone.startDate)} 시작`
          : null
        : null;

  return (
    <li className="group border-line-2 relative border-b px-2.5 py-[13px] transition-colors hover:bg-white/[0.02]">
      <div className={cn('grid', MILESTONE_ROW_GRID)}>
        <div className="flex min-w-0 items-center gap-3">
          <ProgressRing percent={milestone.progressRate} health={health} />
          <div className="flex min-w-0 flex-col gap-[3px]">
            <div className="flex min-w-0 items-center gap-2">
              <Link
                href={href}
                className="focus-visible:after:ring-primary/50 truncate text-[14px] font-medium text-white/92 after:absolute after:inset-0 after:content-[''] hover:text-white focus-visible:outline-none focus-visible:after:ring-2"
              >
                {milestone.title}
              </Link>
              <span className="relative z-10 hidden shrink-0 gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 md:flex">
                <button
                  type="button"
                  onClick={onEdit}
                  aria-label={`${milestone.title} 수정`}
                  className="rounded-[4px] border border-white/15 px-1.5 text-[11px] text-white/70 hover:border-white/35 hover:text-white"
                >
                  수정
                </button>
                <Link
                  href={`/projects/${projectSlug}/runs/create?milestoneId=${milestone.id}`}
                  aria-label={`${milestone.title} 테스트 실행 만들기`}
                  className="rounded-[4px] border border-white/15 px-1.5 text-[11px] text-white/70 hover:border-white/35 hover:text-white"
                >
                  실행 만들기
                </Link>
              </span>
            </div>
            {subText && <p className="truncate text-[11px] text-white/35">{subText}</p>}
          </div>
        </div>

        <div className="hidden md:flex">
          <span
            className={cn(
              'flex items-center gap-[5px] rounded-[9px] border py-0.5 pr-2 pl-[7px] text-[11px] font-medium whitespace-nowrap',
              healthInfo.tone,
              healthInfo.border
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
            {healthInfo.label}
          </span>
        </div>

        <div className="col-span-2 col-start-1 row-start-2 flex flex-col gap-1.5 md:col-span-3 lg:col-span-1 lg:col-start-3 lg:row-start-1">
          {milestone.completedCases === 0 ? (
            <span className="text-[11px] text-white/30">
              {milestone.totalCases === 0 ? '범위에 케이스 없음' : '아직 실행 없음'}
            </span>
          ) : (
            <>
              {phase === 'done' ? (
                <span className="text-[11px] text-white/55">{passRate}% 통과</span>
              ) : (
                <span className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-white/90">
                    {milestone.progressRate}%
                  </span>
                  <span className="text-[11px] text-white/40">
                    {milestone.completedCases}/{milestone.totalCases} 실행
                  </span>
                </span>
              )}
              <ResultBar milestone={milestone} />
            </>
          )}
        </div>

        <span className="hidden lg:block" />

        <span className="hidden text-[11px] whitespace-nowrap text-white/45 lg:block">
          스위트 {milestone.suiteCount} · 케이스 {milestone.totalCases}
        </span>

        <div className="col-start-2 row-start-1 flex flex-col items-end gap-0.5 md:col-start-3 lg:col-start-6">
          <span className="font-mono text-[12px] font-medium text-white/75">
            {milestone.endDate ? formatMonthDay(milestone.endDate) : '-'}
          </span>
          {due && (
            <span
              className={cn(
                'text-[11px] whitespace-nowrap',
                due.tone === 'danger' ? 'text-result-fail font-medium' : 'text-white/40'
              )}
            >
              {due.text}
            </span>
          )}
        </div>
      </div>
    </li>
  );
};
