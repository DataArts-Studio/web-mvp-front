'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { cn } from '@/shared/utils';
import { TagChip } from './tag-chip';
import { TagAutocomplete } from './tag-autocomplete';

export interface TagChipInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  maxTags?: number;
  maxLength?: number;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const TagChipInput = ({
  value,
  onChange,
  suggestions = [],
  maxTags = 10,
  maxLength = 30,
  placeholder = '태그 입력 후 Enter',
  disabled = false,
  className,
}: TagChipInputProps) => {
  const [inputValue, setInputValue] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [shakeTag, setShakeTag] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredSuggestions = useMemo(() => {
    if (inputValue.length < 2) return [];
    const query = inputValue.toLowerCase();
    const valueLower = new Set(value.map((v) => v.toLowerCase()));
    return suggestions
      .filter((s) => {
        const sLower = s.toLowerCase();
        return !valueLower.has(sLower) && sLower.includes(query);
      })
      .sort((a, b) => {
        const aLower = a.toLowerCase();
        const bLower = b.toLowerCase();
        const aPrefix = aLower.startsWith(query);
        const bPrefix = bLower.startsWith(query);
        if (aPrefix && !bPrefix) return -1;
        if (!aPrefix && bPrefix) return 1;
        return 0;
      })
      .slice(0, 5);
  }, [inputValue, suggestions, value]);

  const triggerShake = useCallback((tag: string) => {
    setShakeTag(tag);
    setTimeout(() => setShakeTag(null), 400);
  }, []);

  const addTag = useCallback(
    (raw: string) => {
      const tag = raw.trim().slice(0, maxLength);
      if (!tag) return;

      if (value.some((v) => v.toLowerCase() === tag.toLowerCase())) {
        triggerShake(tag.toLowerCase());
        return;
      }
      if (value.length >= maxTags) return;

      onChange([...value, tag]);
    },
    [value, onChange, maxTags, maxLength, triggerShake],
  );

  const addMultipleTags = useCallback(
    (input: string) => {
      const parts = input.split(',');
      for (const part of parts) {
        addTag(part);
      }
      setInputValue('');
      setShowAutocomplete(false);
      setHighlightedIndex(-1);
    },
    [addTag],
  );

  const removeTag = useCallback(
    (index: number) => {
      onChange(value.filter((_, i) => i !== index));
    },
    [value, onChange],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && filteredSuggestions[highlightedIndex]) {
        addTag(filteredSuggestions[highlightedIndex]);
        setInputValue('');
        setShowAutocomplete(false);
        setHighlightedIndex(-1);
      } else {
        addMultipleTags(inputValue);
      }
    } else if (e.key === ',' ) {
      e.preventDefault();
      addMultipleTags(inputValue);
    } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      removeTag(value.length - 1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredSuggestions.length > 0) {
        setHighlightedIndex((prev) => Math.min(prev + 1, filteredSuggestions.length - 1));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Escape') {
      setShowAutocomplete(false);
      setHighlightedIndex(-1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setShowAutocomplete(val.length >= 2);
    setHighlightedIndex(-1);
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (inputValue.trim()) {
        addMultipleTags(inputValue);
      }
      setShowAutocomplete(false);
      setHighlightedIndex(-1);
    }, 150);
  };

  const handleAutocompleteSelect = (tag: string) => {
    addTag(tag);
    setInputValue('');
    setShowAutocomplete(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div className={cn('flex flex-col gap-2', className)} ref={containerRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={() => inputValue.length >= 2 && setShowAutocomplete(true)}
          placeholder={value.length >= maxTags ? `최대 ${maxTags}개` : placeholder}
          disabled={disabled || value.length >= maxTags}
          className={cn(
            'flex w-full items-center rounded-4 border bg-bg-1 outline-none transition-colors h-[56px] px-[24px] text-body2',
            'border-line-2 text-text-1 placeholder:text-text-2',
            'focus:border-primary',
            disabled && 'border-line-3 bg-bg-3 text-line-3 cursor-not-allowed',
          )}
        />
        {showAutocomplete && (
          <TagAutocomplete
            suggestions={filteredSuggestions}
            query={inputValue}
            highlightedIndex={highlightedIndex}
            onSelect={handleAutocompleteSelect}
            onHighlight={setHighlightedIndex}
          />
        )}
      </div>

      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {value.map((tag, index) => (
            <li key={tag}>
              <TagChip
                label={tag}
                onRemove={() => removeTag(index)}
                disabled={disabled}
                shake={shakeTag === tag.toLowerCase()}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
