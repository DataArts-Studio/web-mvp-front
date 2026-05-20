'use client';
import React from 'react';

import { getTestTypeLabel } from '@/entities/test-case';
import type { TestCaseTemplate } from '@/entities/test-case-template';
import { DSButton } from '@/shared';
import { Edit2, MoreVertical, Trash2 } from 'lucide-react';

interface TemplateCardProps {
  template: TestCaseTemplate;
  isSelected: boolean;
  onSelect: (template: TestCaseTemplate) => void;
  onEdit?: (template: TestCaseTemplate) => void;
  onDelete?: (template: TestCaseTemplate) => void;
}

export const TemplateCard = ({
  template,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}: TemplateCardProps) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const isCustom = template.category === 'CUSTOM';

  return (
    <div
      className={`bg-bg-2 rounded-4 hover:border-primary cursor-pointer border p-4 transition-colors ${
        isSelected ? 'border-primary bg-primary/5' : 'border-line-2'
      }`}
      onClick={() => onSelect(template)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <h4 className="text-text-1 truncate font-medium">{template.name}</h4>
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
          <p className="text-text-3 line-clamp-2 text-sm">{template.description || '설명 없음'}</p>
          <div className="text-text-3 mt-2 flex items-center gap-3 text-xs">
            {template.testType && <span>{getTestTypeLabel(template.testType)}</span>}
            {isCustom && template.usageCount > 0 && <span>사용 {template.usageCount}회</span>}
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
                <div className="rounded-4 border-line-2 bg-bg-2 shadow-4 absolute top-full right-0 z-20 mt-1 w-32 border py-1">
                  {onEdit && (
                    <button
                      className="text-text-1 hover:bg-bg-3 flex w-full items-center gap-2 px-3 py-2 text-sm"
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
                      className="text-system-red hover:bg-bg-3 flex w-full items-center gap-2 px-3 py-2 text-sm"
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
