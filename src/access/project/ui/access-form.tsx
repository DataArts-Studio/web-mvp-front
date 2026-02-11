'use client';

/**
 * 프로젝트 접근 비밀번호 입력 폼
 *
 * 디자인 시스템 컴포넌트(DSButton, DsInput, Logo) 사용
 */

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { track, ACCESS_EVENTS } from '@/shared/lib/analytics';

import { cn } from '@/shared/utils';
import { Logo } from '@/shared/ui/logo';
import { DSButton } from '@/shared/ui/ds-button';

import { verifyProjectAccess } from '../api/verify-access';
import { ProjectAccessFormSchema, type ProjectAccessFormInput } from '../model/schema';

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
      const result = await verifyProjectAccess(projectSlug, data.password);

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
          <h1 className="typo-h1-heading text-text-1">
            프로젝트 접근
          </h1>
          <p className="mt-2 typo-body2-normal text-text-2">
            <span className="text-primary font-semibold">{projectName || projectSlug}</span> 프로젝트에 접근하려면
            <br />
            비밀번호를 입력해주세요.
          </p>
        </div>
      </div>

      {/* 만료 알림 */}
      {isExpired && (
        <div className="mb-4 flex items-center gap-3 rounded-4 border border-yellow-500/30 bg-yellow-500/10 p-4 typo-label-normal text-yellow-400">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>접근 권한이 만료되었습니다. 다시 인증해주세요.</p>
        </div>
      )}

      {/* 에러 메시지 */}
      {serverError && (
        <div className="mb-4 flex items-center gap-3 rounded-4 border border-system-red/30 bg-system-red/10 p-4 typo-label-normal text-system-red">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <div>
            <p>{serverError}</p>
            {remainingAttempts !== null && remainingAttempts > 0 && (
              <p className="mt-1 typo-caption-normal text-system-red/80">
                남은 시도 횟수: {remainingAttempts}회
              </p>
            )}
          </div>
        </div>
      )}

      {/* 폼 */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label
            htmlFor="password"
            className="mb-2 block typo-label-heading text-text-2"
          >
            프로젝트 비밀번호 (식별번호)
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              disabled={isPending}
              className={cn(
                'flex w-full items-center rounded-4 border bg-bg-1 outline-none transition-colors',
                'h-14 px-6 pr-12 typo-body2-normal',
                'placeholder:text-text-3',
                'focus:border-primary',
                'disabled:cursor-not-allowed disabled:bg-bg-3 disabled:text-line-3',
                errors.password
                  ? 'border-system-red text-system-red'
                  : 'border-line-2 text-text-1'
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
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-3 hover:text-text-2 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-2 typo-caption-normal text-system-red">
              {errors.password.message}
            </p>
          )}
        </div>

        <DSButton
          type="submit"
          disabled={isPending}
          variant="solid"
          size="large"
          className="w-full"
        >
          {isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              확인 중...
            </>
          ) : (
            '접근하기'
          )}
        </DSButton>
      </form>

      {/* 안내 텍스트 */}
      <p className="mt-8 text-center typo-caption-normal text-text-3">
        프로젝트 생성 시 설정한 식별번호를 입력해주세요.
        <br />
        비밀번호를 잊으셨다면 프로젝트 관리자에게 문의해주세요.
      </p>
    </div>
  );
}
