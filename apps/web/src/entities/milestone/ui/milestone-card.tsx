import React from 'react';

import Link from 'next/link';

import { MilestoneWithStats } from '@/entities/milestone';
import { LastRunFreshnessLabel } from '@/shared';
import { formatDate } from '@testea/util';

interface MilestoneCardProps {
  milestone: MilestoneWithStats;
  href: string;
  projectSlug: string;
  onEdit: () => void;
}

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    dotClass: string;
    badgeClass: string;
  }
> = {
  inProgress: {
    label: '진행 중',
    dotClass: 'bg-amber-400',
    badgeClass: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  },
  done: {
    label: '완료',
    dotClass: 'bg-system-green',
    badgeClass: 'border-system-green/30 bg-system-green/10 text-system-green',
  },
  planned: {
    label: '예정',
    dotClass: 'bg-text-4',
    badgeClass: 'border-line-2 bg-bg-3 text-text-3',
  },
};

export const MilestoneCard = ({ milestone, href, projectSlug, onEdit }: MilestoneCardProps) => {
  const statusInfo = STATUS_CONFIG[milestone.progressStatus] || {
    label: milestone.progressStatus,
    dotClass: 'bg-text-4',
    badgeClass: 'border-line-2 bg-bg-3 text-text-3',
  };

  const handleEditClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onEdit();
  };

  const actionClass =
    'typo-caption-normal text-text-3 hover:text-primary focus-visible:ring-primary/40 focus-visible:ring-2 focus-visible:outline-none';

  return (
    <article className="border-line-2 hover:bg-bg-2 grid grid-cols-1 gap-3 border-b px-1 py-4 transition-colors last:border-b-0 md:grid-cols-[minmax(0,1fr)_220px] md:items-start md:gap-6">
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href={href}
            className="typo-body2-heading text-text-1 hover:text-primary focus-visible:ring-primary/40 block min-w-0 truncate focus-visible:ring-2 focus-visible:outline-none"
          >
            {milestone.title}
          </Link>
          <span
            className={`typo-caption-heading rounded-1 inline-flex shrink-0 items-center gap-1.5 border px-2 py-0.5 ${statusInfo.badgeClass}`}
          >
            <span className={`h-2 w-2 rounded-full ${statusInfo.dotClass}`} aria-hidden="true" />
            {statusInfo.label}
          </span>
        </div>
        <p className="typo-caption-normal text-text-4 mt-1 line-clamp-1">
          {milestone.description || '설명이 없습니다.'}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link
            href={`/projects/${projectSlug}/runs/create?milestoneId=${milestone.id}`}
            className={actionClass}
          >
            테스트 실행
          </Link>
          <span className="text-text-4" aria-hidden="true">
            /
          </span>
          <Link href={href} className={actionClass}>
            연결 스위트
          </Link>
          <span className="text-text-4" aria-hidden="true">
            /
          </span>
          <Link href={href} className={actionClass}>
            실행 이력
          </Link>
          <span className="text-text-4" aria-hidden="true">
            /
          </span>
          <button type="button" onClick={handleEditClick} className={actionClass}>
            수정
          </button>
        </div>
      </div>

      <div className="min-w-0 md:text-right">
        <div className="typo-caption-normal text-text-3 flex flex-wrap gap-x-2 gap-y-1 md:justify-end">
          <span>
            {formatDate(milestone.startDate)} ~ {formatDate(milestone.endDate)}
          </span>
          <span aria-hidden="true">/</span>
          <span>{milestone.totalCases} 케이스</span>
          <span aria-hidden="true">/</span>
          <span>{milestone.runCount} 실행</span>
        </div>
        <div className="bg-bg-4 rounded-1 mt-2 h-1.5 w-full overflow-hidden md:ml-auto md:max-w-[180px]">
          <div
            className="bg-primary rounded-1 h-full"
            style={{ width: `${milestone.progressRate}%` }}
          />
        </div>
        <div className="typo-caption-normal text-text-4 mt-1 flex items-center gap-2 md:justify-end">
          <span>{milestone.progressRate}%</span>
          <LastRunFreshnessLabel
            lastExecutedAt={milestone.lastExecutedAt}
            className="typo-caption-normal text-text-4"
            showIcon={false}
          />
        </div>
      </div>
    </article>
  );
};
