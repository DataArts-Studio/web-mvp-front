'use client';
import React from 'react';

import type { TestCaseTemplate } from '@/entities/test-case-template';
import { getTestTypeLabel } from '@/entities/test-case';
import { DSButton } from '@/shared';
import { Edit2, MoreVertical, Trash2 } from 'lucide-react';

interface TemplateCardProps {
  template: TestCaseTemplate;
  isSelected: boolean;
  onSelect: (template: TestCaseTemplate) => void;
  onEdit?: (template: TestCaseTemplate) => void;
  onDelete?: (template: TestCaseTemplate) => void;
}

export const TemplateCard = ({ template, isSelected, onSelect, onEdit, onDelete }: TemplateCardProps) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const isCustom = template.category === 'CUSTOM';

  return (
    <div
      className={`bg-bg-2 border rounded-4 p-4 cursor-pointer transition-colors hover:border-primary ${
        isSelected ? 'border-primary bg-primary/5' : 'border-line-2'
      }`}
      onClick={() => onSelect(template)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-text-1 font-medium truncate">{template.name}</h4>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                isCustom
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}
            >
              {isCustom ? '커스텀' : '빌트인'}
            </span>
          </div>
          <p className="text-text-3 text-sm line-clamp-2">{template.description || '설명 없음'}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-text-3">
            {template.testType && (
              <span>{getTestTypeLabel(template.testType)}</span>
            )}
            {isCustom && template.usageCount > 0 && (
              <span>사용 {template.usageCount}회</span>
            )}
          </div>
        </div>

        {isCustom && (onEdit || onDelete) && (
          <div className="relative shrink-0">
            <DSButton
              variant="ghost"
              size="small"
              className="p-1"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
            >
              <MoreVertical className="h-4 w-4" />
            </DSButton>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                  }}
                />
                <div className="absolute right-0 top-full z-20 mt-1 w-32 rounded-4 border border-line-2 bg-bg-2 py-1 shadow-4">
                  {onEdit && (
                    <button
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-1 hover:bg-bg-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        onEdit(template);
                      }}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      수정
                    </button>
                  )}
                  {onDelete && (
                    <button
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-system-red hover:bg-bg-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        onDelete(template);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      삭제
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
