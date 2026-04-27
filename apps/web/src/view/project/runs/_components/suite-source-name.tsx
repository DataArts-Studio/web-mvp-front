'use client';

import React, { useState, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { useOutsideClick } from '@/shared/hooks';
import { MAX_VISIBLE_SUITES, type RunSourceType } from './runs-list-constants';

interface SuiteSourceNameProps {
  sourceName: string;
  sourceType: RunSourceType;
}

export const SuiteSourceName = ({ sourceName, sourceType }: SuiteSourceNameProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLSpanElement>(null);

  useOutsideClick(dropdownRef, () => setIsOpen(false), isOpen);

  if (sourceType !== 'SUITE') {
    return <span className="typo-caption-normal text-text-3">{sourceName}</span>;
  }

  const suites = sourceName.split(', ').filter(Boolean);
  if (suites.length <= MAX_VISIBLE_SUITES) {
    return <span className="typo-caption-normal text-text-3">{sourceName}</span>;
  }

  const visible = suites.slice(0, MAX_VISIBLE_SUITES).join(', ');
  const hiddenCount = suites.length - MAX_VISIBLE_SUITES;

  return (
    <span ref={dropdownRef} className="relative typo-caption-normal text-text-3">
      <span>{visible}</span>
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className="ml-1 inline-flex items-center rounded-1 bg-bg-4 px-1 py-0.5 text-[10px] font-medium text-text-2 hover:bg-bg-3 hover:text-text-1 transition-colors cursor-pointer"
      >
        +{hiddenCount}
        <ChevronDown className={`ml-0.5 h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <span className="absolute top-full left-0 z-20 mt-1 w-max max-w-xs rounded-2 border border-line-2 bg-bg-1 px-3 py-2 text-xs text-text-2 shadow-2">
          {suites.map((suite, i) => (
            <span key={i} className="block py-0.5">{suite}</span>
          ))}
        </span>
      )}
    </span>
  );
};
