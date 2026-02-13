import { useCallback, useState } from 'react';

export function useSelectionSet() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback((filteredItems: { id: string }[]) => {
    setSelectedIds((prev) => {
      if (prev.size === filteredItems.length) {
        return new Set();
      }
      return new Set(filteredItems.map((item) => item.id));
    });
  }, []);

  const has = useCallback((id: string) => selectedIds.has(id), [selectedIds]);

  const isAllSelected = useCallback(
    (filteredItems: { id: string }[]) =>
      filteredItems.length > 0 && selectedIds.size === filteredItems.length,
    [selectedIds],
  );

  const clear = useCallback(() => setSelectedIds(new Set()), []);

  const toArray = useCallback(() => Array.from(selectedIds), [selectedIds]);

  return {
    selectedIds,
    toggle,
    toggleAll,
    has,
    isAllSelected,
    count: selectedIds.size,
    toArray,
    clear,
  };
}
