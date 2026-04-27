import React from 'react';

import { Button } from '@/shared/lib/primitives/button';
import { cn } from '@/shared/utils';
import { buttonVariants } from './button.variable';
import type { DSButtonProps } from './types';

export const DSButton = ({ children, variant, size, className, ref, ...props }: DSButtonProps) => {
  return (
    <Button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props}>
      {children}
    </Button>
  );
};
