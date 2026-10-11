'use client';

import React from 'react';

import { useTranslations } from 'next-intl';

import { cn } from '@/shared';

import { type CaseStatus, useInView, useTicker } from '../run-model';

type CiCase = { id: string; title: string; time: string };

const TICK_MS = 120;
/** 첫 결과 줄이 나오는 박자, 줄 사이 간격, 전송 완료 뒤 머무는 박자 */
const FIRST_AT = 8;
const LINE_GAP = 10;
const HOLD = 26;
/** 예시 결과. 세 번째 케이스는 실패로 들어온다. */
const OUTCOME: ('pass' | 'fail')[] = ['pass', 'pass', 'fail'];

/**
 * TC-006 시각물. 보이는 동안 CI 터미널에 Playwright 결과가 한 줄씩 찍히고,
 * 같은 순간 오른쪽 테스티아 실행의 케이스 상태가 "자동" 표시와 함께 바뀐다. 끝나면 처음부터 반복된다.
 */
export const CiResults = ({
  status,
  reduceMotion,
}: {
  status: CaseStatus;
  reduceMotion: boolean;
}) => {
  const t = useTranslations('lending.run.tc006');
  const cases = t.raw('cases') as CiCase[];
  const [ref, inView] = useInView<HTMLDivElement>();
  const isStarted = status !== 'idle';
  const tick = useTicker(isStarted && inView && !reduceMotion, TICK_MS);

  const sentAt = FIRST_AT + cases.length * LINE_GAP;
  const cycle = sentAt + HOLD;
  const at = reduceMotion || !isStarted ? cycle - 1 : tick % cycle;
  const reported = Math.max(0, Math.min(cases.length, Math.floor((at - FIRST_AT) / LINE_GAP) + 1));
  const isSent = at >= sentAt;
  const isRunning = !isSent;

  return (
    <div
      ref={ref}
      className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]"
    >
      <div className="flex min-h-44 flex-col gap-1.5 rounded-md border border-white/10 bg-[#0A0B0C] p-4 font-mono text-[11px] leading-[1.6]">
        <span className="text-text-2">{t('command')}</span>
        {cases.slice(0, reported).map((c, i) => (
          <span
            key={c.id}
            className={cn(
              'animate-landing-feed-in truncate',
              OUTCOME[i] === 'pass' ? 'text-primary' : 'text-system-red'
            )}
          >
            {OUTCOME[i] === 'pass' ? '✓' : '✘'} [{c.id}] {c.title}{' '}
            <span className="text-text-4">({c.time})</span>
          </span>
        ))}
        {isSent ? (
          <span className="animate-landing-feed-in text-[#60A5FA]">→ {t('sent')}</span>
        ) : (
          isRunning && (
            <span
              aria-hidden="true"
              className="animate-landing-blink bg-text-2 inline-block h-3 w-1.5"
            />
          )
        )}
      </div>

      <div className="bg-bg-2 flex flex-col gap-2 rounded-md border border-white/10 p-4">
        <p className="text-text-1 text-xs font-bold">{t('runTitle')}</p>
        <ul className="flex flex-col gap-1.5">
          {cases.map((c, i) => {
            const result = i < reported ? OUTCOME[i] : null;
            return (
              <li
                key={c.id}
                className="bg-bg-1 flex items-center gap-2 rounded-sm border border-white/5 px-2.5 py-2 text-xs"
              >
                <span className="text-primary shrink-0 font-medium">{c.id}</span>
                <span className="text-text-2 min-w-0 flex-1 truncate">{c.title}</span>
                {result ? (
                  <span
                    key={result}
                    className="animate-landing-pop flex shrink-0 items-center gap-1"
                  >
                    <span className="rounded-sm bg-[#60A5FA]/10 px-1.5 py-0.5 text-[10px] text-[#60A5FA]">
                      {t('auto')}
                    </span>
                    <span
                      className={cn(
                        'rounded-sm px-1.5 py-0.5 text-[11px] font-medium',
                        result === 'pass'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-system-red/10 text-system-red'
                      )}
                    >
                      {t(result)}
                    </span>
                  </span>
                ) : (
                  <span className="text-text-4 shrink-0">{t('waiting')}</span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
