'use client';

import React from 'react';

import { useTranslations } from 'next-intl';
import Image from 'next/image';

import { cn } from '@/shared';
import { useBetaBanner } from '@/widgets/global-header';

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

/** 케이스 하나를 넘기는 데 드는 스크롤 길이(화면 높이 비율). */
const STEP_RATIO = 0.6;

/** 메뉴 바(h-16) 높이. 베타 배너가 보이면 그 높이(h-10)만큼 더 내려온다. */
const HEADER_PX = 64;
const BANNER_PX = 40;

/** 펼친 케이스 위에 바로 전 케이스 행을 이만큼(비율) 남겨, 목록이 이어진다는 걸 보여 준다. */
const PEEK_RATIO = 0.6;

/**
 * 스크롤 위치로 지금 펼칠 케이스와 통과한 케이스 수를 정한다.
 * 케이스 목록은 화면에 고정해 두고, 고정 구간을 STEP_RATIO 만큼 스크롤할 때마다 다음 케이스 하나를 펼친다.
 * 마지막 칸까지 내려가면 모든 케이스가 통과다. 위로 다시 올리면 펼친 케이스는 따라 돌아가지만 통과는 되돌리지 않는다.
 */
const useStepProgress = (
  track: React.RefObject<HTMLDivElement | null>,
  stickyTop: number,
  reduceMotion: boolean
) => {
  const [step, setStep] = React.useState(0);
  const [passed, setPassed] = React.useState(0);

  React.useEffect(() => {
    if (reduceMotion) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = track.current;
      if (!el) return;
      const sticky = el.firstElementChild as HTMLElement | null;
      const unit = (el.offsetHeight - (sticky?.offsetHeight ?? 0)) / CASE_IDS.length;
      if (unit <= 0) return;
      const scrolled = stickyTop - el.getBoundingClientRect().top;
      // 스냅 위치에서 반올림 오차로 한 칸 덜 세지 않게 1px 여유를 준다.
      const next = Math.min(CASE_IDS.length, Math.max(0, Math.floor((scrolled + 1) / unit)));
      setStep(next);
      setPassed((prev) => Math.max(prev, next));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [track, stickyTop, reduceMotion]);

  if (reduceMotion) return { open: -1, passed: CASE_IDS.length };
  // 마지막 칸(모두 통과)에서는 마지막 케이스를 펼친 채로 둔다.
  return { open: Math.min(step, CASE_IDS.length - 1), passed };
};

/** 한 칸 이동을 시작한 뒤 다음 휠 입력을 받기까지 기다리는 시간과, 휠 입력이 끊겼다고 보는 간격(ms). */
const WHEEL_LOCK_MS = 550;
const WHEEL_IDLE_MS = 160;

/**
 * 고정 구간 안에서는 휠 한 번에 정확히 한 칸(케이스 하나)씩 움직인다.
 * 이동 중이거나 트랙패드 관성으로 휠 입력이 이어지는 동안은 추가 입력을 무시해, 한 번 굴려서 여러 케이스를 건너뛰지 않는다.
 * 첫 칸에서 위로, 마지막 칸에서 아래로 굴리면 가로채지 않아 평소처럼 구간을 벗어난다. 터치·키보드 스크롤은 그대로 둔다.
 */
const useWheelStep = (
  track: React.RefObject<HTMLDivElement | null>,
  stickyTop: number,
  reduceMotion: boolean
) => {
  React.useEffect(() => {
    if (reduceMotion) return;
    let movedAt = -Infinity;
    let wheelAt = -Infinity;
    const onWheel = (event: WheelEvent) => {
      const el = track.current;
      if (!el || event.ctrlKey || Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
      const sticky = el.firstElementChild as HTMLElement | null;
      const unit = (el.offsetHeight - (sticky?.offsetHeight ?? 0)) / CASE_IDS.length;
      if (unit <= 0) return;
      const scrolled = stickyTop - el.getBoundingClientRect().top;
      if (scrolled < -2 || scrolled > CASE_IDS.length * unit + 2) return;
      const now = performance.now();
      const isBusy = now - movedAt < WHEEL_LOCK_MS || now - wheelAt < WHEEL_IDLE_MS;
      const position = scrolled / unit;
      const target =
        event.deltaY > 0 ? Math.floor(position + 0.05) + 1 : Math.ceil(position - 0.05) - 1;
      if (!isBusy && (target < 0 || target > CASE_IDS.length)) return;
      event.preventDefault();
      wheelAt = now;
      if (isBusy) return;
      movedAt = now;
      const top = window.scrollY + el.getBoundingClientRect().top - stickyTop + target * unit + 1;
      window.scrollTo({ top, behavior: 'smooth' });
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [track, stickyTop, reduceMotion]);
};

/**
 * 펼친 케이스가 고정 화면 위쪽에 오도록 목록을 위로 미는 거리.
 * 접힌 행 높이는 바뀌지 않으므로 펼침 애니메이션이 끝난 뒤의 위치로 계산한다. 목록 끝이 화면 아래보다 올라가지는 않는다.
 */
const useListOffset = (
  list: React.RefObject<HTMLDivElement | null>,
  open: number,
  disabled: boolean
) => {
  const [offset, setOffset] = React.useState(0);

  React.useLayoutEffect(() => {
    if (disabled) return;
    const measure = () => {
      const el = list.current;
      const viewport = el?.parentElement;
      const rows = el?.querySelectorAll<HTMLElement>(':scope > ol > li');
      if (!el || !viewport || !rows?.length || open < 0) return;
      const listHead = (el.firstElementChild as HTMLElement).offsetHeight;
      const headOf = (row: HTMLElement) => (row.firstElementChild as HTMLElement).offsetHeight + 1;
      const bodyOf = (row: HTMLElement) =>
        (row.lastElementChild?.firstElementChild?.firstElementChild as HTMLElement | null)
          ?.offsetHeight ?? 0;

      let top = listHead;
      let total = listHead + bodyOf(rows[open]);
      rows.forEach((row, index) => {
        if (index < open) top += headOf(row);
        total += headOf(row);
      });
      const peek = open > 0 ? headOf(rows[open - 1]) * PEEK_RATIO : top;
      const max = Math.max(0, total - viewport.clientHeight);
      setOffset(Math.min(max, Math.max(0, top - peek)));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [list, open, disabled]);

  return disabled ? 0 : offset;
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

/**
 * 기능 소개를 테스트 런으로 보여 주는 케이스 목록(TC-001~TC-007)과 마지막 시작 버튼.
 * 목록은 화면에 고정되고, 스크롤 한 칸마다 케이스가 하나씩 펼쳐지며 통과한다(앞 케이스는 다시 접힌다).
 */
export const LandingRun = () => {
  const t = useTranslations('lending.run');
  const reduceMotion = usePrefersReducedMotion();
  const { isVisible: isBannerVisible } = useBetaBanner();
  const stickyTop = HEADER_PX + (isBannerVisible ? BANNER_PX : 0);
  const track = React.useRef<HTMLDivElement>(null);
  const list = React.useRef<HTMLDivElement>(null);
  const { open, passed } = useStepProgress(track, stickyTop, reduceMotion);
  const offset = useListOffset(list, open, reduceMotion);
  useWheelStep(track, stickyTop, reduceMotion);

  const caseList = (
    <div
      ref={list}
      className={cn(!reduceMotion && 'transition-transform duration-500 ease-out')}
      style={reduceMotion ? undefined : { transform: `translateY(${-offset}px)` }}
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
          const status = statusOf(index, passed);
          const isOpen = reduceMotion || index === open;
          const isReached = status !== 'idle';
          return (
            <li
              key={id}
              className={cn(
                'border-b border-white/10 transition-colors duration-500',
                isOpen && !reduceMotion && 'bg-white/[0.03]'
              )}
            >
              <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-1 py-6 md:grid-cols-[120px_1fr_auto] md:px-6 md:py-7">
                <span
                  className={cn(
                    'text-sm font-medium transition-colors duration-500',
                    isReached ? 'text-primary' : 'text-text-4'
                  )}
                >
                  {id}
                </span>
                <h3
                  className={cn(
                    'text-text-1 text-xl leading-[1.35] font-bold tracking-[-0.02em] break-keep transition-opacity duration-500 max-md:col-span-2 max-md:row-start-2 md:text-[28px]',
                    !isOpen && (isReached ? 'opacity-60' : 'opacity-35')
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
    </div>
  );

  return (
    <section
      id="run"
      aria-label={t('sectionAria')}
      className="relative mx-auto w-full max-w-[1200px] scroll-mt-24 px-4 pb-24 md:px-0"
    >
      {reduceMotion ? (
        caseList
      ) : (
        // 고정 화면 높이 + 케이스 수만큼의 스크롤 칸.
        <div
          ref={track}
          className="relative"
          style={{
            height: `calc(100svh - ${stickyTop}px + ${CASE_IDS.length * STEP_RATIO * 100}svh)`,
          }}
        >
          <div
            className="sticky overflow-hidden"
            style={{ top: stickyTop, height: `calc(100svh - ${stickyTop}px)` }}
          >
            {caseList}
          </div>
        </div>
      )}
      <RunComplete remaining={CASE_IDS.length - passed} />
    </section>
  );
};
