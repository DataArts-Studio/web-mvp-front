'use client';

import type { ScenarioListItem, ScenarioStatus } from '@/entities/test-scenario';
import { SCENARIO_STATUS_META } from '@/features/scenario-management';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ChevronDown, ChevronRight, FileText, PenLine } from 'lucide-react';

import { ScenarioRow } from './scenario-row';
import { SortableScenarioRow } from './sortable-scenario-row';

type Props = {
  title: string;
  isManual: boolean;
  items: ScenarioListItem[];
  collapsed: boolean;
  onToggle: () => void;
  dragDisabled: boolean;
  pendingId: string | null;
  onEdit: (scenario: ScenarioListItem) => void;
  onStatusChange: (scenario: ScenarioListItem, status: ScenarioStatus) => void;
  onGenerateSuite: (scenario: ScenarioListItem) => void;
  onDelete: (scenario: ScenarioListItem) => void;
};

const STATUS_ORDER: ScenarioStatus[] = ['CONFIRMED', 'REVIEW', 'DRAFT'];

export const ScenarioGroup = ({
  title,
  isManual,
  items,
  collapsed,
  onToggle,
  dragDisabled,
  pendingId,
  onEdit,
  onStatusChange,
  onGenerateSuite,
  onDelete,
}: Props) => {
  const counts = { DRAFT: 0, REVIEW: 0, CONFIRMED: 0 } as Record<ScenarioStatus, number>;
  items.forEach((i) => {
    counts[i.status] += 1;
  });
  const Icon = isManual ? PenLine : FileText;

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={!collapsed}
        className="bg-bg-2 hover:bg-bg-3 flex w-full items-center gap-2 px-4 py-2.5 text-left transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="text-text-4 h-4 w-4 shrink-0" aria-hidden="true" />
        ) : (
          <ChevronDown className="text-text-4 h-4 w-4 shrink-0" aria-hidden="true" />
        )}
        <Icon className="text-text-4 h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="typo-body2-heading text-text-1 min-w-0 truncate">{title}</span>
        <span className="typo-caption text-text-3 shrink-0">{items.length}개</span>
        <div className="flex flex-1 items-center justify-end gap-2">
          {STATUS_ORDER.filter((s) => counts[s] > 0).map((s) => (
            <span
              key={s}
              className={`typo-caption shrink-0 rounded-full px-2 py-0.5 ${SCENARIO_STATUS_META[s].cls}`}
            >
              {SCENARIO_STATUS_META[s].label} {counts[s]}
            </span>
          ))}
        </div>
      </button>

      {!collapsed && (
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="divide-line-2 border-line-2 divide-y border-t">
            {items.map((scenario) => (
              <SortableScenarioRow key={scenario.id} id={scenario.id} disabled={dragDisabled}>
                <ScenarioRow
                  scenario={scenario}
                  busy={pendingId === scenario.id}
                  onEdit={onEdit}
                  onStatusChange={onStatusChange}
                  onGenerateSuite={onGenerateSuite}
                  onDelete={onDelete}
                />
              </SortableScenarioRow>
            ))}
          </div>
        </SortableContext>
      )}
    </div>
  );
};
