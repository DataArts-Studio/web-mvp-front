'use client';

import { useState } from 'react';

const EMAIL_RE = /^\S+@\S+\.\S+$/;

type Errors = { email?: string; password?: string; confirm?: string };

/**
 * 회원가입 폼 검증 샌드박스 (테스트 대상).
 * - 이메일 형식, 비밀번호 8자 이상, 비밀번호 확인 일치를 검증한다.
 */
export const SignupSandbox = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const next: Errors = {};
    if (!EMAIL_RE.test(email)) next.email = '올바른 이메일 형식이 아닙니다.';
    if (password.length < 8) next.password = '비밀번호는 8자 이상이어야 합니다.';
    if (confirm !== password) next.confirm = '비밀번호가 일치하지 않습니다.';
    setErrors(next);
    setSuccess(Object.keys(next).length === 0);
  };

  const field = (
    testid: string,
    label: string,
    type: string,
    value: string,
    onChange: (v: string) => void,
    errorTestid: string,
    error?: string
  ) => (
    <label className="flex flex-col gap-1.5">
      <span className="text-text-2 text-sm">{label}</span>
      <input
        data-testid={testid}
        type={type}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        className="border-line-3 bg-bg-3 rounded-button text-text-1 focus:border-primary h-button-md border px-3 text-sm transition-colors outline-none"
      />
      {error && (
        <span data-testid={errorTestid} role="alert" className="text-system-red text-xs">
          {error}
        </span>
      )}
    </label>
  );

  return (
    <main className="bg-bg-1 text-text-1 flex min-h-screen w-full items-center justify-center px-4 font-sans">
      <div className="border-line-2 bg-bg-2 w-full max-w-sm rounded-2xl border p-8">
        <h1 className="mb-6 text-xl font-bold">회원가입</h1>
        {success ? (
          <p
            data-testid="signup-success"
            role="status"
            className="border-primary/30 bg-primary/10 text-primary rounded-xl border px-4 py-3 text-sm font-medium"
          >
            가입이 완료되었습니다.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            {field('email', '이메일', 'text', email, setEmail, 'email-error', errors.email)}
            {field(
              'password',
              '비밀번호',
              'password',
              password,
              setPassword,
              'password-error',
              errors.password
            )}
            {field(
              'confirm-password',
              '비밀번호 확인',
              'password',
              confirm,
              setConfirm,
              'confirm-error',
              errors.confirm
            )}
            <button
              data-testid="signup-submit"
              type="submit"
              className="bg-primary rounded-button h-button-md hover:bg-primary/90 active:bg-primary/80 mt-1 inline-flex items-center justify-center px-4 text-sm font-medium text-white transition-colors"
            >
              가입하기
            </button>
          </form>
        )}
      </div>
    </main>
  );
};
