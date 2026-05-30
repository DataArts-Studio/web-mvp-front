'use client';

import type { ScenarioStatus, ScenarioType } from '@/entities/test-scenario';
import { SCENARIO_STATUS_OPTIONS, SCENARIO_TYPE_OPTIONS } from '@/features/scenario-management';
import { ActionToolbar } from '@/widgets';
import { Plus, Sparkles } from 'lucide-react';

export type TypeFilter = ScenarioType | 'all';
export type StatusFilter = ScenarioStatus | 'all';

type Props = {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  typeFilter: TypeFilter;
  onTypeChange: (v: TypeFilter) => void;
  statusFilter: StatusFilter;
  onStatusChange: (v: StatusFilter) => void;
  analysisFilter: string;
  onAnalysisChange: (v: string) => void;
  analysisOptions: { id: string; title: string }[];
  onNew: () => void;
  onAiGenerate: () => void;
  disabled?: boolean;
};

const selectCls =
  'typo-body2-normal rounded-2 border-line-2 bg-bg-2 text-text-2 hover:bg-bg-3 cursor-pointer border px-3 py-2 focus:outline-none';

export const ScenariosToolbar = ({
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeChange,
  statusFilter,
  onStatusChange,
  analysisFilter,
  onAnalysisChange,
  analysisOptions,
  onNew,
  onAiGenerate,
  disabled,
}: Props) => (
  <ActionToolbar.Root ariaLabel="시나리오 관리 컨트롤">
    <ActionToolbar.Group>
      <ActionToolbar.Search
        placeholder="이름·설명으로 검색"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <select
        aria-label="유형 필터"
        value={typeFilter}
        onChange={(e) => onTypeChange(e.target.value as TypeFilter)}
        className={selectCls}
      >
        <option value="all">전체 유형</option>
        {SCENARIO_TYPE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <select
        aria-label="상태 필터"
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value as StatusFilter)}
        className={selectCls}
      >
        <option value="all">전체 상태</option>
        {SCENARIO_STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {analysisOptions.length > 0 && (
        <select
          aria-label="출처 분석서 필터"
          value={analysisFilter}
          onChange={(e) => onAnalysisChange(e.target.value)}
          className={selectCls}
        >
          <option value="all">전체 출처</option>
          <option value="manual">수동 작성</option>
          {analysisOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.title}
            </option>
          ))}
        </select>
      )}
    </ActionToolbar.Group>
    <div className="flex shrink-0 items-center gap-2">
      <ActionToolbar.Action
        size="small"
        type="button"
        variant="ghost"
        onClick={onAiGenerate}
        disabled={disabled}
      >
        <Sparkles className="h-4 w-4" />
        <span className="leading-none">AI 생성</span>
      </ActionToolbar.Action>
      <ActionToolbar.Action
        size="small"
        type="button"
        variant="solid"
        onClick={onNew}
        disabled={disabled}
      >
        <Plus className="h-4 w-4" />
        <span className="leading-none">새 시나리오</span>
      </ActionToolbar.Action>
    </div>
  </ActionToolbar.Root>
);
