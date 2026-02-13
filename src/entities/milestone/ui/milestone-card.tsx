import React from 'react';

import { MilestoneWithStats } from '@/entities/milestone';
import { Calendar, Edit, Play, Check, RotateCcw } from 'lucide-react';
import { cn, DSButton } from '@/shared';
import { formatDate } from '@/shared/utils/date-format';

interface MilestoneCardProps {
  milestone: MilestoneWithStats;
  onEdit: () => void;
  onStatusChange?: (status: 'planned' | 'inProgress' | 'done') => void;
}

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    badgeStyle: string;
    barColor: string;
    progressColor: string;
    iconColor: string;
  }
> = {
  inProgress: {
    label: '진행 중',
    badgeStyle: 'bg-amber-500/30 text-amber-300 border border-amber-400/50',
    barColor: 'bg-amber-500',
    progressColor: 'from-amber-500 to-orange-400',
    iconColor: 'text-amber-400',
  },
  done: {
    label: '완료',
    badgeStyle: 'bg-green-500/30 text-green-300 border border-green-400/50',
    barColor: 'bg-green-500',
    progressColor: 'from-green-500 to-emerald-400',
    iconColor: 'text-green-400',
  },
  planned: {
    label: '예정',
    badgeStyle: 'bg-slate-500/30 text-slate-300 border border-slate-400/50',
    barColor: 'bg-slate-500',
    progressColor: 'from-slate-500 to-slate-400',
    iconColor: 'text-slate-400',
  },
};

// 상태별 Quick Action 설정
const QUICK_ACTION_CONFIG: Record<
  string,
  {
    label: string;
    nextStatus: 'planned' | 'inProgress' | 'done';
    icon: React.ElementType;
    buttonStyle: string;
  } | null
> = {
  planned: {
    label: '시작하기',
    nextStatus: 'inProgress',
    icon: Play,
    buttonStyle: 'bg-amber-500 hover:bg-amber-600 text-white',
  },
  inProgress: {
    label: '완료하기',
    nextStatus: 'done',
    icon: Check,
    buttonStyle: 'bg-green-500 hover:bg-green-600 text-white',
  },
  done: {
    label: '다시 열기',
    nextStatus: 'inProgress',
    icon: RotateCcw,
    buttonStyle: 'bg-slate-500 hover:bg-slate-600 text-white',
  },
};

export const MilestoneCard = ({ milestone, onEdit, onStatusChange }: MilestoneCardProps) => {
  const statusInfo = STATUS_CONFIG[milestone.progressStatus] || {
    label: milestone.progressStatus,
    badgeStyle: 'bg-gray-500/30 text-gray-300 border border-gray-400/50',
    barColor: 'bg-gray-500',
    progressColor: 'from-gray-500 to-gray-400',
    iconColor: 'text-gray-400',
  };

  const quickAction = QUICK_ACTION_CONFIG[milestone.progressStatus];

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onEdit();
  };

  const handleQuickAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (quickAction && onStatusChange) {
      onStatusChange(quickAction.nextStatus);
    }
  };

  const progressPercent = milestone.progressRate || 0;

  return (
    <div
      className={cn(
        'bg-bg-2 shadow-1 rounded-3 group relative flex w-full flex-col gap-5 border-l-4 px-6 py-5 transition-all duration-200 hover:shadow-lg hover:scale-[1.01] md:flex-row md:items-center md:justify-between',
        milestone.progressStatus === 'done' && 'border-l-green-500',
        milestone.progressStatus === 'inProgress' && 'border-l-amber-500',
        milestone.progressStatus === 'planned' && 'border-l-slate-500',
        !STATUS_CONFIG[milestone.progressStatus] && 'border-l-gray-500'
      )}
    >
      {/* 제목, 설명, 날짜 영역 */}
      <div className="flex w-full flex-col gap-2.5 md:w-[35%]">
        <div className="flex items-center gap-3">
          <h2
            className="typo-h2-heading max-w-[180px] truncate"
            title={milestone.title}
          >
            {milestone.title}
          </h2>
          <span
            className={cn(
              'typo-label-heading shrink-0 rounded-full px-3 py-1',
              statusInfo.badgeStyle
            )}
          >
            {statusInfo.label}
          </span>
          <DSButton
            variant="ghost"
            size="small"
            onClick={handleEditClick}
            className="opacity-0 transition-opacity group-hover:opacity-100"
            title="수정"
          >
            <Edit className="h-4 w-4" />
          </DSButton>
        </div>
        <p
          className="typo-body2-normal text-text-2 max-w-[300px] truncate"
          title={milestone.description || '설명이 없습니다.'}
        >
          {milestone.description || '설명이 없습니다.'}
        </p>
        <div className="text-label-normal text-text-3 flex items-center gap-1.5">
          <Calendar className={cn('h-4 w-4', statusInfo.iconColor)} strokeWidth={1.5} />
          <span>
            {formatDate(milestone.startDate)} ~ {formatDate(milestone.endDate)}
          </span>
        </div>
      </div>

      {/* 진행률 영역 - 더 눈에 띄게 */}
      <div className="flex w-full flex-col gap-2 md:w-[30%]">
        <div className="flex items-center justify-between">
          <span className="text-label-normal text-text-3">진행률</span>
          <span
            className={cn(
              'typo-h2-heading text-2xl font-bold',
              progressPercent === 100 ? 'text-green-400' : 'text-text-1'
            )}
          >
            {progressPercent}%
          </span>
        </div>
        <div className="bg-bg-3 relative h-2.5 w-full overflow-hidden rounded-full">
          <div
            className={cn(
              'h-full rounded-full bg-gradient-to-r transition-all duration-500',
              statusInfo.progressColor,
              progressPercent === 100 && 'animate-pulse'
            )}
            style={{ width: `${progressPercent}%` }}
          />
          {/* 진행률 바 하이라이트 효과 */}
          <div
            className="absolute inset-0 h-full rounded-full bg-white/10"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {/* 미니 통계 또는 상태 메시지 */}
        <div className="text-label-normal text-text-3 flex justify-between text-xs">
          {milestone.totalCases === 0 ? (
            <span className="text-text-3 italic">테스트 케이스를 추가해주세요</span>
          ) : progressPercent === 100 ? (
            <span className="text-green-400 font-medium">모든 테스트 완료!</span>
          ) : (
            <span>{milestone.completedCases}/{milestone.totalCases} 완료</span>
          )}
          <span>실행 {milestone.runCount}회</span>
        </div>
      </div>

      {/* 통계 카드 + Quick Action 영역 */}
      <div className="flex w-full items-center gap-4 md:w-auto md:justify-end">
        <div className="flex gap-2">
          <div className="bg-bg-3/50 flex flex-1 flex-col items-center rounded-xl px-3 py-2 md:flex-none md:px-4">
            <span className="typo-body2-heading text-text-1 mt-1">{milestone.totalCases}</span>
            <span className="text-text-3 text-xs">케이스</span>
          </div>
          <div className="bg-bg-3/50 flex flex-1 flex-col items-center rounded-xl px-3 py-2 md:flex-none md:px-4">
            <span className="typo-body2-heading text-text-1 mt-1">{milestone.completedCases}</span>
            <span className="text-text-3 text-xs">완료</span>
          </div>
          <div className="bg-bg-3/50 flex flex-1 flex-col items-center rounded-xl px-3 py-2 md:flex-none md:px-4">
            <span className="typo-body2-heading text-text-1 mt-1">{milestone.runCount}</span>
            <span className="text-text-3 text-xs">실행</span>
          </div>
        </div>
        {/* Quick Action Button - 상태에 따른 다음 액션 */}
        {quickAction && onStatusChange && (
          <button
            onClick={handleQuickAction}
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all shadow-sm',
              'opacity-0 group-hover:opacity-100 group-hover:shadow-md',
              'transform translate-x-2 group-hover:translate-x-0',
              quickAction.buttonStyle
            )}
          >
            <quickAction.icon className="h-4 w-4" />
            <span className="hidden md:inline">{quickAction.label}</span>
          </button>
        )}
      </div>
    </div>
  );
};
