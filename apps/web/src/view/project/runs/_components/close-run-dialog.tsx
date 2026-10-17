'use client';

import React from 'react';

import { Dialog } from '@testea/ui';
import { cn } from '@testea/util';
import { Check } from 'lucide-react';

interface CloseRunDialogProps {
  stats: { total: number; pass: number; fail: number; blocked: number; untested: number };
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const Count = ({ label, value, tone }: { label: string; value: number; tone: string }) => (
  <span className="flex items-center gap-1">
    <span className="text-white/50">{label}</span>
    <span className={cn('font-bold', value > 0 ? tone : 'text-white/30')}>{value}</span>
  </span>
);

/**
 * 미실행이 남은 실행을 완료하기 전 확인 (06g).
 * 시안의 '다음 실행으로 넘기기', 'N/A로 처리하고 완료'는 데이터가 없어 2차로 미루고
 * '미실행으로 두고 완료'만 둔다.
 */
export const CloseRunDialog = ({ stats, isPending, onConfirm, onCancel }: CloseRunDialogProps) => {
  const { total, pass, fail, blocked, untested } = stats;
  const executed = total - untested;
  const pct = (n: number) => `${total > 0 ? (n / total) * 100 : 0}%`;

  return (
    <Dialog.Root
      defaultOpen
      onOpenChange={(open) => {
        if (!open && !isPending) onCancel();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content className="bg-bg-2 border-line-2 w-[calc(100%-32px)] max-w-[540px] rounded-[10px] border p-6 shadow-xl">
          <Dialog.Title className="text-[18px] font-bold text-white/95">
            아직 {untested}건을 판정하지 않았어요
          </Dialog.Title>
          <Dialog.Description className="mt-3 text-[13px] leading-[1.6] text-white/60">
            지금 완료하면 남은 {untested}건은 결과 없이 남아요. 완료한 뒤에도 결과 화면의 &apos;결과
            수정&apos;에서 기록할 수 있어요.
          </Dialog.Description>

          <div className="border-line-2 relative mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 overflow-hidden rounded-[6px] border px-3 py-2.5 text-[12px]">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex">
              <div className="bg-result-pass/[0.08]" style={{ width: pct(pass) }} />
              <div className="bg-result-fail/[0.09]" style={{ width: pct(fail) }} />
              <div className="bg-result-blocked/[0.09]" style={{ width: pct(blocked) }} />
            </div>
            <p className="relative whitespace-nowrap">
              <span className="text-[14px] font-bold text-white/95">{executed}</span>
              <span className="text-white/50"> / {total}</span>
            </p>
            <p className="relative flex flex-wrap items-center gap-3 whitespace-nowrap">
              <Count label="통과" value={pass} tone="text-result-pass" />
              <Count label="실패" value={fail} tone="text-result-fail" />
              <Count label="차단" value={blocked} tone="text-result-blocked" />
              <Count label="남음" value={untested} tone="text-white/80" />
            </p>
          </div>

          <div className="border-primary/60 bg-primary/[0.06] mt-3 flex gap-3 rounded-[8px] border px-4 py-3.5">
            <span
              aria-hidden="true"
              className="bg-primary mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
            >
              <Check className="h-3 w-3 text-white" strokeWidth={3} />
            </span>
            <div className="min-w-0">
              <p className="text-[14px] font-bold text-white/95">미실행으로 두고 완료</p>
              <p className="mt-1 text-[12px] leading-[1.6] text-white/55">
                {untested}건은 결과 없이 남아요. 마일스톤 진행률에서는 실행하지 않은 케이스로
                계산돼요.
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              disabled={isPending}
              className="rounded-[6px] border border-white/[0.17] px-3.5 py-[7px] text-[13px] font-bold text-white/85 hover:border-white/35 disabled:opacity-60"
            >
              계속 실행하기
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isPending}
              className="bg-primary hover:bg-primary/90 rounded-[6px] px-3.5 py-[7px] text-[13px] font-bold whitespace-nowrap text-white disabled:opacity-60"
            >
              {isPending ? '완료하는 중' : '미실행으로 두고 완료'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
