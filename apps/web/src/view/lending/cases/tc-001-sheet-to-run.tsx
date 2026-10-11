'use client';

import React from 'react';

import { useTranslations } from 'next-intl';

import { cn } from '@/shared';

import type { CaseStatus } from '../run-model';
import { CaseTags } from './case-status-badge';

type Verdict = 'pass' | 'fail' | 'blocked';

const VERDICT_STYLE: Record<Verdict, { button: string; badge: string; bar: string }> = {
  pass: {
    button: 'border-primary/50 text-primary hover:bg-primary/10',
    badge: 'bg-primary/10 text-primary',
    bar: 'bg-primary',
  },
  fail: {
    button: 'border-system-red/50 text-system-red hover:bg-system-red/10',
    badge: 'bg-system-red/10 text-system-red',
    bar: 'bg-system-red',
  },
  blocked: {
    button: 'border-[#F59E0B]/50 text-[#F59E0B] hover:bg-[#F59E0B]/10',
    badge: 'bg-[#F59E0B]/10 text-[#F59E0B]',
    bar: 'bg-[#F59E0B]',
  },
};

const VERDICTS: Verdict[] = ['pass', 'fail', 'blocked'];

/** 엑셀 시트. 문제 셀(중복, 실패, 보류)을 색으로 드러낸다. */
const LegacySheet = () => {
  const t = useTranslations('lending.run.tc001');
  const columns = t.raw('sheet.columns') as string[];
  const rows = t.raw('sheet.rows') as string[][];
  const tabs = t.raw('sheet.tabs') as string[];
  const letters = ['A', 'B', 'C', 'D'];

  const rowTone = (row: string[], index: number) => {
    if (row[2] === 'FAIL' || index === 4) return 'bg-[#FEF3C7]';
    if (index === 2) return 'bg-[#FEE2E2]';
    return '';
  };

  return (
    <div className="overflow-hidden rounded-md bg-white text-[12px] text-[#1F2937] shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
      <table className="w-full table-fixed border-collapse">
        <colgroup>
          {/* 좁은 화면에서는 비고(D) 열을 숨기고 항목(B) 열이 남은 폭을 갖는다. */}
          <col className="w-8" />
          <col className="w-[14%] sm:w-[12%]" />
          <col className="sm:w-[30%]" />
          <col className="w-[20%] sm:w-[16%]" />
          <col className="max-sm:w-0" />
        </colgroup>
        <thead>
          <tr className="bg-[#F3F4F6] text-[11px] text-[#6B7280]">
            <th className="border border-[#E5E7EB] py-1 font-normal" />
            {letters.map((letter) => (
              <th
                key={letter}
                className={cn(
                  'border border-[#E5E7EB] py-1 font-normal',
                  letter === 'D' && 'max-sm:hidden'
                )}
              >
                {letter}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="font-semibold">
            <td className="border border-[#E5E7EB] bg-[#F3F4F6] py-1.5 text-center text-[11px] font-normal text-[#6B7280]">
              1
            </td>
            {columns.map((column, i) => (
              <td
                key={column}
                className={cn('border border-[#E5E7EB] px-2 py-1.5', i === 3 && 'max-sm:hidden')}
              >
                {column}
              </td>
            ))}
          </tr>
          {rows.map((row, index) => (
            <tr key={`${row[1]}-${index}`} className={rowTone(row, index)}>
              <td className="border border-[#E5E7EB] bg-[#F3F4F6] py-1.5 text-center text-[11px] text-[#6B7280]">
                {index + 2}
              </td>
              {row.map((cell, i) => (
                <td
                  key={i}
                  className={cn(
                    'truncate border border-[#E5E7EB] px-2 py-1.5',
                    cell === 'FAIL' && 'text-system-red',
                    i === 3 && 'max-sm:hidden'
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
          <tr>
            <td className="border border-[#E5E7EB] bg-[#F3F4F6] py-1.5 text-center text-[11px] text-[#6B7280]">
              {rows.length + 2}
            </td>
            <td className="border border-[#E5E7EB]" />
            <td colSpan={2} className="truncate border border-[#E5E7EB] px-2 py-1.5">
              {t('sheet.formula')}
            </td>
            <td className="border border-[#E5E7EB] max-sm:hidden" />
          </tr>
        </tbody>
      </table>
      <div className="flex gap-1 bg-[#F3F4F6] px-3 py-1.5 text-[11px] text-[#6B7280]">
        {tabs.map((tab, i) => (
          <span
            key={tab}
            className={cn(
              'rounded-sm px-2 py-0.5',
              i === 2 && 'bg-white font-medium text-[#111827]'
            )}
          >
            {tab}
          </span>
        ))}
      </div>
    </div>
  );
};

/** 샘플 실행. 위에서부터 하나씩 통과/실패/블로커를 판정하면 카운터와 막대가 차오른다. */
const SampleRun = () => {
  const t = useTranslations('lending.run.tc001.run');
  const items = t.raw('items') as string[];
  const [verdicts, setVerdicts] = React.useState<Verdict[]>([]);
  const done = verdicts.length;
  const isComplete = done === items.length;
  const count = (v: Verdict) => verdicts.filter((x) => x === v).length;

  return (
    <div className="border-primary/40 bg-bg-2 overflow-hidden rounded-lg border">
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <p className="text-text-1 text-sm font-bold">{t('title')}</p>
        <p className="text-primary text-xs font-medium" aria-live="polite">
          {t('counter', { done, total: items.length })}
        </p>
      </div>
      <div aria-hidden="true" className="flex gap-1 px-4 pb-3">
        {items.map((item, i) => (
          <span key={item} className="bg-bg-4 h-1 flex-1 overflow-hidden rounded-full">
            <span
              className={cn(
                'block h-full transition-[width] duration-300',
                verdicts[i] ? `w-full ${VERDICT_STYLE[verdicts[i]].bar}` : 'w-0'
              )}
            />
          </span>
        ))}
      </div>
      <ol>
        {items.map((item, i) => {
          const verdict = verdicts[i];
          const isCurrent = i === done;
          return (
            <li
              key={item}
              className={cn(
                'flex min-h-12 items-center justify-between gap-3 border-t border-white/5 px-4 py-2 text-sm',
                isCurrent ? 'bg-bg-3 text-text-1' : 'text-text-3',
                verdict && 'text-text-2'
              )}
            >
              <span className="min-w-0 truncate">{item}</span>
              {verdict && (
                <span
                  className={cn(
                    'animate-landing-pop shrink-0 rounded-sm px-2 py-1 text-xs font-medium',
                    VERDICT_STYLE[verdict].badge
                  )}
                >
                  {t(verdict)}
                </span>
              )}
              {isCurrent && (
                <span className="flex shrink-0 gap-1.5">
                  {VERDICTS.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setVerdicts((prev) => [...prev, v])}
                      aria-label={`${item}: ${t(v)}`}
                      className={cn(
                        'cursor-pointer rounded-sm border px-2 py-1 text-xs font-medium transition-colors',
                        VERDICT_STYLE[v].button
                      )}
                    >
                      {t(v)}
                    </button>
                  ))}
                </span>
              )}
              {!verdict && !isCurrent && <span className="shrink-0 text-xs">{t('waiting')}</span>}
            </li>
          );
        })}
      </ol>
      <div className="flex min-h-11 items-center justify-between gap-3 border-t border-white/5 px-4 py-2 text-xs">
        {isComplete ? (
          <>
            <p className="text-text-2" aria-live="polite">
              <span className="text-primary mr-2 font-bold">{t('doneLabel')}</span>
              {t('summary', {
                pass: count('pass'),
                fail: count('fail'),
                blocked: count('blocked'),
              })}
            </p>
            <button
              type="button"
              onClick={() => setVerdicts([])}
              className="text-text-1 hover:border-primary shrink-0 cursor-pointer rounded-sm border border-white/20 px-2.5 py-1 transition-colors"
            >
              {t('retry')}
            </button>
          </>
        ) : (
          <p className="text-text-3">{t('hint')}</p>
        )}
      </div>
    </div>
  );
};

/**
 * TC-001 본문. 진행 중에는 지금 쓰는 엑셀 시트를, 통과하면(스크롤로 시트가 화면 가운데를 지나면)
 * 같은 자리에서 테스티아 샘플 실행으로 바뀐다.
 */
export const SheetToRun = ({ status }: { status: CaseStatus }) => {
  const t = useTranslations('lending.run.tc001');
  const isRun = status === 'passed';

  return (
    <div className="flex flex-col gap-3">
      <p className="text-text-3 text-xs">
        {isRun ? (
          <span className="text-primary">{t('runCaption')}</span>
        ) : (
          <>
            {t('sheetCaption')}
            <span className="ml-3 max-sm:ml-0 max-sm:block">{t('sheetHint')}</span>
          </>
        )}
      </p>
      <div key={isRun ? 'run' : 'sheet'} className={cn(isRun && 'animate-landing-swap-in')}>
        {isRun ? <SampleRun /> : <LegacySheet />}
      </div>
      {isRun ? (
        <CaseTags tags={t.raw('runTags') as string[]} tone="solved" />
      ) : (
        <CaseTags tags={t.raw('sheetTags') as string[]} tone="problem" />
      )}
    </div>
  );
};
