'use client';

import { useState } from 'react';

const VALID_USERNAME = 'tester';
const VALID_PASSWORD = 'qaground123';

type Result = { type: 'success' } | { type: 'error'; message: string } | null;

/**
 * 로그인 폼 샌드박스 (테스트 대상).
 *
 * 자동화 연습용 의도적 타깃. 안정적 셀렉터(data-testid)를 심어 두었다.
 * - 유효 자격증명(tester / qaground123): 성공 메시지
 * - 무효 자격증명: 에러 메시지
 * - 빈 입력: 필수 입력 에러
 */
export const LoginSandbox = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState<Result>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setResult({ type: 'error', message: '아이디와 비밀번호를 모두 입력하세요.' });
      return;
    }
    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
      setResult({ type: 'success' });
      return;
    }
    setResult({ type: 'error', message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
  };

  return (
    <main className="bg-bg-1 text-text-1 flex min-h-screen w-full items-center justify-center px-4 font-sans">
      <div className="border-line-2 bg-bg-2 w-full max-w-sm rounded-2xl border p-8">
        <h1 className="mb-6 text-xl font-bold" data-testid="login-heading">
          로그인
        </h1>

        {result?.type === 'success' ? (
          <p
            data-testid="login-success"
            id="login-success"
            role="status"
            className="qa-login-success border-primary/30 bg-primary/10 text-primary rounded-xl border px-4 py-3 text-sm font-medium"
          >
            환영합니다, {VALID_USERNAME}님. 로그인에 성공했습니다.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <label className="flex flex-col gap-1.5">
              <span className="text-text-2 text-sm">아이디</span>
              <input
                data-testid="username"
                id="username"
                name="username"
                type="text"
                value={username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                className="qa-username border-line-3 bg-bg-3 rounded-button text-text-1 focus:border-primary h-button-md border px-3 text-sm transition-colors outline-none"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-text-2 text-sm">비밀번호</span>
              <input
                data-testid="password"
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                className="qa-password border-line-3 bg-bg-3 rounded-button text-text-1 focus:border-primary h-button-md border px-3 text-sm transition-colors outline-none"
              />
            </label>

            {result?.type === 'error' && (
              <p data-testid="login-error" id="login-error" role="alert" className="qa-login-error text-system-red text-sm">
                {result.message}
              </p>
            )}

            <button
              data-testid="login-submit"
              id="login-submit"
              type="submit"
              className="qa-login-submit bg-primary rounded-button h-button-md hover:bg-primary/90 active:bg-primary/80 mt-1 inline-flex items-center justify-center px-4 text-sm font-medium text-white transition-colors"
            >
              로그인
            </button>
          </form>
        )}
      </div>
    </main>
  );
};
