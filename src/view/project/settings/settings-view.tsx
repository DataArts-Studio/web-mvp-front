'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Check,
  HardDrive,
  Loader2,
  Lock,
  Pencil,
  Settings,
  Trash2,
} from 'lucide-react';

import { ChangeIdentifierFormSchema, ProjectSettingsFormSchema } from '@/entities/project';
import type { ChangeIdentifierForm, ProjectSettingsForm } from '@/entities/project';
import { dashboardQueryOptions } from '@/features/dashboard';
import { useUpdateProject, useChangeIdentifier, useDeleteProject } from '@/features/project-settings';
import { Container, MainContainer } from '@/shared/lib/primitives';
import { Dialog } from '@/shared/lib/primitives';
import { DSButton, DsFormField, DsInput, LoadingSpinner } from '@/shared/ui';
import { Aside } from '@/widgets';
import { formatDateKR } from '@/shared/utils/date-format';

// ─── Shared UI Primitives ────────────────────────────────────────────────────

const SectionIcon = ({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'danger' }) => (
  <div
    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
      variant === 'danger'
        ? 'bg-red-500/10 text-red-400'
        : 'bg-primary/10 text-primary'
    }`}
  >
    {children}
  </div>
);

const SectionHeader = ({
  icon,
  title,
  description,
  variant = 'default',
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  variant?: 'default' | 'danger';
}) => (
  <div className="flex items-start gap-4">
    <SectionIcon variant={variant}>{icon}</SectionIcon>
    <div className="flex flex-col gap-0.5">
      <h2 className={`typo-h2-heading ${variant === 'danger' ? 'text-red-400' : 'text-text-1'}`}>
        {title}
      </h2>
      <p className="typo-caption text-text-3">{description}</p>
    </div>
  </div>
);

const Divider = () => <div className="border-line-2 border-t" />;

// ─── Main View ───────────────────────────────────────────────────────────────

export const SettingsView = () => {
  const params = useParams();
  const slug = params.slug as string;

  const { data: dashboardData, isLoading } = useQuery({
    ...dashboardQueryOptions.stats(slug),
    enabled: !!slug,
  });

  const projectId = dashboardData?.success ? dashboardData.data.project.id : undefined;

  const { data: storageData } = useQuery({
    ...dashboardQueryOptions.storageInfo(projectId!),
    enabled: !!projectId,
  });

  if (isLoading) {
    return (
      <Container className="bg-bg-1 text-text-1 flex min-h-screen font-sans">
        <Aside />
        <MainContainer className="flex flex-1 items-center justify-center">
          <LoadingSpinner size="lg" />
        </MainContainer>
      </Container>
    );
  }

  if (!dashboardData?.success || !projectId) {
    return (
      <Container className="bg-bg-1 text-text-1 flex min-h-screen font-sans">
        <Aside />
        <MainContainer className="flex flex-1 items-center justify-center">
          <div className="text-red-400">프로젝트를 불러올 수 없습니다.</div>
        </MainContainer>
      </Container>
    );
  }

  const { project } = dashboardData.data;

  return (
    <Container className="bg-bg-1 text-text-1 flex min-h-screen font-sans">
      <Aside />
      <MainContainer className="mx-auto flex min-h-screen w-full max-w-[860px] flex-1 flex-col gap-10 px-10 py-8">
        {/* Header */}
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <Settings className="h-4.5 w-4.5 text-primary" />
            </div>
            <h1 className="typo-h1-heading text-text-1">프로젝트 설정</h1>
          </div>
          <p className="typo-body2-normal text-text-3 ml-12">
            <span className="text-primary font-medium">{project.name}</span>
            <span className="text-text-4 mx-2">|</span>
            <span>{formatDateKR(project.created_at)} 생성</span>
          </p>
        </header>

        {/* Section 1: General */}
        <GeneralSettingsSection
          projectId={projectId}
          defaultName={project.name}
          defaultDescription={project.description}
          defaultOwnerName={project.ownerName}
        />

        {/* Section 2: Security */}
        <SecuritySection projectId={projectId} />

        {/* Section 3: Storage */}
        {storageData?.success && (
          <StorageSection
            usedBytes={storageData.data.usedBytes}
            maxBytes={storageData.data.maxBytes}
            usedPercent={storageData.data.usedPercent}
          />
        )}

        {/* Section 4: Danger Zone */}
        <DangerZoneSection projectId={projectId} projectName={project.name} />

        {/* Bottom spacer */}
        <div className="h-8" />
      </MainContainer>
    </Container>
  );
};

// ─── Section 1: General Settings ─────────────────────────────────────────────

interface GeneralSettingsSectionProps {
  projectId: string;
  defaultName: string;
  defaultDescription: string;
  defaultOwnerName: string;
}

const GeneralSettingsSection = ({
  projectId,
  defaultName,
  defaultDescription,
  defaultOwnerName,
}: GeneralSettingsSectionProps) => {
  const updateProject = useUpdateProject();
  const [savedField, setSavedField] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectSettingsForm>({
    resolver: zodResolver(ProjectSettingsFormSchema),
    defaultValues: {
      name: defaultName,
      description: defaultDescription || '',
      ownerName: defaultOwnerName || '',
    },
  });

  const handleSaveField = (field: keyof ProjectSettingsForm) => {
    return handleSubmit((data) => {
      updateProject.mutate(
        { projectId, [field]: data[field] },
        {
          onSuccess: (result) => {
            if (result.success) {
              toast.success(result.message ?? '저장되었습니다.');
              setSavedField(field);
              setTimeout(() => setSavedField(null), 2000);
            } else {
              const errorMsg = Object.values(result.errors).flat().join(', ');
              toast.error(errorMsg);
            }
          },
        },
      );
    });
  };

  const SaveButton = ({ field }: { field: keyof ProjectSettingsForm }) => (
    <DSButton
      variant="ghost"
      size="small"
      onClick={handleSaveField(field)}
      disabled={updateProject.isPending}
      className="shrink-0"
    >
      {updateProject.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : savedField === field ? (
        <span className="flex items-center gap-1.5 text-green-400">
          <Check className="h-3.5 w-3.5" />
          저장됨
        </span>
      ) : (
        '저장'
      )}
    </DSButton>
  );

  return (
    <section className="rounded-5 border-line-2 bg-bg-2 flex flex-col border transition-colors">
      <div className="p-6 pb-5">
        <SectionHeader
          icon={<Pencil className="h-5 w-5" />}
          title="일반 설정"
          description="프로젝트의 기본 정보를 수정합니다."
        />
      </div>

      <Divider />

      <div className="flex flex-col gap-0 divide-y divide-line-2">
        {/* 프로젝트 이름 */}
        <div className="flex items-center gap-4 px-6 py-5">
          <div className="w-28 shrink-0">
            <span className="typo-label-heading text-text-2">프로젝트 이름</span>
          </div>
          <DsFormField.Root error={errors.name?.message} className="!flex-row !items-center !gap-3 flex-1">
            <DsFormField.Control>
              <DsInput
                {...register('name')}
                placeholder="프로젝트 이름"
                              />
            </DsFormField.Control>
            <DsFormField.Message>{errors.name?.message}</DsFormField.Message>
          </DsFormField.Root>
          <SaveButton field="name" />
        </div>

        {/* 설명 */}
        <div className="flex items-center gap-4 px-6 py-5">
          <div className="w-28 shrink-0">
            <span className="typo-label-heading text-text-2">설명</span>
          </div>
          <DsFormField.Root error={errors.description?.message} className="!flex-row !items-center !gap-3 flex-1">
            <DsFormField.Control>
              <DsInput
                {...register('description')}
                placeholder="프로젝트에 대한 간단한 설명"
                              />
            </DsFormField.Control>
            <DsFormField.Message>{errors.description?.message}</DsFormField.Message>
          </DsFormField.Root>
          <SaveButton field="description" />
        </div>

        {/* 소유자 이름 */}
        <div className="flex items-center gap-4 px-6 py-5">
          <div className="w-28 shrink-0">
            <span className="typo-label-heading text-text-2">소유자</span>
          </div>
          <DsFormField.Root error={errors.ownerName?.message} className="!flex-row !items-center !gap-3 flex-1">
            <DsFormField.Control>
              <DsInput
                {...register('ownerName')}
                placeholder="프로젝트 소유자 이름"
                              />
            </DsFormField.Control>
            <DsFormField.Message>{errors.ownerName?.message}</DsFormField.Message>
          </DsFormField.Root>
          <SaveButton field="ownerName" />
        </div>
      </div>
    </section>
  );
};

// ─── Section 2: Security ─────────────────────────────────────────────────────

interface SecuritySectionProps {
  projectId: string;
}

const SecuritySection = ({ projectId }: SecuritySectionProps) => {
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
              const errorMsg = Object.values(result.errors).flat().join(', ');
              toast.error(errorMsg);
            }
          }
        },
      },
    );
  });

  return (
    <section className="rounded-5 border-line-2 bg-bg-2 flex flex-col border transition-colors">
      <div className="p-6 pb-5">
        <SectionHeader
          icon={<Lock className="h-5 w-5" />}
          title="보안"
          description="프로젝트 접근 비밀번호를 관리합니다."
        />
      </div>

      <Divider />

      {/* 기본 상태: CTA 행 */}
      {!isFormOpen && (
        <div className="flex items-center justify-between p-6 pt-5">
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
        </div>
      )}

      {/* 폼 열림 상태 */}
      {isFormOpen && (
        <form onSubmit={onSubmit} className="flex flex-col p-6 pt-5">
          <div className="rounded-4 bg-bg-1 flex flex-col gap-5 p-5">
            <DsFormField.Root error={errors.currentPassword?.message}>
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

            <DsFormField.Root error={errors.newPassword?.message}>
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

            <DsFormField.Root error={errors.confirmPassword?.message}>
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
    </section>
  );
};

// ─── Section 3: Storage ──────────────────────────────────────────────────────

interface StorageSectionProps {
  usedBytes: number;
  maxBytes: number;
  usedPercent: number;
}

const StorageSection = ({ usedBytes, maxBytes, usedPercent }: StorageSectionProps) => {
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const barColor =
    usedPercent >= 95
      ? 'bg-red-500'
      : usedPercent >= 80
        ? 'bg-amber-500'
        : 'bg-primary';

  const textColor =
    usedPercent >= 95
      ? 'text-red-500'
      : usedPercent >= 80
        ? 'text-amber-500'
        : 'text-primary';

  const statusLabel =
    usedPercent >= 95
      ? '용량 부족'
      : usedPercent >= 80
        ? '용량 주의'
        : '정상';

  const statusBg =
    usedPercent >= 95
      ? 'bg-red-500/10 text-red-400'
      : usedPercent >= 80
        ? 'bg-amber-500/10 text-amber-400'
        : 'bg-primary/10 text-primary';

  return (
    <section className="rounded-5 border-line-2 bg-bg-2 flex flex-col border transition-colors">
      <div className="p-6 pb-5">
        <SectionHeader
          icon={<HardDrive className="h-5 w-5" />}
          title="스토리지"
          description="프로젝트 데이터 저장 공간 사용 현황입니다."
        />
      </div>

      <Divider />

      <div className="flex flex-col gap-4 p-6 pt-5">
        {/* Usage bar */}
        <div className="rounded-4 bg-bg-1 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-baseline gap-2">
              <span className={`typo-h2-heading ${textColor}`}>
                {formatBytes(usedBytes)}
              </span>
              <span className="typo-caption text-text-3">
                / {formatBytes(maxBytes)}
              </span>
            </div>
            <span className={`typo-caption rounded-full px-2.5 py-1 ${statusBg}`}>
              {statusLabel}
            </span>
          </div>

          <div className="h-3 w-full overflow-hidden rounded-full bg-bg-3">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${Math.min(usedPercent, 100)}%` }}
            />
          </div>

          <div className="mt-2 flex justify-end">
            <span className={`typo-caption font-medium ${textColor}`}>
              {usedPercent}% 사용 중
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── Section 4: Danger Zone ──────────────────────────────────────────────────

interface DangerZoneSectionProps {
  projectId: string;
  projectName: string;
}

const DangerZoneSection = ({ projectId, projectName }: DangerZoneSectionProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const deleteProject = useDeleteProject();

  const isNameMatch = confirmInput === projectName;

  const handleDelete = () => {
    deleteProject.mutate(
      { projectId, confirmName: confirmInput },
      {
        onSuccess: (result) => {
          if (result.success) {
            toast.success(result.message ?? '프로젝트가 삭제되었습니다.');
          } else {
            const errorMsg = Object.values(result.errors).flat().join(', ');
            toast.error(errorMsg);
            setIsDialogOpen(false);
          }
        },
      },
    );
  };

  return (
    <>
      <section className="rounded-5 flex flex-col border border-red-500/20 bg-red-500/[0.03] transition-colors">
        <div className="p-6 pb-5">
          <SectionHeader
            icon={<AlertTriangle className="h-5 w-5" />}
            title="위험 영역"
            description="이 영역의 작업은 되돌릴 수 없습니다."
            variant="danger"
          />
        </div>

        <div className="border-t border-red-500/10" />

        <div className="flex items-center justify-between p-6 pt-5">
          <div className="flex flex-col gap-1">
            <span className="typo-body2-heading text-text-1">프로젝트 삭제</span>
            <span className="typo-caption text-text-3">
              모든 테스트 케이스, 스위트, 실행 결과가 영구적으로 삭제됩니다.
            </span>
          </div>
          <DSButton
            variant="text"
            size="small"
            className="shrink-0 bg-red-500/10 text-red-400 hover:bg-red-500/20"
            onClick={() => setIsDialogOpen(true)}
          >
            <span className="flex items-center gap-2">
              <Trash2 className="h-3.5 w-3.5" />
              프로젝트 삭제
            </span>
          </DSButton>
        </div>
      </section>

      {isDialogOpen && (
        <Dialog.Root defaultOpen>
          <Dialog.Portal>
            <Dialog.Overlay onClick={() => !deleteProject.isPending && setIsDialogOpen(false)} />
            <Dialog.Content className="bg-bg-2 border-line-2 rounded-5 w-full max-w-[460px] border p-0">
              {/* Dialog header */}
              <div className="flex items-center gap-3 border-b border-line-2 px-6 py-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/10">
                  <Trash2 className="h-4 w-4 text-red-400" />
                </div>
                <Dialog.Title className="typo-h2-heading text-text-1">
                  프로젝트 삭제
                </Dialog.Title>
              </div>

              {/* Dialog body */}
              <div className="flex flex-col gap-4 px-6 py-5">
                <Dialog.Description className="text-text-2 typo-body2-normal">
                  이 작업은 되돌릴 수 없습니다. 삭제를 확인하려면 프로젝트 이름을 정확히 입력해주세요.
                </Dialog.Description>

                <div className="rounded-4 bg-bg-1 border-line-2 border px-4 py-3">
                  <span className="typo-caption text-text-3">프로젝트 이름</span>
                  <p className="typo-body2-heading text-text-1 mt-0.5">{projectName}</p>
                </div>

                <DsInput
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  placeholder="프로젝트 이름을 입력하세요"
                  autoFocus
                />

                {confirmInput.length > 0 && !isNameMatch && (
                  <p className="typo-caption text-red-400">프로젝트 이름이 일치하지 않습니다.</p>
                )}
              </div>

              {/* Dialog footer */}
              <div className="flex justify-end gap-2 border-t border-line-2 px-6 py-4">
                <DSButton
                  variant="ghost"
                  size="small"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setConfirmInput('');
                  }}
                  disabled={deleteProject.isPending}
                >
                  취소
                </DSButton>
                <DSButton
                  variant="text"
                  size="small"
                  className="bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-40"
                  onClick={handleDelete}
                  disabled={!isNameMatch || deleteProject.isPending}
                >
                  {deleteProject.isPending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      삭제 중...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Trash2 className="h-3.5 w-3.5" />
                      영구 삭제
                    </span>
                  )}
                </DSButton>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </>
  );
};
