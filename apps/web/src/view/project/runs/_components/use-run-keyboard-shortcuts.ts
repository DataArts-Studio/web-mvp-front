'use client';

import { useEffect } from 'react';
import { type TestCaseRunStatus } from './run-detail-constants';
import { type TestCaseRunDetail } from '@/features/runs';

interface UseRunKeyboardShortcutsOptions {
  selectedCaseId: string | null;
  filteredCases: TestCaseRunDetail[];
  onStatusChange: (status: TestCaseRunStatus) => void;
  onSelectCase: (id: string) => void;
  onToggleShortcuts: () => void;
}

export function useRunKeyboardShortcuts({
  selectedCaseId,
  filteredCases,
  onStatusChange,
  onSelectCase,
  onToggleShortcuts,
}: UseRunKeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'p':
          onStatusChange('pass');
          break;
        case 'f':
          onStatusChange('fail');
          break;
        case 'b':
          onStatusChange('blocked');
          break;
        case 'u':
          onStatusChange('untested');
          break;
        case 'arrowdown':
        case 'j': {
          e.preventDefault();
          const currentIdx = filteredCases.findIndex((tc) => tc.id === selectedCaseId);
          if (currentIdx < filteredCases.length - 1) {
            onSelectCase(filteredCases[currentIdx + 1].id);
          }
          break;
        }
        case 'arrowup':
        case 'k': {
          e.preventDefault();
          const currIdx = filteredCases.findIndex((tc) => tc.id === selectedCaseId);
          if (currIdx > 0) {
            onSelectCase(filteredCases[currIdx - 1].id);
          }
          break;
        }
        case '?':
          onToggleShortcuts();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCaseId, filteredCases, onStatusChange, onSelectCase, onToggleShortcuts]);
}
