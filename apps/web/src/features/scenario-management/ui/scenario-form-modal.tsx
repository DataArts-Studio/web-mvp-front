'use client';

import { type KeyboardEvent, useState } from 'react';

import {
  type ScenarioListItem,
  type ScenarioStatus,
  type ScenarioType,
  createScenario,
  updateScenario,
} from '@/entities/test-scenario';
import { PromptTextarea } from '@/shared/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DSButton, Dialog } from '@testea/ui';
import { cn } from '@testea/util';
import { Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

import { SCENARIO_STATUS_OPTIONS, SCENARIO_TYPE_OPTIONS } from '../model/scenario-meta';

type Props = {
  projectId: string;
  /** 지정 시 수정 모드, 없으면 수동 추가 모드. */
  scenario?: ScenarioListItem;
  /** 수동 추가 시 연결할 출처 분석서(선택). */
  requirementAnalysisId?: string | null;
  onClose: () => void;
  onSaved: () => void;
};

const ChoiceGroup = <T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) => (
  <div className="flex flex-wrap gap-2">
    {options.map((opt) => (
      <button
        key={opt.value}
        type="button"
        onClick={() => onChange(opt.value)}
        className={cn(
          'typo-caption rounded-full px-3 py-1 transition-colors',
          value === opt.value
            ? 'bg-primary/10 text-primary'
            : 'bg-bg-3 text-text-3 hover:text-text-1'
        )}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

export const ScenarioFormModal = ({
  projectId,
  scenario,
  requirementAnalysisId,
  onClose,
  onSaved,
}: Props) => {
  const queryClient = useQueryClient();
  const isEdit = !!scenario;

  const [name, setName] = useState(scenario?.name ?? '');
  const [description, setDescription] = useState(scenario?.description ?? '');
  const [type, setType] = useState<ScenarioType>(scenario?.type ?? 'positive');
  const [status, setStatus] = useState<ScenarioStatus>(scenario?.status ?? 'DRAFT');
  const [relatedInput, setRelatedInput] = useState(
    (scenario?.relatedRequirementIds ?? []).join(', ')
  );

  const parseRelated = () =>
    relatedInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 20);

  const mutation = useMutation({
    mutationFn: () => {
      const relatedRequirementIds = parseRelated();
      if (isEdit) {
        return updateScenario({
          projectId,
          id: scenario!.id,
          name: name.trim(),
          description,
          type,
          status,
          relatedRequirementIds,
        });
      }
      return createScenario({
        projectId,
        requirementAnalysisId: requirementAnalysisId ?? null,
        name: name.trim(),
        description,
        type,
        status,
        relatedRequirementIds,
      });
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(isEdit ? '시나리오를 수정했습니다.' : '시나리오를 추가했습니다.');
        queryClient.invalidateQueries({ queryKey: ['scenarios'] });
        onSaved();
        onClose();
      } else {
        toast.error(Object.values(result.errors).flat().join(', '));
      }
    },
    onError: (error: Error) => toast.error(error.message || '저장 중 오류가 발생했습니다.'),
  });

  const canSubmit = name.trim().length > 0 && !mutation.isPending;
  const submit = () => {
    if (canSubmit) mutation.mutate();
  };
  const onInputEnter = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  };

  return (
    <Dialog.Root defaultOpen>
      <Dialog.Portal>
        <Dialog.Overlay onClick={onClose} />
        <Dialog.Content className="bg-bg-2 border-line-2 rounded-5 flex max-h-[85vh] w-full max-w-[560px] flex-col border p-0">
          <div className="border-line-2 flex items-center justify-between border-b px-6 py-4">
            <Dialog.Title className="typo-h2-heading text-text-1">
              {isEdit ? '시나리오 수정' : '새 시나리오'}
            </Dialog.Title>
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="text-text-4 hover:text-text-2 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
            <div className="flex flex-col gap-2">
              <label className="typo-label-heading text-text-2">시나리오 이름</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={onInputEnter}
                placeholder="예: 이메일로 정상 회원가입"
                maxLength={200}
                className="typo-body2-normal bg-bg-1 text-text-1 placeholder:text-text-4 rounded-3 border-line-2 focus:border-primary border p-3 focus:outline-none"
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="typo-label-heading text-text-2">설명</label>
              <PromptTextarea
                value={description}
                onValueChange={setDescription}
                onSubmit={submit}
                placeholder="시나리오 흐름·상황을 설명하세요. (선택)"
                minRows={4}
                maxLength={2000}
                aria-label="시나리오 설명"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="typo-label-heading text-text-2">유형</label>
              <ChoiceGroup value={type} options={SCENARIO_TYPE_OPTIONS} onChange={setType} />
            </div>

            <div className="flex flex-col gap-2">
              <label className="typo-label-heading text-text-2">상태</label>
              <ChoiceGroup value={status} options={SCENARIO_STATUS_OPTIONS} onChange={setStatus} />
            </div>

            <div className="flex flex-col gap-2">
              <label className="typo-label-heading text-text-2">연관 요구사항 ID (선택)</label>
              <input
                value={relatedInput}
                onChange={(e) => setRelatedInput(e.target.value)}
                onKeyDown={onInputEnter}
                placeholder="쉼표로 구분. 예: FR-1, FR-2"
                className="typo-body2-normal bg-bg-1 text-text-1 placeholder:text-text-4 rounded-3 border-line-2 focus:border-primary border p-3 focus:outline-none"
              />
            </div>
          </div>

          <div className="border-line-2 flex items-center justify-end gap-2 border-t px-6 py-4">
            <DSButton variant="ghost" size="small" onClick={onClose}>
              취소
            </DSButton>
            <DSButton
              variant="solid"
              size="small"
              onClick={() => mutation.mutate()}
              disabled={!canSubmit}
            >
              {mutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isEdit ? (
                '저장'
              ) : (
                '추가'
              )}
            </DSButton>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
