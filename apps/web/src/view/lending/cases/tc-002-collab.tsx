'use client';

import React from 'react';

import { useTranslations } from 'next-intl';

import { cn } from '@/shared';

import { type CaseStatus, useInView, useTicker } from '../run-model';

type Step = { label: string; value: string };

const TICK_MS = 110;
/** 단계 사이 쉬는 박자와, 다 끝난 뒤 "팀원 합류"를 보여 주는 박자 */
const GAP = 4;
const HOLD = 24;

/** tick 이 한 바퀴 중 어디인지로 각 단계에 써진 글자 수와 지금 단계, 합류 표시 여부를 구한다. */
const frameAt = (tick: number, lengths: number[]) => {
  const cycle = lengths.reduce((sum, len) => sum + len + GAP, 0) + HOLD;
  let t = tick % cycle;
  const typed = lengths.map((len) => {
    const n = Math.max(0, Math.min(len, t));
    t -= len + GAP;
    return n;
  });
  const current = typed.findIndex((n, i) => n < lengths[i]);
  return { typed, current: current === -1 ? lengths.length - 1 : current, joined: current === -1 };
};

/**
 * TC-002 시각물. 보이는 동안 프로젝트 이름 입력 → 비밀번호 → 링크 공유 → 팀원 합류가 계속 반복된다.
 */
export const Collab = ({ status, reduceMotion }: { status: CaseStatus; reduceMotion: boolean }) => {
  const t = useTranslations('lending.run.tc002');
  const steps = t.raw('steps') as Step[];
  const [ref, inView] = useInView<HTMLDivElement>();
  const isStarted = status !== 'idle';
  const tick = useTicker(isStarted && inView && !reduceMotion, TICK_MS);

  const lengths = steps.map((step) => Array.from(step.value).length);
  // 동작 줄이기 사용자에게는 다 채워진 상태를 보여 준다.
  const frame =
    reduceMotion || !isStarted
      ? { typed: lengths, current: lengths.length - 1, joined: reduceMotion && isStarted }
      : frameAt(tick, lengths);

  return (
    <div ref={ref} className="flex flex-col gap-3">
      <ol className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
        {steps.map((step, i) => {
          const isCurrent = i === frame.current && !frame.joined;
          const isDone = frame.typed[i] === lengths[i];
          return (
            <li
              key={step.label}
              className={cn(
                'bg-bg-2 flex flex-col gap-1 rounded-md border px-4 py-3 transition-colors duration-300',
                isCurrent
                  ? 'border-[#60A5FA]/60'
                  : frame.joined
                    ? 'border-primary/50'
                    : isDone
                      ? 'border-white/15'
                      : 'border-white/5'
              )}
            >
              <span className="text-text-3 text-[10px] tracking-wide">
                {t('step', { n: i + 1 })}
              </span>
              <span className="text-text-1 text-sm font-bold">{step.label}</span>
              <span className="text-text-3 flex h-4 items-center truncate text-xs">
                {Array.from(step.value).slice(0, frame.typed[i]).join('')}
                {isCurrent && (
                  <span
                    aria-hidden="true"
                    className="animate-landing-blink bg-primary ml-0.5 inline-block h-3 w-px"
                  />
                )}
              </span>
            </li>
          );
        })}
      </ol>
      <p
        className={cn(
          'text-primary flex items-center gap-2 text-xs transition-opacity duration-300',
          frame.joined ? 'opacity-100' : 'opacity-0'
        )}
        aria-hidden={!frame.joined}
      >
        <span className="flex -space-x-1.5" aria-hidden="true">
          <span className="border-bg-1 size-5 rounded-full border-2 bg-[#60A5FA]" />
          <span className="border-bg-1 bg-primary size-5 rounded-full border-2" />
          <span className="border-bg-1 size-5 rounded-full border-2 bg-[#F59E0B]" />
        </span>
        {t('joined')}
      </p>
    </div>
  );
};
