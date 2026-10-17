'use client';

import React, { useState } from 'react';

import Link from 'next/link';

import type { RunComparison } from '@/entities/test-run';

import { type BlockedGroup, shortDateOf, shortDateTimeOf } from './run-complete-model';

interface BlockedReasonPanelProps {
  group: BlockedGroup;
  history: RunComparison['blockedHistory'];
  projectSlug: string;
  isSaving: boolean;
  onSaveReason: (testCaseRunIds: string[], reason: string) => Promise<boolean>;
}

/** 차단 탭에서 사유 묶음을 골랐을 때 오른쪽 패널 (06h). */
export const BlockedReasonPanel = ({
  group,
  history,
  projectSlug,
  isSaving,
  onSaveReason,
}: BlockedReasonPanelProps) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const earlier = group.reason ? history.filter((h) => h.reason === group.reason) : [];
  const editLabel = group.reason ? '사유 수정' : '사유 기록';

  const meta = [
    `${group.cases.length}건`,
    group.suiteNames.length > 2
      ? `스위트 ${group.suiteNames.length}개`
      : group.suiteNames.join(', '),
    group.firstRecordedAt ? `${shortDateTimeOf(group.firstRecordedAt)} 처음 기록` : null,
  ].filter(Boolean);

  return (
    <section
      aria-label="차단 사유"
      className="border-line-2 mt-4 min-w-0 flex-1 border-t pt-6 lg:mt-0 lg:border-t-0 lg:border-l lg:pt-6 lg:pl-8"
    >
      <p className="text-[12px] font-medium text-white/45">차단 사유</p>
      <h2 className="mt-2 text-[20px] leading-snug font-bold break-words whitespace-pre-wrap text-white/95">
        {group.reason ?? '사유 미기록'}
      </h2>
      <p className="mt-2 text-[12px] text-white/45">{meta.join(' · ')}</p>

      {!group.reason && (
        <p className="mt-4 text-[13px] leading-[1.6] text-white/60">
          왜 판정하지 못했는지 남기지 않은 차단이에요. 사유를 남기면 같은 사유가 다음 실행에서
          반복되는지 볼 수 있어요.
        </p>
      )}

      {group.reason && (
        <div className="mt-6">
          <p className="text-[12px] font-medium text-white/45">
            {earlier.length > 0 ? '같은 사유가 이전에도 있었어요' : '이전 실행에서는 없던 사유예요'}
          </p>
          {earlier.length > 0 && (
            <ul className="mt-2 flex flex-col">
              {earlier.slice(0, 5).map((h) => (
                <li key={h.runId} className="border-line-2 border-b last:border-b-0">
                  <Link
                    href={`/projects/${projectSlug}/runs/${h.runId}`}
                    className="flex items-center gap-3 py-2.5 text-[13px] hover:bg-white/[0.03]"
                  >
                    <span className="min-w-0 truncate font-medium text-white/85">{h.runName}</span>
                    <span className="shrink-0 font-mono text-[11px] text-white/35">
                      {shortDateOf(new Date(h.createdAt))}
                    </span>
                    <span className="text-result-blocked shrink-0 text-[12px] font-bold">
                      {h.count}건
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {earlier.length > 5 && (
            <p className="mt-1 text-[11px] text-white/35">외 {earlier.length - 5}개 실행</p>
          )}
        </div>
      )}

      {editing ? (
        <form
          className="mt-7 flex flex-col gap-2.5"
          onSubmit={async (e) => {
            e.preventDefault();
            const ok = await onSaveReason(
              group.cases.map((tc) => tc.id),
              draft
            );
            if (ok) setEditing(false);
          }}
        >
          <label className="text-[12px] font-medium text-white/45" htmlFor="blocked-reason-input">
            {group.cases.length}건의 차단 사유
          </label>
          <textarea
            id="blocked-reason-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            maxLength={2000}
            autoFocus
            disabled={isSaving}
            className="bg-bg-2 border-line-2 focus:border-primary resize-none rounded-[6px] border px-3 py-2 text-[13px] text-white/90 outline-none"
            placeholder="예: 결제 샌드박스가 응답하지 않음"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={isSaving}
              className="rounded-[6px] border border-white/[0.17] px-3.5 py-[7px] text-[13px] font-medium text-white/85 hover:border-white/35 disabled:opacity-60"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSaving || !draft.trim()}
              className="bg-primary hover:bg-primary/90 rounded-[6px] px-3.5 py-[7px] text-[13px] font-bold text-white disabled:opacity-60"
            >
              {isSaving ? '저장하는 중' : `${group.cases.length}건에 저장`}
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-7 flex items-center">
          <button
            type="button"
            onClick={() => {
              setDraft(group.reason ?? '');
              setEditing(true);
            }}
            className="text-primary text-[13px] font-medium hover:underline"
          >
            {editLabel} →
          </button>
        </div>
      )}
    </section>
  );
};
