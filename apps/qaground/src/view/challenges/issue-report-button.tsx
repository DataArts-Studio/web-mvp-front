'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';

type IssueType = 'bug' | 'idea' | 'etc';
type Status = 'idle' | 'submitting' | 'done' | 'error' | 'unavailable';

const TYPES: { value: IssueType; label: string }[] = [
  { value: 'bug', label: '버그' },
  { value: 'idea', label: '제안' },
  { value: 'etc', label: '기타' },
];

const fieldClass =
  'border-line-3 bg-bg-3 rounded-button text-text-1 placeholder:text-text-3 focus:border-primary w-full border px-3 py-2 text-sm transition-colors outline-none';

export const IssueReportButton = () => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<IssueType>('bug');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const reset = () => {
    setTitle('');
    setType('bug');
    setBody('');
    setStatus('idle');
    setMessage('');
  };
  const close = () => {
    setOpen(false);
    reset();
  };

  const submit = async () => {
    if (title.trim().length < 3 || body.trim().length < 5) {
      setStatus('error');
      setMessage('제목(3자 이상)과 내용(5자 이상)을 적어주세요.');
      return;
    }
    setStatus('submitting');
    setMessage('');
    try {
      const res = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          type,
          body: body.trim(),
          pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
        }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (res.status === 503) {
        setStatus('unavailable');
        setMessage(data?.error ?? '이슈 등록이 아직 설정되지 않았습니다.');
        return;
      }
      if (!res.ok) {
        setStatus('error');
        setMessage(data?.error ?? '이슈 등록에 실패했습니다.');
        return;
      }
      setStatus('done');
    } catch {
      setStatus('error');
      setMessage('이슈 등록에 실패했습니다.');
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="border-line-3 text-text-2 hover:text-text-1 hover:border-line-2 rounded-button h-9 border px-3 text-sm transition-colors"
      >
        이슈 등록
      </button>

      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label="이슈 등록"
          >
            <div className="absolute inset-0 bg-black/60" onClick={close} />
            <div className="border-line-2 bg-bg-2 relative z-10 w-full max-w-lg rounded-2xl border p-6 shadow-xl">
              {status === 'done' ? (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <h2 className="text-base font-semibold">제보가 등록되었습니다</h2>
                  <p className="text-text-2 text-sm leading-relaxed">
                    소중한 의견 감사합니다. 검토 후 반영하겠습니다.
                  </p>
                  <button
                    type="button"
                    onClick={close}
                    className="bg-primary rounded-button h-button-md hover:bg-primary/90 mt-2 px-5 text-sm font-medium text-white transition-colors"
                  >
                    닫기
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold">이슈 등록</h2>
                    <button
                      type="button"
                      onClick={close}
                      className="text-text-3 hover:text-text-1 text-lg transition-colors"
                      aria-label="닫기"
                    >
                      ×
                    </button>
                  </div>
                  <p className="text-text-3 mt-1 text-xs leading-relaxed">
                    버그나 개선 아이디어를 남겨주세요. 운영팀에 바로 전달됩니다.
                  </p>

                  <div className="mt-4 flex flex-col gap-3">
                    <div className="flex gap-2">
                      {TYPES.map((t) => (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setType(t.value)}
                          className={`rounded-button h-9 flex-1 border text-sm transition-colors ${
                            type === t.value
                              ? 'border-primary text-primary'
                              : 'border-line-3 text-text-2 hover:text-text-1'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="제목"
                      maxLength={120}
                      className={fieldClass}
                    />
                    <textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="무엇이 문제이거나 어떤 점이 좋아지면 좋을지 적어주세요."
                      rows={5}
                      maxLength={4000}
                      className={`${fieldClass} resize-none`}
                    />
                  </div>

                  {(status === 'error' || status === 'unavailable') && (
                    <p
                      className={`mt-3 text-sm ${status === 'unavailable' ? 'text-text-3' : 'text-system-red'}`}
                      role="alert"
                    >
                      {message}
                    </p>
                  )}

                  <div className="mt-5 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={close}
                      className="text-text-2 hover:text-text-1 rounded-button h-button-md px-4 text-sm transition-colors"
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      onClick={submit}
                      disabled={status === 'submitting'}
                      className="bg-primary rounded-button h-button-md hover:bg-primary/90 active:bg-primary/80 px-5 text-sm font-medium text-white transition-colors disabled:opacity-60"
                    >
                      {status === 'submitting' ? '등록 중...' : '등록'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
