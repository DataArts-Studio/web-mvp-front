'use client';

import React, { useState } from 'react';

import { useApproveCaseSpec, useCaseSpec, useRevokeCaseSpecApproval } from '@/features/auto-run';
import { DSButton } from '@testea/ui';
import { cn } from '@testea/util';
import { BadgeCheck, ChevronDown, FileCode2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AutoRunSpecReviewProps {
  projectId: string | undefined;
  caseId: string;
  targetSiteId: string;
  /** 자동 실행 중에는 승인 상태를 바꾸지 못하게 막는다. */
  disabled: boolean;
}

/**
 * 자동 실행 모달의 실행 코드 검수 영역(#187).
 * 승인된 코드가 있으면 다음 실행부터 새로 생성하지 않고 그 코드를 쓴다.
 */
export const AutoRunSpecReview = ({
  projectId,
  caseId,
  targetSiteId,
  disabled,
}: AutoRunSpecReviewProps) => {
  const key = { projectId, caseId, targetSiteId };
  const { data: stored, isLoading, isError } = useCaseSpec(key);
  const [open, setOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="text-text-4 flex items-center gap-1.5 text-xs">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        저장된 실행 코드를 확인하는 중...
      </div>
    );
  }
  // 조회 실패는 실행 자체를 막을 이유가 아니므로 안내만 하고 넘어간다.
  if (isError) {
    return <p className="text-text-4 text-xs">저장된 실행 코드를 불러오지 못했습니다.</p>;
  }

  if (!stored) {
    return (
      <p className="text-text-4 text-xs">
        저장된 실행 코드가 없습니다. 실행하면 코드를 새로 만들고 검수할 수 있도록 저장합니다.
      </p>
    );
  }

  const approved = stored.status === 'approved';

  return (
    <div className="border-line-2 rounded-4 border p-3">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="flex items-center gap-1.5 text-sm">
          {approved ? (
            <BadgeCheck className="h-4 w-4 shrink-0 text-green-400" />
          ) : (
            <FileCode2 className="text-text-3 h-4 w-4 shrink-0" />
          )}
          <span className="text-text-2 font-medium">
            {approved ? '승인된 실행 코드' : '검수 전 실행 코드'}
          </span>
        </span>
        <ChevronDown
          className={cn('text-text-3 h-4 w-4 transition-transform', open && 'rotate-180')}
        />
      </button>
      <p className="text-text-4 mt-1 text-xs">
        {approved
          ? '이 코드로 실행합니다. 화면이 바뀌어 다시 만들어야 하면 승인을 해제하세요.'
          : '실행할 때마다 새로 만듭니다. 확인하고 승인하면 다음부터 이 코드로 실행합니다.'}
      </p>
      {open && (
        // 저장본이 바뀌면 편집 내용을 새 저장본으로 초기화한다.
        <SpecEditor
          key={`${stored.status}:${new Date(stored.updatedAt).getTime()}`}
          initialSpec={stored.spec}
          approved={approved}
          disabled={disabled}
          specKey={key}
        />
      )}
    </div>
  );
};

const SpecEditor = ({
  initialSpec,
  approved,
  disabled,
  specKey,
}: {
  initialSpec: string;
  approved: boolean;
  disabled: boolean;
  specKey: { projectId: string | undefined; caseId: string; targetSiteId: string };
}) => {
  const [spec, setSpec] = useState(initialSpec);
  const approve = useApproveCaseSpec(specKey);
  const revoke = useRevokeCaseSpecApproval(specKey);
  const busy = disabled || approve.isPending || revoke.isPending;
  const edited = spec !== initialSpec;

  const handleApprove = () =>
    approve.mutate(spec, {
      onSuccess: () =>
        toast.success(approved ? '수정한 코드를 저장했습니다.' : '실행 코드를 승인했습니다.'),
      onError: (error) => toast.error(error.message),
    });

  const handleRevoke = () =>
    revoke.mutate(undefined, {
      onSuccess: () => toast.success('승인을 해제했습니다. 다음 실행부터 코드를 새로 만듭니다.'),
      onError: (error) => toast.error(error.message),
    });

  return (
    <div className="mt-3 space-y-2">
      <textarea
        aria-label="실행 코드"
        value={spec}
        onChange={(e) => setSpec(e.target.value)}
        disabled={busy}
        spellCheck={false}
        className="border-line-2 bg-bg-1 rounded-2 text-text-2 h-56 w-full resize-y border p-2 font-mono text-[11px] leading-relaxed"
      />
      <div className="flex justify-end gap-2">
        {approved && (
          <DSButton variant="ghost" onClick={handleRevoke} disabled={busy}>
            승인 해제
          </DSButton>
        )}
        {(!approved || edited) && (
          <DSButton variant="solid" onClick={handleApprove} disabled={busy}>
            {approved ? '수정 저장' : edited ? '수정해서 승인' : '승인'}
          </DSButton>
        )}
      </div>
    </div>
  );
};
