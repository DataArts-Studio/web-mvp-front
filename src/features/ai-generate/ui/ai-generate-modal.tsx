'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Bot, Check, CheckSquare, ChevronDown, Edit2, Loader2, Sparkles, Square, X,
} from 'lucide-react';

import { aiConfigQueryOptions } from '@/entities/ai-config';
import type { GeneratedTestCase } from '@/entities/ai-config';
import { saveGeneratedCases } from '@/entities/ai-config/api/server-actions';
import { testSuitesQueryOptions } from '@/widgets';
import { Dialog } from '@/shared/lib/primitives';
import { DSButton } from '@/shared/ui';
import { cn } from '@/shared/utils';

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
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
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

  const categoryLabel: Record<string, { text: string; cls: string }> = {
    positive: { text: 'Positive', cls: 'bg-green-500/10 text-green-400' },
    negative: { text: 'Negative', cls: 'bg-red-500/10 text-red-400' },
    edge_case: { text: 'Edge Case', cls: 'bg-yellow-500/10 text-yellow-400' },
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
              /* API 키 미설정 */
              <div className="flex flex-col items-center gap-4 py-10 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-500/10">
                  <Bot className="h-7 w-7 text-primary-400" />
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
              /* 텍스트 입력 */
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="typo-label-heading text-text-2">기능 설명</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="테스트할 기능을 설명해주세요. 예: 사용자가 이메일과 비밀번호로 로그인할 수 있다. 비밀번호는 8자 이상이어야 하며..."
                    rows={8}
                    maxLength={3000}
                    className="typo-body2-normal bg-bg-1 text-text-1 placeholder:text-text-4 rounded-3 border border-line-2 p-4 focus:outline-none focus:border-primary resize-none"
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
                              : 'bg-bg-3 text-text-3 hover:text-text-1',
                          )}
                        >
                          {l === 'ko' ? '한국어' : 'English'}
                        </button>
                      ))}
                    </div>
                    <span className="typo-caption text-text-4">
                      {description.length}/3,000
                    </span>
                  </div>
                </div>
              </div>
            ) : step === 'loading' ? (
              /* 로딩 */
              <div className="flex flex-col items-center gap-4 py-16">
                <Loader2 className="h-10 w-10 animate-spin text-primary-400" />
                <div className="flex flex-col items-center gap-1">
                  <p className="typo-body1-heading text-text-1">AI가 테스트 케이스를 생성하고 있습니다</p>
                  <p className="typo-body2-normal text-text-3">잠시만 기다려주세요...</p>
                </div>
              </div>
            ) : (
              /* 미리보기 */
              <div className="flex flex-col gap-4">
                {/* 상단 컨트롤 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={toggleAll} className="text-text-3 hover:text-text-1 transition-colors">
                      {selected.size === cases.length ? (
                        <CheckSquare className="h-4.5 w-4.5 text-primary" />
                      ) : (
                        <Square className="h-4.5 w-4.5" />
                      )}
                    </button>
                    <span className="typo-body2-heading text-text-1">
                      {cases.length}개 생성됨
                    </span>
                    <span className="typo-caption text-text-3">
                      ({selected.size}개 선택)
                    </span>
                  </div>

                  {/* 스위트 선택 */}
                  <div className="flex items-center gap-2">
                    <span className="typo-caption text-text-3">스위트:</span>
                    <select
                      value={suiteId}
                      onChange={(e) => setSuiteId(e.target.value)}
                      className="typo-caption bg-bg-1 text-text-1 border border-line-2 rounded-2 px-2 py-1 focus:outline-none"
                    >
                      <option value="">없음</option>
                      {suites.map((s) => (
                        <option key={s.id} value={s.id}>{s.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* TC 목록 */}
                <div className="flex flex-col gap-2">
                  {cases.map((tc, idx) => {
                    const cat = categoryLabel[tc.category] ?? categoryLabel.positive;
                    const isEditing = editingIdx === idx;

                    return (
                      <div
                        key={idx}
                        className={cn(
                          'rounded-3 border p-4 transition-colors',
                          selected.has(idx) ? 'border-primary/30 bg-primary/[0.02]' : 'border-line-2 bg-bg-1',
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <button type="button" onClick={() => toggleOne(idx)} className="mt-0.5 shrink-0">
                            {selected.has(idx) ? (
                              <CheckSquare className="h-4.5 w-4.5 text-primary" />
                            ) : (
                              <Square className="h-4.5 w-4.5 text-text-4" />
                            )}
                          </button>

                          <div className="flex-1 min-w-0">
                            {isEditing ? (
                              <EditableCase
                                tc={tc}
                                onSave={(updated) => {
                                  setCases((prev) => prev.map((c, i) => (i === idx ? updated : c)));
                                  setEditingIdx(null);
                                }}
                                onCancel={() => setEditingIdx(null)}
                              />
                            ) : (
                              <>
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className="typo-body2-heading text-text-1 flex-1 truncate">{tc.name}</span>
                                  <span className={cn('typo-caption rounded-full px-2 py-0.5 shrink-0', cat.cls)}>
                                    {cat.text}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setEditingIdx(idx)}
                                    className="text-text-4 hover:text-text-2 transition-colors shrink-0"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                                {tc.steps && (
                                  <p className="typo-caption text-text-3 line-clamp-2 whitespace-pre-line">
                                    {tc.steps}
                                  </p>
                                )}
                              </>
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

// --- 인라인 편집 컴포넌트 ---
function EditableCase({
  tc,
  onSave,
  onCancel,
}: {
  tc: GeneratedTestCase;
  onSave: (updated: GeneratedTestCase) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(tc.name);
  const [preCondition, setPreCondition] = useState(tc.preCondition);
  const [steps, setSteps] = useState(tc.steps);
  const [expectedResult, setExpectedResult] = useState(tc.expectedResult);

  return (
    <div className="flex flex-col gap-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="typo-body2-heading bg-transparent text-text-1 focus:outline-none border-b border-line-2 pb-1"
        autoFocus
      />
      <div className="flex flex-col gap-1.5">
        <label className="typo-caption text-text-4">사전 조건</label>
        <textarea
          value={preCondition}
          onChange={(e) => setPreCondition(e.target.value)}
          rows={2}
          className="typo-caption bg-bg-2 text-text-1 rounded-2 border border-line-2 p-2 focus:outline-none resize-none"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="typo-caption text-text-4">테스트 단계</label>
        <textarea
          value={steps}
          onChange={(e) => setSteps(e.target.value)}
          rows={3}
          className="typo-caption bg-bg-2 text-text-1 rounded-2 border border-line-2 p-2 focus:outline-none resize-none"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="typo-caption text-text-4">기대 결과</label>
        <textarea
          value={expectedResult}
          onChange={(e) => setExpectedResult(e.target.value)}
          rows={2}
          className="typo-caption bg-bg-2 text-text-1 rounded-2 border border-line-2 p-2 focus:outline-none resize-none"
        />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} className="typo-caption text-text-3 hover:text-text-1 px-2 py-1">
          취소
        </button>
        <button
          type="button"
          onClick={() => onSave({ ...tc, name, preCondition, steps, expectedResult })}
          className="typo-caption bg-primary/10 text-primary rounded-2 px-3 py-1 hover:bg-primary/20 transition-colors"
        >
          적용
        </button>
      </div>
    </div>
  );
}
