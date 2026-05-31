'use client';

import type { ScenarioListItem, ScenarioStatus } from '@/entities/test-scenario';
import { SCENARIO_STATUS_OPTIONS, SCENARIO_TYPE_META } from '@/features/scenario-management';
import { cn } from '@testea/util';
import { FolderPlus, Pencil, Trash2 } from 'lucide-react';

type Props = {
  scenario: ScenarioListItem;
  onEdit: (scenario: ScenarioListItem) => void;
  onStatusChange: (scenario: ScenarioListItem, status: ScenarioStatus) => void;
  onGenerateSuite: (scenario: ScenarioListItem) => void;
  onDelete: (scenario: ScenarioListItem) => void;
  busy?: boolean;
};

export const ScenarioRow = ({
  scenario,
  onEdit,
  onStatusChange,
  onGenerateSuite,
  onDelete,
  busy,
}: Props) => {
  const typeMeta = SCENARIO_TYPE_META[scenario.type] ?? SCENARIO_TYPE_META.positive;

  return (
    <div
      className={cn('flex items-start gap-3 px-4 py-3', busy && 'pointer-events-none opacity-50')}
    >
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="typo-body2-heading text-text-1 truncate">{scenario.name}</span>
          <span className={cn('typo-caption shrink-0 rounded-full px-2 py-0.5', typeMeta.cls)}>
            {typeMeta.label}
          </span>
          {scenario.analysisTitle && (
            <span className="typo-caption text-text-4 truncate">{scenario.analysisTitle}</span>
          )}
        </div>
        {scenario.description && (
          <p className="typo-caption text-text-3 line-clamp-2 whitespace-pre-line">
            {scenario.description}
          </p>
        )}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {scenario.relatedRequirementIds.map((rid) => (
            <span key={rid} className="typo-caption bg-bg-3 text-text-4 rounded-full px-2 py-0.5">
              {rid}
            </span>
          ))}
          {scenario.derivedSuiteCount > 0 && (
            <span className="typo-caption text-text-4">
              스위트 {scenario.derivedSuiteCount}개 파생
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {/* 상태 변경: 네이티브 select 로 스크롤/행 경계 클리핑(#134) 회피. */}
        <select
          aria-label={`상태 변경: ${scenario.name}`}
          value={scenario.status}
          onChange={(e) => onStatusChange(scenario, e.target.value as ScenarioStatus)}
          className="typo-caption rounded-2 border-line-2 bg-bg-2 text-text-2 hover:bg-bg-3 cursor-pointer border px-2 py-1 focus:outline-none"
        >
          {SCENARIO_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          aria-label={
            scenario.derivedSuiteCount > 0 ? '이미 스위트 생성됨' : '시나리오에서 스위트 생성'
          }
          title={scenario.derivedSuiteCount > 0 ? '이미 스위트 생성됨' : '스위트 생성'}
          onClick={() => onGenerateSuite(scenario)}
          className={cn(
            'hover:text-text-1 hover:bg-bg-3 rounded-2 flex h-7 w-7 items-center justify-center transition-colors',
            scenario.derivedSuiteCount > 0 ? 'text-system-green' : 'text-text-4'
          )}
        >
          <FolderPlus className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="시나리오 수정"
          title="수정"
          onClick={() => onEdit(scenario)}
          className="text-text-4 hover:text-text-1 hover:bg-bg-3 rounded-2 flex h-7 w-7 items-center justify-center transition-colors"
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="시나리오 삭제"
          title="삭제"
          onClick={() => onDelete(scenario)}
          className="text-text-4 hover:text-error hover:bg-bg-3 rounded-2 flex h-7 w-7 items-center justify-center transition-colors"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
