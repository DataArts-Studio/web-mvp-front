'use client';

import { useState } from 'react';

const PHONE_RE = /^010-\d{4}-\d{4}$/;

type Errors = { name?: string; phone?: string; age?: string; terms?: string };

/**
 * 프로필 등록 폼 검증 샌드박스 (테스트 대상).
 * - 이름 길이(2~20), 전화 형식(010-0000-0000), 나이 범위(14~120 정수),
 *   약관 동의(필수)를 검증한다. 서로 다른 유형의 유효성 규칙을 한 폼에서 연습.
 */
export const ProfileFormSandbox = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const next: Errors = {};
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 20)
      next.name = '이름은 2자 이상 20자 이하여야 합니다.';
    if (!PHONE_RE.test(phone)) next.phone = '전화번호는 010-0000-0000 형식이어야 합니다.';
    const ageNum = Number(age);
    if (!age || !Number.isInteger(ageNum) || ageNum < 14 || ageNum > 120)
      next.age = '나이는 14세 이상 120세 이하의 숫자여야 합니다.';
    if (!terms) next.terms = '약관에 동의해야 합니다.';
    setErrors(next);
    setSuccess(Object.keys(next).length === 0);
  };

  const field = (
    testid: string,
    label: string,
    value: string,
    onChange: (v: string) => void,
    errorTestid: string,
    placeholder: string,
    error?: string
  ) => (
    <label className="flex flex-col gap-1.5">
      <span className="text-text-2 text-sm">{label}</span>
      <input
        data-testid={testid}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        className="border-line-3 bg-bg-3 rounded-button text-text-1 placeholder:text-text-3 focus:border-primary h-button-md border px-3 text-sm transition-colors outline-none"
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
        <h1 className="mb-6 text-xl font-bold">프로필 등록</h1>
        {success ? (
          <p
            data-testid="profile-success"
            role="status"
            className="border-primary/30 bg-primary/10 text-primary rounded-xl border px-4 py-3 text-sm font-medium"
          >
            프로필이 등록되었습니다.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            {field('name', '이름', name, setName, 'name-error', '2~20자', errors.name)}
            {field(
              'phone',
              '전화번호',
              phone,
              setPhone,
              'phone-error',
              '010-0000-0000',
              errors.phone
            )}
            {field('age', '나이', age, setAge, 'age-error', '14~120', errors.age)}
            <label className="flex items-center gap-2">
              <input
                data-testid="terms"
                type="checkbox"
                checked={terms}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTerms(e.target.checked)}
                className="accent-primary h-4 w-4"
              />
              <span className="text-text-2 text-sm">이용약관에 동의합니다.</span>
            </label>
            {errors.terms && (
              <span data-testid="terms-error" role="alert" className="text-system-red text-xs">
                {errors.terms}
              </span>
            )}
            <button
              data-testid="profile-submit"
              type="submit"
              className="bg-primary rounded-button h-button-md hover:bg-primary/90 active:bg-primary/80 mt-1 inline-flex items-center justify-center px-4 text-sm font-medium text-white transition-colors"
            >
              등록하기
            </button>
          </form>
        )}
      </div>
    </main>
  );
};
