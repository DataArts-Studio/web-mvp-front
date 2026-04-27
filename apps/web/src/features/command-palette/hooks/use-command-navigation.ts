import { useState, useEffect, useCallback } from 'react';
import type { CommandItem } from '../model/types';

interface UseCommandNavigationOptions {
  items: CommandItem[];
  query: string;
  isOpen: boolean;
  onSelect: (item: CommandItem) => void;
  onClose: () => void;
  listRef: React.RefObject<HTMLDivElement | null>;
}

export const useCommandNavigation = ({
  items,
  query,
  isOpen,
  onSelect,
  onClose,
  listRef,
}: UseCommandNavigationOptions) => {
  const [activeIndex, setActiveIndex] = useState(0);

  // Reset index when query changes
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Reset when palette opens
  useEffect(() => {
    if (isOpen) {
      setActiveIndex(0);
    }
  }, [isOpen]);

  // Scroll active item into view
  useEffect(() => {
    const activeEl = listRef.current?.querySelector('[data-active="true"]');
    activeEl?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, listRef]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((prev) => (prev + 1) % items.length || 0);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((prev) =>
            prev <= 0 ? Math.max(items.length - 1, 0) : prev - 1,
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (items[activeIndex]) {
            onSelect(items[activeIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    },
    [activeIndex, items, onSelect, onClose],
  );

  return {
    activeIndex,
    setActiveIndex,
    handleKeyDown,
  };
};
