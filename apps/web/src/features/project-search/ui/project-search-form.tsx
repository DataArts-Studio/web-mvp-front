'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import { PROJECT_SEARCH_EVENTS, track } from '@/shared/lib/analytics';
import { useDebounce, useOutsideClick } from '@testea/lib';
import { DSButton, DsInput } from '@testea/ui';

import { searchProjects } from '../api/server-action';
import type { ProjectSearchResult } from '../model/types';
import { ProjectSearchAutocomplete } from './project-search-autocomplete';

interface ProjectSearchFormProps {
  onSearch: (keyword: string) => Promise<void>;
  isSearching: boolean;
}

export const ProjectSearchForm = ({ onSearch, isSearching }: ProjectSearchFormProps) => {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // 방금 엔터·검색 버튼으로 제출한 검색어. 이 값에 대해선 자동완성을 다시 열지 않는다.
  const lastSubmittedRef = useRef<string | null>(null);

  // Input state
  const [inputValue, setInputValue] = useState('');
  const debouncedValue = useDebounce(inputValue, 300);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<ProjectSearchResult[]>([]);
  const [isAutocompleteLoading, setIsAutocompleteLoading] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Fetch suggestions when debounced value changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      const trimmed = debouncedValue.trim();

      if (trimmed.length < 2) {
        setSuggestions([]);
        setShowAutocomplete(false);
        return;
      }

      // 제출 직후 남아 있던 디바운스가 드롭다운을 다시 여는 레이스를 막는다.
      if (lastSubmittedRef.current === trimmed) return;

      setIsAutocompleteLoading(true);
      setShowAutocomplete(true);

      try {
        const result = await searchProjects(trimmed);
        if (result.success) {
          setSuggestions(result.data);
        } else {
          setSuggestions([]);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setIsAutocompleteLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedValue]);

  // Reset selected index when suggestions change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 자동완성 목록이 바뀌면 키보드 하이라이트 인덱스를 초기화하는 동기화. suggestions 변경 시에만 실행
    setSelectedIndex(-1);
  }, [suggestions]);

  // Handle click outside to close autocomplete
  useOutsideClick(containerRef, () => setShowAutocomplete(false));

  // Handle project selection from autocomplete
  const handleSelectProject = (project: ProjectSearchResult) => {
    setShowAutocomplete(false);
    router.push(`/projects/${encodeURIComponent(project.slug)}/access`);
  };

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showAutocomplete || suggestions.length === 0) {
        if (e.key === 'Enter') {
          e.preventDefault();
          const trimmed = inputValue.trim();
          if (trimmed.length >= 2) {
            lastSubmittedRef.current = trimmed;
            setShowAutocomplete(false);
            onSearch(trimmed);
          }
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            const selected = suggestions[selectedIndex];
            handleSelectProject(selected);
          } else {
            const trimmed = inputValue.trim();
            if (trimmed.length >= 2) {
              lastSubmittedRef.current = trimmed;
              setShowAutocomplete(false);
              onSearch(trimmed);
            }
          }
          break;
        case 'Escape':
          setShowAutocomplete(false);
          setSelectedIndex(-1);
          break;
      }
    },
    [showAutocomplete, suggestions, selectedIndex, inputValue, onSearch]
  );

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (trimmed.length >= 2) {
      track(PROJECT_SEARCH_EVENTS.SUBMIT, { keyword: trimmed });
      lastSubmittedRef.current = trimmed;
      setShowAutocomplete(false);
      onSearch(trimmed);
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    // 입력이 바뀌면 "방금 제출" 가드를 해제한다. 그래야 같은 키워드로 되돌아와도
    // 자동완성이 다시 정상 동작한다(가드는 제출 직후 대기 중인 디바운스에만 적용).
    lastSubmittedRef.current = null;
    if (value.trim().length >= 2) {
      setShowAutocomplete(true);
    }
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (inputValue.trim().length >= 2 && suggestions.length > 0) {
      setShowAutocomplete(true);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <p className="text-body2 text-text-2">프로젝트명으로 검색하세요</p>
      <div className="flex gap-2">
        <div ref={containerRef} className="relative flex-1">
          <DsInput
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            placeholder="프로젝트명 입력..."
            variant="default"
            disabled={isSearching}
            autoComplete="off"
          />
          <ProjectSearchAutocomplete
            suggestions={suggestions}
            isLoading={isAutocompleteLoading}
            isVisible={showAutocomplete}
            selectedIndex={selectedIndex}
            onSelect={handleSelectProject}
            onMouseEnter={setSelectedIndex}
          />
        </div>
        <DSButton
          type="submit"
          variant="solid"
          size="medium"
          disabled={isSearching || inputValue.trim().length < 2}
          className="shrink-0 px-6"
        >
          {isSearching ? '검색 중...' : '검색'}
        </DSButton>
      </div>
      {inputValue.trim().length > 0 && inputValue.trim().length < 2 && (
        <p className="text-body3 text-text-3">최소 2자 이상 입력해주세요</p>
      )}
    </form>
  );
};
