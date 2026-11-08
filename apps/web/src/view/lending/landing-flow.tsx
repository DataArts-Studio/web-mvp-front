'use client';

import React from 'react';

import { useTranslations } from 'next-intl';

import { cn } from '@/shared';

import { FLOW_MOCKS } from './flow/flow-mocks';
import { useInView, usePrefersReducedMotion } from './run-model';

/** 단계 하나를 보여 주는 시간. 목업 장면(박자 350ms × 최대 약 20)이 끝나고 잠시 머문 뒤 넘어간다. */
const STEP_MS = 9000;
const PROGRESS_TICK_MS = 100;

type Step = { title: string; desc: string };

/**
 * 자동 넘김. 화면에 보이고, 사용자가 멈추지 않았고, 포인터·포커스가 섹션 밖에 있을 때만 시간이 흐른다.
 * 멈췄다 다시 재생하면 남은 시간부터 이어서 흐른다.
 */
const useAutoAdvance = (count: number, playing: boolean) => {
  // 단계와 경과 시간을 한 상태로 둬, 시간이 다 차면 한 번의 갱신으로 다음 단계와 0초로 넘어간다.
  const [state, setState] = React.useState({ active: 0, elapsed: 0 });

  React.useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(
      () =>
        setState(({ active, elapsed }) =>
          elapsed + PROGRESS_TICK_MS < STEP_MS
            ? { active, elapsed: elapsed + PROGRESS_TICK_MS }
            : { active: (active + 1) % count, elapsed: 0 }
        ),
      PROGRESS_TICK_MS
    );
    return () => window.clearInterval(id);
  }, [playing, count]);

  const select = React.useCallback((index: number) => setState({ active: index, elapsed: 0 }), []);

  return { active: state.active, select, progress: state.elapsed / STEP_MS };
};

/**
 * 히어로 바로 아래의 사용 흐름 섹션. 왼쪽 4단계(탭)를 고르면 오른쪽에 그 단계의 움직이는 목업이 재생된다.
 * 아래 TC-001~ 케이스 섹션이 기능을 하나씩 깊게 보여 준다면, 이 섹션은 처음부터 끝까지의 흐름을 한눈에 보여 준다.
 */
export const LandingFlow = () => {
  const t = useTranslations('lending.flow');
  const steps = t.raw('steps') as Step[];
  const reduceMotion = usePrefersReducedMotion();
  const [sectionRef, inView] = useInView<HTMLElement>();
  const [paused, setPaused] = React.useState(false);
  const [holding, setHolding] = React.useState(false);
  const playing = inView && !paused && !holding && !reduceMotion;
  const { active, select, progress } = useAutoAdvance(steps.length, playing);
  const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const Mock = FLOW_MOCKS[active];

  const onKeyDown = (event: React.KeyboardEvent) => {
    const keys: Record<string, number> = {
      ArrowDown: active + 1,
      ArrowRight: active + 1,
      ArrowUp: active - 1,
      ArrowLeft: active - 1,
      Home: 0,
      End: steps.length - 1,
    };
    if (!(event.key in keys)) return;
    event.preventDefault();
    const next = (keys[event.key] + steps.length) % steps.length;
    select(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <section
      ref={sectionRef}
      id="flow"
      aria-labelledby="landing-flow-title"
      className="relative w-full px-4 py-20 md:px-10 md:py-28"
      onPointerEnter={() => setHolding(true)}
      onPointerLeave={() => setHolding(false)}
      onFocus={() => setHolding(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHolding(false);
      }}
    >
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-10 md:gap-14">
        <header className="flex flex-col gap-3">
          <p className="text-primary text-xs font-medium tracking-[0.2em] md:text-sm">
            {t('eyebrow')}
          </p>
          <h2
            id="landing-flow-title"
            className="text-text-1 text-3xl leading-[1.25] font-bold tracking-[-0.03em] md:text-5xl"
          >
            {t('title')}
          </h2>
          <p className="text-text-2 text-base md:text-lg">{t('subtitle')}</p>
        </header>

        <div className="grid items-start gap-6 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-12">
          <div className="flex flex-col gap-3">
            <div
              role="tablist"
              aria-label={t('tablistAria')}
              aria-orientation="vertical"
              onKeyDown={onKeyDown}
              className="flex flex-col"
            >
              {steps.map((step, i) => {
                const isActive = i === active;
                return (
                  <button
                    key={step.title}
                    ref={(el) => {
                      tabRefs.current[i] = el;
                    }}
                    type="button"
                    role="tab"
                    id={`flow-tab-${i}`}
                    aria-selected={isActive}
                    aria-controls="flow-panel"
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => select(i)}
                    className={cn(
                      'relative flex cursor-pointer gap-4 border-l-2 py-4 pr-2 pl-5 text-left transition-colors',
                      isActive ? 'border-primary' : 'border-white/10 hover:border-white/30'
                    )}
                  >
                    {/* 진행 중인 단계는 왼쪽 선이 위에서 아래로 차오르며 다음 단계까지 남은 시간을 보여 준다. */}
                    {isActive && playing && (
                      <span
                        aria-hidden="true"
                        style={{ height: `${progress * 100}%` }}
                        className="bg-primary absolute top-0 -left-0.5 w-0.5 transition-[height] duration-100 ease-linear"
                      />
                    )}
                    <span
                      className={cn(
                        'pt-0.5 font-mono text-sm font-bold tabular-nums',
                        isActive ? 'text-primary' : 'text-text-3'
                      )}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="flex min-w-0 flex-col gap-1.5">
                      <span className="sr-only">{t('stepLabel', { n: i + 1 })}</span>
                      <span
                        className={cn(
                          'text-lg font-bold md:text-xl',
                          isActive ? 'text-text-1' : 'text-text-3'
                        )}
                      >
                        {step.title}
                      </span>
                      {/* 좁은 화면에서는 고른 단계의 설명만 펼쳐 목업이 목록 가까이 오게 한다. */}
                      <span
                        className={cn(
                          'text-text-2 text-sm leading-[1.6]',
                          !isActive && 'md:text-text-3 max-md:hidden'
                        )}
                      >
                        {step.desc}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            {!reduceMotion && (
              <button
                type="button"
                onClick={() => setPaused((prev) => !prev)}
                aria-pressed={paused}
                className="text-text-3 hover:text-text-1 self-start pl-5 text-xs underline-offset-4 transition-colors hover:underline"
              >
                {paused ? t('play') : t('pause')}
              </button>
            )}
          </div>

          <div
            role="tabpanel"
            id="flow-panel"
            aria-labelledby={`flow-tab-${active}`}
            className="md:sticky md:top-28"
          >
            {/* 목업은 장식이다. 단계 내용은 탭의 제목·설명이 전한다. */}
            <div key={active} aria-hidden="true" className="animate-landing-swap-in">
              <Mock reduceMotion={reduceMotion} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
