'use client';

import React from 'react';

import { useTranslations } from 'next-intl';

import { cn } from '@/shared';

import type { CaseStatus } from '../run-model';

const STATUS_STYLE: Record<CaseStatus, string> = {
  idle: 'bg-bg-3 text-text-3',
  running: 'bg-[#60A5FA]/10 text-[#60A5FA]',
  passed: 'bg-primary/10 text-primary',
};

export const CaseStatusBadge = ({ status }: { status: CaseStatus }) => {
  const t = useTranslations('lending.run.status');

  return (
    <span
      // 상태가 바뀔 때마다 key 가 바뀌어 팝 애니메이션이 다시 재생된다.
      key={status}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        status !== 'idle' && 'animate-landing-pop',
        STATUS_STYLE[status]
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'size-1.5 rounded-full bg-current',
          status === 'running' && 'animate-landing-blink'
        )}
      />
      {t(status)}
    </span>
  );
};

/** 케이스 본문 아래에 붙는 작은 태그. 문제(시트)는 빨강, 해결(테스티아)은 초록. */
export const CaseTags = ({ tags, tone }: { tags: string[]; tone: 'problem' | 'solved' }) => (
  <ul className="flex flex-wrap gap-2">
    {tags.map((tag) => (
      <li
        key={tag}
        className={cn(
          'rounded-sm px-2 py-1 text-[11px] font-medium',
          tone === 'problem' ? 'bg-system-red/10 text-system-red' : 'bg-primary/10 text-primary'
        )}
      >
        {tag}
      </li>
    ))}
  </ul>
);
