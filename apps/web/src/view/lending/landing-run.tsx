'use client';

import React from 'react';

import { useTranslations } from 'next-intl';
import Image from 'next/image';

import { cn } from '@/shared';

import { CaseStatusBadge } from './cases/case-status-badge';
import { SheetToRun } from './cases/tc-001-sheet-to-run';
import { Collab } from './cases/tc-002-collab';
import { AiScenario } from './cases/tc-003-ai-scenario';
import { LiveProgress } from './cases/tc-004-live-progress';
import { ShareReport } from './cases/tc-005-share-report';
import { CiResults } from './cases/tc-006-ci-results';
import { AutomationCandidates } from './cases/tc-007-automation-candidates';
import { CASE_IDS, type CaseStatus, statusOf, usePrefersReducedMotion } from './run-model';
import { StartButton } from './start-button';

const CASE_KEYS = ['tc001', 'tc002', 'tc003', 'tc004', 'tc005', 'tc006', 'tc007'] as const;

/** 케이스 본문의 가운데가 화면 이 높이(비율)를 지나면 그 케이스를 통과로 본다. */
const PASS_LINE = 0.5;

/**
 * 스크롤 위치로 통과한 케이스 수를 센다. 다음 차례 케이스의 본문이 화면 가운데를 지나면 하나 늘어난다.
 * 위로 다시 올려도 통과는 되돌리지 않는다(통과된 행은 펼친 상태 유지).
 */
const useScrollProgress = (
  anchors: React.RefObject<(HTMLElement | null)[]>,
  reduceMotion: boolean
) => {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    if (reduceMotion) return;
    let frame = 0;
    const check = () => {
      frame = 0;
      setProgress((prev) => {
        let next = prev;
        while (next < CASE_IDS.length) {
          const el = anchors.current[next];
          if (!el) break;
          const rect = el.getBoundingClientRect();
          if (rect.top + rect.height / 2 >= window.innerHeight * PASS_LINE) break;
          next += 1;
        }
        return next;
      });
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    check();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [anchors, reduceMotion]);

  // 동작 줄이기 사용자에게는 애니메이션 없이 모든 케이스를 통과 상태로 보여 준다.
  return reduceMotion ? CASE_IDS.length : progress;
};

const CaseVisual = ({
  index,
  status,
  reduceMotion,
}: {
  index: number;
  status: CaseStatus;
  reduceMotion: boolean;
}) => {
  if (index === 0) return <SheetToRun status={status} />;
  if (index === 1) return <Collab status={status} reduceMotion={reduceMotion} />;
  if (index === 2) return <AiScenario status={status} reduceMotion={reduceMotion} />;
  if (index === 3) return <LiveProgress status={status} reduceMotion={reduceMotion} />;
  if (index === 4) return <ShareReport status={status} reduceMotion={reduceMotion} />;
  if (index === 5) return <CiResults status={status} reduceMotion={reduceMotion} />;
  return <AutomationCandidates status={status} reduceMotion={reduceMotion} />;
};

const RunComplete = ({ remaining }: { remaining: number }) => {
  const t = useTranslations('lending.run.complete');
  const isDone = remaining === 0;

  return (
    <div
      className={cn(
        'mt-6 flex flex-col gap-5 rounded-lg border px-5 py-6 transition-[border-color,background-color,box-shadow] duration-500 md:flex-row md:items-center md:justify-between md:px-6',
        isDone
          ? 'border-primary from-primary/15 to-primary/5 bg-gradient-to-r shadow-[0_0_40px_rgba(11,181,127,0.25)]'
          : 'bg-bg-2 border-dashed border-white/15'
      )}
    >
      <div className="flex flex-col gap-1.5" aria-live="polite">
        <p className={cn('text-lg font-bold md:text-xl', isDone ? 'text-primary' : 'text-text-1')}>
          {isDone ? t('doneTitle') : t('lockedTitle', { total: CASE_IDS.length })}
        </p>
        <p className="text-text-3 text-xs md:text-sm">
          {isDone ? t('doneDesc') : t('lockedDesc', { count: remaining })}
        </p>
      </div>
      <div className="relative self-start md:self-auto">
        <StartButton location="landing_run_complete" ariaLabel={t('buttonAria')} />
        {/* 베타 히어로의 커서 에셋을 버튼 끝에 둔다. */}
        <Image
          src="/backgrounds/arrow.svg"
          alt=""
          aria-hidden="true"
          width={30}
          height={30}
          className="pointer-events-none absolute -right-3 -bottom-4"
        />
      </div>
    </div>
  );
};

/** 기능 소개를 테스트 런으로 보여 주는 케이스 목록(TC-001~TC-004)과 마지막 시작 버튼. */
export const LandingRun = () => {
  const t = useTranslations('lending.run');
  const reduceMotion = usePrefersReducedMotion();
  const anchors = React.useRef<(HTMLElement | null)[]>([]);
  const progress = useScrollProgress(anchors, reduceMotion);

  return (
    <section
      id="run"
      aria-label={t('sectionAria')}
      className="relative mx-auto w-full max-w-[1200px] scroll-mt-24 px-4 pb-24 md:px-0"
    >
      <div
        aria-hidden="true"
        className="text-text-3 hidden grid-cols-[120px_1fr_auto] border-b border-white/10 px-6 pb-3 text-[11px] tracking-wide md:grid"
      >
        <span>{t('headId')}</span>
        <span>{t('headCase')}</span>
        <span>{t('headStatus')}</span>
      </div>
      <ol>
        {CASE_IDS.map((id, index) => {
          const key = CASE_KEYS[index];
          const status = statusOf(index, progress);
          const isOpen = status !== 'idle';
          return (
            <li
              key={id}
              className={cn(
                'border-b border-white/10 transition-colors duration-500',
                status === 'running' && 'bg-white/[0.03]'
              )}
            >
              <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-1 py-6 md:grid-cols-[120px_1fr_auto] md:px-6 md:py-7">
                <span
                  className={cn(
                    'text-sm font-medium transition-colors duration-500',
                    isOpen ? 'text-primary' : 'text-text-4'
                  )}
                >
                  {id}
                </span>
                <h3
                  className={cn(
                    'text-text-1 text-xl leading-[1.35] font-bold tracking-[-0.02em] break-keep transition-opacity duration-500 max-md:col-span-2 max-md:row-start-2 md:text-[28px]',
                    !isOpen && 'opacity-35'
                  )}
                >
                  {t(`${key}.title`)}
                </h3>
                <span className="justify-self-end">
                  <CaseStatusBadge status={status} />
                </span>
              </div>
              <div
                className={cn(
                  'grid transition-[grid-template-rows] duration-500 ease-out',
                  isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                )}
                inert={!isOpen}
              >
                <div className="min-h-0 overflow-hidden">
                  <div
                    ref={(el) => {
                      anchors.current[index] = el;
                    }}
                    className={cn(
                      'flex gap-4 px-1 pb-8 md:px-6 md:pb-10 md:pl-[144px]',
                      index === 0
                        ? 'flex-col'
                        : 'flex-col md:grid md:grid-cols-[280px_1fr] md:gap-8'
                    )}
                  >
                    <div
                      className={cn(
                        'flex gap-2',
                        index === 0 ? 'flex-col md:flex-row md:items-baseline md:gap-3' : 'flex-col'
                      )}
                    >
                      <span className="text-text-3 shrink-0 text-xs">{t('expected')}</span>
                      <p className="text-text-2 text-sm leading-[1.6] break-keep md:text-base">
                        {t(`${key}.desc`)}
                      </p>
                    </div>
                    <CaseVisual index={index} status={status} reduceMotion={reduceMotion} />
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <RunComplete remaining={CASE_IDS.length - progress} />
    </section>
  );
};
