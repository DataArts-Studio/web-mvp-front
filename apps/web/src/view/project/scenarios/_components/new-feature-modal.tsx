'use client';

import { type KeyboardEvent, useState } from 'react';

import { createFeature } from '@/entities/requirement-analysis';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DSButton, Dialog } from '@testea/ui';
import { Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

type Props = {
  projectId: string;
  onClose: () => void;
  onCreated: (featureId: string) => void;
};

export const NewFeatureModal = ({ projectId, onClose, onCreated }: Props) => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');

  const mutation = useMutation({
    mutationFn: () => createFeature({ projectId, title: title.trim() }),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('기능을 만들었습니다.');
        queryClient.invalidateQueries({ queryKey: ['scenarioFeatures', projectId] });
        queryClient.invalidateQueries({ queryKey: ['requirementAnalyses', projectId] });
        onCreated(result.data.id);
      } else {
        toast.error(Object.values(result.errors).flat().join(', '));
      }
    },
    onError: (error: Error) => toast.error(error.message || '생성 중 오류가 발생했습니다.'),
  });

  const canSubmit = title.trim().length > 0 && !mutation.isPending;
  const submit = () => {
    if (canSubmit) mutation.mutate();
  };

  return (
    <Dialog.Root defaultOpen>
      <Dialog.Portal>
        <Dialog.Overlay onClick={onClose} />
        <Dialog.Content className="bg-bg-2 border-line-2 rounded-5 flex w-full max-w-[480px] flex-col border p-0">
          <div className="border-line-2 flex items-center justify-between border-b px-6 py-4">
            <Dialog.Title className="typo-h2-heading text-text-1">새 기능</Dialog.Title>
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="text-text-4 hover:text-text-2 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-col gap-2 p-6">
            <label className="typo-label-heading text-text-2">기능 이름</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e: KeyboardEvent) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder="예: 회원가입, 결제, 알림"
              maxLength={200}
              className="typo-body2-normal bg-bg-1 text-text-1 placeholder:text-text-4 rounded-3 border-line-2 focus:border-primary border p-3 focus:outline-none"
              autoFocus
            />
            <p className="typo-caption text-text-4">
              기능을 만든 뒤 그 안에서 시나리오를 추가하거나 AI로 생성할 수 있어요.
            </p>
          </div>

          <div className="border-line-2 flex items-center justify-end gap-2 border-t px-6 py-4">
            <DSButton variant="ghost" size="small" onClick={onClose}>
              취소
            </DSButton>
            <DSButton variant="solid" size="small" onClick={submit} disabled={!canSubmit}>
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : '만들기'}
            </DSButton>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
