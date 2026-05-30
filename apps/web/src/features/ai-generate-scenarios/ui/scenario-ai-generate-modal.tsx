'use client';

import { useState } from 'react';

import { aiConfigQueryOptions } from '@/entities/ai-config';
import { aiUsageQueryOptions } from '@/entities/ai-usage';
import type { GeneratedScenario } from '@/entities/requirement-analysis';
import { saveGeneratedScenarios } from '@/entities/test-scenario';
import { SCENARIO_TYPE_META } from '@/features/scenario-management';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DSButton, Dialog } from '@testea/ui';
import { cn } from '@testea/util';
import { Bot, CheckSquare, Loader2, Sparkles, Square, X } from 'lucide-react';
import { toast } from 'sonner';

type Props = {
  projectId: string;
  onClose: () => void;
};

type Step = 'input' | 'loading' | 'preview';

export const ScenarioAiGenerateModal = ({ projectId, onClose }: Props) => {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>('input');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState<'ko' | 'en'>('ko');
  const [scenarios, setScenarios] = useState<GeneratedScenario[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const { data: configData } = useQuery(aiConfigQueryOptions(projectId));
  const hasConfig = configData?.success && !!configData.data;

  const { data: usageData } = useQuery(aiUsageQueryOptions(projectId));
  const usage = usageData?.success ? usageData.data : null;
  const isLimitExceeded = usage ? usage.used >= usage.limit : false;

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/ai/generate-scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, description, language }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '시나리오 생성에 실패했습니다.');
      return data.scenarios as GeneratedScenario[];
    },
    onMutate: () => setStep('loading'),
    onSuccess: (result) => {
      setScenarios(result);
      setSelected(new Set(result.map((_, i) => i)));
      queryClient.invalidateQueries({ queryKey: ['ai-usage'] });
      setStep('preview');
    },
    onError: (error: Error) => {
      toast.error(error.message);
      setStep('input');
    },
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const picked = scenarios.filter((_, i) => selected.has(i));
      return saveGeneratedScenarios({ projectId, scenarios: picked });
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`${result.data.count}개의 시나리오를 저장했습니다.`);
        queryClient.invalidateQueries({ queryKey: ['scenarios'] });
        onClose();
      } else {
        toast.error(Object.values(result.errors).flat().join(', '));
      }
    },
    onError: (error: Error) => toast.error(error.message || '저장 중 오류가 발생했습니다.'),
  });

  const toggleAll = () =>
    setSelected((prev) =>
      prev.size === scenarios.length ? new Set() : new Set(scenarios.map((_, i) => i))
    );

  const toggleOne = (idx: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });

  return (
    <Dialog.Root defaultOpen>
      <Dialog.Portal>
        <Dialog.Overlay onClick={step !== 'loading' ? onClose : undefined} />
        <Dialog.Content className="bg-bg-2 border-line-2 rounded-5 flex max-h-[85vh] w-full max-w-[640px] flex-col border p-0">
          <div className="border-line-2 flex items-center justify-between border-b px-6 py-4">
            <Dialog.Title className="typo-h2-heading text-text-1">AI 시나리오 생성</Dialog.Title>
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
              <div className="flex flex-col gap-4">
                {usage && (
                  <div className="border-line-2 bg-bg-3 flex items-center justify-between rounded-lg border px-4 py-2.5">
                    <span className="typo-body2-normal text-text-3">이번 달 사용량</span>
                    <span
                      className={`typo-body2-heading ${isLimitExceeded ? 'text-error' : 'text-text-1'}`}
                    >
                      {usage.used}/{usage.limit}건
                    </span>
                  </div>
                )}
                {isLimitExceeded && (
                  <div className="border-error/30 bg-error/5 rounded-lg border px-4 py-3">
                    <p className="typo-body2-normal text-error">
                      이번 달 사용 한도를 초과했습니다. 다음 달에 다시 이용해주세요.
                    </p>
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <label className="typo-label-heading text-text-2">요구사항 · 맥락</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="시나리오를 만들고 싶은 기능·요구사항을 입력하세요. 예: 사용자는 이메일로 회원가입하고, 가입 후 프로필을 설정할 수 있어야 한다..."
                    rows={8}
                    maxLength={5000}
                    className="typo-body2-normal bg-bg-1 text-text-1 placeholder:text-text-4 rounded-3 border-line-2 focus:border-primary resize-none border p-4 focus:outline-none"
                    autoFocus
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="typo-caption text-text-4">생성 언어:</span>
                      {(['ko', 'en'] as const).map((l) => (
                        <button
                          key={l}
                          type="button"
                          onClick={() => setLanguage(l)}
                          className={cn(
                            'typo-caption rounded-full px-2.5 py-0.5 transition-colors',
                            language === l
                              ? 'bg-primary/10 text-primary'
                              : 'bg-bg-3 text-text-3 hover:text-text-1'
                          )}
                        >
                          {l === 'ko' ? '한국어' : 'English'}
                        </button>
                      ))}
                    </div>
                    <span className="typo-caption text-text-4">{description.length}/5,000</span>
                  </div>
                </div>
              </div>
            ) : step === 'loading' ? (
              <div className="flex flex-col items-center gap-4 py-16">
                <Loader2 className="text-primary h-10 w-10 animate-spin" />
                <div className="flex flex-col items-center gap-1">
                  <p className="typo-body1-heading text-text-1">AI가 시나리오를 만들고 있습니다</p>
                  <p className="typo-body2-normal text-text-3">잠시만 기다려주세요...</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleAll}
                    aria-label={selected.size === scenarios.length ? '전체 선택 해제' : '전체 선택'}
                    className="text-text-3 hover:text-text-1 transition-colors"
                  >
                    {selected.size === scenarios.length ? (
                      <CheckSquare className="text-primary h-4.5 w-4.5" />
                    ) : (
                      <Square className="h-4.5 w-4.5" />
                    )}
                  </button>
                  <span className="typo-body2-heading text-text-1">
                    생성된 시나리오 {scenarios.length}개
                  </span>
                  <span className="typo-caption text-text-3">({selected.size}개 선택)</span>
                </div>
                <p className="typo-caption text-text-4">선택한 시나리오가 목록에 저장됩니다.</p>

                <div className="flex flex-col gap-2">
                  {scenarios.map((scenario, idx) => {
                    const typeMeta =
                      SCENARIO_TYPE_META[scenario.type ?? 'positive'] ??
                      SCENARIO_TYPE_META.positive;
                    return (
                      <div
                        key={idx}
                        className={cn(
                          'rounded-3 border p-4 transition-colors',
                          selected.has(idx)
                            ? 'border-primary/30 bg-primary/[0.02]'
                            : 'border-line-2 bg-bg-1'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => toggleOne(idx)}
                            aria-label={
                              selected.has(idx)
                                ? `선택 해제: ${scenario.name}`
                                : `선택: ${scenario.name}`
                            }
                            className="mt-0.5 shrink-0"
                          >
                            {selected.has(idx) ? (
                              <CheckSquare className="text-primary h-4.5 w-4.5" />
                            ) : (
                              <Square className="text-text-4 h-4.5 w-4.5" />
                            )}
                          </button>
                          <div className="min-w-0 flex-1">
                            <div className="mb-1.5 flex items-center gap-2">
                              <span className="typo-body2-heading text-text-1 flex-1 truncate">
                                {scenario.name}
                              </span>
                              <span
                                className={cn(
                                  'typo-caption shrink-0 rounded-full px-2 py-0.5',
                                  typeMeta.cls
                                )}
                              >
                                {typeMeta.label}
                              </span>
                            </div>
                            {scenario.description && (
                              <p className="typo-caption text-text-3 line-clamp-3 whitespace-pre-line">
                                {scenario.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

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
                      description.trim().length < 20 ||
                      generateMutation.isPending ||
                      isLimitExceeded
                    }
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      생성하기
                    </span>
                  </DSButton>
                ) : (
                  <DSButton
                    variant="solid"
                    size="small"
                    onClick={() => saveMutation.mutate()}
                    disabled={selected.size === 0 || saveMutation.isPending}
                  >
                    {saveMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      `${selected.size}개 저장`
                    )}
                  </DSButton>
                )}
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
