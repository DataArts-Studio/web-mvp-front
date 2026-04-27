'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Link2, Copy, Trash2, RefreshCw, Loader2, ExternalLink } from 'lucide-react';
import { Dialog } from '@testea/ui';
import { DSButton } from '@/shared';
import { generateShareLink, revokeShareLink } from '../api/share-actions';

interface ShareModalProps {
  testRunId: string;
  shareToken: string | null;
  shareExpiresAt: string | Date | null;
  onClose: () => void;
}

type ShareState = 'none' | 'active' | 'expired';

function getShareState(token: string | null, expiresAt: string | Date | null): ShareState {
  if (!token) return 'none';
  if (!expiresAt) return 'expired';
  const expDate = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  if (expDate < new Date()) return 'expired';
  return 'active';
}

function getShareUrl(token: string): string {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/share/runs/${token}`;
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export const ShareModal = ({ testRunId, shareToken, shareExpiresAt, onClose }: ShareModalProps) => {
  const queryClient = useQueryClient();
  const [currentToken, setCurrentToken] = useState(shareToken);
  const [currentExpiresAt, setCurrentExpiresAt] = useState<string | Date | null>(shareExpiresAt);

  const shareState = getShareState(currentToken, currentExpiresAt);

  const generateMutation = useMutation({
    mutationFn: () => generateShareLink(testRunId),
    onSuccess: (result) => {
      if (result.success) {
        setCurrentToken(result.data.token);
        setCurrentExpiresAt(result.data.expiresAt);
        queryClient.invalidateQueries({ queryKey: ['testRun', testRunId] });
        toast.success('공유 링크가 생성되었습니다.');
      } else {
        toast.error(result.errors._general?.[0] || '공유 링크 생성에 실패했습니다.');
      }
    },
    onError: (error) => {
      console.error('[ShareModal] generateShareLink error:', error);
      toast.error('공유 링크 생성 중 오류가 발생했습니다.');
    },
  });

  const revokeMutation = useMutation({
    mutationFn: () => revokeShareLink(testRunId),
    onSuccess: (result) => {
      if (result.success) {
        setCurrentToken(null);
        setCurrentExpiresAt(null);
        queryClient.invalidateQueries({ queryKey: ['testRun', testRunId] });
        toast.success('공유 링크가 해제되었습니다.');
      } else {
        toast.error(result.errors._general?.[0] || '공유 해제에 실패했습니다.');
      }
    },
    onError: (error) => {
      console.error('[ShareModal] revokeShareLink error:', error);
      toast.error('공유 해제 중 오류가 발생했습니다.');
    },
  });

  const isPending = generateMutation.isPending || revokeMutation.isPending;

  const handleCopy = async () => {
    if (!currentToken) return;
    try {
      await navigator.clipboard.writeText(getShareUrl(currentToken));
      toast.success('링크가 클립보드에 복사되었습니다.');
    } catch {
      toast.error('복사에 실패했습니다.');
    }
  };

  return (
    <Dialog.Root defaultOpen>
      <Dialog.Portal>
        <Dialog.Overlay onClick={!isPending ? onClose : undefined} />
        <Dialog.Content className="bg-bg-2 border-line-2 w-[440px] rounded-2xl border p-6 shadow-xl">
          <Dialog.Title className="text-text-1 mb-1 text-lg font-semibold">
            리포트 공유
          </Dialog.Title>
          <Dialog.Description className="text-text-3 mb-5 text-sm">
            고유 링크를 생성하여 비밀번호 없이 읽기 전용 요약 리포트를 공유할 수 있습니다.
          </Dialog.Description>

          {/* State: No share link */}
          {shareState === 'none' && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="bg-bg-3 flex h-12 w-12 items-center justify-center rounded-full">
                <Link2 className="text-text-3 h-6 w-6" />
              </div>
              <p className="text-text-2 text-center text-sm">
                공유 링크가 아직 생성되지 않았습니다.
              </p>
              <DSButton
                variant="solid"
                size="small"
                onClick={() => generateMutation.mutate()}
                disabled={isPending}
                className="flex items-center gap-2"
              >
                {generateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                공유 링크 생성
              </DSButton>
            </div>
          )}

          {/* State: Active share link */}
          {shareState === 'active' && currentToken && (
            <div className="flex flex-col gap-4">
              <div className="bg-bg-3 flex items-center gap-2 rounded-lg p-3">
                <input
                  type="text"
                  readOnly
                  value={getShareUrl(currentToken)}
                  className="bg-transparent text-text-1 flex-1 truncate text-sm outline-none"
                />
                <button
                  onClick={handleCopy}
                  className="text-text-3 hover:text-text-1 flex-shrink-0 transition-colors"
                  aria-label="링크 복사"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <a
                  href={getShareUrl(currentToken)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-3 hover:text-text-1 flex-shrink-0 transition-colors"
                  aria-label="새 탭에서 열기"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>

              {currentExpiresAt && (
                <p className="text-text-3 text-xs">
                  만료일: {formatDate(currentExpiresAt)}
                </p>
              )}

              <div className="flex justify-end gap-2">
                <DSButton
                  variant="text"
                  size="small"
                  onClick={() => revokeMutation.mutate()}
                  disabled={isPending}
                  className="flex items-center gap-1.5 !text-red-400"
                >
                  {revokeMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  공유 해제
                </DSButton>
              </div>
            </div>
          )}

          {/* State: Expired */}
          {shareState === 'expired' && currentToken && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="bg-amber-500/10 flex h-12 w-12 items-center justify-center rounded-full">
                <Link2 className="h-6 w-6 text-amber-400" />
              </div>
              <p className="text-text-2 text-center text-sm">
                공유 링크가 만료되었습니다.
              </p>
              <DSButton
                variant="solid"
                size="small"
                onClick={() => generateMutation.mutate()}
                disabled={isPending}
                className="flex items-center gap-2"
              >
                {generateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                새 링크 생성
              </DSButton>
            </div>
          )}

          {/* Close button */}
          <div className="mt-5 flex justify-end">
            <DSButton variant="ghost" size="small" onClick={onClose} disabled={isPending}>
              닫기
            </DSButton>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
