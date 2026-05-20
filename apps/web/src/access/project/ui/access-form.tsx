'use client';

/**
 * 프로젝트 접근 비밀번호 입력 폼
 *
 * 디자인 시스템 컴포넌트(DSButton, DsInput, Logo) 사용
 */
import { useEffect, useRef, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { ENV } from '@/shared/constants';
import { ACCESS_EVENTS, track } from '@/shared/lib/analytics';
import { zodResolver } from '@hookform/resolvers/zod';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { Logo } from '@testea/ui';
import { DSButton } from '@testea/ui';
import { cn } from '@testea/util';
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';

import { verifyProjectAccess } from '../api/verify-access';
import { type ProjectAccessFormInput, ProjectAccessFormSchema } from '../model/schema';

interface AccessFormProps {
  projectSlug: string;
  projectName?: string;
  redirectUrl?: string;
  isExpired?: boolean;
  className?: string;
}

export function AccessForm({
  projectSlug,
  projectName,
  redirectUrl,
  isExpired,
  className,
}: AccessFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const turnstileRef = useRef<TurnstileInstance>(null);
  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const siteKey = isLocalhost ? '' : ENV.CLIENT.TURNSTILE_SITE_KEY;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectAccessFormInput>({
    resolver: zodResolver(ProjectAccessFormSchema),
    defaultValues: {
      password: '',
    },
  });

  useEffect(() => {
    if (isExpired) {
      track(ACCESS_EVENTS.TOKEN_EXPIRED, { project_slug: projectSlug });
    }
  }, [isExpired, projectSlug]);

  const onSubmit = (data: ProjectAccessFormInput) => {
    setServerError(null);
    track(ACCESS_EVENTS.ATTEMPT, { project_slug: projectSlug });

    startTransition(async () => {
      const result = await verifyProjectAccess(
        projectSlug,
        data.password,
        turnstileToken || undefined
      );

      if (result.success) {
        track(ACCESS_EVENTS.SUCCESS, { project_slug: projectSlug });
        // Open Redirect 방지: 상대 경로만 허용
        const safeRedirect =
          redirectUrl && redirectUrl.startsWith('/') && !redirectUrl.startsWith('//')
            ? redirectUrl
            : result.redirectUrl;
        router.push(safeRedirect);
        router.refresh();
      } else {
        track(ACCESS_EVENTS.FAIL, { remaining_attempts: result.remainingAttempts ?? null });
        setServerError(result.error);
        if (result.remainingAttempts !== undefined) {
          setRemainingAttempts(result.remainingAttempts);
        }
        // 실패 시 Turnstile 리셋
        turnstileRef.current?.reset();
        setTurnstileToken('');
      }
    });
  };

  return (
    <div className={cn('w-full max-w-md', className)}>
      {/* 헤더 */}
      <div className="mb-10 flex flex-col items-center gap-4">
        <Link href="/" className="transition-opacity hover:opacity-80">
          <Logo width={120} height={28} />
        </Link>
        <div className="text-center">
          <h1 className="typo-h1-heading text-text-1">프로젝트 접근</h1>
          <p className="typo-body2-normal text-text-2 mt-2">
            <span className="text-primary font-semibold">{projectName || projectSlug}</span>{' '}
            프로젝트에 접근하려면
            <br />
            비밀번호를 입력해주세요.
          </p>
        </div>
      </div>

      {/* 만료 알림 */}
      {isExpired && (
        <div className="rounded-4 typo-label-normal mb-4 flex items-center gap-3 border border-yellow-500/30 bg-yellow-500/10 p-4 text-yellow-400">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>접근 권한이 만료되었습니다. 다시 인증해주세요.</p>
        </div>
      )}

      {/* 에러 메시지 */}
      {serverError && (
        <div className="rounded-4 border-system-red/30 bg-system-red/10 typo-label-normal text-system-red mb-4 flex items-center gap-3 border p-4">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <div>
            <p>{serverError}</p>
            {remainingAttempts !== null && remainingAttempts > 0 && (
              <p className="typo-caption-normal text-system-red/80 mt-1">
                남은 시도 횟수: {remainingAttempts}회
              </p>
            )}
          </div>
        </div>
      )}

      {/* 폼 */}
      {/* eslint-disable-next-line react-hooks/refs -- handleSubmit from useForm is not a ref */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="password" className="typo-label-heading text-text-2 mb-2 block">
            프로젝트 비밀번호 (식별번호)
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              disabled={isPending}
              className={cn(
                'rounded-4 bg-bg-1 flex w-full items-center border transition-colors outline-none',
                'typo-body2-normal h-14 px-6 pr-12',
                'placeholder:text-text-3',
                'focus:border-primary',
                'disabled:bg-bg-3 disabled:text-line-3 disabled:cursor-not-allowed',
                errors.password ? 'border-system-red text-system-red' : 'border-line-2 text-text-1'
              )}
              placeholder="8~16자리 비밀번호 입력"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => {
                track(ACCESS_EVENTS.PASSWORD_TOGGLE);
                setShowPassword(!showPassword);
              }}
              className="text-text-3 hover:text-text-2 absolute top-1/2 right-4 -translate-y-1/2 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="typo-caption-normal text-system-red mt-2">{errors.password.message}</p>
          )}
        </div>

        {siteKey && (
          <Turnstile
            ref={turnstileRef}
            siteKey={siteKey}
            onSuccess={setTurnstileToken}
            onError={() => setTurnstileToken('')}
            onExpire={() => setTurnstileToken('')}
            options={{ theme: 'dark', size: 'flexible' }}
          />
        )}

        <DSButton
          type="submit"
          disabled={isPending || (!!siteKey && !turnstileToken)}
          variant="solid"
          size="large"
          className="w-full"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              확인 중...
            </>
          ) : (
            '접근하기'
          )}
        </DSButton>
      </form>

      {/* 안내 텍스트 */}
      <p className="typo-caption-normal text-text-3 mt-8 text-center">
        프로젝트 생성 시 설정한 식별번호를 입력해주세요.
        <br />
        비밀번호를 잊으셨다면 프로젝트 관리자에게 문의해주세요.
      </p>
    </div>
  );
}
