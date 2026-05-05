'use client';

import React, { type ReactNode } from 'react';
import { useBetaBanner } from '@/widgets/global-header';

export const BannerPaddingWrapper = ({ children }: { children: ReactNode }) => {
  const { isVisible: isBannerVisible } = useBetaBanner();

  return (
    <div className={`flex w-full flex-col items-start gap-9 pl-8 transition-[padding-top] duration-200 ${isBannerVisible ? 'pt-10' : 'pt-4'}`}>
      {children}
    </div>
  );
};
