'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Bot, Loader2, Sparkles, X } from 'lucide-react';

import { aiConfigQueryOptions } from '@/entities/ai-config';
import type { GeneratedTestCase } from '@/entities/ai-config';
import { saveGeneratedCases } from '@/entities/ai-config/api/server-actions';
import { testSuitesQueryOptions } from '@/widgets';
import { Dialog } from '@/shared/lib/primitives';
import { DSButton } from '@/shared/ui';

import { AiGenerateForm } from './ai-generate-form';
import { AiGeneratingSpinner } from './ai-generating-spinner';
import { AiCasePreviewList } from './ai-case-preview-list';

type Props = {
  projectId: string;
  slug: string;
  onClose: () => void;
};

type Step = 'input' | 'loading' | 'preview';

export const AiGenerateModal = ({ projectId, slug, onClose }: Props) => {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>('input');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState<'ko' | 'en'>('ko');
  const [cases, setCases] = useState<GeneratedTestCase[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [suiteId, setSuiteId] = useState<string>('');

  const { data: configData } = useQuery(aiConfigQueryOptions(projectId));
  const hasConfig = configData?.success && !!configData.data;

  const { data: suitesData } = useQuery({
    ...testSuitesQueryOptions(projectId),
    enabled: !!projectId,
  });
  const suites = suitesData?.success ? suitesData.data : [];

  // AI 생성 요청
  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/ai/generate-cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, description, language }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '생성에 실패했습니다.');
      return data.cases as GeneratedTestCase[];
    },
    onMutate: () => setStep('loading'),
    onSuccess: (result) => {
      setCases(result);
      setSelected(new Set(result.map((_, i) => i)));
      setStep('preview');
    },
    onError: (error: Error) => {
      toast.error(error.message);
      setStep('input');
    },
  });

  // TC 저장
  const saveMutation = useMutation({
    mutationFn: () => {
      const selectedCases = cases.filter((_, i) => selected.has(i));
      return saveGeneratedCases({
        projectId,
        suiteId: suiteId || undefined,
        cases: selectedCases,
      });
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`${result.data.count}건의 테스트 케이스가 저장되었습니다.`);
        queryClient.invalidateQueries({ queryKey: ['testCases'] });
        onClose();
      } else {
        const msg = Object.values(result.errors).flat().join(', ');
        toast.error(msg);
      }
    },
  });

  const toggleAll = () => {
    if (selected.size === cases.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(cases.map((_, i) => i)));
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

  const handleUpdateCase = (idx: number, updated: GeneratedTestCase) => {
    setCases((prev) => prev.map((c, i) => (i === idx ? updated : c)));
  };

  return (
    <Dialog.Root defaultOpen>
      <Dialog.Portal>
        <Dialog.Overlay onClick={step !== 'loading' ? onClose : undefined} />
        <Dialog.Content className="bg-bg-2 border-line-2 rounded-5 w-full max-w-[720px] max-h-[85vh] border p-0 flex flex-col">
          {/* 헤더 */}
          <div className="flex items-center justify-between border-b border-line-2 px-6 py-4">
            <div className="flex items-center gap-3">
              <Dialog.Title className="typo-h2-heading text-text-1">
                AI 테스트 케이스 생성
              </Dialog.Title>
            </div>
            {step !== 'loading' && (
              <button type="button" onClick={onClose} className="text-text-4 hover:text-text-2 transition-colors">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* 콘텐츠 */}
          <div className="flex-1 overflow-y-auto p-6">
            {!hasConfig ? (
              <div className="flex flex-col items-center gap-4 py-10 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-7 w-7 text-primary" />
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
              <AiGenerateForm
                description={description}
                onDescriptionChange={setDescription}
                language={language}
                onLanguageChange={setLanguage}
              />
            ) : step === 'loading' ? (
              <AiGeneratingSpinner />
            ) : (
              <AiCasePreviewList
                cases={cases}
                selected={selected}
                onToggleAll={toggleAll}
                onToggleOne={toggleOne}
                onUpdateCase={handleUpdateCase}
                suiteId={suiteId}
                onSuiteIdChange={setSuiteId}
                suites={suites}
              />
            )}
          </div>

          {/* 푸터 */}
          {hasConfig && step !== 'loading' && (
            <div className="flex items-center justify-between border-t border-line-2 px-6 py-4">
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
                    disabled={description.trim().length < 20 || generateMutation.isPending}
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      생성하기
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
                      `${selected.size}개 저장하기`
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
