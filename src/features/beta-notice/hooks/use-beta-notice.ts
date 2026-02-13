'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'beta-notice-dismissed-v1';

export const useBetaNotice = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const isDismissed = sessionStorage.getItem(STORAGE_KEY);
    setIsVisible(!isDismissed);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, 'true');
    setIsVisible(false);
  };

  return {
    isVisible: isMounted && isVisible,
    dismiss,
  };
};
