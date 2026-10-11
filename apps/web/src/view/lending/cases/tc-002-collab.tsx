'use client';

import React from 'react';

import { useTranslations } from 'next-intl';

import { cn } from '@/shared';

import type { CaseStatus } from '../run-model';

type Step = { label: string; value: string };

/** TC-002 시각물. 진행 중이 되면 프로젝트 이름 → 비밀번호 → 링크 공유 순으로 단계가 켜진다. */
export const Collab = ({ status, reduceMotion }: { status: CaseStatus; reduceMotion: boolean }) => {
  const t = useTranslations('lending.run.tc002');
  const steps = t.raw('steps') as Step[];
  const [active, setActive] = React.useState(-1);
  const stepCount = steps.length;
  const isStarted = status !== 'idle';

  React.useEffect(() => {
    if (!isStarted) return;
    if (reduceMotion) return;
    const timers = Array.from({ length: stepCount }, (_, i) =>
      window.setTimeout(() => setActive(i), 250 + i * 450)
    );
    return () => timers.forEach(window.clearTimeout);
  }, [isStarted, reduceMotion, stepCount]);

  const lit = reduceMotion && isStarted ? stepCount - 1 : active;

  return (
    <ol className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
      {steps.map((step, i) => {
        const isOn = i <= lit;
        const isLast = i === lit && i === steps.length - 1;
        return (
          <li
            key={step.label}
            className={cn(
              'bg-bg-2 flex flex-col gap-1 rounded-md border px-4 py-3 transition-colors duration-300',
              isLast
                ? status === 'passed'
                  ? 'border-primary/60'
                  : 'border-[#60A5FA]/60'
                : isOn
                  ? 'border-white/15'
                  : 'border-white/5 opacity-50'
            )}
          >
            <span className="text-text-3 text-[10px] tracking-wide">{t('step', { n: i + 1 })}</span>
            <span className="text-text-1 text-sm font-bold">{step.label}</span>
            <span className="text-text-3 truncate text-xs">{step.value}</span>
          </li>
        );
      })}
    </ol>
  );
};
