'use client';

import { useState } from 'react';

type Status = 'idle' | 'submitting' | 'done' | 'error';

export const WaitlistForm = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [alreadyJoined, setAlreadyJoined] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === 'submitting') return;
    if (!email.includes('@')) {
      setStatus('error');
      return;
    }

    setStatus('submitting');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        setStatus('error');
        return;
      }
      const data = (await res.json()) as { ok: boolean; alreadyJoined?: boolean };
      setAlreadyJoined(Boolean(data.alreadyJoined));
      setStatus('done');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'done') {
    return (
      <p className="text-primary text-sm font-medium" role="status">
        {alreadyJoined
          ? '이미 신청된 이메일이에요. 공개되면 알려드릴게요.'
          : '신청 완료. 공개되면 가장 먼저 알려드릴게요.'}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-3">
      <div className="flex w-full flex-col gap-3 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setEmail(e.target.value);
            if (status === 'error') setStatus('idle');
          }}
          placeholder="이메일 주소"
          aria-label="베타 신청 이메일"
          disabled={status === 'submitting'}
          className="border-line-3 bg-bg-2 rounded-button text-text-1 placeholder:text-text-3 focus:border-primary h-button-lg flex-1 border px-4 text-sm transition-colors outline-none disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="bg-primary rounded-button h-button-lg hover:bg-primary/90 active:bg-primary/80 inline-flex items-center justify-center px-6 text-sm font-medium whitespace-nowrap text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === 'submitting' ? '신청 중...' : '베타 신청'}
        </button>
      </div>
      {status === 'error' && (
        <p className="text-system-red text-xs" role="alert">
          신청에 실패했어요. 이메일을 확인하고 다시 시도해 주세요.
        </p>
      )}
    </form>
  );
};
