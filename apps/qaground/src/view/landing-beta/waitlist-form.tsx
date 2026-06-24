'use client';

import { useState } from 'react';

export const WaitlistForm = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // TODO: 백엔드 연동 (대기자 명단 저장). 현재는 제출 시 로컬 확인만 한다.
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.includes('@')) return;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <p className="text-primary text-sm font-medium" role="status">
        신청 완료. 공개되면 가장 먼저 알려드릴게요.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
      <input
        type="email"
        required
        value={email}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
        placeholder="이메일 주소"
        aria-label="베타 신청 이메일"
        className="border-line-3 bg-bg-2 rounded-button text-text-1 placeholder:text-text-3 focus:border-primary h-button-lg flex-1 border px-4 text-sm transition-colors outline-none"
      />
      <button
        type="submit"
        className="bg-primary rounded-button h-button-lg hover:bg-primary/90 active:bg-primary/80 inline-flex items-center justify-center px-6 text-sm font-medium whitespace-nowrap text-white transition-colors"
      >
        베타 신청
      </button>
    </form>
  );
};
