'use client';

import React, { useCallback, useState } from 'react';
import { AlignLeft, List } from 'lucide-react';
import { stepsToText, textToSteps } from '@/entities/test-case';
import { cn } from '@testea/util';
import { StepBoxEditor, type StepBoxEditorProps } from './step-box-editor';

type Mode = 'stepbox' | 'textarea';

interface StepSectionEditorProps extends Omit<StepBoxEditorProps, 'className'> {
  textareaClassName?: string;
}

export const StepSectionEditor = ({
  value,
  onChange,
  disabled,
  addLabel,
  placeholder,
  textareaClassName,
}: StepSectionEditorProps) => {
  const [mode, setMode] = useState<Mode>('stepbox');
  const [textDraft, setTextDraft] = useState<string>(() => stepsToText(value));

  const switchToTextarea = useCallback(() => {
    setTextDraft(stepsToText(value));
    setMode('textarea');
  }, [value]);

  const switchToStepbox = useCallback(() => {
    onChange(textToSteps(textDraft));
    setMode('stepbox');
  }, [textDraft, onChange]);

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const text = e.target.value;
      setTextDraft(text);
      onChange(textToSteps(text));
    },
    [onChange],
  );

  const toggleBtnBase =
    'flex items-center justify-center rounded-3 p-1 transition-colors';

  return (
    <div className="flex w-full flex-col gap-2">
      {/* Toggle bar */}
      <div className="flex justify-end gap-1">
        <button
          type="button"
          aria-label="스텝 모드"
          className={cn(
            toggleBtnBase,
            mode === 'stepbox'
              ? 'bg-bg-3 text-primary'
              : 'text-text-3 hover:text-text-1',
          )}
          onClick={switchToStepbox}
          disabled={disabled}
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="텍스트 모드"
          className={cn(
            toggleBtnBase,
            mode === 'textarea'
              ? 'bg-bg-3 text-primary'
              : 'text-text-3 hover:text-text-1',
          )}
          onClick={switchToTextarea}
          disabled={disabled}
        >
          <AlignLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Editor */}
      {mode === 'stepbox' ? (
        <StepBoxEditor
          value={value}
          onChange={onChange}
          disabled={disabled}
          addLabel={addLabel}
          placeholder={placeholder}
        />
      ) : (
        <textarea
          className={cn(
            'w-full rounded-4 border border-line-2 bg-bg-1 px-6 py-4 text-base text-text-1 placeholder:text-text-2 outline-none transition-colors focus:border-primary resize-none min-h-[120px]',
            textareaClassName,
          )}
          value={textDraft}
          onChange={handleTextChange}
          disabled={disabled}
          placeholder={placeholder}
        />
      )}
    </div>
  );
};
