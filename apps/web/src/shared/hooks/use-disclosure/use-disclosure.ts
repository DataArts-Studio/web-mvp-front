import React from 'react';

/**
 * useDisclosure - 모달/패널 상태 관리 훅
 *
 * @example 기본 사용 (단일 모달)
 * const { isOpen, onOpen, onClose } = useDisclosure();
 *
 * @example 타입 지정 (여러 모달 구분)
 * type ModalType = 'create' | 'detail';
 * const { isOpen, activeType, onOpen, onClose } = useDisclosure<ModalType>();
 * onOpen('create'); // activeType === 'create'
 */
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
