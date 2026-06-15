'use client';

import { useActionState } from 'react';

import { type GateState, signInAdminAction } from '@/features/auth-gate/api/gate-actions';
import { Button } from '@/shared/ui/button';

const initialState: GateState = {};

export function GateForm({ redirectTo }: { redirectTo: string }) {
  const [state, formAction, pending] = useActionState(signInAdminAction, initialState);

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
      <input type="hidden" name="redirect" value={redirectTo} />
      <div className="flex flex-col gap-2">
        <label htmlFor="secret" className="text-text-2 text-sm font-medium">
          운영자 키
        </label>
        <input
          id="secret"
          name="secret"
          type="password"
          autoComplete="off"
          autoFocus
          required
          className="bg-bg-3 border-line-2 text-text-1 focus:border-primary rounded-lg border px-3 py-2 text-sm outline-none"
          placeholder="공유키 입력"
        />
        {state.error && <p className="text-system-red text-sm">{state.error}</p>}
      </div>
      <Button type="submit" size="medium" disabled={pending}>
        {pending ? '확인 중…' : '입장'}
      </Button>
    </form>
  );
}
