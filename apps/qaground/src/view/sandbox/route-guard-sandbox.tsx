'use client';

import { useState } from 'react';

/**
 * 라우트 가드 샌드박스 (테스트 대상).
 *
 * 보호 페이지는 인증된 경우에만 보인다. 미인증 상태로 접근을 시도하면 로그인 화면으로
 * 리다이렉트되고 안내가 노출된다. 로그인 후에는 보호 페이지에 바로 접근된다.
 */

const VALID_USERNAME = 'tester';
const VALID_PASSWORD = 'qaground123';

type View = 'home' | 'login' | 'protected';

const inputClass =
  'border-line-3 bg-bg-3 rounded-button text-text-1 focus:border-primary h-button-md border px-3 text-sm transition-colors outline-none';

const navButtonClass =
  'border-line-3 text-text-2 rounded-button h-button-md hover:text-text-1 border px-3 text-sm transition-colors';

export const RouteGuardSandbox = () => {
  const [authed, setAuthed] = useState(false);
  const [view, setView] = useState<View>('home');
  const [redirected, setRedirected] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // 보호 페이지 접근 시도: 인증돼 있으면 진입, 아니면 로그인으로 리다이렉트.
  const goProtected = () => {
    if (authed) {
      setView('protected');
      setRedirected(false);
    } else {
      setView('login');
      setRedirected(true);
    }
  };

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
      setAuthed(true);
      setError('');
      setRedirected(false);
      setView('protected');
      return;
    }
    setError('아이디 또는 비밀번호가 올바르지 않습니다.');
  };

  const logout = () => {
    setAuthed(false);
    setView('home');
    setUsername('');
    setPassword('');
    setRedirected(false);
  };

  return (
    <main className="bg-bg-1 text-text-1 flex min-h-screen w-full justify-center px-4 py-10 font-sans">
      <div className="border-line-2 bg-bg-2 w-full max-w-sm rounded-2xl border p-8">
        <nav className="mb-6 flex items-center gap-2">
          <button
            data-testid="nav-home"
            type="button"
            onClick={() => setView('home')}
            className={navButtonClass}
          >
            홈
          </button>
          <button
            data-testid="guard-protected-link"
            type="button"
            onClick={goProtected}
            className={navButtonClass}
          >
            보호 페이지
          </button>
          {authed && (
            <button
              data-testid="guard-logout"
              type="button"
              onClick={logout}
              className={`${navButtonClass} ml-auto`}
            >
              로그아웃
            </button>
          )}
        </nav>

        {view === 'home' && (
          <div data-testid="guard-home-view">
            <h1 className="text-xl font-bold">홈</h1>
            <p className="text-text-2 mt-2 text-sm">보호 페이지로 이동을 시도해 보세요.</p>
          </div>
        )}

        {view === 'login' && (
          <form
            onSubmit={handleLogin}
            data-testid="guard-login-view"
            className="flex flex-col gap-4"
            noValidate
          >
            {redirected && (
              <p
                data-testid="guard-redirect-notice"
                role="alert"
                className="text-system-red text-sm"
              >
                로그인이 필요합니다.
              </p>
            )}
            <h1 className="text-xl font-bold">로그인</h1>
            <label className="flex flex-col gap-1.5">
              <span className="text-text-2 text-sm">아이디</span>
              <input
                data-testid="guard-username"
                type="text"
                value={username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-text-2 text-sm">비밀번호</span>
              <input
                data-testid="guard-password"
                type="password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                className={inputClass}
              />
            </label>
            {error && (
              <p data-testid="guard-login-error" role="alert" className="text-system-red text-sm">
                {error}
              </p>
            )}
            <button
              data-testid="guard-login-submit"
              type="submit"
              className="bg-primary rounded-button h-button-md hover:bg-primary/90 active:bg-primary/80 mt-1 inline-flex items-center justify-center px-4 text-sm font-medium text-white transition-colors"
            >
              로그인
            </button>
          </form>
        )}

        {view === 'protected' && (
          <div data-testid="guard-protected-view">
            <h1 className="text-primary text-xl font-bold">보호 페이지</h1>
            <p className="text-text-2 mt-2 text-sm">인증된 사용자만 볼 수 있는 내용입니다.</p>
          </div>
        )}
      </div>
    </main>
  );
};
