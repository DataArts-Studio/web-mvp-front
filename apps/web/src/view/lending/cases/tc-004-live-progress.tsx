'use client';

import React from 'react';

import { useTranslations } from 'next-intl';

import { cn } from '@/shared';

import { type CaseStatus, useInView, useTicker } from '../run-model';

type Result = 'pass' | 'fail' | 'blocked';

/** 스위트별 시작 판정 수와 전체 케이스 수. 문구는 i18n, 숫자는 여기서 정한다. */
const SUITE_BASE = [
  { pass: 4, fail: 0, blocked: 1, total: 12 },
  { pass: 3, fail: 0, blocked: 1, total: 8 },
  { pass: 0, fail: 1, blocked: 0, total: 6 },
];

/**
 * 실시간 활동 이벤트(i18n events 와 같은 순서). suite 가 있으면 그 스위트 막대에 판정이 하나 더해진다.
 * result 가 없는 이벤트(실행 시작)는 파란 점으로 보인다.
 */
const EVENT_META: { suite?: number; result?: Result }[] = [
  { suite: 0, result: 'pass' },
  {},
  { suite: 0, result: 'fail' },
  { suite: 1, result: 'pass' },
  { suite: 2, result: 'blocked' },
  { suite: 2, result: 'pass' },
];

const DOT: Record<Result | 'start', string> = {
  pass: 'bg-primary',
  fail: 'bg-system-red',
  blocked: 'bg-[#F59E0B]',
  start: 'bg-[#60A5FA]',
};

const TICK_MS = 2200;
const FEED_SIZE = 3;

/**
 * TC-004 시각물. 보이는 동안 실시간 활동 맨 위에 새 판정이 계속 밀려 들어오고,
 * 그 판정만큼 마일스톤 막대가 차오른다. 이벤트를 한 바퀴 돌면 새 실행처럼 처음부터 다시 쌓인다.
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
  const events = t.raw('events') as string[];
  const times = t.raw('times') as string[];
  const isStarted = status !== 'idle';
  const [ref, inView] = useInView<HTMLDivElement>();
  const tick = useTicker(isStarted && inView && !reduceMotion, TICK_MS);

  // 가장 최근 이벤트 위치. 처음엔 앞의 세 개가 이미 쌓인 상태로 시작한다.
  const latest = (tick + FEED_SIZE - 1) % events.length;
  const feed = Array.from({ length: FEED_SIZE }, (_, i) => {
    const index = (latest - i + events.length) % events.length;
    return { index, text: events[index], time: times[i] };
  });

  // 이번 바퀴에서 지금까지 들어온 판정을 시작값에 더한다.
  const counts = SUITE_BASE.map((base) => ({ ...base }));
  for (let i = 0; i <= latest; i += 1) {
    const { suite, result } = EVENT_META[i] ?? {};
    if (suite !== undefined && result) counts[suite][result] += 1;
  }

  return (
    <div ref={ref} className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div className="bg-bg-2 flex flex-col gap-4 rounded-md border border-white/10 p-4">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-text-1 font-bold">{t('milestone')}</span>
          <span className="shrink-0 font-bold text-[#F59E0B]">{t('dday')}</span>
        </div>
        <ul className="flex flex-col gap-3">
          {suites.map((suite, i) => {
            const c = counts[i];
            // 진행 중이 되기 전에는 비워 두었다가 왼쪽부터 차오른다.
            const pct = (n: number) => `${isStarted ? (n / c.total) * 100 : 0}%`;
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
                    className="bg-system-red h-full transition-[width] duration-700 ease-out"
                    style={{ width: pct(c.fail) }}
                  />
                  <span
                    className="h-full bg-[#F59E0B] transition-[width] duration-700 ease-out"
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

      <div className="bg-bg-2 flex flex-col gap-3 overflow-hidden rounded-md border border-white/10 p-4">
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
        <ul className="flex flex-col gap-3">
          {feed.map(({ index, text, time }, i) => {
            const result = EVENT_META[index]?.result ?? 'start';
            return (
              // 이벤트 위치를 key 로 써서, 새로 들어온 맨 위 항목만 밀려 들어오는 애니메이션을 탄다.
              <li
                key={index}
                className={cn(
                  'flex gap-2 text-xs',
                  i === 0 && isStarted && 'animate-landing-feed-in'
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn('mt-1.5 size-1.5 shrink-0 rounded-full', DOT[result])}
                />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-text-2">{text}</span>
                  <span className="text-text-4 text-[11px]">{time}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
