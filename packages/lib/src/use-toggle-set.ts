import { useCallback, useState } from 'react';

export function useToggleSet(initialIds: string[] = []) {
  const [set, setSet] = useState<Set<string>>(() => new Set(initialIds));

  const toggle = useCallback((id: string) => {
    setSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const has = useCallback((id: string) => set.has(id), [set]);

  return { set, toggle, has };
}
