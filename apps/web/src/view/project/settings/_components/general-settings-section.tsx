'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Check, Loader2, Pencil } from 'lucide-react';

import { ProjectSettingsFormSchema } from '@/entities/project';
import type { ProjectSettingsForm } from '@/entities/project';
import { useUpdateProject } from '@/features/project-settings';
import { DSButton, DsFormField, DsInput, SettingsCard } from '@testea/ui';

// ─── Section: General Settings ───────────────────────────────────────────────

interface GeneralSettingsSectionProps {
  projectId: string;
  defaultName: string;
  defaultDescription: string;
  defaultOwnerName: string;
}

export const GeneralSettingsSection = ({
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
              toast.error(Object.values(result.errors).flat().join(', '));
            }
          },
        },
      );
    });
  };

  const renderSaveButton = (field: keyof ProjectSettingsForm) => (
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

  const fields = [
    { key: 'name' as const, label: '프로젝트 이름', placeholder: '프로젝트 이름' },
    { key: 'description' as const, label: '설명', placeholder: '프로젝트에 대한 간단한 설명' },
    { key: 'ownerName' as const, label: '소유자', placeholder: '프로젝트 소유자 이름' },
  ];

  return (
    <SettingsCard.Root>
      <SettingsCard.Header
        icon={<Pencil className="h-5 w-5" />}
        title="일반 설정"
        description="프로젝트의 기본 정보를 수정합니다."
      />
      <SettingsCard.Divider />
      <div className="flex flex-col gap-0 divide-y divide-line-2">
        {fields.map(({ key, label, placeholder }) => (
          <SettingsCard.Row key={key}>
            <div className="w-28 shrink-0">
              <span className="typo-label-heading text-text-2">{label}</span>
            </div>
            <DsFormField.Root error={errors[key]} className="!flex-row !items-center !gap-3 flex-1">
              <DsFormField.Control>
                <DsInput {...register(key)} placeholder={placeholder} />
              </DsFormField.Control>
              <DsFormField.Message>{errors[key]?.message}</DsFormField.Message>
            </DsFormField.Root>
            {renderSaveButton(key)}
          </SettingsCard.Row>
        ))}
      </div>
    </SettingsCard.Root>
  );
};
