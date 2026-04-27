'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';

import { useDeleteProject } from '@/features/project-settings';
import { Dialog } from '@/shared/lib/primitives';
import { DSButton, DsInput, SettingsCard } from '@/shared/ui';

// ─── Section: Danger Zone ────────────────────────────────────────────────────

export const DangerZoneSection = ({ projectId, projectName }: { projectId: string; projectName: string }) => {
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
            toast.error(Object.values(result.errors).flat().join(', '));
            setIsDialogOpen(false);
          }
        },
      },
    );
  };

  return (
    <>
      <SettingsCard.Root variant="danger">
        <SettingsCard.Header
          icon={<AlertTriangle className="h-5 w-5" />}
          title="위험 영역"
          description="이 영역의 작업은 되돌릴 수 없습니다."
          variant="danger"
        />
        <SettingsCard.Divider variant="danger" />
        <SettingsCard.Body className="flex items-center justify-between">
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
        </SettingsCard.Body>
      </SettingsCard.Root>

      {isDialogOpen && (
        <Dialog.Root defaultOpen>
          <Dialog.Portal>
            <Dialog.Overlay onClick={() => !deleteProject.isPending && setIsDialogOpen(false)} />
            <Dialog.Content className="bg-bg-2 border-line-2 rounded-5 w-full max-w-[460px] border p-0">
              <div className="flex items-center gap-3 border-b border-line-2 px-6 py-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/10">
                  <Trash2 className="h-4 w-4 text-red-400" />
                </div>
                <Dialog.Title className="typo-h2-heading text-text-1">
                  프로젝트 삭제
                </Dialog.Title>
              </div>

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
