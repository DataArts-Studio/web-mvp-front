'use client';

import React from 'react';

import { useTranslations } from 'next-intl';

import { cn } from '@/shared';

import type { CaseStatus } from '../run-model';

/** 스위트별 판정 수(통과·실패·블로커)와 전체 케이스 수. 문구는 i18n, 숫자는 여기서 정한다. */
const SUITE_COUNTS = [
  { pass: 5, fail: 1, blocked: 1, total: 12 },
  { pass: 4, fail: 0, blocked: 1, total: 8 },
  { pass: 1, fail: 1, blocked: 0, total: 6 },
];

const FEED_DOT = ['bg-system-red', 'bg-[#60A5FA]', 'bg-primary'];

type FeedItem = { text: string; time: string };

/**
 * TC-004 시각물. 진행 중이 되면 마일스톤 막대가 왼쪽부터 차오르고,
 * 실시간 활동 맨 위에 새 항목(실패 판정)이 밀려 들어온다.
 */
export const LiveProgress = ({
  status,
  reduceMotion,
}: {
  status: CaseStatus;
  reduceMotion: boolean;
}) => {
  const t = useTranslations('lending.run.tc004');
  const suites = t.raw('suites') as string[];
  const feed = t.raw('feed') as FeedItem[];
  const isStarted = status !== 'idle';
  const [isFilled, setFilled] = React.useState(false);
  const [isPushed, setHasNewItem] = React.useState(false);

  React.useEffect(() => {
    if (!isStarted) return;
    if (reduceMotion) return;
    const fill = window.setTimeout(() => setFilled(true), 150);
    const push = window.setTimeout(() => setHasNewItem(true), 1400);
    return () => {
      window.clearTimeout(fill);
      window.clearTimeout(push);
    };
  }, [isStarted, reduceMotion]);

  const skip = reduceMotion && isStarted;
  const filled = skip || isFilled;
  const hasNewItem = skip || isPushed;

  // 새 항목(맨 앞)은 들어오기 전까지 숨긴다.
  const visibleFeed = feed.map((item, i) => ({ item, i })).filter(({ i }) => i > 0 || hasNewItem);

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div className="bg-bg-2 flex flex-col gap-4 rounded-md border border-white/10 p-4">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-text-1 font-bold">{t('milestone')}</span>
          <span className="shrink-0 font-bold text-[#F59E0B]">{t('dday')}</span>
        </div>
        <ul className="flex flex-col gap-3">
          {suites.map((suite, i) => {
            const c = SUITE_COUNTS[i];
            const pct = (n: number) => `${filled ? (n / c.total) * 100 : 0}%`;
            return (
              <li key={suite} className="flex items-center gap-3 text-xs">
                <span className="text-text-2 w-16 shrink-0 truncate">{suite}</span>
                <span
                  aria-hidden="true"
                  className="bg-bg-4 flex h-1.5 flex-1 overflow-hidden rounded-full"
                >
                  <span
                    className="bg-primary h-full transition-[width] duration-700 ease-out"
                    style={{ width: pct(c.pass) }}
                  />
                  <span
                    className="bg-system-red h-full transition-[width] delay-300 duration-500 ease-out"
                    style={{ width: pct(c.fail) }}
                  />
                  <span
                    className="h-full bg-[#F59E0B] transition-[width] delay-500 duration-500 ease-out"
                    style={{ width: pct(c.blocked) }}
                  />
                </span>
                <span className="text-text-3 w-9 shrink-0 text-right tabular-nums">
                  {c.pass + c.fail + c.blocked}/{c.total}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="bg-bg-2 flex flex-col gap-3 rounded-md border border-white/10 p-4">
        <p className="text-text-1 flex items-center gap-2 text-xs font-bold">
          <span
            aria-hidden="true"
            className={cn(
              'bg-system-red size-1.5 rounded-full',
              isStarted && 'animate-landing-blink'
            )}
          />
          {t('feedTitle')}
        </p>
        <ul className="flex flex-col gap-3" aria-live="polite">
          {visibleFeed.map(({ item, i }) => (
            <li
              key={item.text}
              className={cn('flex gap-2 text-xs', i === 0 && 'animate-landing-feed-in')}
            >
              <span
                aria-hidden="true"
                className={cn('mt-1.5 size-1.5 shrink-0 rounded-full', FEED_DOT[i])}
              />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-text-2">{item.text}</span>
                <span className="text-text-4 text-[11px]">{item.time}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
