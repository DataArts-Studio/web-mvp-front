'use client';

import React from 'react';

import { useTranslations } from 'next-intl';

import { cn } from '@/shared';

import { type CaseStatus, useInView, useTicker } from '../run-model';

const TICK_MS = 100;
/** 박자 단위 타임라인: 버튼 눌림 → 링크 생성 → 복사 → 리포트 열림 → 머묾 */
const PRESS_AT = 8;
const LINK_AT = 12;
const COPY_AT = 22;
const REPORT_AT = 28;
const CYCLE = 70;

const RESULT = { pass: 18, fail: 2, blocked: 2 };
const TOTAL = RESULT.pass + RESULT.fail + RESULT.blocked;
const PASS_RATE = Math.round((RESULT.pass / TOTAL) * 100);

/**
 * TC-005 시각물. 보이는 동안 공유 링크 만들기 → 링크 복사 → 읽기 전용 리포트 미리보기가 반복된다.
 */
export const ShareReport = ({
  status,
  reduceMotion,
}: {
  status: CaseStatus;
  reduceMotion: boolean;
}) => {
  const t = useTranslations('lending.run.tc005');
  const [ref, inView] = useInView<HTMLDivElement>();
  const isStarted = status !== 'idle';
  const tick = useTicker(isStarted && inView && !reduceMotion, TICK_MS);

  // 동작 줄이기 사용자와 시작 전에는 리포트가 열린 완성 상태를 보여 준다.
  const at = reduceMotion || !isStarted ? CYCLE - 1 : tick % CYCLE;
  const isPressed = at >= PRESS_AT && at < LINK_AT;
  const hasLink = at >= LINK_AT;
  const isCopied = at >= COPY_AT && at < REPORT_AT + 14;
  const hasReport = at >= REPORT_AT;
  // 통과율 숫자가 0에서 차오른다.
  const rate = hasReport
    ? Math.min(PASS_RATE, Math.round(((at - REPORT_AT + 1) / 8) * PASS_RATE))
    : 0;

  return (
    <div
      ref={ref}
      className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]"
    >
      <div className="bg-bg-2 flex flex-col gap-3 rounded-md border border-white/10 p-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-text-1 text-sm font-bold">{t('runName')}</span>
          <span className="text-text-3 text-xs">{t('runMeta')}</span>
        </div>
        <span
          className={cn(
            'rounded-sm border py-2 text-center text-xs font-bold transition-[color,background-color,scale] duration-200',
            isPressed
              ? 'border-primary bg-primary/20 text-primary scale-[0.97]'
              : 'text-text-1 border-white/20'
          )}
        >
          {t('share')}
        </span>
        <div
          className={cn(
            'flex items-center gap-2 transition-opacity duration-300',
            hasLink ? 'opacity-100' : 'opacity-0'
          )}
          aria-hidden={!hasLink}
        >
          <span className="bg-bg-1 text-text-2 min-w-0 flex-1 truncate rounded-sm border border-white/10 px-2.5 py-1.5 text-xs">
            {t('link')}
          </span>
          <span
            className={cn(
              'shrink-0 rounded-sm px-2.5 py-1.5 text-xs font-bold transition-colors duration-200',
              isCopied ? 'bg-secondary text-text-1' : 'bg-primary text-text-1'
            )}
          >
            {t('copy')}
          </span>
        </div>
        <p
          className={cn(
            'text-primary h-4 text-xs transition-opacity duration-300',
            isCopied ? 'opacity-100' : 'opacity-0'
          )}
          aria-hidden={!isCopied}
        >
          {t('copied')}
        </p>
      </div>

      <div
        className={cn(
          'bg-bg-1 flex flex-col gap-3 rounded-md border border-white/10 p-4 transition-[opacity,translate] duration-500',
          hasReport ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-30'
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-text-3 text-[10px] tracking-wide">{t('reportLabel')}</span>
          <span className="text-text-4 text-[10px]">{t('expires')}</span>
        </div>
        <p className="text-text-1 text-sm font-bold">{t('reportTitle')}</p>
        <div className="flex items-end gap-2">
          <span className="text-primary text-4xl leading-none font-bold tabular-nums">{rate}%</span>
          <span className="text-text-3 pb-1 text-xs">{t('passRate')}</span>
        </div>
        <span aria-hidden="true" className="bg-bg-4 flex h-1.5 overflow-hidden rounded-full">
          {(['pass', 'fail', 'blocked'] as const).map((key) => (
            <span
              key={key}
              className={cn(
                'h-full transition-[width] duration-700 ease-out',
                key === 'pass' && 'bg-primary',
                key === 'fail' && 'bg-system-red',
                key === 'blocked' && 'bg-[#F59E0B]'
              )}
              style={{ width: `${hasReport ? (RESULT[key] / TOTAL) * 100 : 0}%` }}
            />
          ))}
        </span>
        <ul className="text-text-2 flex gap-4 text-xs">
          {(['pass', 'fail', 'blocked'] as const).map((key) => (
            <li key={key} className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className={cn(
                  'size-1.5 rounded-full',
                  key === 'pass' && 'bg-primary',
                  key === 'fail' && 'bg-system-red',
                  key === 'blocked' && 'bg-[#F59E0B]'
                )}
              />
              {t(`counts.${key}`)} {RESULT[key]}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
