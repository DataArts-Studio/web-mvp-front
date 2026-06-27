'use client';

import { useState } from 'react';

import { useLocalStorage } from './use-local-storage';

/**
 * 폼 임시저장 샌드박스 (테스트 대상).
 *
 * 입력을 localStorage(키: qaground_draft)에 자동 저장하고 재방문 시 복원한다.
 * 초기화 버튼은 입력과 draft 를 모두 비우고, 제출하면 draft 를 제거한다.
 */

const DRAFT_KEY = 'qaground_draft';

interface Draft {
  title: string;
  body: string;
}

function parseDraft(raw: string | null): Draft {
  if (!raw) return { title: '', body: '' };
  try {
    const parsed = JSON.parse(raw) as Partial<Draft>;
    return { title: parsed.title ?? '', body: parsed.body ?? '' };
  } catch {
    return { title: '', body: '' };
  }
}

const inputClass =
  'border-line-3 bg-bg-3 rounded-button text-text-1 focus:border-primary border px-3 text-sm transition-colors outline-none';

export const FormAutosaveSandbox = () => {
  const [raw, setRaw] = useLocalStorage(DRAFT_KEY);
  const draft = parseDraft(raw);
  const [status, setStatus] = useState('입력 대기');
  const [submitted, setSubmitted] = useState(false);

  const update = (next: Draft) => {
    setRaw(JSON.stringify(next));
    setStatus('임시저장됨');
    setSubmitted(false);
  };

  const clearDraft = () => {
    setRaw(null);
    setStatus('초기화됨');
    setSubmitted(false);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setRaw(null);
    setStatus('제출됨');
    setSubmitted(true);
  };

  return (
    <main className="bg-bg-1 text-text-1 flex min-h-screen w-full justify-center px-4 py-10 font-sans">
      <div className="border-line-2 bg-bg-2 w-full max-w-md rounded-2xl border p-8">
        <h1 className="mb-1 text-xl font-bold">글 작성</h1>
        <p className="text-text-3 mb-6 text-xs">
          입력은 자동으로 임시저장됩니다 (localStorage: {DRAFT_KEY}).
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-text-2 text-sm">제목</span>
            <input
              data-testid="draft-title"
              type="text"
              value={draft.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                update({ ...draft, title: e.target.value })
              }
              className={`${inputClass} h-button-md`}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-text-2 text-sm">내용</span>
            <textarea
              data-testid="draft-body"
              value={draft.body}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                update({ ...draft, body: e.target.value })
              }
              rows={4}
              className={`${inputClass} resize-none py-2`}
            />
          </label>

          <p data-testid="draft-status" role="status" className="text-text-3 text-xs">
            {status}
          </p>

          {submitted && (
            <p
              data-testid="draft-success"
              className="border-primary/30 bg-primary/10 text-primary rounded-xl border px-4 py-3 text-sm font-medium"
            >
              제출되었습니다.
            </p>
          )}

          <div className="mt-1 flex gap-2">
            <button
              data-testid="draft-submit"
              type="submit"
              className="bg-primary rounded-button h-button-md hover:bg-primary/90 active:bg-primary/80 inline-flex items-center justify-center px-4 text-sm font-medium text-white transition-colors"
            >
              제출
            </button>
            <button
              data-testid="draft-clear"
              type="button"
              onClick={clearDraft}
              className="border-line-3 text-text-2 rounded-button h-button-md hover:text-text-1 border px-4 text-sm transition-colors"
            >
              초기화
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};
