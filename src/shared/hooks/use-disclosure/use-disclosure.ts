import React from 'react';

export const useDisclosure = (initialValue = false) => {
  const [isOpen, setIsOpen] = React.useState(initialValue);
  const onOpen = React.useCallback(() => setIsOpen(true), []);
  const onClose = React.useCallback(() => setIsOpen(false), []);
  return { isOpen, onOpen, onClose };
};
