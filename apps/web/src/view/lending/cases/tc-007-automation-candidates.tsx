'use client';

import React from 'react';

import { useTranslations } from 'next-intl';

import { cn } from '@/shared';

import { type CaseStatus, useInView, useTicker } from '../run-model';

type Kind = 'candidate' | 'flaky' | 'sample';
type Run = 'p' | 'f' | null;

/** 케이스별 최근 6회 실행(p 통과, f 실패, null 실행 없음)과 판정. 문구는 i18n, 이력은 여기서 정한다. */
const HISTORY: { runs: Run[]; kind: Kind }[] = [
  { runs: ['p', 'p', 'p', 'p', 'p', 'p'], kind: 'candidate' },
  { runs: ['p', 'p', 'f', 'p', 'f', 'p'], kind: 'flaky' },
  { runs: [null, null, null, null, 'p', 'p'], kind: 'sample' },
  { runs: ['p', 'p', 'p', 'p', 'p', 'p'], kind: 'candidate' },
];

const KIND_STYLE: Record<Kind, string> = {
  candidate: 'bg-primary/10 text-primary',
  flaky: 'bg-[#F59E0B]/10 text-[#F59E0B]',
  sample: 'bg-bg-3 text-text-3',
};

const TICK_MS = 150;
const FIRST_AT = 4;
const ROW_GAP = 7;
const HOLD = 24;

/**
 * TC-007 시각물. 보이는 동안 실행 이력을 위에서부터 한 줄씩 훑으며 판정 배지를 붙이고,
 * 다 훑으면 자동화 후보 수를 알려 준 뒤 처음부터 반복된다.
 */
export const AutomationCandidates = ({
  status,
  reduceMotion,
}: {
  status: CaseStatus;
  reduceMotion: boolean;
}) => {
  const t = useTranslations('lending.run.tc007');
  const cases = t.raw('cases') as { id: string; title: string }[];
  const [ref, inView] = useInView<HTMLDivElement>();
  const isStarted = status !== 'idle';
  const tick = useTicker(isStarted && inView && !reduceMotion, TICK_MS);

  const doneAt = FIRST_AT + cases.length * ROW_GAP;
  const cycle = doneAt + HOLD;
  const at = reduceMotion || !isStarted ? cycle - 1 : tick % cycle;
  const scanned = Math.max(0, Math.min(cases.length, Math.floor((at - FIRST_AT) / ROW_GAP) + 1));
  const scanning = at >= FIRST_AT && at < doneAt ? scanned - 1 : -1;
  const isDone = at >= doneAt;
  const candidates = HISTORY.filter((h) => h.kind === 'candidate').length;

  return (
    <div ref={ref} className="bg-bg-2 flex flex-col gap-3 rounded-md border border-white/10 p-4">
      <div className="text-text-3 flex items-center justify-between text-[11px]">
        <span>{t('listLabel')}</span>
        <span className={cn('transition-colors', isDone ? 'text-primary font-medium' : '')}>
          {isDone ? t('summary', { count: candidates }) : t('scanning')}
        </span>
      </div>
      <ul className="flex flex-col gap-1.5">
        {cases.map((c, i) => {
          const h = HISTORY[i];
          const isScanned = i < scanned && (i !== scanning || isDone);
          return (
            <li
              key={c.id}
              className={cn(
                'flex items-center gap-3 rounded-sm border px-3 py-2.5 text-xs transition-colors duration-300',
                i === scanning
                  ? 'border-[#60A5FA]/50 bg-[#60A5FA]/[0.06]'
                  : 'bg-bg-1 border-white/5'
              )}
            >
              {/* 좁은 화면에서는 ID 와 제목을 두 줄로 쌓아 제목이 잘리지 않게 한다. */}
              <span className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-3">
                <span className="text-primary shrink-0 font-medium max-sm:text-[11px] sm:w-14">
                  {c.id}
                </span>
                <span className="text-text-2 min-w-0 truncate">{c.title}</span>
              </span>
              <span aria-hidden="true" className="flex shrink-0 gap-1">
                {h.runs.map((run, j) => (
                  <span
                    key={j}
                    className={cn(
                      'size-2.5 rounded-[2px]',
                      run === 'p' && 'bg-primary/80',
                      run === 'f' && 'bg-system-red/80',
                      run === null && 'border border-white/10'
                    )}
                  />
                ))}
              </span>
              <span className="shrink-0 text-right sm:w-20">
                {isScanned && (
                  <span
                    className={cn(
                      'animate-landing-pop inline-block rounded-sm px-1.5 py-0.5 text-[11px] font-medium',
                      KIND_STYLE[h.kind]
                    )}
                  >
                    {t(`kinds.${h.kind}`)}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
