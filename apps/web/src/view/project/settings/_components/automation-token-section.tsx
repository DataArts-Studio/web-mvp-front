'use client';

import { useState } from 'react';

import {
  useAutomationTokenStatus,
  useIssueAutomationToken,
  useRevokeAutomationToken,
} from '@/features/automation-token';
import { DSButton, Dialog, SettingsCard } from '@testea/ui';
import { Bot, Copy, KeyRound, Loader2, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface AutomationTokenSectionProps {
  projectId: string;
}

/**
 * 프로젝트 설정 화면의 "자동화 토큰" 섹션 (FDD-TR09 V1).
 *
 * - 토큰 없음: 발급 버튼만
 * - 토큰 있음: prefix + 마지막 사용 시각 + 재발급/회수
 * - 발급 직후: 평문을 1회만 노출하는 모달
 * - 회수: 확인 다이얼로그
 */
export const AutomationTokenSection = ({ projectId }: AutomationTokenSectionProps) => {
  const statusQuery = useAutomationTokenStatus(projectId);
  const issueMutation = useIssueAutomationToken(projectId);
  const revokeMutation = useRevokeAutomationToken(projectId);

  const [issuedPlaintext, setIssuedPlaintext] = useState<string | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState(false);

  const status = statusQuery.data?.success ? statusQuery.data.data : null;
  const exists = !!status?.exists;

  const handleIssue = () => {
    issueMutation.mutate(undefined, {
      onSuccess: (result) => {
        if (result.success) {
          setIssuedPlaintext(result.data.plaintext);
          toast.success(result.message ?? '자동화 토큰이 발급되었습니다.');
        } else {
          toast.error(Object.values(result.errors).flat().join(', '));
        }
      },
    });
  };

  const handleRevoke = () => {
    revokeMutation.mutate(undefined, {
      onSuccess: (result) => {
        if (result.success) {
          toast.success('토큰이 회수되었습니다.');
          setConfirmRevoke(false);
        } else {
          toast.error(Object.values(result.errors).flat().join(', '));
        }
      },
    });
  };

  const handleCopyPlaintext = async () => {
    if (!issuedPlaintext) return;
    try {
      await navigator.clipboard.writeText(issuedPlaintext);
      toast.success('클립보드에 복사했습니다.');
    } catch {
      toast.error('복사에 실패했습니다. 토큰을 직접 선택해 복사하세요.');
    }
  };

  return (
    <>
      <SettingsCard.Root>
        <SettingsCard.Header
          icon={<Zap className="h-5 w-5" />}
          title="자동화 토큰"
          description="CI 에서 자동화 결과를 Test Run 에 보고할 때 사용하는 인증 토큰입니다."
        />
        <SettingsCard.Divider />

        <SettingsCard.Body className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            {!exists && (
              <>
                <span className="typo-body2-heading text-text-1">발급된 토큰 없음</span>
                <span className="typo-caption text-text-3">
                  자동화 결과를 보고하려면 토큰을 발급하세요. 발급 직후 1회만 노출됩니다.
                </span>
              </>
            )}
            {exists && status && (
              <>
                <span className="typo-body2-heading text-text-1 flex items-center gap-2">
                  <KeyRound className="h-4 w-4" aria-hidden="true" />
                  <code className="font-mono">{status.prefix}…</code>
                </span>
                <span className="typo-caption text-text-3">
                  {status.lastUsedAt
                    ? `마지막 사용: ${new Date(status.lastUsedAt).toLocaleString('ko-KR')}`
                    : '발급 후 아직 사용된 적 없음'}
                </span>
              </>
            )}
          </div>

          {!exists && (
            <DSButton
              variant="solid"
              size="small"
              onClick={handleIssue}
              disabled={issueMutation.isPending}
              className="shrink-0"
            >
              {issueMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  발급 중...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Bot className="h-3.5 w-3.5" />
                  토큰 발급
                </span>
              )}
            </DSButton>
          )}

          {exists && (
            <div className="flex shrink-0 gap-2">
              <DSButton
                variant="ghost"
                size="small"
                onClick={handleIssue}
                disabled={issueMutation.isPending || revokeMutation.isPending}
              >
                {issueMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    재발급 중...
                  </span>
                ) : (
                  '재발급'
                )}
              </DSButton>
              <DSButton
                variant="ghost"
                size="small"
                onClick={() => setConfirmRevoke(true)}
                disabled={revokeMutation.isPending}
              >
                회수
              </DSButton>
            </div>
          )}
        </SettingsCard.Body>
      </SettingsCard.Root>

      {/* 발급 직후 평문 노출 모달 (1회만)
          Dialog.Root 는 외부 onOpenChange 콜백을 지원하지 않으므로 외부 상태 정리는
          명시 close 버튼에서 setIssuedPlaintext(null) 로 처리한다.
          `key={issuedPlaintext}` 로 재발급 시마다 강제 re-mount 해 defaultOpen 이 적용되도록 한다. */}
      {issuedPlaintext && (
        <Dialog.Root key={issuedPlaintext} defaultOpen>
          <Dialog.Portal>
            <Dialog.Overlay
              className="animate-in fade-in"
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                zIndex: 1010,
              }}
            />
            <Dialog.Content
              className="bg-bg-2 w-full max-w-lg rounded-2xl p-6 shadow-2xl"
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 1011,
                outline: 'none',
              }}
            >
              <div className="flex flex-col gap-4">
                <Dialog.Title className="typo-h2-heading text-text-1">토큰 발급 완료</Dialog.Title>
                <Dialog.Description className="typo-body2-normal text-text-3">
                  아래 토큰은 <strong className="text-text-1">지금 한 번만</strong> 노출됩니다. 창을
                  닫으면 다시 볼 수 없으니 CI 시크릿에 저장하세요.
                </Dialog.Description>
                <div className="bg-bg-3 border-line-2 flex items-center gap-2 rounded-md border p-3">
                  <code className="typo-body2-normal text-text-1 flex-1 font-mono break-all">
                    {issuedPlaintext}
                  </code>
                  <DSButton
                    variant="ghost"
                    size="small"
                    onClick={handleCopyPlaintext}
                    className="shrink-0"
                    aria-label="토큰 복사"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </DSButton>
                </div>
                <DSButton
                  variant="solid"
                  size="medium"
                  className="w-full"
                  onClick={() => setIssuedPlaintext(null)}
                >
                  복사했음, 닫기
                </DSButton>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}

      {/* 회수 확인 다이얼로그 */}
      {confirmRevoke && (
        <Dialog.Root defaultOpen>
          <Dialog.Portal>
            <Dialog.Overlay
              className="animate-in fade-in"
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                zIndex: 1010,
              }}
            />
            <Dialog.Content
              className="bg-bg-2 w-full max-w-md rounded-2xl p-6 shadow-2xl"
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 1011,
                outline: 'none',
              }}
            >
              <div className="flex flex-col gap-4">
                <Dialog.Title className="typo-h2-heading text-text-1">
                  토큰을 회수할까요?
                </Dialog.Title>
                <Dialog.Description className="typo-body2-normal text-text-3">
                  회수 즉시 CI 에서 이 토큰으로 보내는 요청은 거부됩니다. 새 토큰을 발급해 CI
                  시크릿을 교체해야 합니다.
                </Dialog.Description>
                <div className="flex justify-end gap-2">
                  <DSButton
                    variant="ghost"
                    size="small"
                    onClick={() => setConfirmRevoke(false)}
                    disabled={revokeMutation.isPending}
                  >
                    취소
                  </DSButton>
                  <DSButton
                    variant="solid"
                    size="small"
                    onClick={handleRevoke}
                    disabled={revokeMutation.isPending}
                  >
                    {revokeMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        회수 중...
                      </span>
                    ) : (
                      '회수'
                    )}
                  </DSButton>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </>
  );
};
