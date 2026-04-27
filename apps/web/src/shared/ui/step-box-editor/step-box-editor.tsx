'use client';

import React, { useCallback, useId, useMemo, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { StepRow } from './step-row';

export interface StepBoxEditorProps {
  value: string[];
  onChange: (steps: string[]) => void;
  disabled?: boolean;
  className?: string;
  addLabel?: string;
  placeholder?: string;
}

export const StepBoxEditor = ({ value, onChange, disabled, className, addLabel = '단계 추가', placeholder }: StepBoxEditorProps) => {
  const idPrefix = useId();
  const steps = value.length > 0 ? value : [''];
  const [error, setError] = useState<string | null>(null);

  const itemIds = useMemo(
    () => steps.map((_, i) => `${idPrefix}-step-${i}`),
    [steps.length, idPrefix]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const oldIndex = itemIds.indexOf(active.id as string);
        const newIndex = itemIds.indexOf(over.id as string);
        if (oldIndex !== -1 && newIndex !== -1) {
          onChange(arrayMove([...steps], oldIndex, newIndex));
        }
      }
    },
    [itemIds, steps, onChange]
  );

  const updateStep = useCallback(
    (index: number, value: string) => {
      const next = steps.map((s, i) => (i === index ? value : s));
      onChange(next);
      if (error) setError(null);
    },
    [steps, onChange, error]
  );

  const moveStep = useCallback(
    (from: number, to: number) => {
      if (to < 0 || to >= steps.length) return;
      onChange(arrayMove([...steps], from, to));
    },
    [steps, onChange]
  );

  const insertStep = useCallback(
    (at: number) => {
      const next = [...steps];
      next.splice(at, 0, '');
      onChange(next);
    },
    [steps, onChange]
  );

  const duplicateStep = useCallback(
    (index: number) => {
      const next = [...steps];
      next.splice(index + 1, 0, steps[index]);
      onChange(next);
    },
    [steps, onChange]
  );

  const deleteStep = useCallback(
    (index: number) => {
      if (steps.length <= 1) return;
      onChange(steps.filter((_, i) => i !== index));
    },
    [steps, onChange]
  );

  const addStep = useCallback(() => {
    const hasEmpty = steps.some((s) => !s.trim());
    if (hasEmpty) {
      setError('비어있는 항목을 먼저 입력해주세요.');
      return;
    }
    setError(null);
    onChange([...steps, '']);
  }, [steps, onChange]);

  return (
    <div className={cn('flex w-full flex-col gap-2', className)}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {steps.map((step, i) => (
            <StepRow
              key={itemIds[i]}
              id={itemIds[i]}
              index={i}
              total={steps.length}
              value={step}
              disabled={disabled}
              onChange={(v) => updateStep(i, v)}
              onMoveUp={() => moveStep(i, i - 1)}
              onMoveDown={() => moveStep(i, i + 1)}
              onInsertAbove={() => insertStep(i)}
              onInsertBelow={() => insertStep(i + 1)}
              onDuplicate={() => duplicateStep(i)}
              onDelete={() => deleteStep(i)}
              onEnterOnLast={addStep}
              isLast={i === steps.length - 1}
              placeholder={placeholder}
            />
          ))}
        </SortableContext>
      </DndContext>

      <button
        type="button"
        onClick={addStep}
        disabled={disabled}
        className={cn(
          'flex items-center justify-center gap-1.5 rounded-4 border border-dashed border-line-2 py-2 text-sm',
          'text-text-3 transition-colors hover:border-primary hover:text-primary',
          'disabled:opacity-40 disabled:cursor-not-allowed'
        )}
      >
        <Plus className="h-4 w-4" />
        {addLabel}
      </button>

      {error && (
        <p className="text-xs text-system-red">{error}</p>
      )}
    </div>
  );
};
