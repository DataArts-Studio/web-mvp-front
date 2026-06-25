'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type IssueType = 'bug' | 'idea' | 'etc';
type Status = 'idle' | 'submitting' | 'done' | 'error' | 'unavailable';

const TYPES: { value: IssueType; label: string }[] = [
  { value: 'bug', label: '버그' },
  { value: 'idea', label: '제안' },
  { value: 'etc', label: '기타' },
];

const BROWSERS = ['Chrome', 'Edge', 'Whale', 'Safari', 'Firefox', 'Opera', '기타'];

/** userAgent 로 브라우저 이름과 버전(빌드번호)을 감지한다. 순서 중요(Edge>Chrome 등). */
function detectBrowser(): { name: string; version: string } {
  if (typeof navigator === 'undefined') return { name: 'Chrome', version: '' };
  const ua = navigator.userAgent;
  const pick = (re: RegExp): string => ua.match(re)?.[1] ?? '';
  if (/Edg\//.test(ua)) return { name: 'Edge', version: pick(/Edg\/([\d.]+)/) };
  if (/Whale\//.test(ua)) return { name: 'Whale', version: pick(/Whale\/([\d.]+)/) };
  if (/OPR\//.test(ua)) return { name: 'Opera', version: pick(/OPR\/([\d.]+)/) };
  if (/Firefox\//.test(ua)) return { name: 'Firefox', version: pick(/Firefox\/([\d.]+)/) };
  if (/Chrome\//.test(ua)) return { name: 'Chrome', version: pick(/Chrome\/([\d.]+)/) };
  if (/Safari\//.test(ua)) return { name: 'Safari', version: pick(/Version\/([\d.]+)/) };
  return { name: '기타', version: '' };
}

const fieldClass =
  'border-line-3 bg-bg-3 rounded-button text-text-1 placeholder:text-text-3 focus:border-primary w-full border px-3 py-2 text-sm transition-colors outline-none';

export const IssueReportButton = () => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<IssueType>('bug');
  const [body, setBody] = useState('');
  const [steps, setSteps] = useState('');
  const [expected, setExpected] = useState('');
  const [actual, setActual] = useState('');
  const [severity, setSeverity] = useState('보통');
  const [priority, setPriority] = useState('보통');
  const [browser, setBrowser] = useState('Chrome');
  const [browserVersion, setBrowserVersion] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const d = detectBrowser();
    setBrowser(d.name);
    setBrowserVersion(d.version);
  }, []);

  const reset = () => {
    setTitle('');
    setType('bug');
    setBody('');
    setSteps('');
    setExpected('');
    setActual('');
    setSeverity('보통');
    setPriority('보통');
    setStatus('idle');
    setMessage('');
  };
  const close = () => {
    setOpen(false);
    reset();
  };

  const submit = async () => {
    const isBug = type === 'bug';
    let composed: string;
    if (isBug) {
      if (title.trim().length < 3 || steps.trim().length < 5 || actual.trim().length < 3) {
        setStatus('error');
        setMessage('제목·재현 절차·실제 결과를 적어주세요.');
        return;
      }
      composed = [
        '## 재현 절차',
        steps.trim(),
        '',
        '## 기대 결과',
        expected.trim() || '(작성 안 함)',
        '',
        '## 실제 결과',
        actual.trim(),
        '',
        '## 심각도',
        severity,
        '',
        '## 우선순위',
        priority,
        '',
        '## 환경',
        `브라우저: ${browser}${browserVersion ? ` ${browserVersion}` : ''}`,
      ].join('\n');
    } else {
      if (title.trim().length < 3 || body.trim().length < 5) {
        setStatus('error');
        setMessage('제목(3자 이상)과 내용(5자 이상)을 적어주세요.');
        return;
      }
      composed = body.trim();
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
          body: composed,
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
            <div className="border-line-2 bg-bg-2 relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border p-6 shadow-xl">
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

                    {type === 'bug' ? (
                      <>
                        <div>
                          <span className="text-text-3 text-xs">심각도</span>
                          <div className="mt-1 flex gap-2">
                            {['낮음', '보통', '높음', '심각'].map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setSeverity(s)}
                                className={`rounded-button h-9 flex-1 border text-sm transition-colors ${
                                  severity === s
                                    ? 'border-primary text-primary'
                                    : 'border-line-3 text-text-2 hover:text-text-1'
                                }`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-text-3 text-xs">우선순위</span>
                          <div className="mt-1 flex gap-2">
                            {['낮음', '보통', '높음', '긴급'].map((p) => (
                              <button
                                key={p}
                                type="button"
                                onClick={() => setPriority(p)}
                                className={`rounded-button h-9 flex-1 border text-sm transition-colors ${
                                  priority === p
                                    ? 'border-primary text-primary'
                                    : 'border-line-3 text-text-2 hover:text-text-1'
                                }`}
                              >
                                {p}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <select
                            value={browser}
                            onChange={(e) => setBrowser(e.target.value)}
                            className={`${fieldClass} flex-1`}
                            aria-label="브라우저"
                          >
                            {BROWSERS.map((b) => (
                              <option key={b} value={b}>
                                {b}
                              </option>
                            ))}
                          </select>
                          <input
                            value={browserVersion}
                            onChange={(e) => setBrowserVersion(e.target.value)}
                            placeholder="버전 (빌드번호)"
                            maxLength={40}
                            className={`${fieldClass} flex-1`}
                            aria-label="브라우저 버전"
                          />
                        </div>
                        <textarea
                          value={steps}
                          onChange={(e) => setSteps(e.target.value)}
                          placeholder="재현 절차 (예: 1. 로그인 페이지 진입  2. 빈 값으로 제출  3. ...)"
                          rows={3}
                          maxLength={2000}
                          className={`${fieldClass} resize-none`}
                        />
                        <textarea
                          value={expected}
                          onChange={(e) => setExpected(e.target.value)}
                          placeholder="기대 결과 (어떻게 동작해야 하나요?)"
                          rows={2}
                          maxLength={1000}
                          className={`${fieldClass} resize-none`}
                        />
                        <textarea
                          value={actual}
                          onChange={(e) => setActual(e.target.value)}
                          placeholder="실제 결과 (실제로 어떻게 됐나요?)"
                          rows={2}
                          maxLength={1000}
                          className={`${fieldClass} resize-none`}
                        />
                      </>
                    ) : (
                      <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder={
                          type === 'idea'
                            ? '어떤 점이 좋아지면 좋을지 적어주세요.'
                            : '내용을 적어주세요.'
                        }
                        rows={5}
                        maxLength={4000}
                        className={`${fieldClass} resize-none`}
                      />
                    )}
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
