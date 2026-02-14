'use client';

import React from 'react';
import { cn } from '@/shared/utils';

interface TagAutocompleteProps {
  suggestions: string[];
  query: string;
  highlightedIndex: number;
  onSelect: (tag: string) => void;
  onHighlight: (index: number) => void;
}

const highlightMatch = (text: string, query: string) => {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const idx = lowerText.indexOf(lowerQuery);
  if (idx < 0) return <span>{text}</span>;

  return (
    <span>
      {text.slice(0, idx)}
      <strong className="text-primary">{text.slice(idx, idx + query.length)}</strong>
      {text.slice(idx + query.length)}
    </span>
  );
};

export const TagAutocomplete = ({
  suggestions,
  query,
  highlightedIndex,
  onSelect,
  onHighlight,
}: TagAutocompleteProps) => {
  if (suggestions.length === 0) return null;

  return (
    <ul
      role="listbox"
      className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[200px] overflow-y-auto rounded-4 border border-line-2 bg-bg-1 py-1 shadow-4"
    >
      {suggestions.map((tag, index) => (
        <li
          key={tag}
          role="option"
          aria-selected={highlightedIndex === index}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(tag);
          }}
          onMouseEnter={() => onHighlight(index)}
          className={cn(
            'cursor-pointer px-6 py-2.5 text-body2 transition-colors',
            highlightedIndex === index && 'bg-bg-3',
          )}
        >
          {highlightMatch(tag, query)}
        </li>
      ))}
    </ul>
  );
};
