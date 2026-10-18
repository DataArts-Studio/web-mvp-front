'use client';

import React, { useState } from 'react';

import Link from 'next/link';

import type { TestCaseRunDetail } from '@/entities/test-run';

import type { IssueDraft } from './run-issue-model';

interface RunIssuePanelProps {
  cases: TestCaseRunDetail[];
  draft: IssueDraft;
  repoFullName: string | null;
  projectSlug: string;
  isSubmitting: boolean;
  onSubmit: (title: string, body: string) => void;
  onCancel: () => void;
}

/** 실패 케이스로 GitHub 이슈를 쓰는 오른쪽 패널 (06i). 초안은 실행 결과로 채운다. */
export const RunIssuePanel = ({
  cases,
  draft,
  repoFullName,
  projectSlug,
  isSubmitting,
  onSubmit,
  onCancel,
}: RunIssuePanelProps) => {
  const [title, setTitle] = useState(draft.title);
  const [body, setBody] = useState(draft.body);
  const codes = cases.map((tc) => tc.code).join(' · ');

  return (
    <section
      aria-labelledby="run-issue-heading"
      className="border-line-2 mt-4 flex min-w-0 flex-1 flex-col border-t pt-6 lg:mt-0 lg:border-t-0 lg:border-l lg:pt-6 lg:pl-8"
    >
      <form
        className="flex flex-col"
        onSubmit={(e) => {
          e.preventDefault();
          if (title.trim() && repoFullName) onSubmit(title, body);
        }}
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h2 id="run-issue-heading" className="text-[16px] font-bold text-white/95">
            이슈 등록
          </h2>
          <span className="min-w-0 truncate font-mono text-[12px] text-white/45">{codes}</span>
          <span className="flex-1" />
          <span className="border-line-2 rounded-[6px] border px-2.5 py-1 text-[12px] text-white/70">
            GitHub {repoFullName ?? '연결 안 됨'}
          </span>
        </div>

        {!repoFullName && (
          <p className="border-result-blocked/40 bg-result-blocked/[0.06] mt-4 rounded-[6px] border px-3 py-2.5 text-[12px] leading-[1.6] text-white/75">
            GitHub 저장소를 연결하면 이 초안으로 바로 이슈를 만들 수 있어요.{' '}
            <Link
              href={`/projects/${projectSlug}/settings`}
              className="text-primary font-medium hover:underline"
            >
              설정에서 연결 →
            </Link>
          </p>
        )}

        <label htmlFor="run-issue-title" className="mt-5 text-[12px] font-medium text-white/45">
          제목
        </label>
        <input
          id="run-issue-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={256}
          disabled={isSubmitting}
          className="bg-bg-2 border-line-2 focus:border-primary mt-2 rounded-[6px] border px-3 py-2 text-[14px] text-white/90 outline-none"
        />

        <label htmlFor="run-issue-body" className="mt-4 text-[12px] font-medium text-white/45">
          본문{' '}
          <span className="text-primary font-normal">실행 결과로 채웠어요, 고칠 수 있어요</span>
        </label>
        <textarea
          id="run-issue-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={10000}
          rows={14}
          disabled={isSubmitting}
          className="bg-bg-2 border-line-2 focus:border-primary mt-2 resize-y rounded-[6px] border px-3 py-2.5 font-mono text-[12px] leading-[1.6] text-white/85 outline-none"
        />

        <p className="mt-3 flex flex-wrap items-center gap-1.5 text-[12px]">
          {['testea', 'bug'].map((label) => (
            <span
              key={label}
              className="border-line-2 rounded-[4px] border px-2 py-0.5 text-white/70"
            >
              {label}
            </span>
          ))}
          <span className="text-white/35">라벨은 자동으로 붙어요</span>
        </p>

        {cases.length > 1 && (
          <p className="mt-3 rounded-[6px] bg-white/[0.03] px-3 py-2.5 text-[12px] text-white/70">
            <span className="font-mono">{codes}</span> {cases.length}개 케이스를 이 이슈 하나에
            연결해요. 본문에 케이스별 재현 단계가 들어가요.
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-[6px] border border-white/[0.17] px-3.5 py-[7px] text-[13px] font-medium text-white/85 hover:border-white/35 disabled:opacity-60"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !repoFullName || !title.trim()}
            className="bg-primary hover:bg-primary/90 rounded-[6px] px-3.5 py-[7px] text-[13px] font-bold text-white disabled:opacity-50"
          >
            {isSubmitting ? '만드는 중' : '이슈 만들기'}
          </button>
        </div>
      </form>
    </section>
  );
};
