'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, Lock } from 'lucide-react';

import { ChangeIdentifierFormSchema } from '@/entities/project';
import type { ChangeIdentifierForm } from '@/entities/project';
import { useChangeIdentifier } from '@/features/project-settings';
import { DSButton, DsFormField, DsInput, SettingsCard } from '@testea/ui';

// ─── Section: Security ───────────────────────────────────────────────────────

export const SecuritySection = ({ projectId }: { projectId: string }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const changeIdentifier = useChangeIdentifier();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
  } = useForm<ChangeIdentifierForm>({
    resolver: zodResolver(ChangeIdentifierFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const handleCancel = () => {
    setIsFormOpen(false);
    reset();
  };

  const onSubmit = handleSubmit((data) => {
    changeIdentifier.mutate(
      {
        projectId,
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      },
      {
        onSuccess: (result) => {
          if (result.success) {
            toast.success(result.message ?? '비밀번호가 변경되었습니다.');
            reset();
            setIsFormOpen(false);
          } else {
            if (result.errors.currentPassword) {
              setError('currentPassword', {
                message: result.errors.currentPassword[0],
              });
            } else {
              toast.error(Object.values(result.errors).flat().join(', '));
            }
          }
        },
      },
    );
  });

  return (
    <SettingsCard.Root>
      <SettingsCard.Header
        icon={<Lock className="h-5 w-5" />}
        title="보안"
        description="프로젝트 접근 비밀번호를 관리합니다."
      />
      <SettingsCard.Divider />

      {!isFormOpen && (
        <SettingsCard.Body className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="typo-body2-heading text-text-1">접근 비밀번호</span>
            <span className="typo-caption text-text-3">
              프로젝트에 접근할 때 사용하는 비밀번호를 변경합니다.
            </span>
          </div>
          <DSButton
            variant="ghost"
            size="small"
            className="shrink-0"
            onClick={() => setIsFormOpen(true)}
          >
            <span className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5" />
              변경하기
            </span>
          </DSButton>
        </SettingsCard.Body>
      )}

      {isFormOpen && (
        <form onSubmit={onSubmit} className="flex flex-col p-6 pt-5">
          <div className="rounded-4 bg-bg-1 flex flex-col gap-5 p-5">
            <DsFormField.Root error={errors.currentPassword}>
              <DsFormField.Label className="typo-label-heading text-text-2">현재 비밀번호</DsFormField.Label>
              <DsFormField.Control>
                <DsInput
                  {...register('currentPassword')}
                  type="password"
                  placeholder="현재 비밀번호를 입력하세요"
                  autoComplete="current-password"
                  autoFocus
                />
              </DsFormField.Control>
              <DsFormField.Message>{errors.currentPassword?.message}</DsFormField.Message>
            </DsFormField.Root>

            <div className="border-line-2 border-t" />

            <DsFormField.Root error={errors.newPassword}>
              <DsFormField.Label className="typo-label-heading text-text-2">새 비밀번호</DsFormField.Label>
              <DsFormField.Control>
                <DsInput
                  {...register('newPassword')}
                  type="password"
                  placeholder="8~16자의 새 비밀번호"
                  autoComplete="new-password"
                />
              </DsFormField.Control>
              <DsFormField.Message>{errors.newPassword?.message}</DsFormField.Message>
            </DsFormField.Root>

            <DsFormField.Root error={errors.confirmPassword}>
              <DsFormField.Label className="typo-label-heading text-text-2">새 비밀번호 확인</DsFormField.Label>
              <DsFormField.Control>
                <DsInput
                  {...register('confirmPassword')}
                  type="password"
                  placeholder="새 비밀번호를 다시 입력하세요"
                  autoComplete="new-password"
                />
              </DsFormField.Control>
              <DsFormField.Message>{errors.confirmPassword?.message}</DsFormField.Message>
            </DsFormField.Root>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <DSButton
              type="button"
              variant="ghost"
              size="small"
              onClick={handleCancel}
              disabled={changeIdentifier.isPending}
            >
              취소
            </DSButton>
            <DSButton
              type="submit"
              variant="solid"
              size="small"
              disabled={changeIdentifier.isPending}
            >
              {changeIdentifier.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  변경 중...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5" />
                  비밀번호 변경
                </span>
              )}
            </DSButton>
          </div>
        </form>
      )}
    </SettingsCard.Root>
  );
};
