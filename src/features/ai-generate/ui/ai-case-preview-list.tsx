'use client';

import { useState } from 'react';
import { CheckSquare, Edit2, Square } from 'lucide-react';

import type { GeneratedTestCase } from '@/entities/ai-config';
import { cn } from '@/shared/utils';

import { AiSuiteSelector } from './ai-suite-selector';

type SuiteOption = {
  id: string;
  title: string;
};

type Props = {
  cases: GeneratedTestCase[];
  selected: Set<number>;
  onToggleAll: () => void;
  onToggleOne: (idx: number) => void;
  onUpdateCase: (idx: number, updated: GeneratedTestCase) => void;
  suiteId: string;
  onSuiteIdChange: (value: string) => void;
  suites: SuiteOption[];
};

const CATEGORY_LABEL: Record<string, { text: string; cls: string }> = {
  positive: { text: 'Positive', cls: 'bg-green-500/10 text-green-400' },
  negative: { text: 'Negative', cls: 'bg-red-500/10 text-red-400' },
  edge_case: { text: 'Edge Case', cls: 'bg-yellow-500/10 text-yellow-400' },
};

export const AiCasePreviewList = ({
  cases,
  selected,
  onToggleAll,
  onToggleOne,
  onUpdateCase,
  suiteId,
  onSuiteIdChange,
  suites,
}: Props) => {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-4">
      {/* 상단 컨트롤 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button type="button" onClick={onToggleAll} className="text-text-3 hover:text-text-1 transition-colors">
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

        <AiSuiteSelector
          suiteId={suiteId}
          onSuiteIdChange={onSuiteIdChange}
          suites={suites}
        />
      </div>

      {/* TC 목록 */}
      <div className="flex flex-col gap-2">
        {cases.map((tc, idx) => {
          const cat = CATEGORY_LABEL[tc.category] ?? CATEGORY_LABEL.positive;
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
                <button type="button" onClick={() => onToggleOne(idx)} className="mt-0.5 shrink-0">
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
                        onUpdateCase(idx, updated);
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
