'use client';

import { useState } from 'react';

import { aiConfigQueryOptions } from '@/entities/ai-config';
import { aiUsageQueryOptions } from '@/entities/ai-usage';
import type { GeneratedScenario, RequirementAnalysis } from '@/entities/requirement-analysis';
import { saveRequirementAnalysis } from '@/entities/requirement-analysis/api/server-actions';
import { AttachmentDropzone } from '@/shared/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog } from '@testea/ui';
import { DSButton } from '@testea/ui';
import { Bot, Loader2, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';

import { RequirementAnalysisForm } from './requirement-analysis-form';
import { RequirementAnalysisPreview } from './requirement-analysis-preview';
import { RequirementAnalysisSpinner } from './requirement-analysis-spinner';

type Props = {
  projectId: string;
  onClose: () => void;
};

type Step = 'input' | 'loading' | 'preview';

type AttachmentMeta = { type: 'pdf' | 'markdown'; charCount: number };

export const RequirementAnalysisModal = ({ projectId, onClose }: Props) => {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>('input');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState<'ko' | 'en'>('ko');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<RequirementAnalysis | null>(null);
  const [scenarios, setScenarios] = useState<GeneratedScenario[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [attachmentMeta, setAttachmentMeta] = useState<AttachmentMeta | null>(null);

  const { data: configData } = useQuery(aiConfigQueryOptions(projectId));
  const hasConfig = configData?.success && !!configData.data;

  const { data: usageData } = useQuery(aiUsageQueryOptions(projectId));
  const usage = usageData?.success ? usageData.data : null;
  const isLimitExceeded = usage ? usage.used >= usage.limit : false;

  // 분석 요청 (첨부가 있으면 multipart, 없으면 JSON)
  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = attachment
        ? await fetch('/api/ai/analyze-requirements', {
            method: 'POST',
            body: (() => {
              const fd = new FormData();
              fd.set('projectId', projectId);
              fd.set('description', description);
              fd.set('language', language);
              fd.set('file', attachment);
              return fd;
            })(),
          })
        : await fetch('/api/ai/analyze-requirements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectId, description, language }),
          });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '분석에 실패했습니다.');
      return {
        analysis: data.analysis as RequirementAnalysis,
        scenarios: data.scenarios as GeneratedScenario[],
        attachment: data.attachment as {
          type: 'pdf' | 'markdown';
          truncated: boolean;
          charCount: number;
        } | null,
      };
    },
    onMutate: () => setStep('loading'),
    onSuccess: ({ analysis: resultAnalysis, scenarios: resultScenarios, attachment: meta }) => {
      setAnalysis(resultAnalysis);
      setScenarios(resultScenarios);
      setSelected(new Set(resultScenarios.map((_, i) => i)));
      setAttachmentMeta(meta ? { type: meta.type, charCount: meta.charCount } : null);
      if (meta?.truncated) {
        const typeLabel = meta.type === 'pdf' ? 'PDF' : 'Markdown';
        toast.warning(
          `${typeLabel} 첨부가 ${meta.charCount.toLocaleString()}자에서 잘려 뒷부분은 분석되지 않았어요.`
        );
      }
      queryClient.invalidateQueries({ queryKey: ['ai-usage'] });
      setStep('preview');
    },
    onError: (error: Error) => {
      toast.error(error.message);
      setStep('input');
    },
  });

  // 분석서 + 선택 시나리오 저장
  const saveMutation = useMutation({
    mutationFn: () => {
      if (!analysis) throw new Error('분석 결과가 없습니다.');
      return saveRequirementAnalysis({
        projectId,
        // 첨부만 있고 설명이 비면(생성은 허용) 저장 스키마 sourceInput min(1) 위반이라, 첨부 기반 마커로 채운다.
        sourceInput:
          description.trim() || `첨부 문서 기반 분석${attachment ? ` (${attachment.name})` : ''}`,
        language,
        analysis,
        scenarios,
        selectedScenarioIndices: Array.from(selected),
        attachment: attachmentMeta,
      });
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`${result.data.suiteCount}개의 시나리오가 스위트로 저장되었습니다.`);
        queryClient.invalidateQueries({ queryKey: ['requirementAnalyses', projectId] });
        // 스위트 목록 쿼리 키는 ['testSuites', 'list', projectId] (testSuiteQueryKeys.list).
        queryClient.invalidateQueries({ queryKey: ['testSuites', 'list', projectId] });
        queryClient.invalidateQueries({ queryKey: ['testCases'] });
        onClose();
      } else {
        const msg = Object.values(result.errors).flat().join(', ');
        toast.error(msg);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || '저장 중 오류가 발생했습니다.');
    },
  });

  const toggleAll = () => {
    if (selected.size === scenarios.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(scenarios.map((_, i) => i)));
    }
  };

  const toggleOne = (idx: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  return (
    <Dialog.Root defaultOpen>
      <Dialog.Portal>
        <Dialog.Overlay onClick={step !== 'loading' ? onClose : undefined} />
        <Dialog.Content className="bg-bg-2 border-line-2 rounded-5 flex max-h-[85vh] w-full max-w-[720px] flex-col border p-0">
          {/* 헤더 */}
          <div className="border-line-2 flex items-center justify-between border-b px-6 py-4">
            <Dialog.Title className="typo-h2-heading text-text-1">AI 요구사항 분석</Dialog.Title>
            {step !== 'loading' && (
              <button
                type="button"
                onClick={onClose}
                aria-label="닫기"
                className="text-text-4 hover:text-text-2 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* 콘텐츠 */}
          <div className="flex-1 overflow-y-auto p-6">
            {!hasConfig ? (
              <div className="flex flex-col items-center gap-4 py-10 text-center">
                <div className="bg-primary/10 flex h-14 w-14 items-center justify-center rounded-full">
                  <Bot className="text-primary h-7 w-7" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="typo-body1-heading text-text-1">API 키가 필요합니다</p>
                  <p className="typo-body2-normal text-text-3">
                    설정 페이지에서 OpenAI 또는 Anthropic API 키를 등록해주세요.
                  </p>
                </div>
                <DSButton variant="solid" size="small" onClick={onClose}>
                  확인
                </DSButton>
              </div>
            ) : step === 'input' ? (
              <>
                {usage && (
                  <div className="border-line-2 bg-bg-3 mb-4 flex items-center justify-between rounded-lg border px-4 py-2.5">
                    <span className="typo-body2-normal text-text-3">이번 달 사용량</span>
                    <span
                      className={`typo-body2-heading ${isLimitExceeded ? 'text-error' : 'text-text-1'}`}
                    >
                      {usage.used}/{usage.limit}건
                    </span>
                  </div>
                )}
                {isLimitExceeded && (
                  <div className="border-error/30 bg-error/5 mb-4 rounded-lg border px-4 py-3">
                    <p className="typo-body2-normal text-error">
                      이번 달 사용 한도를 초과했습니다. 다음 달에 다시 이용해주세요.
                    </p>
                  </div>
                )}
                <RequirementAnalysisForm
                  description={description}
                  onDescriptionChange={setDescription}
                  language={language}
                  onLanguageChange={setLanguage}
                  hasAttachment={!!attachment}
                />
                <div className="mt-4 flex flex-col gap-2">
                  <label className="typo-label-heading text-text-2">참고 문서 첨부 (선택)</label>
                  <AttachmentDropzone
                    file={attachment}
                    onChange={setAttachment}
                    disabled={generateMutation.isPending}
                  />
                </div>
              </>
            ) : step === 'loading' ? (
              <RequirementAnalysisSpinner />
            ) : analysis ? (
              <RequirementAnalysisPreview
                analysis={analysis}
                scenarios={scenarios}
                selected={selected}
                onToggleAll={toggleAll}
                onToggleOne={toggleOne}
              />
            ) : null}
          </div>

          {/* 푸터 */}
          {hasConfig && step !== 'loading' && (
            <div className="border-line-2 flex items-center justify-between border-t px-6 py-4">
              {step === 'preview' && (
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="typo-body2-normal text-text-3 hover:text-text-1 transition-colors"
                >
                  ← 다시 입력
                </button>
              )}
              <div className="flex-1" />
              <div className="flex gap-2">
                <DSButton variant="ghost" size="small" onClick={onClose}>
                  취소
                </DSButton>
                {step === 'input' ? (
                  <DSButton
                    variant="solid"
                    size="small"
                    onClick={() => generateMutation.mutate()}
                    disabled={
                      (!attachment && description.trim().length < 20) ||
                      generateMutation.isPending ||
                      isLimitExceeded
                    }
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      분석하기
                    </span>
                  </DSButton>
                ) : step === 'preview' ? (
                  <DSButton
                    variant="solid"
                    size="small"
                    onClick={() => saveMutation.mutate()}
                    disabled={selected.size === 0 || saveMutation.isPending}
                  >
                    {saveMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      `${selected.size}개 스위트로 저장`
                    )}
                  </DSButton>
                ) : null}
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
