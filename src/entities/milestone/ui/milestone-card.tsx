import React from 'react';

import { MilestoneWithStats } from '@/entities/milestone';
import { Calendar, CheckCircle, ListChecks, PlayCircle } from 'lucide-react';
import { cn } from '@/shared';

interface MilestoneCardProps {
  milestone: MilestoneWithStats;
}

const STATUS_CONFIG: Record<string, { label: string; style: string }> = {
  inProgress: {
    label: '진행 중',
    style: 'bg-amber-500/20 text-amber-300',
  },
  done: {
    label: '완료',
    style: 'bg-green-500/20 text-green-300',
  },
  planned: {
    label: '예정',
    style: 'bg-slate-500/20 text-slate-300',
  },
};

const formatDate = (date: Date | null) => {
  if (!date) return '-';
  return date.toISOString().split('T')[0];
};

export const MilestoneCard = ({ milestone }: MilestoneCardProps) => {
  const statusInfo = STATUS_CONFIG[milestone.status] || {
    label: milestone.status,
    style: 'bg-gray-500/20 text-gray-300',
  };

  return (
    <div className="cursor-pointer bg-bg-2 shadow-1 rounded-3 flex w-full flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between">
      <div className="flex w-full flex-col gap-2 md:w-[40%]">
        <div className="flex items-center gap-3">
          <h2 className="typo-h2-heading">{milestone.title}</h2>
          <span className={cn('typo-label-heading rounded-full px-3 py-1', statusInfo.style)}>
            {statusInfo.label}
          </span>
        </div>
        <p className="typo-body2-normal text-text-2">
          {milestone.description || '설명이 없습니다.'}
        </p>
        <div className="text-label-normal text-text-3 flex items-center gap-1.5">
          <Calendar className="text-text-3 h-4 w-4" strokeWidth={1.5} />
          <span>
            {formatDate(milestone.startDate)} ~ {formatDate(milestone.endDate)}
          </span>
        </div>
      </div>

      <div className="flex w-full flex-col gap-2 md:w-[30%]">
        <div className="text-label-normal text-text-3 flex items-center justify-between">
          <span>진행률</span>
          <span className="typo-body2-heading text-primary">{milestone.progressRate}%</span>
        </div>
        <div className="bg-bg-3 h-1.5 w-full rounded-full">
          <div
            className="bg-primary h-full rounded-full transition-all duration-300"
            style={{ width: `${milestone.progressRate}%` }}
          />
        </div>
      </div>

      <div className="text-label-normal text-text-3 flex w-full flex-col gap-1 md:w-[30%] md:items-end">
        <div className="flex items-center gap-1.5 md:justify-end">
          <ListChecks className="text-text-3 h-4 w-4" strokeWidth={1.5} />
          <span>테스트 케이스 {milestone.totalCases}개</span>
        </div>
        <div className="flex items-center gap-1.5 md:justify-end">
          <CheckCircle className="text-text-3 h-4 w-4" strokeWidth={1.5} />
          <span>{milestone.completedCases}개 완료</span>
        </div>
        <div className="flex items-center gap-1.5 md:justify-end">
          <PlayCircle className="text-text-3 h-4 w-4" strokeWidth={1.5} />
          <span>실행 {milestone.runCount}회</span>
        </div>
      </div>
    </div>
  );
};
