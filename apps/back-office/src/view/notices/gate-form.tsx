'use client';

import { useActionState } from 'react';

import { type GateState, signInAdminAction } from '@/features/auth-gate/api/gate-actions';

const initialState: GateState = {};

export function GateForm({ redirectTo }: { redirectTo: string }) {
  const [state, formAction, pending] = useActionState(signInAdminAction, initialState);

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
      <input type="hidden" name="redirect" value={redirectTo} />
      <div className="flex flex-col gap-2">
        <label htmlFor="secret" className="text-text-primary text-sm font-medium">
          운영자 키
        </label>
        <input
          id="secret"
          name="secret"
          type="password"
          autoComplete="off"
          autoFocus
          required
          className="border-border text-text-primary placeholder:text-text-secondary rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:border-[#155DFC]"
          placeholder="공유키 입력"
        />
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1d4ed8] disabled:opacity-50"
      >
        {pending ? '확인 중…' : '입장'}
      </button>
    </form>
  );
}
