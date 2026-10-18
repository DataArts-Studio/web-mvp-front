'use client';

import React, { useState } from 'react';

import type { RunComparison, TestCaseRunDetail } from '@/entities/test-run';
import { RUN_NAME_MAX_LENGTH } from '@/entities/test-run/model/schema';
import { Dialog } from '@testea/ui';
import { cn } from '@testea/util';
import { Check, ChevronDown, Minus, X } from 'lucide-react';

import type { Transition } from './run-complete-model';
import {
  DEFAULT_RERUN_GROUPS,
  type RerunGroup,
  buildRerunGroups,
  nextRunNameOf,
} from './run-rerun-model';

interface RerunSheetProps {
  runName: string;
  cases: TestCaseRunDetail[];
  comparison: RunComparison | undefined;
  isPending: boolean;
  onSubmit: (name: string, testCaseRunIds: string[]) => void;
  onClose: () => void;
}

const TONE: Record<Transition, { edge: string; bar: string; count: string }> = {
  newFail: { edge: 'bg-result-fail', bar: 'bg-result-fail/[0.1]', count: 'text-result-fail' },
  stillFail: { edge: 'bg-result-fail', bar: 'bg-result-fail/[0.1]', count: 'text-result-fail' },
  blocked: {
    edge: 'bg-result-blocked',
    bar: 'bg-result-blocked/[0.1]',
    count: 'text-result-blocked',
  },
  untested: { edge: 'bg-white/30', bar: 'bg-white/[0.05]', count: 'text-white/70' },
  recovered: { edge: 'bg-result-pass', bar: 'bg-result-pass/[0.08]', count: 'text-result-pass' },
  stillPass: { edge: 'bg-result-pass', bar: 'bg-result-pass/[0.08]', count: 'text-result-pass' },
};

const CheckMark = ({ state }: { state: 'on' | 'off' | 'some' }) => (
  <span
    aria-hidden="true"
    className={cn(
      'flex size-4 shrink-0 items-center justify-center rounded-[3px] border',
      state === 'off' ? 'border-white/30' : 'bg-primary border-primary'
    )}
  >
    {state === 'on' && <Check className="size-3 text-white" strokeWidth={3} />}
    {state === 'some' && <Minus className="size-3 text-white" strokeWidth={3} />}
  </span>
);

/** 끝난 실행에서 다시 볼 케이스만 골라 새 실행을 만드는 사이드 시트 (06j). */
export const RerunSheet = ({
  runName,
  cases,
  comparison,
  isPending,
  onSubmit,
  onClose,
}: RerunSheetProps) => {
  const groups = buildRerunGroups(cases, comparison);
  const [name, setName] = useState(() => nextRunNameOf(runName));
  const [picked, setPicked] = useState<Set<string>>(
    () =>
      new Set(
        groups
          .filter((g) => DEFAULT_RERUN_GROUPS.includes(g.value))
          .flatMap((g) => g.cases.map((tc) => tc.id))
      )
  );
  const [expanded, setExpanded] = useState<Transition | null>(null);

  const total = cases.length;
  const trimmedName = name.trim();
  const canSubmit = picked.size > 0 && trimmedName.length >= 2 && !isPending;

  const pickedIn = (group: RerunGroup) => group.cases.filter((tc) => picked.has(tc.id)).length;

  const toggleGroup = (group: RerunGroup) => {
    const allOn = pickedIn(group) === group.cases.length;
    setPicked((prev) => {
      const next = new Set(prev);
      for (const tc of group.cases) {
        if (allOn) next.delete(tc.id);
        else next.add(tc.id);
      }
      return next;
    });
  };

  const toggleCase = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <Dialog.Root
      defaultOpen
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content
          closeOnEscape={!isPending}
          className="bg-bg-1 border-line-2 flex w-full max-w-[500px] flex-col border-l shadow-xl"
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            left: 'auto',
            transform: 'none',
            zIndex: 1001,
            outline: 'none',
          }}
        >
          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={(e) => {
              e.preventDefault();
              if (canSubmit) onSubmit(trimmedName, [...picked]);
            }}
          >
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pt-6 pb-4">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <Dialog.Title className="text-[18px] font-bold text-white/95">
                    재실행 만들기
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-[12px] text-white/50">
                    {runName} 결과에서 다시 볼 케이스만 골라 새 실행을 만들어요.
                  </Dialog.Description>
                </div>
                <button
                  type="button"
                  aria-label="닫기"
                  onClick={onClose}
                  disabled={isPending}
                  className="rounded-[4px] p-1 text-white/50 hover:bg-white/5 hover:text-white/85"
                >
                  <X className="size-4" />
                </button>
              </div>

              <label htmlFor="rerun-name" className="mt-6 text-[12px] font-medium text-white/55">
                이름
              </label>
              <input
                id="rerun-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={RUN_NAME_MAX_LENGTH}
                disabled={isPending}
                className="bg-bg-2 border-line-2 focus:border-primary mt-2 rounded-[6px] border px-3 py-2.5 text-[14px] text-white/90 outline-none"
              />

              <div className="mt-6 flex items-center justify-between">
                <span id="rerun-groups" className="text-[12px] font-medium text-white/55">
                  포함할 케이스
                </span>
                <span className="text-primary text-[13px] font-bold">{picked.size}건</span>
              </div>

              <ul
                aria-labelledby="rerun-groups"
                className="border-line-2 mt-2 overflow-hidden rounded-[6px] border"
              >
                {groups.map((group) => {
                  const on = pickedIn(group);
                  const state = on === 0 ? 'off' : on === group.cases.length ? 'on' : 'some';
                  const isOpen = expanded === group.value;
                  const tone = TONE[group.value];
                  return (
                    <li key={group.value} className="border-line-2 border-b last:border-b-0">
                      <div className="group/row relative flex items-center">
                        <div
                          aria-hidden="true"
                          className={cn('absolute inset-y-0 left-0', tone.bar)}
                          style={{ width: `${(group.cases.length / total) * 100}%` }}
                        />
                        <span
                          aria-hidden="true"
                          className={cn('absolute inset-y-0 left-0 w-[3px]', tone.edge)}
                        />
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={state === 'some' ? 'mixed' : state === 'on'}
                          onClick={() => toggleGroup(group)}
                          disabled={isPending}
                          className="relative flex min-w-0 flex-1 items-center gap-3 py-2.5 pr-2 pl-4 text-left"
                        >
                          <CheckMark state={state} />
                          <span className="min-w-0">
                            <span className="block text-[13px] font-medium text-white/90">
                              {group.label}
                            </span>
                            {(state === 'some' || group.hint) && (
                              <span className="block truncate text-[11px] text-white/45">
                                {state === 'some'
                                  ? `${group.cases.length}건 중 ${on}건 선택`
                                  : group.hint}
                              </span>
                            )}
                          </span>
                        </button>
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          aria-label={`${group.label} 케이스 ${isOpen ? '접기' : '보기'}`}
                          onClick={() => setExpanded(isOpen ? null : group.value)}
                          className={cn(
                            'text-primary relative flex items-center gap-0.5 px-2 py-1 text-[11px] opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100',
                            (isOpen || state === 'some') && 'opacity-100'
                          )}
                        >
                          {isOpen ? '접기' : '케이스 보기'}
                          <ChevronDown className={cn('size-3', isOpen && 'rotate-180')} />
                        </button>
                        <span
                          className={cn(
                            'relative w-14 shrink-0 pr-4 text-right text-[13px] font-bold',
                            tone.count
                          )}
                        >
                          {state === 'some' ? `${on} / ${group.cases.length}` : group.cases.length}
                        </span>
                      </div>
                      {isOpen && (
                        <ul className="border-line-2 border-t bg-black/10 py-1">
                          {group.cases.map((tc) => {
                            const isPicked = picked.has(tc.id);
                            return (
                              <li key={tc.id}>
                                <button
                                  type="button"
                                  role="checkbox"
                                  aria-checked={isPicked}
                                  onClick={() => toggleCase(tc.id)}
                                  disabled={isPending}
                                  className={cn(
                                    'flex w-full items-center gap-3 py-1.5 pr-4 pl-10 text-left hover:bg-white/[0.03]',
                                    isPicked && 'bg-white/[0.03]'
                                  )}
                                >
                                  <CheckMark state={isPicked ? 'on' : 'off'} />
                                  <span className="w-16 shrink-0 font-mono text-[11px] text-white/45">
                                    {tc.code}
                                  </span>
                                  <span
                                    className={cn(
                                      'min-w-0 flex-1 truncate text-[12px]',
                                      isPicked ? 'text-white/90' : 'text-white/70'
                                    )}
                                  >
                                    {tc.title}
                                  </span>
                                  {tc.testSuiteName && (
                                    <span className="max-w-20 shrink-0 truncate text-[11px] text-white/40">
                                      {tc.testSuiteName}
                                    </span>
                                  )}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-[11px] text-white/40">
                행 배경 = {total}건 중 그 묶음이 차지하는 비율
              </p>
              {picked.size < total && (
                <p className="mt-4 rounded-[6px] bg-white/[0.03] px-3 py-2.5 text-[12px] leading-[1.6] text-white/65">
                  고른 케이스로 범위를 고정해요. 마일스톤이나 스위트에 케이스가 늘어도 이 실행에는
                  들어오지 않아요.
                </p>
              )}
            </div>

            <div className="border-line-2 flex items-center gap-2.5 border-t px-6 py-4">
              <span className="text-[13px] font-bold text-white/90">{picked.size}건</span>
              <span className="flex-1" />
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="rounded-[6px] border border-white/[0.17] px-3.5 py-[7px] text-[13px] font-medium text-white/85 hover:border-white/35 disabled:opacity-60"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className="bg-primary hover:bg-primary/90 rounded-[6px] px-3.5 py-[7px] text-[13px] font-bold text-white disabled:opacity-50"
              >
                {isPending ? '만드는 중' : '실행 만들기'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
