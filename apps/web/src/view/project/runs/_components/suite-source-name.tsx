'use client';

import React, { useRef, useState } from 'react';

import { useOutsideClick } from '@testea/lib';
import { ChevronDown } from 'lucide-react';

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
    <span ref={dropdownRef} className="typo-caption-normal text-text-3 relative">
      <span>{visible}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="rounded-1 bg-bg-4 text-text-2 hover:bg-bg-3 hover:text-text-1 ml-1 inline-flex cursor-pointer items-center px-1 py-0.5 text-[10px] font-medium transition-colors"
      >
        +{hiddenCount}
        <ChevronDown
          className={`ml-0.5 h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <span className="rounded-2 border-line-2 bg-bg-1 text-text-2 shadow-2 absolute top-full left-0 z-20 mt-1 w-max max-w-xs border px-3 py-2 text-xs">
          {suites.map((suite, i) => (
            <span key={i} className="block py-0.5">
              {suite}
            </span>
          ))}
        </span>
      )}
    </span>
  );
};
