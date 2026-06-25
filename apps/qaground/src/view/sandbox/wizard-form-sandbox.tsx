'use client';

import { useState } from 'react';

const EMAIL_RE = /^\S+@\S+\.\S+$/;

type Errors = { name?: string; email?: string };

/**
 * 다단계 위저드 폼 샌드박스 (테스트 대상).
 * - 1단계 입력 검증 → 2단계 확인(입력값 표시·이전 가능) → 3단계 완료.
 *   단계 이동과 단계별 검증, 이전 단계 복귀를 검증하는 연습.
 */
export const WizardFormSandbox = () => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Errors>({});

  const goNext = () => {
    const next: Errors = {};
    if (name.trim().length < 2) next.name = '이름을 2자 이상 입력하세요.';
    if (!EMAIL_RE.test(email)) next.email = '올바른 이메일을 입력하세요.';
    setErrors(next);
    if (Object.keys(next).length === 0) setStep(2);
  };

  const input =
    'border-line-3 bg-bg-3 rounded-button text-text-1 placeholder:text-text-3 focus:border-primary h-button-md border px-3 text-sm transition-colors outline-none';
  const btn =
    'bg-primary rounded-button h-button-md hover:bg-primary/90 active:bg-primary/80 inline-flex items-center justify-center px-4 text-sm font-medium text-white transition-colors';
  const ghost =
    'border-line-3 text-text-2 hover:bg-bg-3 rounded-button h-button-md inline-flex items-center justify-center border px-4 text-sm transition-colors';

  return (
    <main className="bg-bg-1 text-text-1 flex min-h-screen w-full items-center justify-center px-4 font-sans">
      <div className="border-line-2 bg-bg-2 flex w-full max-w-sm flex-col gap-4 rounded-2xl border p-8">
        <p data-testid="step-indicator" className="text-text-3 text-sm">
          {step} / 3 단계
        </p>
        {step === 1 && (
          <>
            <label className="flex flex-col gap-1.5">
              <span className="text-text-2 text-sm">이름</span>
              <input
                data-testid="name"
                type="text"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                className={input}
              />
              {errors.name && (
                <span data-testid="name-error" role="alert" className="text-system-red text-xs">
                  {errors.name}
                </span>
              )}
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-text-2 text-sm">이메일</span>
              <input
                data-testid="email"
                type="text"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                className={input}
              />
              {errors.email && (
                <span data-testid="email-error" role="alert" className="text-system-red text-xs">
                  {errors.email}
                </span>
              )}
            </label>
            <button data-testid="next-btn" className={btn} onClick={goNext}>
              다음
            </button>
          </>
        )}
        {step === 2 && (
          <>
            <div className="border-line-2 bg-bg-3 flex flex-col gap-1 rounded-xl border px-4 py-3 text-sm">
              <span data-testid="confirm-name">이름: {name}</span>
              <span data-testid="confirm-email">이메일: {email}</span>
            </div>
            <div className="flex gap-2">
              <button data-testid="prev-btn" className={ghost} onClick={() => setStep(1)}>
                이전
              </button>
              <button data-testid="submit-btn" className={btn} onClick={() => setStep(3)}>
                제출
              </button>
            </div>
          </>
        )}
        {step === 3 && (
          <p
            data-testid="complete"
            role="status"
            className="border-primary/30 bg-primary/10 text-primary rounded-xl border px-4 py-3 text-sm font-medium"
          >
            신청이 완료되었습니다.
          </p>
        )}
      </div>
    </main>
  );
};
