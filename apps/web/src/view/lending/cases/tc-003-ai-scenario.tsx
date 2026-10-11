'use client';

import React from 'react';

import { useTranslations } from 'next-intl';

import { cn } from '@/shared';

import type { CaseStatus } from '../run-model';

const TYPE_INTERVAL_MS = 28;

/**
 * TC-003 시각물. 진행 중이 되면 요구사항이 타자 치듯 써지고, "시나리오 만들기"가 눌린 뒤
 * 초안 카드가 위에서부터 하나씩 나온다. 마지막 카드는 "작성 중…"으로 잠깐 머문 뒤 완성된다.
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

  // typed: 써진 글자 수, shown: 나타난 초안 수, finished: 마지막 초안까지 완성
  const [typedChars, setTyped] = React.useState(0);
  const [shownDrafts, setShown] = React.useState(0);
  const [isFinished, setFinished] = React.useState(false);

  React.useEffect(() => {
    if (!isStarted) return;
    if (reduceMotion) return;
    const timers: number[] = [];
    let chars = 0;
    const typing = window.setInterval(() => {
      chars += 1;
      setTyped(chars);
      if (chars < requirement.length) return;
      window.clearInterval(typing);
      for (let i = 1; i <= draftCount; i += 1) {
        timers.push(window.setTimeout(() => setShown(i), 400 + i * 350));
      }
      timers.push(window.setTimeout(() => setFinished(true), 400 + draftCount * 350 + 900));
    }, TYPE_INTERVAL_MS);
    return () => {
      window.clearInterval(typing);
      timers.forEach(window.clearTimeout);
    };
  }, [isStarted, reduceMotion, requirement, draftCount]);

  // 동작 줄이기 사용자에게는 완성된 상태를 바로 보여 준다.
  const skip = reduceMotion && isStarted;
  const typed = skip ? requirement.length : typedChars;
  const shown = skip ? draftCount : shownDrafts;
  const finished = skip || isFinished;

  const isTyping = isStarted && typed < requirement.length;
  const isPressed = typed >= requirement.length && isStarted;

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
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
            'rounded-sm py-2 text-center text-xs font-bold transition-colors duration-300',
            isPressed ? 'bg-secondary text-text-1' : 'bg-primary text-text-1'
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
