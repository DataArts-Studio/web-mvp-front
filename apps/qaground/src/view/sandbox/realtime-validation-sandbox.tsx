'use client';

import { useState } from 'react';

const EMAIL_RE = /^\S+@\S+\.\S+$/;

/**
 * 실시간 인라인 검증 샌드박스 (테스트 대상).
 * - 입력하는 즉시 이메일 형식·비밀번호 강도를 표시하고,
 *   둘 다 유효할 때만 제출 버튼이 활성화된다.
 */
export const RealtimeValidationSandbox = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const emailValid = EMAIL_RE.test(email);
  const pwValid = password.length >= 8;
  const strength = password.length >= 12 ? '강함' : password.length >= 8 ? '보통' : '약함';
  const canSubmit = emailValid && pwValid;

  const input =
    'border-line-3 bg-bg-3 rounded-button text-text-1 placeholder:text-text-3 focus:border-primary h-button-md border px-3 text-sm transition-colors outline-none';

  return (
    <main className="bg-bg-1 text-text-1 flex min-h-screen w-full items-center justify-center px-4 font-sans">
      <div className="border-line-2 bg-bg-2 flex w-full max-w-sm flex-col gap-4 rounded-2xl border p-8">
        <h1 className="text-xl font-bold">가입</h1>
        <label className="flex flex-col gap-1.5">
          <span className="text-text-2 text-sm">이메일</span>
          <input
            data-testid="email"
            type="text"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            className={input}
          />
          {email !== '' && (
            <span
              data-testid="email-status"
              className={emailValid ? 'text-primary text-xs' : 'text-system-red text-xs'}
            >
              {emailValid ? '사용 가능한 형식입니다.' : '이메일 형식이 올바르지 않습니다.'}
            </span>
          )}
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-text-2 text-sm">비밀번호</span>
          <input
            data-testid="password"
            type="password"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            className={input}
          />
          {password !== '' && (
            <span data-testid="password-strength" className="text-text-3 text-xs">
              강도: {strength}
            </span>
          )}
        </label>
        <button
          data-testid="submit"
          disabled={!canSubmit}
          className="bg-primary rounded-button h-button-md mt-1 inline-flex items-center justify-center px-4 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          가입하기
        </button>
      </div>
    </main>
  );
};
