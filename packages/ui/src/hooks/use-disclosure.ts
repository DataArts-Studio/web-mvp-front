import React from 'react';

export const useDisclosure = <T extends string = never>(initialValue?: T | boolean) => {
  const [activeType, setActiveType] = React.useState<T | null>(() => {
    if (typeof initialValue === 'boolean') {
      return initialValue ? ('default' as T) : null;
    }
    return initialValue ?? null;
  });

  const isOpen = activeType !== null;

  const onOpen = React.useCallback((type?: T) => {
    setActiveType((type ?? ('default' as T)) as T);
  }, []);

  const onClose = React.useCallback(() => {
    setActiveType(null);
  }, []);

  const isActiveType = React.useCallback(
    (type: T) => activeType === type,
    [activeType]
  );

  return { isOpen, activeType, onOpen, onClose, isActiveType };
};
