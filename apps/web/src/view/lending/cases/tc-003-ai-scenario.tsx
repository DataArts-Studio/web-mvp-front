'use client';

import React from 'react';

import { useTranslations } from 'next-intl';

import { cn } from '@/shared';

import { type CaseStatus, useInView, useTicker } from '../run-model';

const TICK_MS = 35;
/** 박자 단위 타임라인: 다 써진 뒤 버튼 눌림, 초안 간격, 마지막 초안 작성 시간, 완성 후 머무는 시간 */
const PRESS = 12;
const DRAFT_GAP = 10;
const WRITING = 25;
const HOLD = 75;

/**
 * TC-003 시각물. 보이는 동안 요구사항이 타자 치듯 써지고, "시나리오 만들기"가 눌린 뒤
 * 초안 카드가 위에서부터 하나씩 나온다. 마지막 카드는 "작성 중…"으로 잠깐 머문 뒤 완성되고,
 * 잠시 뒤 처음부터 다시 반복된다.
 */
export const AiScenario = ({
  status,
  reduceMotion,
}: {
  status: CaseStatus;
  reduceMotion: boolean;
}) => {
  const t = useTranslations('lending.run.tc003');
  const requirement = t('requirement');
  const drafts = t.raw('drafts') as string[];
  const draftCount = drafts.length;
  const isStarted = status !== 'idle';
  const [ref, inView] = useInView<HTMLDivElement>();
  const tick = useTicker(isStarted && inView && !reduceMotion, TICK_MS);

  const len = requirement.length;
  const draftsAt = len + PRESS;
  const finishAt = draftsAt + draftCount * DRAFT_GAP + WRITING;
  const cycle = finishAt + HOLD;
  const at = tick % cycle;

  // 동작 줄이기 사용자에게는 완성된 상태를 바로 보여 준다.
  const skip = reduceMotion && isStarted;
  const typed = skip ? len : Math.min(at, len);
  const shown = skip
    ? draftCount
    : Math.max(0, Math.min(draftCount, Math.floor((at - draftsAt) / DRAFT_GAP) + 1));
  const finished = skip || at >= finishAt;

  const isTyping = isStarted && typed < requirement.length;
  // 다 써진 직후 잠깐 눌린 모습을 보여 준다.
  const isPressed = !skip && isStarted && at >= len && at < draftsAt + DRAFT_GAP;

  return (
    <div
      ref={ref}
      className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
    >
      <div className="bg-bg-2 flex flex-col gap-3 rounded-md border border-white/10 p-4">
        <p className="text-text-3 text-[10px] tracking-wide">{t('requirementLabel')}</p>
        <p className="bg-bg-1 text-text-2 min-h-24 rounded-sm border border-white/10 p-3 text-xs leading-[1.6]">
          {/* 화면에는 써지는 만큼만 보이고, 보조기술과 검색엔진에는 전체 문장을 준다. */}
          <span aria-hidden="true">{requirement.slice(0, typed)}</span>
          <span className="sr-only">{requirement}</span>
          {isTyping && (
            <span
              aria-hidden="true"
              className="animate-landing-blink bg-primary ml-0.5 inline-block h-3.5 w-px align-middle"
            />
          )}
        </p>
        <span
          className={cn(
            'rounded-sm py-2 text-center text-xs font-bold transition-[color,background-color,scale] duration-200',
            isPressed ? 'bg-secondary text-text-1 scale-[0.97]' : 'bg-primary text-text-1'
          )}
        >
          {t('generate')}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-text-3 flex items-center justify-between text-[10px] tracking-wide">
          <span>{t('draftLabel')}</span>
          {shown > 0 && (
            <span className="text-primary">{t('draftCount', { count: draftCount })}</span>
          )}
        </div>
        <ol className="flex flex-col gap-2">
          {drafts.map((draft, i) => {
            const isVisible = i < shown;
            const isWriting = i === draftCount - 1 && !finished;
            return (
              <li
                key={draft}
                className={cn(
                  'flex items-center gap-3 rounded-md border px-3 py-2.5 text-xs transition-opacity duration-300',
                  isVisible ? 'animate-landing-feed-in opacity-100' : 'opacity-0',
                  isWriting ? 'border-dashed border-white/20' : 'bg-bg-2 border-white/10'
                )}
              >
                <span className="text-primary shrink-0 font-medium">
                  SC-{String(i + 1).padStart(2, '0')}
                </span>
                <span
                  className={cn(
                    'min-w-0 flex-1 truncate',
                    isWriting ? 'text-text-3' : 'text-text-1'
                  )}
                >
                  {draft}
                </span>
                <span className={cn('shrink-0', isWriting ? 'text-text-3' : 'text-primary')}>
                  {isWriting ? t('writing') : t('move')}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
};
