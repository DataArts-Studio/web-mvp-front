'use client';

import React, { useMemo, useState } from 'react';

import Link from 'next/link';

import { type RunAutomatedTestData } from '@/features/auto-run';
import { useRunAutomatedTest } from '@/features/auto-run';
import { useTargetSites } from '@/features/target-sites';
import { DSButton, Dialog, DsInput, DsSelect } from '@testea/ui';
import { cn } from '@testea/util';
import { AlertTriangle, CheckCircle2, ChevronDown, Loader2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface AutoRunCaseOption {
  /** testCaseRun 의 원본 케이스 id (= caseId, runAutomatedTest 입력). */
  testCaseId: string;
  code: string;
  title: string;
}

interface AutoRunDialogProps {
  projectId: string | undefined;
  projectSlug: string;
  runId: string;
  cases: AutoRunCaseOption[];
  /** 단건 트리거(행 액션)로 진입 시 미리 선택된 케이스. */
  initialCaseId?: string;
  onClose: () => void;
}

const STATUS_LABEL: Record<string, string> = {
  passed: '통과',
  failed: '실패',
  timedOut: '시간 초과',
};

export const AutoRunDialog = ({
  projectId,
  projectSlug,
  runId,
  cases,
  initialCaseId,
  onClose,
}: AutoRunDialogProps) => {
  const { data: targetSitesData, isLoading: isLoadingTargets } = useTargetSites(projectId);
  const targetSites = useMemo(
    () => (targetSitesData?.success ? targetSitesData.data : []),
    [targetSitesData]
  );

  const runAutomatedTest = useRunAutomatedTest(projectId);

  const [targetSiteId, setTargetSiteId] = useState('');
  const [caseId, setCaseId] = useState(initialCaseId ?? cases[0]?.testCaseId ?? '');
  const [path, setPath] = useState('');
  const [result, setResult] = useState<RunAutomatedTestData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSpec, setShowSpec] = useState(false);

  const targetOptions = useMemo(
    () => targetSites.map((site) => ({ value: site.id, label: `${site.name} (${site.baseUrl})` })),
    [targetSites]
  );

  const caseOptions = useMemo(
    () => cases.map((c) => ({ value: c.testCaseId, label: `${c.code}  ${c.title}` })),
    [cases]
  );

  const noTargets = !isLoadingTargets && targetSites.length === 0;
  const isPending = runAutomatedTest.isPending;
  const canSubmit = !!projectId && !!targetSiteId && !!caseId && !isPending;

  const handleSubmit = () => {
    if (!projectId || !targetSiteId || !caseId) return;
    setResult(null);
    setErrorMessage(null);
    setShowSpec(false);
    runAutomatedTest.mutate(
      { projectId, runId, caseId, targetSiteId, path: path.trim() || undefined },
      {
        onSuccess: (data) => {
          setResult(data);
          if (data.status === 'passed') {
            toast.success('자동 실행이 통과했습니다.');
          } else {
            toast.error(`자동 실행 결과: ${STATUS_LABEL[data.status] ?? data.status}`);
          }
        },
        onError: (error) =>
          setErrorMessage(error instanceof Error ? error.message : '자동 실행에 실패했습니다.'),
      }
    );
  };

  return (
    <Dialog.Root
      defaultOpen
      onOpenChange={(open) => {
        if (!open && !isPending) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content className="bg-bg-1 rounded-8 max-h-[85vh] w-full max-w-lg overflow-y-auto p-6 shadow-xl">
          <Dialog.Title className="text-text-1 text-lg font-semibold">자동 실행</Dialog.Title>
          <Dialog.Description className="text-text-3 mt-2 text-sm">
            등록된 테스트 대상에 대해 케이스 단계를 자동으로 실행하고 결과를 이 실행에 기록합니다.
            대상 페이지 캡처와 실행에 수 초에서 수십 초가 걸릴 수 있습니다.
          </Dialog.Description>

          {noTargets ? (
            <div className="border-line-2 bg-bg-2 rounded-4 mt-5 border p-4">
              <div className="text-text-2 flex items-start gap-2 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                <p>등록된 테스트 대상이 없습니다. 설정에서 테스트 대상을 먼저 등록하세요.</p>
              </div>
              <div className="mt-4 flex justify-end gap-3">
                <DSButton variant="ghost" onClick={onClose}>
                  닫기
                </DSButton>
                <Link href={`/projects/${projectSlug}/settings`}>
                  <DSButton variant="solid">설정으로 이동</DSButton>
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {/* 대상 사이트 */}
              <div className="space-y-1.5">
                <label className="text-text-2 text-sm font-medium">대상 사이트</label>
                <DsSelect
                  value={targetSiteId}
                  onChange={setTargetSiteId}
                  options={targetOptions}
                  placeholder={isLoadingTargets ? '불러오는 중...' : '대상 사이트를 선택하세요'}
                  disabled={isLoadingTargets || isPending}
                />
              </div>

              {/* 케이스 */}
              <div className="space-y-1.5">
                <label className="text-text-2 text-sm font-medium">실행할 케이스</label>
                <DsSelect
                  value={caseId}
                  onChange={setCaseId}
                  options={caseOptions}
                  placeholder="케이스를 선택하세요"
                  disabled={isPending}
                />
              </div>

              {/* 경로 (선택) */}
              <div className="space-y-1.5">
                <label className="text-text-2 text-sm font-medium">
                  경로 <span className="text-text-4 font-normal">(선택)</span>
                </label>
                <DsInput
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  placeholder="/dashboard (비우면 대상 URL 루트)"
                  disabled={isPending}
                />
              </div>

              {/* 진행 중 안내 */}
              {isPending && (
                <div className="text-text-3 flex items-center gap-2 text-sm">
                  <Loader2 className="text-primary h-4 w-4 animate-spin" />
                  <span>자동 실행 중입니다. 페이지를 벗어나지 마세요...</span>
                </div>
              )}

              {/* 에러 결과 */}
              {errorMessage && (
                <div className="rounded-4 border border-red-500/30 bg-red-500/10 p-3">
                  <div className="flex items-start gap-2 text-sm text-red-400">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p className="break-words">{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* 성공/실행 결과 */}
              {result && (
                <div className="border-line-2 bg-bg-2 rounded-4 space-y-3 border p-3">
                  <ResultStatus status={result.status} durationMs={result.durationMs} />

                  {result.status !== 'passed' && result.errorMessage && (
                    <div className="border-line-2 bg-bg-1 rounded-2 border p-2">
                      <p className="text-text-4 text-xs font-medium">실패 메시지</p>
                      <p className="text-text-2 mt-1 text-xs break-words whitespace-pre-wrap">
                        {result.errorMessage}
                      </p>
                    </div>
                  )}

                  {!result.recorded && (
                    <div className="text-text-3 flex items-start gap-1.5 text-xs">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                      <span>
                        case_key &quot;{result.caseKey}&quot; 가 이 실행의 케이스와 매칭되지 않아
                        결과가 기록되지 않았습니다.
                      </span>
                    </div>
                  )}

                  {/* spec 미리보기 (접기/펼치기) */}
                  {result.specPreview && (
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowSpec((prev) => !prev)}
                        className="text-text-3 hover:text-text-1 flex items-center gap-1 text-xs transition-colors"
                      >
                        <ChevronDown
                          className={cn(
                            'h-3.5 w-3.5 transition-transform',
                            showSpec && 'rotate-180'
                          )}
                        />
                        생성된 spec 미리보기
                      </button>
                      {showSpec && (
                        <pre className="border-line-2 bg-bg-1 rounded-2 text-text-2 mt-2 max-h-48 overflow-auto border p-2 text-[11px] leading-relaxed">
                          {result.specPreview}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-1">
                <DSButton variant="ghost" onClick={onClose} disabled={isPending}>
                  {result || errorMessage ? '닫기' : '취소'}
                </DSButton>
                <DSButton variant="solid" onClick={handleSubmit} disabled={!canSubmit}>
                  {isPending ? '실행 중...' : result || errorMessage ? '다시 실행' : '자동 실행'}
                </DSButton>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

const ResultStatus = ({ status, durationMs }: { status: string; durationMs: number }) => {
  const passed = status === 'passed';
  const label = STATUS_LABEL[status] ?? status;
  return (
    <div className="flex items-center gap-2 text-sm">
      {passed ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" />
      ) : (
        <XCircle className="h-4 w-4 shrink-0 text-red-400" />
      )}
      <span className={cn('font-medium', passed ? 'text-green-400' : 'text-red-400')}>{label}</span>
      <span className="text-text-4 text-xs">· {(durationMs / 1000).toFixed(1)}초</span>
    </div>
  );
};
