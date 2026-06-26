'use client';

import { useState } from 'react';

import { useLocalStorage } from './use-local-storage';

/**
 * 토큰 저장 샌드박스 (테스트 대상).
 *
 * 로그인 성공 시 인증 토큰을 localStorage(키: qaground_token)에 저장하고,
 * 로그아웃 시 제거한다. 저장된 토큰이 있으면 로그인 상태가 유지된다.
 */

const VALID_USERNAME = 'tester';
const VALID_PASSWORD = 'qaground123';
const TOKEN_KEY = 'qaground_token';

const inputClass =
  'border-line-3 bg-bg-3 rounded-button text-text-1 focus:border-primary h-button-md border px-3 text-sm transition-colors outline-none';

export const TokenStorageSandbox = () => {
  const [token, setToken] = useLocalStorage(TOKEN_KEY);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
      setToken(`qg.${btoa(`${username}:${password.length}`)}`);
      setError('');
      return;
    }
    setError('아이디 또는 비밀번호가 올바르지 않습니다.');
  };

  const logout = () => {
    setToken(null);
    setUsername('');
    setPassword('');
  };

  return (
    <main className="bg-bg-1 text-text-1 flex min-h-screen w-full items-center justify-center px-4 font-sans">
      <div className="border-line-2 bg-bg-2 w-full max-w-sm rounded-2xl border p-8">
        <h1 className="mb-6 text-xl font-bold">토큰 인증</h1>

        {token ? (
          <div className="flex flex-col gap-3">
            <p
              data-testid="token-status"
              role="status"
              className="border-primary/30 bg-primary/10 text-primary rounded-xl border px-4 py-3 text-sm font-medium"
            >
              로그인됨
            </p>
            <p className="text-text-3 text-xs">저장된 토큰 (localStorage: {TOKEN_KEY})</p>
            <code
              data-testid="token-value"
              className="border-line-3 bg-bg-3 text-text-2 block overflow-x-auto rounded-lg border px-3 py-2 font-mono text-xs"
            >
              {token}
            </code>
            <button
              data-testid="token-logout"
              type="button"
              onClick={logout}
              className="border-line-3 text-text-2 rounded-button h-button-md hover:text-text-1 mt-2 border px-4 text-sm transition-colors"
            >
              로그아웃
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <p data-testid="token-status" className="text-text-3 text-sm">
              로그아웃됨
            </p>
            <label className="flex flex-col gap-1.5">
              <span className="text-text-2 text-sm">아이디</span>
              <input
                data-testid="token-username"
                name="username"
                type="text"
                value={username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-text-2 text-sm">비밀번호</span>
              <input
                data-testid="token-password"
                name="password"
                type="password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                className={inputClass}
              />
            </label>

            {error && (
              <p data-testid="token-error" role="alert" className="text-system-red text-sm">
                {error}
              </p>
            )}

            <button
              data-testid="token-login"
              type="submit"
              className="bg-primary rounded-button h-button-md hover:bg-primary/90 active:bg-primary/80 mt-1 inline-flex items-center justify-center px-4 text-sm font-medium text-white transition-colors"
            >
              로그인
            </button>
          </form>
        )}
      </div>
    </main>
  );
};
