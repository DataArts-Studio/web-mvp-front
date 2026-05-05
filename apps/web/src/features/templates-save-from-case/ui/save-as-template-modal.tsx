'use client';
import React from 'react';
import { useForm } from 'react-hook-form';

import { useSaveAsTemplate } from '../hooks';
import { DSButton, DsFormField, DsInput, LoadingSpinner } from '@/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, X } from 'lucide-react';
import { z } from 'zod';
import { toast } from 'sonner';

const SaveAsTemplateFormSchema = z.object({
  name: z.string().min(1, '템플릿 이름을 입력해주세요.').max(50, '템플릿 이름은 50자를 넘을 수 없습니다.'),
  description: z.string().max(200, '설명은 200자를 넘을 수 없습니다.').optional(),
});

type SaveAsTemplateForm = z.infer<typeof SaveAsTemplateFormSchema>;

interface SaveAsTemplateModalProps {
  caseId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SaveAsTemplateModal = ({ caseId, onClose, onSuccess }: SaveAsTemplateModalProps) => {
  const { mutate, isPending } = useSaveAsTemplate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SaveAsTemplateForm>({
    resolver: zodResolver(SaveAsTemplateFormSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const onSubmit = handleSubmit((data) => {
    mutate(
      { caseId, name: data.name, description: data.description },
      {
        onSuccess: () => {
          toast.success('템플릿으로 저장되었습니다.');
          onSuccess?.();
          onClose();
        },
        onError: () => {
          toast.error('템플릿 저장에 실패했습니다.');
        },
      }
    );
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <section
        className="bg-bg-2 border border-line-2 rounded-5 relative flex max-h-[85vh] w-full max-w-[440px] flex-col overflow-hidden shadow-4"
        onClick={(e) => e.stopPropagation()}
      >
        {isPending && (
          <div className="rounded-5 bg-bg-2/80 absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm">
            <LoadingSpinner size="md" text="템플릿을 저장하고 있어요" />
          </div>
        )}
        <header className="border-line-2 flex shrink-0 items-center justify-between border-b px-6 py-5">
          <div>
            <h2 className="text-text-1 typo-h2-heading">템플릿으로 저장</h2>
            <p className="text-text-3 typo-caption-normal mt-0.5">
              이 테스트 케이스를 템플릿으로 저장합니다.
            </p>
          </div>
          <DSButton variant="ghost" size="small" onClick={onClose} className="p-2">
            <X className="h-5 w-5" />
          </DSButton>
        </header>

        <form
          id="save-as-template-form"
          onSubmit={onSubmit}
          className="flex flex-1 flex-col gap-5 p-6"
          noValidate
        >
          <DsFormField.Root error={errors.name}>
            <DsFormField.Label className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              템플릿 이름 <span className="text-system-red">*</span>
            </DsFormField.Label>
            <DsFormField.Control asChild>
              <DsInput
                {...register('name')}
                variant={errors.name ? 'error' : 'default'}
                placeholder="예: 로그인 테스트 템플릿"
              />
            </DsFormField.Control>
            <DsFormField.Message />
          </DsFormField.Root>

          <DsFormField.Root error={errors.description}>
            <DsFormField.Label className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              설명
            </DsFormField.Label>
            <DsFormField.Control asChild>
              <DsInput
                {...register('description')}
                variant={errors.description ? 'error' : 'default'}
                placeholder="템플릿에 대한 간단한 설명"
              />
            </DsFormField.Control>
            <DsFormField.Message />
          </DsFormField.Root>
        </form>

        <div className="border-line-2 flex shrink-0 justify-end gap-3 border-t px-6 py-4">
          <DSButton type="button" variant="ghost" onClick={onClose} disabled={isPending}>
            취소
          </DSButton>
          <DSButton type="submit" form="save-as-template-form" variant="solid" disabled={isPending}>
            {isPending ? '저장 중...' : '템플릿으로 저장'}
          </DSButton>
        </div>
      </section>
    </div>
  );
};
