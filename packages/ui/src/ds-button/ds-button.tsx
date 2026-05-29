import React from 'react';

import { cn } from '@testea/util';

import { Button } from '../primitives/button';
import { buttonVariants } from './button.variable';
import type { DSButtonProps } from './types';

export const DSButton = ({ children, variant, size, className, ref, ...props }: DSButtonProps) => {
  return (
    <Button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props}>
      {children}
    </Button>
  );
};
