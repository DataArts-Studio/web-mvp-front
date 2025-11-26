import React from 'react';

export const useDisclosure = (initialValue = false) => {
  const [isOpen, setIsOpen] = React.useState(initialValue);

  const onOpen = React.useCallback(() => setIsOpen(true), []);
  const onClose = React.useCallback(() => setIsOpen(false), []);
  const onToggle = React.useCallback(() => setIsOpen((prev) => !prev), []);

  return { isOpen, onOpen, onClose, onToggle };
};
