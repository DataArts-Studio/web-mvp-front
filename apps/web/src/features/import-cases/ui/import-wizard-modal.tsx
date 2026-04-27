'use client';

import { useCallback, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/shared/utils';
import { useImportWizard } from '../model/use-import-wizard';
import { StepFileUpload } from './step-file-upload';
import { StepColumnMapping } from './step-column-mapping';
import { StepPreviewImport } from './step-preview-import';

const STEPS = [
  { key: 'upload', label: '1. 파일 업로드' },
  { key: 'mapping', label: '2. 컬럼 매핑' },
  { key: 'preview', label: '3. 미리보기' },
] as const;

interface ImportWizardModalProps {
  projectId: string;
  onClose: () => void;
}

export function ImportWizardModal({ projectId, onClose }: ImportWizardModalProps) {
  const { step, status, reset } = useImportWizard();
  const isImporting = status === 'importing';

  // Prevent closing during import
  const handleClose = useCallback(() => {
    if (isImporting) return;
    reset();
    onClose();
  }, [isImporting, reset, onClose]);

  // ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isImporting) handleClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isImporting, handleClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={isImporting ? undefined : handleClose}
      />

      {/* Modal */}
      <div className="bg-bg-1 relative z-10 flex h-full w-full flex-col shadow-2xl md:h-[90vh] md:max-w-[960px] md:rounded-lg">
        {/* Header */}
        <header className="border-line-2 flex items-center justify-between border-b px-4 py-3 md:px-6 md:py-4">
          <h2 className="typo-body1-heading md:typo-h2-heading text-text-1">테스트케이스 가져오기</h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={isImporting}
            className="text-text-3 hover:text-text-1 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Step Indicator */}
        <nav className="border-line-2 flex border-b px-4 md:px-6">
          {STEPS.map((s, i) => {
            const stepIndex = STEPS.findIndex((st) => st.key === step);
            const isActive = s.key === step;
            const isCompleted = i < stepIndex;

            return (
              <div
                key={s.key}
                className={cn(
                  'typo-caption1 md:typo-body2-normal flex-1 py-2.5 text-center transition-colors md:py-3',
                  isActive && 'text-primary border-primary border-b-2 font-medium',
                  isCompleted && 'text-text-2',
                  !isActive && !isCompleted && 'text-text-3',
                )}
              >
                {s.label}
              </div>
            );
          })}
        </nav>

        {/* Content */}
        <div className="flex flex-1 flex-col overflow-y-auto px-4 py-4 md:px-6 md:py-6">
          {step === 'upload' && <StepFileUpload />}
          {step === 'mapping' && <StepColumnMapping />}
          {step === 'preview' && <StepPreviewImport projectId={projectId} />}
        </div>
      </div>
    </div>
  );
}
